-- ============================================================
-- schema.sql — Estrutura do banco Santo Desapego
-- Gerado a partir das queries usadas em server.js
-- ============================================================

CREATE TABLE usuarios (
  id                 SERIAL PRIMARY KEY,
  nome               VARCHAR(100)  NOT NULL,
  sobrenome          VARCHAR(100)  NOT NULL,
  telefone           VARCHAR(20),
  email              VARCHAR(255)  NOT NULL UNIQUE,
  senha              VARCHAR(255)  NOT NULL,
  cep                VARCHAR(9),
  logradouro         VARCHAR(200),
  numero             VARCHAR(20),
  complemento        VARCHAR(100),
  bairro             VARCHAR(100),
  cpf                VARCHAR(14)   NOT NULL UNIQUE,
  aceita_termos      BOOLEAN       NOT NULL DEFAULT FALSE,
  recebe_newsletter  BOOLEAN       NOT NULL DEFAULT FALSE,
  foto_perfil        TEXT,
  data_cadastro      TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE TABLE categorias (
  id             SERIAL PRIMARY KEY,
  nome           VARCHAR(100) NOT NULL,
  slug           VARCHAR(100) NOT NULL UNIQUE,
  icone          VARCHAR(50),
  categoria_pai  INTEGER REFERENCES categorias(id),
  ordem          INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE anuncios (
  id                  SERIAL PRIMARY KEY,
  vendedor_id         INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  categoria_id        INTEGER NOT NULL REFERENCES categorias(id),
  titulo              VARCHAR(120) NOT NULL,
  descricao           TEXT NOT NULL,
  preco               NUMERIC(10,2) NOT NULL,
  aceita_troca        BOOLEAN NOT NULL DEFAULT FALSE,
  estado_conservacao  VARCHAR(30) NOT NULL
                        CHECK (estado_conservacao IN ('novo','seminovo','usado','para-reparo')),
  cep                 VARCHAR(8) NOT NULL,
  bairro              VARCHAR(100),
  status              VARCHAR(20) NOT NULL DEFAULT 'ativo'
                        CHECK (status IN ('ativo','vendido','pausado')),
  data_criacao        TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE anuncio_imagens (
  id            SERIAL PRIMARY KEY,
  anuncio_id    INTEGER NOT NULL REFERENCES anuncios(id) ON DELETE CASCADE,
  imagem        TEXT NOT NULL,
  ordem         INTEGER NOT NULL DEFAULT 0,
  is_principal  BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE conversas (
  id                  SERIAL PRIMARY KEY,
  anuncio_id          INTEGER NOT NULL REFERENCES anuncios(id) ON DELETE CASCADE,
  comprador_id        INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  vendedor_id         INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  criada_em           TIMESTAMP NOT NULL DEFAULT NOW(),
  ultima_mensagem_em  TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (anuncio_id, comprador_id)
);

CREATE TABLE mensagens (
  id           SERIAL PRIMARY KEY,
  conversa_id  INTEGER NOT NULL REFERENCES conversas(id) ON DELETE CASCADE,
  remetente_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  conteudo     TEXT NOT NULL,
  lida         BOOLEAN NOT NULL DEFAULT FALSE,
  enviada_em   TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE compras (
  id                 SERIAL PRIMARY KEY,
  anuncio_id         INTEGER NOT NULL REFERENCES anuncios(id) ON DELETE CASCADE,
  comprador_id       INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  vendedor_id        INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  preco              NUMERIC(10,2) NOT NULL,
  payment_id         VARCHAR(50) NOT NULL UNIQUE,
  status             VARCHAR(20) NOT NULL DEFAULT 'approved',
  metodo_pagamento   VARCHAR(30),
  parcelas           INTEGER,
  criada_em          TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE avaliacoes (
  id            SERIAL PRIMARY KEY,
  compra_id     INTEGER NOT NULL UNIQUE REFERENCES compras(id) ON DELETE CASCADE,
  avaliador_id  INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  avaliado_id   INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  nota          INTEGER NOT NULL CHECK (nota BETWEEN 1 AND 5),
  comentario    TEXT,
  criada_em     TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_anuncios_status      ON anuncios(status);
CREATE INDEX idx_anuncios_categoria   ON anuncios(categoria_id);
CREATE INDEX idx_anuncios_vendedor    ON anuncios(vendedor_id);
CREATE INDEX idx_conversas_comprador  ON conversas(comprador_id);
CREATE INDEX idx_conversas_vendedor   ON conversas(vendedor_id);
CREATE INDEX idx_mensagens_conversa   ON mensagens(conversa_id);
CREATE INDEX idx_compras_comprador    ON compras(comprador_id);
CREATE INDEX idx_compras_vendedor     ON compras(vendedor_id);
CREATE INDEX idx_avaliacoes_avaliado  ON avaliacoes(avaliado_id);

-- ============================================================
-- Categorias iniciais (necessárias para publicar anúncios)
-- ============================================================
INSERT INTO categorias (nome, slug, icone, categoria_pai, ordem) VALUES
  ('Móveis',            'moveis',            'sofa',      NULL, 1),
  ('Eletrônicos',       'eletronicos',       'tv',        NULL, 2),
  ('Roupas e Acessórios','roupas',           'shirt',     NULL, 3),
  ('Livros',            'livros',            'book',      NULL, 4),
  ('Utensílios de Casa','utensilios-casa',   'utensils',  NULL, 5),
  ('Esporte e Lazer',   'esporte-lazer',     'ball',      NULL, 6),
  ('Infantil',          'infantil',          'baby',      NULL, 7),
  ('Outros',            'outros',            'box',       NULL, 8);
