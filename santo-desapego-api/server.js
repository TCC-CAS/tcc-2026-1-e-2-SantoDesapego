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

// Aumenta o limite de payload pra suportar fotos em base64 (até ~10MB)
app.use(cors());
app.use(express.json({ limit: '10mb' }));

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
//  GET PERFIL — retorna dados completos + foto + ESTATÍSTICAS
//  [RF05] + [RF13]
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

    // ────────────────────────────────────────────────
    // Estatísticas do painel [RF13 — Painel do Vendedor]
    // Como ainda não temos as tabelas anuncios/transacoes/avaliacoes,
    // os números vêm zerados. Quando você criar essas tabelas,
    // basta substituir esses zeros por COUNTs reais.
    // ────────────────────────────────────────────────
    const estatisticas = {
      anuncios_ativos: 0,
      anuncios_vendidos: 0,
      anuncios_pausados: 0,
      compras_realizadas: 0,
      reputacao_media: null,    // null = ainda sem avaliações
      total_avaliacoes: 0,
      mensagens_nao_lidas: 0,
    };

    return res.json({ usuario, estatisticas });
  } catch (erro) {
    console.error('Erro ao buscar perfil:', erro);
    return res.status(500).json({ erro: 'Erro ao carregar perfil.' });
  }
});

// ============================================================
//  PUT PERFIL — atualiza dados pessoais e endereço
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
//  Recebe a imagem em base64 (já redimensionada pelo front-end)
// ============================================================
app.put('/api/usuario/foto', autenticar, async (req, res) => {
  try {
    const { foto_perfil } = req.body;

    // foto_perfil = null → remoção
    // foto_perfil = string → atualização
    if (foto_perfil !== null && typeof foto_perfil !== 'string') {
      return res.status(400).json({ erro: 'Formato de foto inválido.' });
    }

    // Limite de segurança: 700KB de string base64
    // (base64 ocupa ~33% mais espaço que o binário, então 700KB ≈ 525KB de imagem real)
    if (foto_perfil && foto_perfil.length > 700000) {
      return res.status(400).json({
        erro: 'A foto está muito grande. Tente uma imagem menor.'
      });
    }

    // Valida prefixo data:image/ pra garantir que é uma imagem mesmo
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
//  PUT SENHA — RN03
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
//  GET EXPORTAR — LGPD [RF04]
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
//  DELETE CONTA — [RF04 + RN10]
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

// ──────────────────────────────────────────────────────────
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Servidor do Santo Desapego rodando em http://localhost:${PORT}`);
});