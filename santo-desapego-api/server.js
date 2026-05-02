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

app.use(cors());
app.use(express.json());

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
// CADASTRO DE USUÁRIO
// ──────────────────────────────────────────────────────────
app.post('/api/auth/cadastro', async (req, res) => {
  try {
    const {
      nome, sobrenome, telefone, email, senha,
      cep, logradouro, numero, complemento, bairro,
      cpf, aceita_termos, recebe_newsletter
    } = req.body;

    if (!nome || !sobrenome || !email || !senha) {
      return res.status(400).json({
        erro: 'Nome, sobrenome, e-mail e senha são obrigatórios.'
      });
    }
    if (!aceita_termos) {
      return res.status(400).json({
        erro: 'É necessário aceitar os Termos de Uso.'
      });
    }

    const saltRounds = 10;
    const senhaHash  = await bcrypt.hash(senha, saltRounds);

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
        complemento || null, bairro || null, cpf || null,
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
      return res.status(409).json({
        erro: 'E-mail ou CPF já cadastrado na plataforma.'
      });
    }
    return res.status(500).json({
      erro: 'Erro interno no servidor ao cadastrar usuário.'
    });
  }
});

// ──────────────────────────────────────────────────────────
// LOGIN MANUAL (e-mail + senha)
// ──────────────────────────────────────────────────────────
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ erro: 'E-mail e senha são obrigatórios.' });
    }

    const resultado = await pool.query(
      `SELECT id, nome, sobrenome, email, senha, bairro
       FROM usuarios WHERE email = $1`,
      [email]
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
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      mensagem: 'Login realizado com sucesso!',
      token,
      usuario: {
        id:        usuario.id,
        nome:      usuario.nome,
        sobrenome: usuario.sobrenome,
        email:     usuario.email,
        bairro:    usuario.bairro,
      }
    });

  } catch (erro) {
    console.error('Erro no login:', erro);
    return res.status(500).json({ erro: 'Erro interno no servidor.' });
  }
});

// ──────────────────────────────────────────────────────────
// LOGIN COM GOOGLE
// O React envia o access_token do Google. A gente usa esse
// token pra chamar a API userinfo do Google e CONFIRMAR
// que o usuário é quem diz ser (não dá pra forjar).
// Se o e-mail existir no banco, loga; senão, retorna erro.
// ──────────────────────────────────────────────────────────
app.post('/api/auth/google', async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ erro: 'Token do Google não enviado.' });
    }

    // 1. Valida o access_token chamando a API userinfo do Google.
    //    Se o token for falso/expirado, o Google retorna erro.
    const respostaGoogle = await fetch(
      'https://www.googleapis.com/oauth2/v3/userinfo',
      { headers: { Authorization: `Bearer ${credential}` } }
    );

    if (!respostaGoogle.ok) {
      return res.status(401).json({ erro: 'Token do Google inválido ou expirado.' });
    }

    const userInfo = await respostaGoogle.json();
    const emailGoogle = userInfo.email;

    if (!emailGoogle) {
      return res.status(400).json({ erro: 'Não foi possível obter o e-mail do Google.' });
    }

    console.log('🔐 Login Google solicitado por:', emailGoogle);

    // 2. Busca o e-mail no banco
    const resultado = await pool.query(
      `SELECT id, nome, sobrenome, email, bairro
       FROM usuarios WHERE email = $1`,
      [emailGoogle]
    );

    // 3. Se NÃO existe, retorna erro pedindo pra cadastrar primeiro
    if (resultado.rows.length === 0) {
      return res.status(404).json({
        erro: `Não encontramos uma conta com o e-mail ${emailGoogle}. Crie sua conta primeiro!`,
        precisaCadastro: true,
      });
    }

    // 4. Existe → gera nosso JWT e loga
    const usuario = resultado.rows[0];

    const token = jwt.sign(
      { id: usuario.id, email: usuario.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      mensagem: `Bem-vindo(a) de volta, ${usuario.nome}!`,
      token,
      usuario: {
        id:        usuario.id,
        nome:      usuario.nome,
        sobrenome: usuario.sobrenome,
        email:     usuario.email,
        bairro:    usuario.bairro,
      }
    });

  } catch (erro) {
    console.error('Erro no login com Google:', erro);
    return res.status(500).json({ erro: 'Não foi possível validar sua conta Google.' });
  }
});

// ──────────────────────────────────────────────────────────
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Servidor do Santo Desapego rodando em http://localhost:${PORT}`);
});