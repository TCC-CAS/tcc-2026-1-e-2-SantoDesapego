import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Explorar.css';

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
const IconLogout = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

const Explorar = () => {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState(null);
  
  // Estados de filtros
  const [ordenacao, setOrdenacao] = useState('recentes');
  const [tabAtiva, setTabAtiva] = useState('todos');
  const [precoMin, setPrecoMin] = useState(0);
  const [precoMax, setPrecoMax] = useState(5000);
  const [distancia, setDistancia] = useState('qualquer');
  const [condicoes, setCondicoes] = useState([]);
  const [bairros, setBairros] = useState([]);
  const [extras, setExtras] = useState([]);
  
  // Lê usuário do localStorage
  useEffect(() => {
    const usuarioSalvo = localStorage.getItem('sd_usuario');
    if (usuarioSalvo) {
      try {
        setUsuario(JSON.parse(usuarioSalvo));
      } catch {
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
  
  // Toggle checkbox
  const toggleCheckbox = (array, setArray, value) => {
    if (array.includes(value)) {
      setArray(array.filter(item => item !== value));
    } else {
      setArray([...array, value]);
    }
  };
  
  // Limpar filtro específico
  const limparPreco = () => {
    setPrecoMin(0);
    setPrecoMax(5000);
  };
  const limparDistancia = () => setDistancia('qualquer');
  const limparCondicoes = () => setCondicoes([]);
  const limparBairros = () => setBairros([]);
  const limparExtras = () => setExtras([]);
  
  const aplicarFiltros = () => {
    // TODO: quando conectar com o backend, faz a chamada aqui
    console.log('Filtros aplicados:', {
      ordenacao, tabAtiva, precoMin, precoMax,
      distancia, condicoes, bairros, extras
    });
  };

  return (
    <div className="explorar-wrapper">
      
      {/* ── Header (mesmo da Home) ── */}
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

          <nav className="nav-actions">
            {usuario ? (
              <>
                <Link to="/perfil" style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                  fontSize: '0.9rem', color: 'var(--ink)', fontWeight: 600, textDecoration: 'none',
                }} title="Meu perfil">
                  <span style={{
                    width: 30, height: 30, borderRadius: '50%',
                    background: 'var(--terracotta)', color: 'var(--cream)',
                    display: 'grid', placeItems: 'center', fontSize: '0.8rem',
                    fontWeight: 700, overflow: 'hidden',
                  }}>
                    {usuario.foto_perfil
                      ? <img src={usuario.foto_perfil} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : usuario.nome[0].toUpperCase()}
                  </span>
                  Olá, {usuario.nome}!
                </Link>
                <button onClick={handleLogout} style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                  background: 'none', border: 'none', color: 'var(--ink-muted)',
                  fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                }}>
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

      {/* ── Main Content ── */}
      <div className="explorar-container">
        
        {/* Breadcrumb */}
        <div className="explorar-breadcrumb">
          <Link to="/">Início</Link>
          <span>›</span>
          <span>Explorar</span>
        </div>

        {/* Header */}
        <div className="explorar-header">
          <div className="explorar-header-top">
            <div>
              <h1>Explorar <em>desapegos</em></h1>
              <p className="explorar-header-subtitle">0 anúncios encontrados em Santo Amaro</p>
            </div>
            
            <div className="explorar-sort">
              <span>Ordenar por:</span>
              <select value={ordenacao} onChange={(e) => setOrdenacao(e.target.value)}>
                <option value="recentes">Mais recentes</option>
                <option value="preco-menor">Menor preço</option>
                <option value="preco-maior">Maior preço</option>
                <option value="distancia">Mais próximos</option>
              </select>
            </div>
          </div>

          {/* Tabs */}
          <div className="explorar-tabs">
            <button
              className={`explorar-tab ${tabAtiva === 'todos' ? 'active' : ''}`}
              onClick={() => setTabAtiva('todos')}
            >
              Todos <span className="count">0</span>
            </button>
            <button
              className={`explorar-tab ${tabAtiva === 'disponiveis' ? 'active' : ''}`}
              onClick={() => setTabAtiva('disponiveis')}
            >
              Disponíveis <span className="count">0</span>
            </button>
            <button
              className={`explorar-tab ${tabAtiva === 'troca' ? 'active' : ''}`}
              onClick={() => setTabAtiva('troca')}
            >
              Aceita Troca <span className="count">0</span>
            </button>
            <button
              className={`explorar-tab ${tabAtiva === 'novos' ? 'active' : ''}`}
              onClick={() => setTabAtiva('novos')}
            >
              Novos <span className="count">0</span>
            </button>
            <button
              className={`explorar-tab ${tabAtiva === 'perto' ? 'active' : ''}`}
              onClick={() => setTabAtiva('perto')}
            >
              Até 3km <span className="count">0</span>
            </button>
          </div>
        </div>

        {/* Layout principal: Sidebar + Grid */}
        <div className="explorar-main">
          
          {/* ── Sidebar de filtros ── */}
          <aside className="explorar-sidebar">
            
            {/* Faixa de preço */}
            <div className="filter-section">
              <div className="filter-section-title">
                <h3>Faixa de preço</h3>
                <button className="filter-clear" onClick={limparPreco}>Limpar</button>
              </div>
              <div className="price-range">
                <div className="price-range-labels">
                  <span>R$ {precoMin}</span>
                  <span>R$ {precoMax}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="5000"
                  step="100"
                  value={precoMax}
                  onChange={(e) => setPrecoMax(parseInt(e.target.value))}
                />
              </div>
            </div>

            {/* Distância máxima */}
            <div className="filter-section">
              <div className="filter-section-title">
                <h3>Distância máxima</h3>
                <button className="filter-clear" onClick={limparDistancia}>Limpar</button>
              </div>
              <div className="filter-options">
                {['qualquer', '500m', '1km', '2km', '5km'].map((d) => (
                  <button
                    key={d}
                    className={`filter-option ${distancia === d ? 'active' : ''}`}
                    onClick={() => setDistancia(d)}
                  >
                    {d === 'qualquer' ? 'Qualquer' : d}
                  </button>
                ))}
              </div>
            </div>

            {/* Condição */}
            <div className="filter-section">
              <div className="filter-section-title">
                <h3>Condição</h3>
                <button className="filter-clear" onClick={limparCondicoes}>Limpar</button>
              </div>
              <div className="filter-checkboxes">
                {[
                  { value: 'novo', label: 'Novo / Na caixa', count: 0 },
                  { value: 'otimo', label: 'Ótimo estado', count: 0 },
                  { value: 'bom', label: 'Bom estado', count: 0 },
                  { value: 'marcas', label: 'Com marcas de uso', count: 0 },
                ].map((c) => (
                  <div key={c.value} className="filter-checkbox">
                    <input
                      type="checkbox"
                      id={`cond-${c.value}`}
                      checked={condicoes.includes(c.value)}
                      onChange={() => toggleCheckbox(condicoes, setCondicoes, c.value)}
                    />
                    <label htmlFor={`cond-${c.value}`}>
                      {c.label}
                      <span className="count">{c.count}</span>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Bairros */}
            <div className="filter-section">
              <div className="filter-section-title">
                <h3>Bairros</h3>
                <button className="filter-clear" onClick={limparBairros}>Limpar</button>
              </div>
              <div className="filter-checkboxes">
                {[
                  { value: 'santo-amaro', label: 'Santo Amaro Centro', count: 0 },
                  { value: 'campo-belo', label: 'Campo Belo', count: 0 },
                  { value: 'brooklin', label: 'Brooklin', count: 0 },
                  { value: 'vila-mascote', label: 'Vila Mascote', count: 0 },
                  { value: 'granja-julieta', label: 'Granja Julieta', count: 0 },
                  { value: 'vila-sofia', label: 'Vila Sofia', count: 0 },
                ].map((b) => (
                  <div key={b.value} className="filter-checkbox">
                    <input
                      type="checkbox"
                      id={`bairro-${b.value}`}
                      checked={bairros.includes(b.value)}
                      onChange={() => toggleCheckbox(bairros, setBairros, b.value)}
                    />
                    <label htmlFor={`bairro-${b.value}`}>
                      {b.label}
                      <span className="count">{b.count}</span>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Extras */}
            <div className="filter-section">
              <div className="filter-section-title">
                <h3>Extras</h3>
                <button className="filter-clear" onClick={limparExtras}>Limpar</button>
              </div>
              <div className="filter-checkboxes">
                {[
                  { value: 'troca', label: 'Aceita troca', count: 0 },
                  { value: 'entrega', label: 'Com entrega', count: 0 },
                  { value: 'verificado', label: 'Vendedor verificado', count: 0 },
                  { value: 'hoje', label: 'Anunciado hoje', count: 0 },
                ].map((e) => (
                  <div key={e.value} className="filter-checkbox">
                    <input
                      type="checkbox"
                      id={`extra-${e.value}`}
                      checked={extras.includes(e.value)}
                      onChange={() => toggleCheckbox(extras, setExtras, e.value)}
                    />
                    <label htmlFor={`extra-${e.value}`}>
                      {e.label}
                      <span className="count">{e.count}</span>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <button className="filter-apply" onClick={aplicarFiltros}>
              Aplicar filtros
            </button>
          </aside>

          {/* ── Grid de produtos ── */}
          <div className="explorar-content">
            <div className="explorar-results-count">
              Mostrando 1–0 de 0 anúncios
            </div>

            <div className="explorar-grid">
              {/* Estado vazio */}
              <div className="explorar-empty">
                <div className="explorar-empty-icon">📦</div>
                <h3>Nenhum anúncio por aqui ainda</h3>
                <p>
                  Seja o primeiro a anunciar! Publique seu desapego e comece a 
                  movimentar a economia local de Santo Amaro.
                </p>
                <Link to={usuario ? '/anunciar' : '/cadastro'}>
                  {usuario ? '+ Criar meu primeiro anúncio' : '+ Cadastre-se para anunciar'}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="home-footer">
        <div className="footer-wrap">
          <div className="footer-brand">
            <Link to="/" className="logo">
              <span className="logo-mark">SD</span>
              Santo <em>Desapego</em>
            </Link>
            <p>Marketplace C2C hiperlocal para Santo Amaro, São Paulo. Economia compartilhada e consumo consciente.</p>
          </div>

          <div className="footer-col">
            <h4>Plataforma</h4>
            <a href="#">Como funciona</a>
            <a href="#">Anunciar</a>
            <a href="#">Categorias</a>
            <a href="#">Dicas de segurança</a>
          </div>

          <div className="footer-col">
            <h4>Comunidade</h4>
            <a href="#">Nosso impacto</a>
            <a href="#">Bairros atendidos</a>
            <a href="#">Blog</a>
            <a href="#">Indique um vizinho</a>
          </div>

          <div className="footer-col">
            <h4>Suporte</h4>
            <a href="#">Central de ajuda</a>
            <a href="#">Fale conosco</a>
            <a href="#">Termos de uso</a>
            <a href="#">Privacidade (LGPD)</a>
          </div>
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

export default Explorar;