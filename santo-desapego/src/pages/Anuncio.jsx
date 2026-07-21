import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import './Anuncio.css';

const API_URL = 'http://localhost:8080';

const ESTADO_LABEL = {
  'novo':        { emoji: '✨', name: 'Novo / Na caixa' },
  'seminovo':    { emoji: '👌', name: 'Seminovo' },
  'usado':       { emoji: '👍', name: 'Usado' },
  'para-reparo': { emoji: '🔧', name: 'Para reparo' },
};

const brl = (v) =>
  Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const Anuncio = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [anuncio, setAnuncio] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [foto, setFoto] = useState(0);

  useEffect(() => {
    setCarregando(true);
    fetch(`${API_URL}/api/anuncios/${id}`)
      .then((r) => r.json())
      .then((dados) => {
        // aceita { anuncio: {...} } ou o objeto direto
        const item = dados.anuncio || (dados.id ? dados : null);
        if (item) setAnuncio(item);
        else setErro(dados.erro || 'Anúncio não encontrado.');
      })
      .catch(() => setErro('Erro ao conectar com o servidor.'))
      .finally(() => setCarregando(false));
  }, [id]);

  const comprar = () => {
    const token = localStorage.getItem('sd_token');
    if (!token) { navigate('/login'); return; }
    navigate('/compra-realizada', { state: { anuncio } });
  };

  const Header = () => (
    <header className="site-header">
      <div className="nav-top">
        <Link to="/" className="logo">
          <span className="logo-mark">SD</span>
          Santo <em>Desapego</em>
        </Link>
        <nav className="nav-actions">
          <Link to="/explorar">← Voltar para o Explorar</Link>
        </nav>
      </div>
    </header>
  );

  if (carregando) {
    return (
      <div className="anuncio-wrapper">
        <Header />
        <div className="anuncio-estado">Carregando anúncio...</div>
      </div>
    );
  }

  if (erro || !anuncio) {
    return (
      <div className="anuncio-wrapper">
        <Header />
        <div className="anuncio-estado">
          <h2>Este anúncio não está disponível</h2>
          <p>{erro || 'Ele pode ter sido vendido ou removido pelo vendedor.'}</p>
          <Link to="/explorar" className="btn-anuncio-comprar">Ver outros desapegos →</Link>
        </div>
      </div>
    );
  }

  // Normaliza campos que podem variar de nome no retorno da API
  const imagens  = anuncio.imagens?.length ? anuncio.imagens : [null];
  const estado   = ESTADO_LABEL[anuncio.estado_conservacao] || { emoji: '📦', name: anuncio.estado_conservacao || '—' };
  const vendedor = anuncio.usuario?.nome || anuncio.vendedor?.nome || anuncio.usuario_nome || 'Vendedor';
  const categoria = anuncio.categoria?.nome || anuncio.categoria_nome || '';

  return (
    <div className="anuncio-wrapper">
      <Header />

      <div className="anuncio-container">
        <nav className="anuncio-trilha" aria-label="Navegação">
          <Link to="/explorar">Explorar</Link>
          {categoria && <><span aria-hidden="true">/</span><span>{categoria}</span></>}
        </nav>

        <div className="anuncio-grid">

          {/* ── Galeria ─────────────────────────────── */}
          <section className="anuncio-galeria">
            <div className="galeria-principal">
              {imagens[foto]
                ? <img src={imagens[foto]} alt={anuncio.titulo} />
                : <div className="galeria-vazia">Sem foto</div>}
              {imagens.length > 1 && (
                <span className="galeria-contador">{foto + 1}/{imagens.length}</span>
              )}
            </div>

            {imagens.length > 1 && (
              <div className="galeria-miniaturas">
                {imagens.map((img, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`galeria-mini${i === foto ? ' ativa' : ''}`}
                    onClick={() => setFoto(i)}
                    aria-label={`Ver foto ${i + 1}`}
                  >
                    <img src={img} alt="" />
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* ── Painel de compra ────────────────────── */}
          <aside className="anuncio-painel">
            {categoria && <p className="anuncio-categoria">{categoria}</p>}
            <h1 className="anuncio-titulo">{anuncio.titulo}</h1>
            <p className="anuncio-preco">{brl(anuncio.preco)}</p>

            <div className="anuncio-tags">
              <span className="anuncio-tag">{estado.emoji} {estado.name}</span>
              {anuncio.aceita_troca && <span className="anuncio-tag troca">🔄 Aceita troca</span>}
            </div>

            <p className="anuncio-local">
              📍 {anuncio.bairro}
              {anuncio.cep && <span>CEP {anuncio.cep}</span>}
            </p>

            <div className="anuncio-acoes">
              <button type="button" className="btn-anuncio-comprar" onClick={comprar}>
                Comprar agora
              </button>
              <button type="button" className="btn-anuncio-proposta">
                Fazer proposta
              </button>
            </div>

            <p className="anuncio-nota">
              O pagamento fica retido até você confirmar a retirada da peça, aqui mesmo em Santo Amaro.
            </p>

            <div className="anuncio-vendedor">
              <span className="vendedor-avatar">{vendedor[0]?.toUpperCase()}</span>
              <div>
                <strong>{vendedor}</strong>
                <p>Anunciante em {anuncio.bairro}</p>
              </div>
            </div>
          </aside>
        </div>

        {/* ── Descrição ─────────────────────────────── */}
        <section className="anuncio-descricao">
          <h2>Sobre a peça</h2>
          <p>{anuncio.descricao}</p>

          <dl className="anuncio-ficha">
            <div><dt>Estado</dt><dd>{estado.name}</dd></div>
            <div><dt>Categoria</dt><dd>{categoria || '—'}</dd></div>
            <div><dt>Troca</dt><dd>{anuncio.aceita_troca ? 'Aceita' : 'Não aceita'}</dd></div>
            <div><dt>Retirada</dt><dd>{anuncio.bairro}</dd></div>
          </dl>
        </section>
      </div>

      {/* ── Barra fixa no celular ───────────────────── */}
      <div className="anuncio-barra">
        <div>
          <span>{anuncio.titulo}</span>
          <strong>{brl(anuncio.preco)}</strong>
        </div>
        <button type="button" className="btn-anuncio-comprar" onClick={comprar}>
          Comprar agora
        </button>
      </div>
    </div>
  );
};

export default Anuncio;