import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Home.css';
import Mapa from '../componentes/Mapa';

/* ── Dados — altere aqui sem tocar no JSX ──────────────────── */
const CATEGORIES = [
  { id: 1, icon: '🛋️', name: 'Móveis & Casa',    bg: '#F7D7CB' },
  { id: 2, icon: '💻', name: 'Eletrônicos',       bg: '#D0DFD6' },
  { id: 3, icon: '👗', name: 'Moda',              bg: '#FCE5B6' },
  { id: 4, icon: '🧸', name: 'Infantil & Bebê',   bg: '#E5D5EB' },
  { id: 5, icon: '📚', name: 'Livros',            bg: '#FCD3C1' },
  { id: 6, icon: '🚴', name: 'Esporte & Lazer',   bg: '#C9DDE8' },
  { id: 7, icon: '🎨', name: 'Arte & Decoração',  bg: '#E8DCC4' },
  { id: 8, icon: '🔧', name: 'Ferramentas',       bg: '#E1D1C0' },
];

const FILTER_CHIPS = ['Todos', 'Mais recentes', 'Aceita troca', 'Abaixo de R$100', 'Perto de mim'];

const PRODUCTS = [
  {
    id: 1,
    img: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500&q=80',
    cat: 'Móveis',
    title: 'Sofá 3 lugares veludo verde • excelente estado',
    price: 'R$ 950',
    seller: 'Mariana',
    hood: 'Jardim Marajoara • 0,8km',
    badge: { label: 'Novo anúncio', type: 'new' },
  },
  {
    id: 2,
    img: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=500&q=80',
    cat: 'Eletrônicos',
    title: 'Canon AE-1 analógica com flash e 3 rolos',
    price: 'R$ 380',
    seller: 'João',
    hood: 'Campo Belo • 1,2km',
    badge: null,
  },
  {
    id: 3,
    img: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500&q=80',
    cat: 'Cozinha',
    title: 'Cafeteira italiana Bialetti 6 xícaras',
    price: 'R$ 65',
    seller: 'Renata',
    hood: 'Santo Amaro • 0,4km',
    badge: { label: 'Aceita troca', type: '' },
  },
  {
    id: 4,
    img: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=500&q=80',
    cat: 'Livros',
    title: 'Coleção Harry Potter capa dura completa',
    price: 'R$ 220',
    seller: 'Clara',
    hood: 'Brooklin • 2,3km',
    badge: { label: '🔥 Em alta', type: 'hot' },
  },
  {
    id: 5,
    img: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&q=80',
    cat: 'Eletrônicos',
    title: 'MacBook Air 2020 M1, 8GB, 256GB SSD',
    price: 'R$ 3.850',
    priceOld: 'R$ 7.499',
    seller: 'Paulo',
    hood: 'Granja Julieta • 1,8km',
    badge: null,
  },
  {
    id: 6,
    img: 'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=500&q=80',
    cat: 'Decoração',
    title: 'Luminária vintage de latão anos 70',
    price: 'R$ 150',
    seller: 'Luisa',
    hood: 'Vila Sofia • 2,1km',
    badge: null,
  },
  {
    id: 7,
    img: 'https://images.unsplash.com/photo-1566479179817-c0b5b4b4b1e1?w=500&q=80',
    cat: 'Infantil',
    title: 'Carrinho de bebê Galzerano, excelente estado',
    price: 'R$ 380',
    seller: 'Erica',
    hood: 'Brooklin • 3,0km',
    badge: { label: 'Aceita troca', type: '' },
  },
  {
    id: 8,
    img: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=500&q=80',
    cat: 'Ferramentas',
    title: 'Furadeira Bosch com kit de brocas',
    price: 'R$ 190',
    seller: 'André',
    hood: 'Vila Mascote • 1,5km',
    badge: null,
  },
];

const STEPS = [
  {
    num: '01',
    title: 'Anuncie em 2 minutos',
    desc: 'Fotografe, descreva, defina o preço. Nosso sistema valida seu CEP e posiciona seu anúncio para vizinhos do bairro.',
  },
  {
    num: '02',
    title: 'Conecte-se com vizinhos',
    desc: 'Converse direto no chat seguro da plataforma. Combine o encontro, a forma de pagamento e esclareça dúvidas em tempo real.',
  },
  {
    num: '03',
    title: 'Feche o negócio perto de casa',
    desc: 'Retire pessoalmente ou escolha entrega hiperlocal. Após a transação, ambos se avaliam e fortalecem a reputação da comunidade.',
  },
];

/* ── Pilares do Santo Desapego ─────────────────────────────── */
const IMPACT_CARDS = [
  {
    num: '01',
    title: 'Hiperlocal',
    desc: 'Cadastros validados por CEP. Anúncios e transações acontecem 100% dentro do distrito de Santo Amaro.',
    accent: 'terracotta',
  },
  {
    num: '02',
    title: 'Circular',
    desc: 'Cada item ganha uma nova história em vez de virar descarte. Menos lixo no aterro, menos produção nova.',
    accent: 'forest',
  },
  {
    num: '03',
    title: 'Comunidade',
    desc: 'Conexões reais entre quem mora perto. A reputação do vizinho se constrói anúncio a anúncio.',
    accent: 'mustard',
  },
  {
    num: '04',
    title: 'Consciente',
    desc: 'Preço justo e ciclo de vida prolongado. Um modelo pensado para um consumo mais responsável.',
    accent: 'ink',
  },
];

const HOODS = [
  'Santo Amaro Centro', 'Jardim Marajoara', 'Campo Belo',
  'Brooklin', 'Granja Julieta', 'Vila Cruzeiro',
  'Vila Sofia', 'Vila Mascote', '+ 12 bairros',
];

const FOOTER_LINKS = [
  {
    title: 'Plataforma',
    links: ['Como funciona', 'Anunciar', 'Categorias', 'Dicas de segurança'],
  },
  {
    title: 'Comunidade',
    links: ['Nosso impacto', 'Bairros atendidos', 'Blog', 'Indique um vizinho'],
  },
  {
    title: 'Suporte',
    links: ['Central de ajuda', 'Fale conosco', 'Termos de uso', 'Privacidade (LGPD)'],
  },
];

const HERO_CARDS = [
  { img: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=80', price: 'R$ 480',  hood: 'Sofá • Jardim Marajoara',      cls: 'hero-card-1' },
  { img: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=400&q=80', price: 'R$ 120',  hood: 'Bicicleta • Campo Belo', cls: 'hero-card-2' },
  { img: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=400&q=80', price: 'R$ 35',   hood: 'Livros • Vila Cruzeiro',          cls: 'hero-card-3' },
  { img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80', price: 'R$ 220',  hood: 'Tênis • Vila Mascote',            cls: 'hero-card-4' },
];

/* ── Ícones ─────────────────────────────────────────────────── */
const IconSearch = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
  </svg>
);
const IconPin = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>
  </svg>
);
const IconArrow = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round">
    <path d="M5 12h14M13 5l7 7-7 7"/>
  </svg>
);
const IconHeart = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
  </svg>
);
const IconLogout = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

/* ════════════════════════════════════════════════════════════
   COMPONENTE
   ════════════════════════════════════════════════════════════ */
const Home = () => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('Todos');
  const [favorites, setFavorites] = useState(new Set());
  const [termoBusca, setTermoBusca] = useState('');
  const [anunciosReais, setAnunciosReais] = useState([]);
  const [carregandoAnuncios, setCarregandoAnuncios] = useState(true);

  // ── Estado do usuário logado (lê do localStorage)
  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    const usuarioSalvo = localStorage.getItem('sd_usuario');
    if (usuarioSalvo) {
      try {
        setUsuario(JSON.parse(usuarioSalvo));
      } catch {
        // se o JSON estiver corrompido, limpa pra evitar loop de erro
        localStorage.removeItem('sd_usuario');
        localStorage.removeItem('sd_token');
      }
    }
  }, []);

  // Buscar anúncios reais da API
  useEffect(() => {
    const buscarAnuncios = async () => {
      try {
        const res = await fetch('http://localhost:8080/api/anuncios?limite=8&ordenacao=recentes');
        const data = await res.json();
        setAnunciosReais(data.anuncios || []);
      } catch (erro) {
        console.error('Erro ao buscar anúncios:', erro);
        setAnunciosReais([]);
      } finally {
        setCarregandoAnuncios(false);
      }
    };
    
    buscarAnuncios();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('sd_token');
    localStorage.removeItem('sd_usuario');
    setUsuario(null);
    navigate('/');
  };
  
  const handleBuscar = (e) => {
    e.preventDefault();
    if (termoBusca.trim()) {
      navigate(`/explorar?busca=${encodeURIComponent(termoBusca.trim())}`);
    } else {
      navigate('/explorar');
    }
  };

  const toggleFav = (id) =>
    setFavorites((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  // ── CTA "Anunciar grátis": leva pra /anunciar se logado, pra /cadastro se visitante ──
  const linkAnunciar = usuario ? '/anunciar' : '/cadastro';

  return (
    <div className="home-page">

      {/* ── Announcement ── */}
      <div className="announcement">
        🌱 Economia circular em Santo Amaro:{' '}
        <strong>menos descarte, mais comunidade</strong> entre vizinhos.
      </div>

      {/* ── Header ── */}
      <header className="site-header">
        <div className="nav-top home-nav">
          <Link to="/" className="logo">
            <span className="logo-mark">SD</span>
            Santo <em>Desapego</em>
          </Link>

          <div className="search-bar">
            <IconSearch />
            <input 
              type="text" 
              placeholder="Buscar sofá, bicicleta, livro, notebook..." 
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleBuscar(e)}
            />
            <span className="search-location">
              <IconPin />
              Santo Amaro, SP
            </span>
            <button className="search-btn" onClick={handleBuscar}>Buscar</button>
          </div>

          {/* ───── Header dinâmico: muda se está logado ───── */}
          <nav className="nav-actions">
            {usuario ? (
              <>
                <Link to="/perfil" style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.9rem',
                  color: 'var(--ink)',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
                title="Meu perfil"
                >
                  <span style={{
                    width: 30,
                    height: 30,
                    borderRadius: '50%',
                    background: 'var(--terracotta)',
                    color: 'var(--cream)',
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    overflow: 'hidden',
                  }}>
                    {usuario.foto_perfil
                      ? <img src={usuario.foto_perfil} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : usuario.nome[0].toUpperCase()}
                  </span>
                  Olá, {usuario.nome}!
                </Link>
                <button
                  onClick={handleLogout}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    background: 'none',
                    border: 'none',
                    color: 'var(--ink-muted)',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  <IconLogout />
                  Sair
                </button>
                <Link to="/anunciar" className="btn-sell">+ Anunciar grátis</Link>
              </>
            ) : (
              <>
                <Link to="/login">Entrar</Link>
                <Link to="/cadastro" className="btn-sell">+ Anunciar grátis</Link>
              </>
            )}
          </nav>
        </div>

        <nav className="nav-categories">
          <Link to="/explorar">Todos</Link>
          <Link to="/explorar?categoria_id=1">🛋️ Móveis & Casa</Link>
          <Link to="/explorar?categoria_id=2">💻 Eletrônicos</Link>
          <Link to="/explorar?categoria_id=3">👗 Moda</Link>
          <Link to="/explorar?categoria_id=4">🧸 Infantil & Bebê</Link>
          <Link to="/explorar?categoria_id=5">📚 Livros</Link>
          <Link to="/explorar?categoria_id=6">🚴 Esporte & Lazer</Link>
          <Link to="/explorar?categoria_id=7">🎨 Arte & Decoração</Link>
          <Link to="/explorar?categoria_id=8">🔧 Ferramentas</Link>
          <Link to="/explorar">🕰️ Brechó vintage</Link>
          <Link to="/explorar?aceita_troca=true">Trocas 🔄</Link>
        </nav>
      </header>

      {/* ══════════════════════════════════
          HERO
          ══════════════════════════════════ */}
      <section className="hero">
        <div className="hero-text">
          <span className="hero-kicker">Economia compartilhada • Santo Amaro</span>
          <h1>
            {usuario ? (
              <>
                Olá, <em>{usuario.nome}</em>! <br />
                Veja o que tem de novo no <em>seu bairro</em>.
              </>
            ) : (
              <>
                Seu desapego <br />
                encontra uma <em>nova história</em> aqui perto.
              </>
            )}
          </h1>
          <p className="lede">
            Uma plataforma hiperlocal de compra, venda e troca entre vizinhos de Santo Amaro.
            Menos descarte, mais comunidade — e produtos com preço justo.
          </p>

          <div className="hero-cta-row">
            <Link to="/explorar" className="btn-home-primary">
              Explorar desapegos <IconArrow />
            </Link>
            <a href="#como-funciona" className="btn-ghost">Como funciona</a>
          </div>

          <div className="hero-trust">
            {[
              { num: '🌱', lbl: 'Economia circular' },
              { num: '🤝', lbl: 'Comunidade local' },
              { num: '♻️',  lbl: 'Consumo consciente' },
            ].map((t) => (
              <div className="trust-item" key={t.lbl}>
                <span className="num">{t.num}</span>
                <span className="lbl">{t.lbl}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="hero-visual">
          {HERO_CARDS.map((c) => (
            <div key={c.cls} className={`hero-card ${c.cls}`}>
              <img src={c.img} alt="" />
              <div className="price">{c.price}</div>
              <div className="hood">{c.hood}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════
          CATEGORIAS
          ══════════════════════════════════ */}
      <section>
        <div className="section">
          <div className="section-head">
            <div>
              <h2>Explore por <em>categoria</em></h2>
              <p>Do sofá ao tênis — tudo perto de você.</p>
            </div>
            <Link to="/explorar" className="head-link">Ver tudo →</Link>
          </div>

          <div className="cat-grid">
            {CATEGORIES.map((c) => (
              <Link 
                key={c.name} 
                to={`/explorar?categoria_id=${c.id}`} 
                className="cat-card"
              >
                <div className="cat-icon" style={{ background: c.bg }}>{c.icon}</div>
                <div className="name">{c.name}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════
          PRODUTOS EM DESTAQUE
          ══════════════════════════════════ */}
      <section className="products-section" id="produtos">
        <div className="section">
          <div className="section-head">
            <div>
              <h2>Veja o que você <em>pode encontrar</em></h2>
              <p>Anúncios recentes em Santo Amaro.</p>
            </div>
            {anunciosReais.length > 0 && (
              <Link to="/explorar" className="head-link">Ver todos →</Link>
            )}
          </div>

          {/* LOADING */}
          {carregandoAnuncios && (
            <div className="products-loading">
              <p>Buscando anúncios...</p>
            </div>
          )}

          {/* GRID COM ANÚNCIOS REAIS */}
          {!carregandoAnuncios && anunciosReais.length > 0 && (
            <div className="products-grid">
              {anunciosReais.map((p) => (
                <article key={p.id} className="product">
                  <div className="product-img">
                    <img 
                      src={p.imagem_principal || 'https://via.placeholder.com/400x400?text=Sem+imagem'} 
                      alt={p.titulo} 
                      loading="lazy" 
                    />
                    <button
                      className={`product-fav${favorites.has(p.id) ? ' favorited' : ''}`}
                      onClick={() => toggleFav(p.id)}
                      aria-label="Favoritar"
                    >
                      <IconHeart />
                    </button>
                  </div>
                  <div className="product-body">
                    <div className="product-cat">{p.categoria_nome}</div>
                    <h3 className="product-title">{p.titulo}</h3>
                    <div className="product-price">
                      R$ {parseFloat(p.preco || 0).toFixed(2)}
                    </div>
                    <div className="product-meta">
                      <div className="seller">
                        <div className="seller-avatar">{p.vendedor_nome?.[0] || '?'}</div>
                        <span>{p.vendedor_nome || 'Anônimo'}</span>
                      </div>
                      <span>{p.bairro || 'Santo Amaro'}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {/* CTA QUANDO NÃO TEM ANÚNCIOS */}
          {!carregandoAnuncios && anunciosReais.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">📦</div>
              <h3>Ainda não há anúncios em Santo Amaro</h3>
              <p>Seja o primeiro a desapegar e ajude a construir<br />a economia circular do bairro!</p>
              <Link to="/anunciar" className="btn-home-primary">
                + Criar meu primeiro anúncio
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════
          COMO FUNCIONA
          ══════════════════════════════════ */}
      <section className="how-section" id="como-funciona">
        <div className="section">
          <div className="section-head">
            <div>
              <h2>Três passos. <em>Zero complicação.</em></h2>
              <p>Do cadastro à entrega. Uma experiência pensada pra quem vive em Santo Amaro.</p>
            </div>
          </div>

          <div className="steps">
            {STEPS.map((s) => (
              <div key={s.num} className="step">
                <span className="step-num">{s.num}</span>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════
          NOSSOS PILARES
          ══════════════════════════════════ */}
      <section className="impact-section">
        <div className="impact-wrap">
          <div className="impact-text">
            <span className="badge-ods">Nossos pilares</span>
            <h2>Cada desapego é uma <em>pequena revolução</em> circular.</h2>
            <p>
              Mais que um marketplace, o Santo Desapego propõe um modelo de
              economia circular hiperlocal alinhado aos Objetivos de
              Desenvolvimento Sustentável da ONU — combinando sustentabilidade
              ambiental, vínculo comunitário e fortalecimento da economia
              do bairro.
            </p>
            <a href="#como-funciona" className="btn-ghost">Ver como funciona →</a>
          </div>

          <div className="impact-grid">
            {IMPACT_CARDS.map((c) => (
              <article
                key={c.num}
                className={`impact-card impact-card--${c.accent}`}
              >
                <span className="impact-card-num">{c.num}</span>
                <h3 className="impact-card-title">{c.title}</h3>
                <p className="impact-card-desc">{c.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════
          LOCAL — SANTO AMARO
          ══════════════════════════════════ */}
      <section className="local-section">
        <div className="local-wrap">
          <Mapa />

          <div className="local-text">
            <h2>Feito <em>pra cá</em>, feito <em>por aqui</em>.</h2>
            <p>
              Diferente de marketplaces globais, o Santo Desapego nasce com foco hiperlocal:
              apenas moradores da região podem anunciar, e todas as transações acontecem
              dentro do distrito. Menos logística, mais vínculo comunitário.
            </p>
            <p>
              A plataforma valida endereços por CEP, exibe a distância exata entre comprador
              e vendedor e prioriza entregas a pé, de bike ou em encontros presenciais seguros.
            </p>
            <div className="local-hoods">
              {HOODS.map((h) => (
                <span key={h} className="hood-tag">{h}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════
          CTA
          ══════════════════════════════════ */}
      <section className="cta-section">
        <div className="cta-wrap">
          <h2>Tem algo <em>parado em casa</em>?<br />Transforme em desapego.</h2>
          <p>{usuario
            ? 'Anúncio em 2 minutos. Seu próximo vizinho-comprador está aqui do lado.'
            : 'Cadastro gratuito, anúncio em 2 minutos. Seu próximo vizinho-comprador está aqui do lado.'}</p>
          <Link to={linkAnunciar} className="btn-home-primary cta-btn">
            {usuario ? 'Criar novo anúncio' : 'Anunciar meu primeiro item'} <IconArrow />
          </Link>
        </div>
      </section>

      {/* ══════════════════════════════════
          FOOTER
          ══════════════════════════════════ */}
      <footer className="home-footer">
        <div className="footer-wrap">
          <div className="footer-brand">
            <Link to="/" className="logo">
              <span className="logo-mark">SD</span>
              Santo <em>Desapego</em>
            </Link>
            <p>Marketplace C2C hiperlocal para Santo Amaro, São Paulo. Economia compartilhada e consumo consciente.</p>
          </div>

          {FOOTER_LINKS.map((col) => (
            <div key={col.title} className="footer-col">
              <h4>{col.title}</h4>
              {col.links.map((l) => <a key={l} href="#">{l}</a>)}
            </div>
          ))}
        </div>

        <div className="footer-tcc">
          <div className="footer-tcc-info">
            <div>
              <strong>Projeto acadêmico</strong> — Trabalho de Conclusão de Curso • Bacharelado em Sistemas de Informação • Centro Universitário Senac Santo Amaro
            </div>
            <div>Luisa Aquino • Maria Erica Cruz • Paulo Santana</div>
          </div>

          <div className="cc-license">
            <Link to="/">Santo Desapego</Link> © 2026 by{' '}
            <span className="cc-authors">Paulo Santana, Maria Erica Cruz e Luisa Nascimento</span>{' '}
            is licensed under{' '}
            <a
              href="https://creativecommons.org/licenses/by-nc-nd/4.0/"
              target="_blank"
              rel="noopener noreferrer"
            >
              CC BY-NC-ND 4.0
            </a>
            <img src="https://mirrors.creativecommons.org/presskit/icons/cc.svg" alt="CC" />
            <img src="https://mirrors.creativecommons.org/presskit/icons/by.svg" alt="BY" />
            <img src="https://mirrors.creativecommons.org/presskit/icons/nc.svg" alt="NC" />
            <img src="https://mirrors.creativecommons.org/presskit/icons/nd.svg" alt="ND" />
          </div>
        </div>
      </footer>

    </div>
  );
};

export default Home;