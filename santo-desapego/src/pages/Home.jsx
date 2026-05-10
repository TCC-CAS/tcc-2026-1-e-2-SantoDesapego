import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Home.css';
import Mapa from '../componentes/Mapa';

/* ── Dados — altere aqui sem tocar no JSX ──────────────────── */
const CATEGORIES = [
  { icon: '🛋️', name: 'Móveis & Casa',    count: '412 itens',  bg: '#F7D7CB' },
  { icon: '💻', name: 'Eletrônicos',       count: '289 itens',  bg: '#D0DFD6' },
  { icon: '👗', name: 'Moda',              count: '631 itens',  bg: '#FCE5B6' },
  { icon: '🧸', name: 'Infantil & Bebê',   count: '198 itens',  bg: '#E5D5EB' },
  { icon: '📚', name: 'Livros',            count: '543 itens',  bg: '#FCD3C1' },
  { icon: '🚴', name: 'Esporte & Lazer',   count: '177 itens',  bg: '#C9DDE8' },
  { icon: '🎨', name: 'Arte & Decoração',  count: '224 itens',  bg: '#E8DCC4' },
  { icon: '🔧', name: 'Ferramentas',       count: '96 itens',   bg: '#E1D1C0' },
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

const IMPACT_CARDS = [
  { num: '2,4t',    lbl: 'de itens evitados do descarte em 2025' },
  { num: 'R$ 420k', lbl: 'movimentados na economia local' },
  { num: '18mil',   lbl: 'conexões entre vizinhos criadas' },
  { num: '93%',     lbl: 'dos usuários voltam a anunciar em 30 dias' },
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
  { img: 'https://images.unsplash.com/photo-1511556820780-d912e42b4980?w=400&q=80', price: 'R$ 120',  hood: 'Bicicleta infantil • Campo Belo', cls: 'hero-card-2' },
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

  const handleLogout = () => {
    localStorage.removeItem('sd_token');
    localStorage.removeItem('sd_usuario');
    setUsuario(null);
    navigate('/');
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
        <strong>já evitamos 2,4 toneladas</strong> de descarte neste mês.
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
            <input type="text" placeholder="Buscar sofá, bicicleta, livro, notebook..." />
            <span className="search-location">
              <IconPin />
              Santo Amaro, SP
            </span>
            <button className="search-btn">Buscar</button>
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
          {['Todos','Móveis & Casa','Eletrônicos','Moda','Infantil & Bebê','Livros','Esporte & Lazer','Arte & Decoração','Ferramentas','Brechó vintage','Trocas 🔄'].map((cat, i) => (
            <a key={cat} href="#" className={i === 0 ? 'active' : ''}>{cat}</a>
          ))}
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
              { num: '1.247', lbl: 'vizinhos ativos' },
              { num: '3.590', lbl: 'itens circulando' },
              { num: '4,9★',  lbl: 'avaliação média' },
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
          <div className="hero-sticker">frete grátis<br />até 3km!</div>
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
              <div key={c.name} className="cat-card">
                <div className="cat-icon" style={{ background: c.bg }}>{c.icon}</div>
                <div className="name">{c.name}</div>
                <div className="count">{c.count}</div>
              </div>
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
              <h2>Desapegos <em>fresquinhos</em></h2>
              <p>Anunciados nas últimas 24 horas pelos seus vizinhos.</p>
            </div>
            <Link to="/explorar" className="head-link">Ver todos →</Link>
          </div>

          {/* Filter chips */}
          <div className="filter-bar">
            {FILTER_CHIPS.map((chip) => (
              <button
                key={chip}
                className={`filter-chip${activeFilter === chip ? ' active' : ''}`}
                onClick={() => setActiveFilter(chip)}
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Grid de produtos */}
          <div className="products-grid">
            {PRODUCTS.map((p) => (
              <article key={p.id} className="product">
                <div className="product-img">
                  <img src={p.img} alt={p.title} loading="lazy" />
                  {p.badge && (
                    <span className={`product-badge${p.badge.type ? ' ' + p.badge.type : ''}`}>
                      {p.badge.label}
                    </span>
                  )}
                  <button
                    className={`product-fav${favorites.has(p.id) ? ' favorited' : ''}`}
                    onClick={() => toggleFav(p.id)}
                    aria-label="Favoritar"
                  >
                    <IconHeart />
                  </button>
                </div>
                <div className="product-body">
                  <div className="product-cat">{p.cat}</div>
                  <h3 className="product-title">{p.title}</h3>
                  <div className="product-price">
                    {p.price}
                    {p.priceOld && <small>{p.priceOld}</small>}
                  </div>
                  <div className="product-meta">
                    <div className="seller">
                      <div className="seller-avatar">{p.seller[0]}</div>
                      <span>{p.seller}</span>
                    </div>
                    <span>{p.hood}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
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
          IMPACTO / ODS 12
          ══════════════════════════════════ */}
      <section className="impact-section">
        <div className="impact-wrap">
          <div className="impact-text">
            <span className="badge-ods">🎯 ODS 12 • Consumo responsável</span>
            <h2>Cada desapego é uma <em>pequena revolução</em> circular.</h2>
            <p>
              O Santo Desapego reinsere ativos subutilizados na cadeia produtiva local,
              reduzindo o descarte e fortalecendo a economia do distrito. Os números
              crescem junto com a comunidade.
            </p>
            <a href="#" className="btn-ghost">Conheça o impacto →</a>
          </div>

          <div className="impact-grid">
            {IMPACT_CARDS.map((c) => (
              <div key={c.num} className="impact-card">
                <div className="impact-num">{c.num}</div>
                <div className="impact-lbl">{c.lbl}</div>
              </div>
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
          <div>
            <strong>Projeto acadêmico</strong> — Trabalho de Conclusão de Curso • Bacharelado em Sistemas de Informação • Centro Universitário Senac Santo Amaro
          </div>
          <div>Luisa Aquino • Maria Erica Cruz • Paulo Santana</div>
        </div>
      </footer>

    </div>
  );
};

export default Home;