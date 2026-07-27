// ============================================================
// server.js — API do Santo Desapego
// ============================================================
const express = require('express');
const cors    = require('cors');
const bcrypt  = require('bcrypt');
const jwt     = require('jsonwebtoken');
require('dotenv').config();
const pool = require('./db');

// Mercado Pago — SDK v2
const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');
const mp = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

const app = express();

// Aumenta o limite pra suportar múltiplas imagens em base64
app.use(cors());
app.use(express.json({ limit: '30mb' }));

// ============================================================
// MIDDLEWARE — verifica JWT em rotas protegidas
// ============================================================
const autenticar = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ erro: 'Token de autenticação não enviado.' });
  }
  const token = auth.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.id;
    req.userEmail = payload.email;
    next();
  } catch (erro) {
    return res.status(401).json({ erro: 'Token inválido ou expirado.' });
  }
};

// ============================================================
//  Validação de senha forte (RN03)
// ============================================================
const validarSenhaForte = (senha, dadosUsuario = {}) => {
  if (senha.length < 8)
    return 'A senha deve ter pelo menos 8 caracteres.';
  if (!/[A-Z]/.test(senha))
    return 'A senha deve conter pelo menos uma letra maiúscula.';
  if (!/[a-z]/.test(senha))
    return 'A senha deve conter pelo menos uma letra minúscula.';
  if (!/[0-9]/.test(senha))
    return 'A senha deve conter pelo menos um número.';
  if (!/[^A-Za-z0-9]/.test(senha))
    return 'A senha deve conter pelo menos um caractere especial (ex: @, #, $, &).';

  const senhaLower = senha.toLowerCase();
  if (dadosUsuario.nome && dadosUsuario.nome.length >= 4 &&
      senhaLower.includes(dadosUsuario.nome.toLowerCase()))
    return 'A senha não pode conter seu nome.';
  if (dadosUsuario.sobrenome && dadosUsuario.sobrenome.length >= 4 &&
      senhaLower.includes(dadosUsuario.sobrenome.toLowerCase()))
    return 'A senha não pode conter seu sobrenome.';
  if (/123456|654321|111111|000000|abcdef/.test(senhaLower))
    return 'A senha não pode conter sequências óbvias (ex: 123456).';

  return null;
};

// ============================================================
//  RN01 — Validação de CEP de Santo Amaro
// ============================================================
const validarCEPSantoAmaro = (cep) => {
  const numeros = cep.replace(/\D/g, '');
  if (numeros.length !== 8) return false;
  const prefixo = parseInt(numeros.slice(0, 5));
  return prefixo >= 4600 && prefixo <= 4799;
};

// ============================================================
//  RN09 — Moderação de conteúdo (palavras proibidas)
// ============================================================
const PALAVRAS_PROIBIDAS = [
  'arma', 'armas', 'pistola', 'revolver', 'revólver', 'rifle', 'munição', 'municao',
  'fuzil', 'espingarda', 'cocaina', 'cocaína', 'maconha', 'crack', 'heroina', 'heroína',
  'lsd', 'ecstasy', 'arara-azul', 'mico-leao', 'jaguatirica', 'pornografia',
  'erotico', 'erótico', 'fetiche', 'cnh falsa', 'rg falso', 'diploma falso', 'documento falso',
];

const conteudoTemPalavrasProibidas = (texto) => {
  const textoLower = texto.toLowerCase();
  return PALAVRAS_PROIBIDAS.find((p) => {
    const regex = new RegExp(`\\b${p}\\b`, 'i');
    return regex.test(textoLower);
  });
};

// ──────────────────────────────────────────────────────────
// Rota de teste
// ──────────────────────────────────────────────────────────
app.get('/ping', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ status: 'ok', horaBanco: result.rows[0].now });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Falha ao conectar no PostgreSQL' });
  }
});

// ──────────────────────────────────────────────────────────
// CADASTRO
// ──────────────────────────────────────────────────────────
app.post('/api/auth/cadastro', async (req, res) => {
  try {
    const {
      nome, sobrenome, telefone, email, senha,
      cep, logradouro, numero, complemento, bairro,
      cpf, aceita_termos, recebe_newsletter
    } = req.body;

    if (!nome || !sobrenome || !email || !senha || !cpf) {
      return res.status(400).json({
        erro: 'Nome, sobrenome, CPF, e-mail e senha são obrigatórios.'
      });
    }
    if (!aceita_termos) {
      return res.status(400).json({ erro: 'É necessário aceitar os Termos de Uso.' });
    }

    const erroSenha = validarSenhaForte(senha, { nome, sobrenome });
    if (erroSenha) return res.status(400).json({ erro: erroSenha });

    const senhaHash = await bcrypt.hash(senha, 10);

    const novoUsuario = await pool.query(
      `INSERT INTO usuarios
        (nome, sobrenome, telefone, email, senha,
         cep, logradouro, numero, complemento, bairro,
         cpf, aceita_termos, recebe_newsletter)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING id, nome, email`,
      [
        nome, sobrenome, telefone || null, email, senhaHash,
        cep || null, logradouro || null, numero || null,
        complemento || null, bairro || null, cpf,
        aceita_termos === true, recebe_newsletter === true
      ]
    );

    return res.status(201).json({
      mensagem: 'Usuário cadastrado com sucesso!',
      usuario:  novoUsuario.rows[0]
    });

  } catch (erro) {
    console.error('Erro no cadastro:', erro);
    if (erro.code === '23505') {
      return res.status(409).json({ erro: 'E-mail ou CPF já cadastrado na plataforma.' });
    }
    return res.status(500).json({ erro: 'Erro interno no servidor ao cadastrar usuário.' });
  }
});

// ──────────────────────────────────────────────────────────
// LOGIN MANUAL
// ──────────────────────────────────────────────────────────
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, senha } = req.body;
    if (!email || !senha) {
      return res.status(400).json({ erro: 'E-mail e senha são obrigatórios.' });
    }

    const resultado = await pool.query(
      `SELECT id, nome, sobrenome, email, senha, bairro, foto_perfil
       FROM usuarios WHERE email = $1`, [email]
    );

    if (resultado.rows.length === 0) {
      return res.status(401).json({ erro: 'E-mail ou senha inválidos.' });
    }

    const usuario = resultado.rows[0];
    const senhaCorreta = await bcrypt.compare(senha, usuario.senha);
    if (!senhaCorreta) {
      return res.status(401).json({ erro: 'E-mail ou senha inválidos.' });
    }

    const token = jwt.sign(
      { id: usuario.id, email: usuario.email },
      process.env.JWT_SECRET, { expiresIn: '7d' }
    );

    return res.json({
      mensagem: 'Login realizado com sucesso!',
      token,
      usuario: {
        id: usuario.id, nome: usuario.nome, sobrenome: usuario.sobrenome,
        email: usuario.email, bairro: usuario.bairro,
        foto_perfil: usuario.foto_perfil,
      }
    });
  } catch (erro) {
    console.error('Erro no login:', erro);
    return res.status(500).json({ erro: 'Erro interno no servidor.' });
  }
});

// ──────────────────────────────────────────────────────────
// LOGIN GOOGLE
// ──────────────────────────────────────────────────────────
app.post('/api/auth/google', async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ erro: 'Token do Google não enviado.' });
    }

    const respostaGoogle = await fetch(
      'https://www.googleapis.com/oauth2/v3/userinfo',
      { headers: { Authorization: `Bearer ${credential}` } }
    );
    if (!respostaGoogle.ok) {
      return res.status(401).json({ erro: 'Token do Google inválido ou expirado.' });
    }

    const userInfo = await respostaGoogle.json();
    const emailGoogle = userInfo.email;

    const resultado = await pool.query(
      `SELECT id, nome, sobrenome, email, bairro, foto_perfil
       FROM usuarios WHERE email = $1`, [emailGoogle]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({
        erro: `Não encontramos uma conta com o e-mail ${emailGoogle}. Crie sua conta primeiro!`,
        precisaCadastro: true,
      });
    }

    const usuario = resultado.rows[0];
    const token = jwt.sign(
      { id: usuario.id, email: usuario.email },
      process.env.JWT_SECRET, { expiresIn: '7d' }
    );

    return res.json({
      mensagem: `Bem-vindo(a) de volta, ${usuario.nome}!`,
      token,
      usuario: {
        id: usuario.id, nome: usuario.nome, sobrenome: usuario.sobrenome,
        email: usuario.email, bairro: usuario.bairro,
        foto_perfil: usuario.foto_perfil,
      }
    });
  } catch (erro) {
    console.error('Erro no login com Google:', erro);
    return res.status(500).json({ erro: 'Não foi possível validar sua conta Google.' });
  }
});

// ============================================================
//  GET PERFIL — com estatísticas REAIS do banco
// ============================================================
app.get('/api/usuario/perfil', autenticar, async (req, res) => {
  try {
    const resultado = await pool.query(
      `SELECT id, nome, sobrenome, cpf, telefone, email,
              cep, logradouro, numero, complemento, bairro,
              recebe_newsletter, aceita_termos, foto_perfil
       FROM usuarios WHERE id = $1`, [req.userId]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ erro: 'Usuário não encontrado.' });
    }

    const usuario = resultado.rows[0];

    // Estatísticas reais do banco
    const stats = await pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'ativo')   AS anuncios_ativos,
         COUNT(*) FILTER (WHERE status = 'vendido') AS anuncios_vendidos,
         COUNT(*) FILTER (WHERE status = 'pausado') AS anuncios_pausados
       FROM anuncios WHERE vendedor_id = $1`, [req.userId]
    );

    const compras = await pool.query(
      `SELECT COUNT(*) AS total
       FROM compras WHERE comprador_id = $1 AND status = 'approved'`, [req.userId]
    );

    const avaliacoes = await pool.query(
      `SELECT AVG(nota)::float AS media, COUNT(*) AS total
       FROM avaliacoes WHERE avaliado_id = $1`, [req.userId]
    );

    const estatisticas = {
      anuncios_ativos:    parseInt(stats.rows[0]?.anuncios_ativos)   || 0,
      anuncios_vendidos:  parseInt(stats.rows[0]?.anuncios_vendidos) || 0,
      anuncios_pausados:  parseInt(stats.rows[0]?.anuncios_pausados) || 0,
      compras_realizadas: parseInt(compras.rows[0]?.total) || 0,
      reputacao_media:    avaliacoes.rows[0]?.media ?? null,
      total_avaliacoes:   parseInt(avaliacoes.rows[0]?.total) || 0,
      mensagens_nao_lidas: 0,
    };

    return res.json({ usuario, estatisticas });
  } catch (erro) {
    console.error('Erro ao buscar perfil:', erro);
    return res.status(500).json({ erro: 'Erro ao carregar perfil.' });
  }
});

// ============================================================
//  PUT PERFIL
// ============================================================
app.put('/api/usuario/perfil', autenticar, async (req, res) => {
  try {
    const {
      nome, sobrenome, telefone,
      cep, logradouro, numero, complemento, bairro,
      recebe_newsletter
    } = req.body;

    if (!nome || !sobrenome) {
      return res.status(400).json({ erro: 'Nome e sobrenome são obrigatórios.' });
    }

    const resultado = await pool.query(
      `UPDATE usuarios SET
         nome = $1, sobrenome = $2, telefone = $3,
         cep = $4, logradouro = $5, numero = $6,
         complemento = $7, bairro = $8,
         recebe_newsletter = $9
       WHERE id = $10
       RETURNING id, nome, sobrenome, email, bairro, foto_perfil`,
      [
        nome.trim(), sobrenome.trim(), telefone || null,
        cep || null, logradouro || null, numero || null,
        complemento || null, bairro || null,
        recebe_newsletter === true,
        req.userId
      ]
    );

    return res.json({
      mensagem: 'Perfil atualizado com sucesso!',
      usuario: resultado.rows[0]
    });
  } catch (erro) {
    console.error('Erro ao atualizar perfil:', erro);
    return res.status(500).json({ erro: 'Erro ao atualizar perfil.' });
  }
});

// ============================================================
//  PUT FOTO DE PERFIL
// ============================================================
app.put('/api/usuario/foto', autenticar, async (req, res) => {
  try {
    const { foto_perfil } = req.body;

    if (foto_perfil !== null && typeof foto_perfil !== 'string') {
      return res.status(400).json({ erro: 'Formato de foto inválido.' });
    }

    if (foto_perfil && foto_perfil.length > 700000) {
      return res.status(400).json({
        erro: 'A foto está muito grande. Tente uma imagem menor.'
      });
    }

    if (foto_perfil && !foto_perfil.startsWith('data:image/')) {
      return res.status(400).json({ erro: 'Formato de imagem não suportado.' });
    }

    await pool.query(
      'UPDATE usuarios SET foto_perfil = $1 WHERE id = $2',
      [foto_perfil, req.userId]
    );

    return res.json({
      mensagem: foto_perfil ? 'Foto atualizada!' : 'Foto removida!',
      foto_perfil
    });
  } catch (erro) {
    console.error('Erro ao atualizar foto:', erro);
    return res.status(500).json({ erro: 'Erro ao atualizar foto.' });
  }
});

// ============================================================
//  PUT SENHA
// ============================================================
app.put('/api/usuario/senha', autenticar, async (req, res) => {
  try {
    const { senhaAtual, novaSenha } = req.body;

    if (!senhaAtual || !novaSenha) {
      return res.status(400).json({ erro: 'Informe a senha atual e a nova senha.' });
    }

    const resultado = await pool.query(
      'SELECT nome, sobrenome, senha FROM usuarios WHERE id = $1',
      [req.userId]
    );
    if (resultado.rows.length === 0) {
      return res.status(404).json({ erro: 'Usuário não encontrado.' });
    }

    const usuario = resultado.rows[0];
    const senhaCorreta = await bcrypt.compare(senhaAtual, usuario.senha);
    if (!senhaCorreta) {
      return res.status(401).json({ erro: 'Senha atual incorreta.' });
    }

    const erroSenha = validarSenhaForte(novaSenha, {
      nome: usuario.nome, sobrenome: usuario.sobrenome
    });
    if (erroSenha) return res.status(400).json({ erro: erroSenha });

    const igualAntiga = await bcrypt.compare(novaSenha, usuario.senha);
    if (igualAntiga) {
      return res.status(400).json({ erro: 'A nova senha deve ser diferente da atual.' });
    }

    const novaSenhaHash = await bcrypt.hash(novaSenha, 10);
    await pool.query('UPDATE usuarios SET senha = $1 WHERE id = $2', [novaSenhaHash, req.userId]);

    return res.json({ mensagem: 'Senha alterada com sucesso!' });
  } catch (erro) {
    console.error('Erro ao trocar senha:', erro);
    return res.status(500).json({ erro: 'Erro ao alterar senha.' });
  }
});

// ============================================================
//  GET EXPORTAR — LGPD
// ============================================================
app.get('/api/usuario/exportar', autenticar, async (req, res) => {
  try {
    const resultado = await pool.query(
      `SELECT id, nome, sobrenome, cpf, telefone, email,
              cep, logradouro, numero, complemento, bairro,
              recebe_newsletter, aceita_termos
       FROM usuarios WHERE id = $1`, [req.userId]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ erro: 'Usuário não encontrado.' });
    }

    const dados = {
      exportadoEm: new Date().toISOString(),
      base_legal: 'Lei nº 13.709/2018 (LGPD), Art. 18, II — Direito de acesso aos dados',
      plataforma: 'Santo Desapego',
      usuario: resultado.rows[0],
    };
    return res.json(dados);
  } catch (erro) {
    console.error('Erro ao exportar dados:', erro);
    return res.status(500).json({ erro: 'Erro ao exportar dados.' });
  }
});

// ============================================================
//  DELETE CONTA
// ============================================================
app.delete('/api/usuario/conta', autenticar, async (req, res) => {
  try {
    const { senhaConfirmacao } = req.body;
    if (!senhaConfirmacao) {
      return res.status(400).json({ erro: 'Informe sua senha para confirmar a exclusão.' });
    }

    const resultado = await pool.query('SELECT senha FROM usuarios WHERE id = $1', [req.userId]);
    if (resultado.rows.length === 0) {
      return res.status(404).json({ erro: 'Usuário não encontrado.' });
    }

    const senhaCorreta = await bcrypt.compare(senhaConfirmacao, resultado.rows[0].senha);
    if (!senhaCorreta) {
      return res.status(401).json({ erro: 'Senha incorreta.' });
    }

    await pool.query('DELETE FROM usuarios WHERE id = $1', [req.userId]);
    console.log(`🗑️  Conta excluída — usuário ID ${req.userId}`);

    return res.json({ mensagem: 'Conta excluída com sucesso. Sentiremos sua falta!' });
  } catch (erro) {
    console.error('Erro ao excluir conta:', erro);
    return res.status(500).json({ erro: 'Erro ao excluir conta.' });
  }
});

// ============================================================
//  GET MEUS ANÚNCIOS — anúncios do vendedor logado (todos status)
//  Usado na aba "Anúncios" do perfil.
// ============================================================
app.get('/api/usuario/anuncios', autenticar, async (req, res) => {
  try {
    const resultado = await pool.query(
      `SELECT
         a.id, a.titulo, a.preco, a.status, a.estado_conservacao, a.data_criacao,
         c.nome AS categoria_nome,
         (SELECT imagem FROM anuncio_imagens
           WHERE anuncio_id = a.id AND is_principal = TRUE LIMIT 1) AS imagem_principal
       FROM anuncios a
       JOIN categorias c ON c.id = a.categoria_id
       WHERE a.vendedor_id = $1
       ORDER BY a.data_criacao DESC`,
      [req.userId]
    );

    return res.json({ anuncios: resultado.rows });
  } catch (erro) {
    console.error('Erro ao listar meus anúncios:', erro);
    return res.status(500).json({ erro: 'Erro ao listar seus anúncios.' });
  }
});

// ============================================================
//  GET MINHAS COMPRAS — compras do comprador logado
//  Usado na aba "Compras" do perfil.
// ============================================================
app.get('/api/usuario/compras', autenticar, async (req, res) => {
  try {
    const resultado = await pool.query(
      `SELECT
         co.id, co.preco, co.status, co.metodo_pagamento, co.parcelas, co.criada_em,
         a.id AS anuncio_id, a.titulo AS anuncio_titulo,
         u.id AS vendedor_id, u.nome AS vendedor_nome, u.sobrenome AS vendedor_sobrenome,
         (SELECT imagem FROM anuncio_imagens
           WHERE anuncio_id = a.id AND is_principal = TRUE LIMIT 1) AS anuncio_imagem,
         (av.id IS NOT NULL) AS ja_avaliei
       FROM compras co
       JOIN anuncios a ON a.id = co.anuncio_id
       JOIN usuarios u ON u.id = co.vendedor_id
       LEFT JOIN avaliacoes av ON av.compra_id = co.id
       WHERE co.comprador_id = $1
       ORDER BY co.criada_em DESC`,
      [req.userId]
    );

    return res.json({ compras: resultado.rows });
  } catch (erro) {
    console.error('Erro ao listar compras:', erro);
    return res.status(500).json({ erro: 'Erro ao listar suas compras.' });
  }
});

// ============================================================
//  GET AVALIAÇÕES RECEBIDAS — avaliações de quem comprou de mim
//  Usado na aba "Avaliações" do perfil.
// ============================================================
app.get('/api/usuario/avaliacoes', autenticar, async (req, res) => {
  try {
    const resultado = await pool.query(
      `SELECT
         av.id, av.nota, av.comentario, av.criada_em,
         u.nome AS avaliador_nome, u.foto_perfil AS avaliador_foto,
         a.titulo AS anuncio_titulo
       FROM avaliacoes av
       JOIN usuarios u ON u.id = av.avaliador_id
       JOIN compras co ON co.id = av.compra_id
       JOIN anuncios a ON a.id = co.anuncio_id
       WHERE av.avaliado_id = $1
       ORDER BY av.criada_em DESC`,
      [req.userId]
    );

    const mediaResultado = await pool.query(
      `SELECT AVG(nota)::float AS media, COUNT(*) AS total
       FROM avaliacoes WHERE avaliado_id = $1`,
      [req.userId]
    );

    return res.json({
      avaliacoes: resultado.rows,
      media: mediaResultado.rows[0]?.media ?? null,
      total: parseInt(mediaResultado.rows[0]?.total) || 0,
    });
  } catch (erro) {
    console.error('Erro ao listar avaliações:', erro);
    return res.status(500).json({ erro: 'Erro ao listar avaliações.' });
  }
});

// ============================================================
//  POST AVALIAÇÃO — comprador avalia o vendedor de uma compra
// ============================================================
app.post('/api/avaliacoes', autenticar, async (req, res) => {
  try {
    const { compra_id, nota, comentario } = req.body;

    if (!compra_id) {
      return res.status(400).json({ erro: 'Informe a compra que está sendo avaliada.' });
    }
    const notaNum = parseInt(nota);
    if (!notaNum || notaNum < 1 || notaNum > 5) {
      return res.status(400).json({ erro: 'A nota deve ser um número de 1 a 5.' });
    }
    if (comentario && comentario.length > 500) {
      return res.status(400).json({ erro: 'Comentário muito longo (máximo 500 caracteres).' });
    }

    const compra = await pool.query(
      'SELECT comprador_id, vendedor_id FROM compras WHERE id = $1',
      [compra_id]
    );

    if (compra.rows.length === 0) {
      return res.status(404).json({ erro: 'Compra não encontrada.' });
    }
    if (compra.rows[0].comprador_id !== req.userId) {
      return res.status(403).json({ erro: 'Você só pode avaliar suas próprias compras.' });
    }

    const jaAvaliada = await pool.query(
      'SELECT id FROM avaliacoes WHERE compra_id = $1', [compra_id]
    );
    if (jaAvaliada.rows.length > 0) {
      return res.status(409).json({ erro: 'Você já avaliou esta compra.' });
    }

    const nova = await pool.query(
      `INSERT INTO avaliacoes (compra_id, avaliador_id, avaliado_id, nota, comentario)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, nota, comentario, criada_em`,
      [compra_id, req.userId, compra.rows[0].vendedor_id, notaNum, comentario?.trim() || null]
    );

    return res.status(201).json({
      mensagem: 'Avaliação enviada com sucesso!',
      avaliacao: nova.rows[0],
    });
  } catch (erro) {
    console.error('Erro ao registrar avaliação:', erro);
    return res.status(500).json({ erro: 'Erro ao registrar avaliação.' });
  }
});

// ============================================================
//  GET CATEGORIAS — lista hierárquica
// ============================================================
app.get('/api/categorias', async (req, res) => {
  try {
    const resultado = await pool.query(
      `SELECT id, nome, slug, icone, categoria_pai, ordem
       FROM categorias ORDER BY ordem, nome`
    );

    const principais = resultado.rows.filter((c) => c.categoria_pai === null);
    const filhas     = resultado.rows.filter((c) => c.categoria_pai !== null);

    const categorias = principais.map((p) => ({
      ...p,
      subcategorias: filhas.filter((f) => f.categoria_pai === p.id),
    }));

    return res.json({ categorias });
  } catch (erro) {
    console.error('Erro ao listar categorias:', erro);
    return res.status(500).json({ erro: 'Erro ao listar categorias.' });
  }
});

// ============================================================
//  POST ANÚNCIO — cria com validações
// ============================================================
app.post('/api/anuncios', autenticar, async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      titulo, descricao, preco, aceita_troca,
      estado_conservacao, categoria_id,
      cep, bairro,
      imagens
    } = req.body;

    // Validações básicas
    if (!titulo || titulo.trim().length < 5)
      return res.status(400).json({ erro: 'Título precisa ter pelo menos 5 caracteres.' });
    if (titulo.length > 120)
      return res.status(400).json({ erro: 'Título muito longo (máximo 120 caracteres).' });
    if (!descricao || descricao.trim().length < 20)
      return res.status(400).json({ erro: 'Descrição precisa ter pelo menos 20 caracteres.' });
    if (!preco || preco < 0)
      return res.status(400).json({ erro: 'Informe um preço válido.' });
    if (!['novo', 'seminovo', 'usado', 'para-reparo'].includes(estado_conservacao))
      return res.status(400).json({ erro: 'Estado de conservação inválido.' });
    if (!categoria_id)
      return res.status(400).json({ erro: 'Selecione uma categoria.' });

    // RN01 — Restrição Geográfica
    if (!validarCEPSantoAmaro(cep)) {
      return res.status(400).json({
        erro: 'Anúncios só podem ser publicados em CEPs de Santo Amaro e regiões limítrofes (zona sul de SP). [RN01]'
      });
    }

    // RN09 — Moderação de Conteúdo
    const palavraProibida = conteudoTemPalavrasProibidas(`${titulo} ${descricao}`);
    if (palavraProibida) {
      return res.status(400).json({
        erro: `Seu anúncio contém conteúdo não permitido pelos Termos de Uso. Revise o título e a descrição. [RN09]`
      });
    }

    // RFN19 — Limites de Upload
    if (!imagens || !Array.isArray(imagens) || imagens.length === 0)
      return res.status(400).json({ erro: 'Envie pelo menos 1 imagem do produto.' });
    if (imagens.length > 6)
      return res.status(400).json({ erro: 'Máximo de 6 imagens por anúncio.' });

    const tamanhoTotal = imagens.reduce((acc, img) => acc + (img?.length || 0), 0);
    if (tamanhoTotal > 5 * 1024 * 1024) {
      return res.status(400).json({ erro: 'Imagens muito grandes no total. Tente reduzir a quantidade ou qualidade.' });
    }

    for (const img of imagens) {
      if (typeof img !== 'string' || !img.startsWith('data:image/')) {
        return res.status(400).json({ erro: 'Uma das imagens está em formato inválido.' });
      }
    }

    // Verifica se categoria existe
    const cat = await client.query('SELECT id FROM categorias WHERE id = $1', [categoria_id]);
    if (cat.rows.length === 0) {
      return res.status(400).json({ erro: 'Categoria inválida.' });
    }

    // Inicia transação (ACID)
    await client.query('BEGIN');

    const cepLimpo = cep.replace(/\D/g, '');

    const novoAnuncio = await client.query(
      `INSERT INTO anuncios
        (vendedor_id, categoria_id, titulo, descricao, preco,
         aceita_troca, estado_conservacao, cep, bairro, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'ativo')
       RETURNING id, titulo, preco, status, data_criacao`,
      [
        req.userId, categoria_id, titulo.trim(), descricao.trim(), preco,
        aceita_troca === true, estado_conservacao, cepLimpo, bairro || null
      ]
    );

    const anuncioId = novoAnuncio.rows[0].id;

    // Insere imagens (a primeira é a principal)
    for (let i = 0; i < imagens.length; i++) {
      await client.query(
        `INSERT INTO anuncio_imagens (anuncio_id, imagem, ordem, is_principal)
         VALUES ($1, $2, $3, $4)`,
        [anuncioId, imagens[i], i, i === 0]
      );
    }

    await client.query('COMMIT');

    console.log(`📦 Anúncio #${anuncioId} criado por usuário #${req.userId}`);

    return res.status(201).json({
      mensagem: 'Anúncio publicado com sucesso!',
      anuncio: novoAnuncio.rows[0]
    });

  } catch (erro) {
    await client.query('ROLLBACK');
    console.error('Erro ao criar anúncio:', erro);
    return res.status(500).json({ erro: 'Erro ao publicar anúncio.' });
  } finally {
    client.release();
  }
});

// ============================================================
//  GET ANÚNCIOS — lista com filtros (pra tela Explorar)
// ============================================================
app.get('/api/anuncios', async (req, res) => {
  try {
    const {
      categoria_id,
      preco_min,
      preco_max,
      estado_conservacao,
      aceita_troca,
      bairro,
      busca,
      ordenacao = 'recentes',
      pagina = 1,
      limite = 12
    } = req.query;

    let query = `
      SELECT 
        a.id, a.titulo, a.descricao, a.preco, a.aceita_troca,
        a.estado_conservacao, a.bairro, a.status, a.data_criacao,
        c.nome AS categoria_nome,
        u.nome AS vendedor_nome,
        u.foto_perfil AS vendedor_foto,
        (SELECT imagem FROM anuncio_imagens WHERE anuncio_id = a.id AND is_principal = true LIMIT 1) AS imagem_principal
      FROM anuncios a
      JOIN categorias c ON a.categoria_id = c.id
      JOIN usuarios u ON a.vendedor_id = u.id
      WHERE a.status = 'ativo'
    `;

    const params = [];
    let paramIndex = 1;

    if (categoria_id) {
      // Busca anúncios da categoria OU de suas subcategorias
      query += ` AND (a.categoria_id = $${paramIndex} OR c.categoria_pai = $${paramIndex})`;
      params.push(categoria_id);
      paramIndex++;
    }

    if (busca) {
      // Busca por texto no título ou descrição (case-insensitive, ignora acentos)
      // Normaliza tanto o termo de busca quanto os dados usando TRANSLATE
      const buscaNormalizada = busca
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
      
      query += ` AND (
        TRANSLATE(LOWER(a.titulo), 'áàâãäéèêëíìîïóòôõöúùûüçñ', 'aaaaaeeeeiiiiooooouuuucn') LIKE $${paramIndex}
        OR TRANSLATE(LOWER(a.descricao), 'áàâãäéèêëíìîïóòôõöúùûüçñ', 'aaaaaeeeeiiiiooooouuuucn') LIKE $${paramIndex}
      )`;
      params.push(`%${buscaNormalizada}%`);
      paramIndex++;
    }

    if (preco_min) {
      query += ` AND a.preco >= $${paramIndex}`;
      params.push(preco_min);
      paramIndex++;
    }

    if (preco_max) {
      query += ` AND a.preco <= $${paramIndex}`;
      params.push(preco_max);
      paramIndex++;
    }

    if (estado_conservacao) {
      query += ` AND a.estado_conservacao = $${paramIndex}`;
      params.push(estado_conservacao);
      paramIndex++;
    }

    if (aceita_troca === 'true') {
      query += ` AND a.aceita_troca = true`;
    }

    if (bairro) {
      query += ` AND a.bairro = $${paramIndex}`;
      params.push(bairro);
      paramIndex++;
    }

    // Ordenação
    if (ordenacao === 'preco-menor') {
      query += ' ORDER BY a.preco ASC';
    } else if (ordenacao === 'preco-maior') {
      query += ' ORDER BY a.preco DESC';
    } else {
      query += ' ORDER BY a.data_criacao DESC';
    }

    // Paginação
    const offset = (pagina - 1) * limite;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limite, offset);

    const resultado = await pool.query(query, params);

    // Conta total pra paginação
    let countQuery = 'SELECT COUNT(*) FROM anuncios a WHERE a.status = $1';
    const countParams = ['ativo'];
    const totalResult = await pool.query(countQuery, countParams);
    const total = parseInt(totalResult.rows[0].count);

    return res.json({
      anuncios: resultado.rows,
      paginacao: {
        pagina_atual: parseInt(pagina),
        total_paginas: Math.ceil(total / limite),
        total_itens: total,
        itens_por_pagina: parseInt(limite)
      }
    });

  } catch (erro) {
    console.error('Erro ao listar anúncios:', erro);
    return res.status(500).json({ erro: 'Erro ao buscar anúncios.' });
  }
});

// ============================================================
//  GET ANÚNCIO POR ID — detalhe (pra tela do anúncio)  ← NOVA
// ============================================================
app.get('/api/anuncios/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (isNaN(parseInt(id))) {
      return res.status(400).json({ erro: 'ID de anúncio inválido.' });
    }

    const resultado = await pool.query(
      `SELECT
         a.id, a.titulo, a.descricao, a.preco, a.aceita_troca,
         a.estado_conservacao, a.cep, a.bairro, a.status, a.data_criacao,
         a.categoria_id, a.vendedor_id,
         c.nome AS categoria_nome,
         u.nome AS vendedor_nome,
         u.nome AS usuario_nome,
         u.sobrenome AS vendedor_sobrenome,
         u.foto_perfil AS vendedor_foto
       FROM anuncios a
       JOIN categorias c ON a.categoria_id = c.id
       JOIN usuarios   u ON a.vendedor_id  = u.id
       WHERE a.id = $1`,
      [id]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ erro: 'Anúncio não encontrado.' });
    }

    const anuncio = resultado.rows[0];

    // Todas as imagens, com a principal primeiro
    const imagens = await pool.query(
      `SELECT imagem
         FROM anuncio_imagens
        WHERE anuncio_id = $1
        ORDER BY is_principal DESC, ordem ASC, id ASC`,
      [id]
    );

    anuncio.imagens = imagens.rows.map((linha) => linha.imagem);

    return res.json({ anuncio });

  } catch (erro) {
    console.error('Erro ao buscar anúncio:', erro);
    return res.status(500).json({ erro: 'Erro ao buscar anúncio.' });
  }
});

// ============================================================
//  CHAT — abre (ou reaproveita) uma conversa sobre um anúncio
//  O comprador clica em "Conversar com o anunciante".
// ============================================================
app.post('/api/conversas', autenticar, async (req, res) => {
  try {
    const { anuncio_id } = req.body;

    if (!anuncio_id) {
      return res.status(400).json({ erro: 'Informe o anúncio.' });
    }

    const anuncio = await pool.query(
      'SELECT id, vendedor_id, status FROM anuncios WHERE id = $1',
      [anuncio_id]
    );

    if (anuncio.rows.length === 0) {
      return res.status(404).json({ erro: 'Anúncio não encontrado.' });
    }

    const vendedorId = anuncio.rows[0].vendedor_id;

    if (vendedorId === req.userId) {
      return res.status(400).json({ erro: 'Você não pode conversar no seu próprio anúncio.' });
    }

    // ON CONFLICT: se a conversa já existe, devolve ela em vez de duplicar
    const conversa = await pool.query(
      `INSERT INTO conversas (anuncio_id, comprador_id, vendedor_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (anuncio_id, comprador_id)
       DO UPDATE SET anuncio_id = EXCLUDED.anuncio_id
       RETURNING id, anuncio_id, comprador_id, vendedor_id, criada_em`,
      [anuncio_id, req.userId, vendedorId]
    );

    return res.status(201).json({ conversa: conversa.rows[0] });

  } catch (erro) {
    console.error('Erro ao abrir conversa:', erro);
    return res.status(500).json({ erro: 'Erro ao abrir conversa.' });
  }
});

// ============================================================
//  CHAT — lista as conversas do usuário logado
//  Traz a última mensagem e quantas não lidas, numa consulta só.
// ============================================================
app.get('/api/conversas', autenticar, async (req, res) => {
  try {
    const resultado = await pool.query(
      `SELECT
         c.id,
         c.anuncio_id,
         c.ultima_mensagem_em,
         CASE WHEN c.comprador_id = $1 THEN 'comprador' ELSE 'vendedor' END AS meu_papel,
         a.titulo  AS anuncio_titulo,
         a.preco   AS anuncio_preco,
         a.status  AS anuncio_status,
         (SELECT imagem FROM anuncio_imagens
           WHERE anuncio_id = a.id AND is_principal = TRUE LIMIT 1) AS anuncio_imagem,
         o.id          AS outro_id,
         o.nome        AS outro_nome,
         o.foto_perfil AS outro_foto,
         ultima.conteudo     AS ultima_mensagem,
         ultima.remetente_id AS ultima_remetente_id,
         COALESCE(nao_lidas.qtd, 0)::int AS nao_lidas
       FROM conversas c
       JOIN anuncios a ON a.id = c.anuncio_id
       JOIN usuarios o
         ON o.id = CASE WHEN c.comprador_id = $1 THEN c.vendedor_id ELSE c.comprador_id END
       LEFT JOIN LATERAL (
         SELECT conteudo, remetente_id
           FROM mensagens m
          WHERE m.conversa_id = c.id
          ORDER BY m.id DESC
          LIMIT 1
       ) ultima ON TRUE
       LEFT JOIN LATERAL (
         SELECT COUNT(*) AS qtd
           FROM mensagens m
          WHERE m.conversa_id = c.id
            AND m.remetente_id <> $1
            AND m.lida = FALSE
       ) nao_lidas ON TRUE
       WHERE c.comprador_id = $1 OR c.vendedor_id = $1
       ORDER BY c.ultima_mensagem_em DESC
       LIMIT 50`,
      [req.userId]
    );

    const total_nao_lidas = resultado.rows.reduce((soma, c) => soma + c.nao_lidas, 0);

    return res.json({ conversas: resultado.rows, total_nao_lidas });

  } catch (erro) {
    console.error('Erro ao listar conversas:', erro);
    return res.status(500).json({ erro: 'Erro ao listar conversas.' });
  }
});

// ============================================================
//  CHAT — mensagens de uma conversa
//  ?antes_de=<id>  → carrega o histórico mais antigo (rolagem)
//  ?depois_de=<id> → busca só o que chegou depois (atualização)
// ============================================================
app.get('/api/conversas/:id/mensagens', autenticar, async (req, res) => {
  try {
    const conversaId = req.params.id;
    const { antes_de, depois_de } = req.query;
    const limite = Math.min(parseInt(req.query.limite) || 30, 100);

    // Confere se o usuário faz parte da conversa
    const conversa = await pool.query(
      `SELECT c.id, c.anuncio_id, c.comprador_id, c.vendedor_id,
              a.titulo AS anuncio_titulo, a.preco AS anuncio_preco, a.status AS anuncio_status,
              (SELECT imagem FROM anuncio_imagens
                WHERE anuncio_id = a.id AND is_principal = TRUE LIMIT 1) AS anuncio_imagem
         FROM conversas c
         JOIN anuncios a ON a.id = c.anuncio_id
        WHERE c.id = $1`,
      [conversaId]
    );

    if (conversa.rows.length === 0) {
      return res.status(404).json({ erro: 'Conversa não encontrada.' });
    }

    const dadosConversa = conversa.rows[0];
    const participa =
      dadosConversa.comprador_id === req.userId || dadosConversa.vendedor_id === req.userId;

    if (!participa) {
      return res.status(403).json({ erro: 'Esta conversa não é sua.' });
    }

    let mensagens;

    if (depois_de) {
      // Só o que chegou depois — é o que a tela pede de tempos em tempos
      mensagens = await pool.query(
        `SELECT id, conteudo, remetente_id, lida, enviada_em
           FROM mensagens
          WHERE conversa_id = $1 AND id > $2
          ORDER BY id ASC
          LIMIT $3`,
        [conversaId, depois_de, limite]
      );
    } else {
      // Histórico: pega as mais novas (ou anteriores a um id) e inverte
      mensagens = await pool.query(
        `SELECT id, conteudo, remetente_id, lida, enviada_em
           FROM mensagens
          WHERE conversa_id = $1
            AND ($2::bigint IS NULL OR id < $2)
          ORDER BY id DESC
          LIMIT $3`,
        [conversaId, antes_de || null, limite]
      );
      mensagens.rows.reverse();
    }

    // Marca como lidas as mensagens que o outro mandou
    await pool.query(
      `UPDATE mensagens
          SET lida = TRUE
        WHERE conversa_id = $1 AND remetente_id <> $2 AND lida = FALSE`,
      [conversaId, req.userId]
    );

    return res.json({
      mensagens: mensagens.rows,
      // com menos que o limite, chegamos no começo da conversa
      tem_mais: !depois_de && mensagens.rows.length === limite,
      conversa: {
        id: dadosConversa.id,
        anuncio_id: dadosConversa.anuncio_id,
        anuncio_titulo: dadosConversa.anuncio_titulo,
        anuncio_preco: dadosConversa.anuncio_preco,
        anuncio_status: dadosConversa.anuncio_status,
        anuncio_imagem: dadosConversa.anuncio_imagem,
        meu_papel: dadosConversa.comprador_id === req.userId ? 'comprador' : 'vendedor',
      },
    });

  } catch (erro) {
    console.error('Erro ao buscar mensagens:', erro);
    return res.status(500).json({ erro: 'Erro ao buscar mensagens.' });
  }
});

// ============================================================
//  CHAT — envia uma mensagem
// ============================================================
app.post('/api/conversas/:id/mensagens', autenticar, async (req, res) => {
  try {
    const conversaId = req.params.id;
    const { conteudo } = req.body;

    if (!conteudo || conteudo.trim().length === 0) {
      return res.status(400).json({ erro: 'A mensagem não pode ficar vazia.' });
    }
    if (conteudo.length > 1000) {
      return res.status(400).json({ erro: 'Mensagem muito longa (máximo 1000 caracteres).' });
    }

    // RN09 — mesma moderação usada nos anúncios
    if (conteudoTemPalavrasProibidas(conteudo)) {
      return res.status(400).json({
        erro: 'Sua mensagem contém conteúdo não permitido pelos Termos de Uso. [RN09]',
      });
    }

    const conversa = await pool.query(
      'SELECT comprador_id, vendedor_id FROM conversas WHERE id = $1',
      [conversaId]
    );

    if (conversa.rows.length === 0) {
      return res.status(404).json({ erro: 'Conversa não encontrada.' });
    }

    const { comprador_id, vendedor_id } = conversa.rows[0];
    if (comprador_id !== req.userId && vendedor_id !== req.userId) {
      return res.status(403).json({ erro: 'Esta conversa não é sua.' });
    }

    const nova = await pool.query(
      `INSERT INTO mensagens (conversa_id, remetente_id, conteudo)
       VALUES ($1, $2, $3)
       RETURNING id, conteudo, remetente_id, lida, enviada_em`,
      [conversaId, req.userId, conteudo.trim()]
    );

    // Mantém a conversa no topo da lista
    await pool.query(
      'UPDATE conversas SET ultima_mensagem_em = NOW() WHERE id = $1',
      [conversaId]
    );

    return res.status(201).json({ mensagem: nova.rows[0] });

  } catch (erro) {
    console.error('Erro ao enviar mensagem:', erro);
    return res.status(500).json({ erro: 'Erro ao enviar mensagem.' });
  }
});

// ============================================================
//  PAGAMENTO — cria a preferência do Checkout Pro (só cartão)
//  Chamada pela tela de revisão do pedido (/checkout/:id).
// ============================================================
app.post('/api/pagamentos/preferencia', autenticar, async (req, res) => {
  try {
    const { anuncio_id } = req.body;

    if (!anuncio_id) {
      return res.status(400).json({ erro: 'Informe o anúncio que será comprado.' });
    }

    // O preço vem SEMPRE do banco — nunca do que o front mandou
    const resultado = await pool.query(
      `SELECT a.id, a.titulo, a.preco, a.status, a.vendedor_id,
              c.nome AS categoria_nome
         FROM anuncios a
         JOIN categorias c ON c.id = a.categoria_id
        WHERE a.id = $1`,
      [anuncio_id]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ erro: 'Anúncio não encontrado.' });
    }

    const anuncio = resultado.rows[0];

    if (anuncio.status !== 'ativo') {
      return res.status(400).json({ erro: 'Este anúncio não está mais disponível.' });
    }
    if (anuncio.vendedor_id === req.userId) {
      return res.status(400).json({ erro: 'Você não pode comprar o seu próprio anúncio.' });
    }

    // Dados do comprador ajudam o Mercado Pago a aprovar mais pagamentos
    const comprador = await pool.query(
      'SELECT nome, sobrenome, email FROM usuarios WHERE id = $1',
      [req.userId]
    );

    const preference = new Preference(mp);

    const resposta = await preference.create({
      body: {
        items: [
          {
            id: String(anuncio.id),
            title: anuncio.titulo,
            description: anuncio.categoria_nome,
            quantity: 1,
            currency_id: 'BRL',
            unit_price: Number(anuncio.preco),
          },
        ],

        payer: {
          name: comprador.rows[0]?.nome,
          surname: comprador.rows[0]?.sobrenome,
          email: comprador.rows[0]?.email,
        },

        // Só cartão — sem Pix, boleto ou lotérica
        payment_methods: {
          excluded_payment_types: [
            { id: 'ticket' },         // boleto e lotérica
            { id: 'bank_transfer' },  // Pix
            { id: 'atm' },            // caixa eletrônico
          ],
          installments: 12,
        },

        back_urls: {
          success: `${FRONTEND_URL}/compra-realizada`,
          pending: `${FRONTEND_URL}/compra-realizada`,
          failure: `${FRONTEND_URL}/checkout/${anuncio.id}?falhou=1`,
        },

        // auto_return não funciona com localhost — o Mercado Pago exige uma
        // URL pública com HTTPS. Em desenvolvimento, o comprador volta pelo
        // botão "Voltar ao site" na tela de confirmação do Mercado Pago.
        // Ao publicar o projeto com domínio real, basta descomentar:
        // auto_return: 'approved',

        external_reference: String(anuncio.id),
        statement_descriptor: 'SANTO DESAPEGO',
      },
    });

    console.log(`💳 Preferência criada — anúncio #${anuncio.id}`);

    return res.json({
      preference_id: resposta.id,
      // Com credenciais TEST-, o init_point normal já roda em modo de teste.
      // Não usamos sandbox_init_point: aquele subdomínio (sandbox.mercadopago
      // .com.br) entra em loop de login com usuários de teste.
      init_point: resposta.init_point,
    });

  } catch (erro) {
    // Mostra o que o Mercado Pago realmente respondeu
    console.error('──────── ERRO MERCADO PAGO ────────');
    console.error('Mensagem:', erro.message);
    console.error('Status:', erro.status || erro.statusCode);
    console.error('Detalhes:', JSON.stringify(erro.cause || erro.error || {}, null, 2));
    console.error('───────────────────────────────────');

    return res.status(500).json({
      erro: 'Não foi possível iniciar o pagamento.',
      detalhe: erro.message,
    });
  }
});

// ============================================================
//  PAGAMENTO — consulta o status real de um pagamento
//  A tela de confirmação usa o payment_id que vem na URL.
// ============================================================
app.get('/api/pagamentos/:paymentId', async (req, res) => {
  try {
    const payment = new Payment(mp);
    const dados = await payment.get({ id: req.params.paymentId });

    return res.json({
      pagamento: {
        id: dados.id,
        status: dados.status,               // approved, pending, rejected...
        status_detail: dados.status_detail,
        valor: dados.transaction_amount,
        metodo: dados.payment_method_id,    // visa, master, elo...
        tipo: dados.payment_type_id,        // credit_card, debit_card
        parcelas: dados.installments,
        anuncio_id: dados.external_reference,
      },
    });
  } catch (erro) {
    console.error('Erro ao consultar pagamento:', erro);
    return res.status(500).json({ erro: 'Erro ao consultar o pagamento.' });
  }
});

// ============================================================
//  PAGAMENTO — confirma e persiste a compra no banco
//  Chamada pela tela /compra-realizada assim que o pagamento é
//  confirmado como aprovado junto ao Mercado Pago. Idempotente:
//  pode ser chamada mais de uma vez pro mesmo payment_id.
// ============================================================
app.post('/api/compras/confirmar', autenticar, async (req, res) => {
  try {
    const { payment_id } = req.body;
    if (!payment_id) {
      return res.status(400).json({ erro: 'Informe o payment_id do pagamento.' });
    }

    const payment = new Payment(mp);
    const dados = await payment.get({ id: payment_id });

    if (dados.status !== 'approved') {
      return res.status(200).json({ registrada: false, status: dados.status });
    }

    const anuncioId = dados.external_reference;
    const anuncio = await pool.query(
      'SELECT id, vendedor_id, preco, status FROM anuncios WHERE id = $1',
      [anuncioId]
    );

    if (anuncio.rows.length === 0) {
      return res.status(404).json({ erro: 'Anúncio da compra não foi encontrado.' });
    }

    const { vendedor_id, preco } = anuncio.rows[0];

    if (vendedor_id === req.userId) {
      return res.status(400).json({ erro: 'Você não pode confirmar uma compra do seu próprio anúncio.' });
    }

    const compra = await pool.query(
      `INSERT INTO compras
        (anuncio_id, comprador_id, vendedor_id, preco, payment_id, status, metodo_pagamento, parcelas)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (payment_id) DO UPDATE SET status = EXCLUDED.status
       RETURNING id, anuncio_id, preco, status, criada_em`,
      [
        anuncioId, req.userId, vendedor_id, preco,
        String(payment_id), dados.status, dados.payment_method_id, dados.installments,
      ]
    );

    await pool.query(
      `UPDATE anuncios SET status = 'vendido' WHERE id = $1 AND status = 'ativo'`,
      [anuncioId]
    );

    return res.status(201).json({ registrada: true, compra: compra.rows[0] });
  } catch (erro) {
    console.error('Erro ao confirmar compra:', erro);
    return res.status(500).json({ erro: 'Erro ao confirmar a compra.' });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Servidor do Santo Desapego rodando em http://localhost:${PORT}`);
});