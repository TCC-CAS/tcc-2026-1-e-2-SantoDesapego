// ============================================================
// server.js — API do Santo Desapego
// ============================================================
const express = require('express');
const cors    = require('cors');
const bcrypt  = require('bcrypt');
const jwt     = require('jsonwebtoken');
require('dotenv').config();
const pool = require('./db');

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

    const estatisticas = {
      anuncios_ativos:    parseInt(stats.rows[0]?.anuncios_ativos)   || 0,
      anuncios_vendidos:  parseInt(stats.rows[0]?.anuncios_vendidos) || 0,
      anuncios_pausados:  parseInt(stats.rows[0]?.anuncios_pausados) || 0,
      compras_realizadas: 0,
      reputacao_media:    null,
      total_avaliacoes:   0,
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

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Servidor do Santo Desapego rodando em http://localhost:${PORT}`);
});