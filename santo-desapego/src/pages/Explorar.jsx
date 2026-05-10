import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import './Explorar.css';

const API_URL = 'http://localhost:8080/api';

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
  const [searchParams] = useSearchParams();
  const [usuario, setUsuario] = useState(null);
  const [categorias, setCategorias] = useState([]);
  const [anuncios, setAnuncios] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [termoBusca, setTermoBusca] = useState('');
  
  // Estados de filtros
  const [ordenacao, setOrdenacao] = useState('recentes');
  const [categoriaAtiva, setCategoriaAtiva] = useState(null);
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
  
  // Busca categorias
  useEffect(() => {
    fetch(`${API_URL}/categorias`)
      .then(res => res.json())
      .then(data => setCategorias(data.categorias || []))
      .catch(err => console.error('Erro ao buscar categorias:', err));
  }, []);
  
  // Lê parâmetros da URL quando a página carrega
  useEffect(() => {
    const categoriaUrl = searchParams.get('categoria_id');
    const aceitaTrocaUrl = searchParams.get('aceita_troca');
    const buscaUrl = searchParams.get('busca');
    
    if (categoriaUrl) {
      setCategoriaAtiva(parseInt(categoriaUrl));
    }
    if (aceitaTrocaUrl === 'true') {
      setTabAtiva('troca');
    }
    // Atualiza o input de busca com o termo da URL
    if (buscaUrl) {
      setTermoBusca(buscaUrl);
    } else {
      setTermoBusca('');
    }
  }, [searchParams]);
  
  // Busca anúncios quando os filtros mudam OU searchParams muda
  useEffect(() => {
    buscarAnuncios();
  }, [ordenacao, categoriaAtiva, tabAtiva, searchParams]);
  
  const buscarAnuncios = async () => {
    setCarregando(true);
    try {
      const params = new URLSearchParams();
      params.append('ordenacao', ordenacao);
      params.append('limite', '12');
      
      if (categoriaAtiva) params.append('categoria_id', categoriaAtiva);
      if (tabAtiva === 'troca') params.append('aceita_troca', 'true');
      if (tabAtiva === 'novos') params.append('estado_conservacao', 'novo');
      
      // Adiciona termo de busca se existir na URL
      const buscaUrl = searchParams.get('busca');
      if (buscaUrl) params.append('busca', buscaUrl);
      
      const res = await fetch(`${API_URL}/anuncios?${params}`);
      const data = await res.json();
      
      setAnuncios(data.anuncios || []);
    } catch (erro) {
      console.error('Erro ao buscar anúncios:', erro);
      setAnuncios([]);
    } finally {
      setCarregando(false);
    }
  };
  
  const handleLogout = () => {
    localStorage.removeItem('sd_token');
    localStorage.removeItem('sd_usuario');
    setUsuario(null);
    navigate('/');
  };
  
  const handleBuscar = (e) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    
    if (termoBusca.trim()) {
      params.set('busca', termoBusca.trim());
    } else {
      params.delete('busca');
    }
    
    navigate(`/explorar?${params.toString()}`);
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
    buscarAnuncios();
  };
  
  const formatarPreco = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  return (
    <div className="explorar-wrapper">
      
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
          <a 
            href="#" 
            className={!categoriaAtiva ? 'active' : ''}
            onClick={(e) => { e.preventDefault(); setCategoriaAtiva(null); }}
          >
            Todos
          </a>
          {categorias.map((cat) => (
            <a 
              key={cat.id} 
              href="#"
              className={categoriaAtiva === cat.id ? 'active' : ''}
              onClick={(e) => {
                e.preventDefault();
                setCategoriaAtiva(cat.id);
              }}
            >
              {cat.icone} {cat.nome}
            </a>
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
              <p className="explorar-header-subtitle">
                {anuncios.length} {anuncios.length === 1 ? 'anúncio encontrado' : 'anúncios encontrados'} em Santo Amaro
              </p>
            </div>
            
            <div className="explorar-sort">
              <span>Ordenar por:</span>
              <select value={ordenacao} onChange={(e) => setOrdenacao(e.target.value)}>
                <option value="recentes">Mais recentes</option>
                <option value="preco-menor">Menor preço</option>
                <option value="preco-maior">Maior preço</option>
              </select>
            </div>
          </div>

          {/* Tabs */}
          <div className="explorar-tabs">
            <button
              className={`explorar-tab ${tabAtiva === 'todos' ? 'active' : ''}`}
              onClick={() => setTabAtiva('todos')}
            >
              Todos <span className="count">{anuncios.length}</span>
            </button>
            <button
              className={`explorar-tab ${tabAtiva === 'disponiveis' ? 'active' : ''}`}
              onClick={() => setTabAtiva('disponiveis')}
            >
              Disponíveis <span className="count">{anuncios.filter(a => a.status === 'ativo').length}</span>
            </button>
            <button
              className={`explorar-tab ${tabAtiva === 'troca' ? 'active' : ''}`}
              onClick={() => setTabAtiva('troca')}
            >
              Aceita Troca <span className="count">{anuncios.filter(a => a.aceita_troca).length}</span>
            </button>
            <button
              className={`explorar-tab ${tabAtiva === 'novos' ? 'active' : ''}`}
              onClick={() => setTabAtiva('novos')}
            >
              Novos <span className="count">{anuncios.filter(a => a.estado_conservacao === 'novo').length}</span>
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
                  { value: 'novo', label: 'Novo / Na caixa' },
                  { value: 'seminovo', label: 'Seminovo' },
                  { value: 'usado', label: 'Usado' },
                  { value: 'para-reparo', label: 'Para reparo' },
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
                      <span className="count">{anuncios.filter(a => a.estado_conservacao === c.value).length}</span>
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
              Mostrando 1–{anuncios.length} de {anuncios.length} anúncios
            </div>

            {carregando ? (
              <div className="explorar-loading">Carregando...</div>
            ) : anuncios.length > 0 ? (
              <div className="explorar-grid">
                {anuncios.map((anuncio) => (
                  <div key={anuncio.id} className="product-card">
                    <div className="product-image">
                      {anuncio.imagem_principal ? (
                        <img src={anuncio.imagem_principal} alt={anuncio.titulo} />
                      ) : (
                        <div style={{
                          width: '100%', height: '100%', background: 'var(--gray-2)',
                          display: 'grid', placeItems: 'center', color: 'var(--ink-muted)',
                          fontSize: '3rem'
                        }}>📦</div>
                      )}
                      {anuncio.aceita_troca && (
                        <span className="product-badge">🔄 Aceita troca</span>
                      )}
                    </div>
                    <div className="product-info">
                      <h3 className="product-title">{anuncio.titulo}</h3>
                      <p className="product-price">{formatarPreco(anuncio.preco)}</p>
                      <p className="product-location">{anuncio.bairro || 'Santo Amaro'}</p>
                      <div className="product-meta">
                        <span className="product-condition">{anuncio.estado_conservacao}</span>
                        <span className="product-time">Agora</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="explorar-grid">
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
            )}
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