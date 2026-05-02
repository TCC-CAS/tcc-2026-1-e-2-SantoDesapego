import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Perfil.css';

const API_URL = 'http://localhost:8080';

/* ── Ícones SVG ───────────────────────────────────────────── */
const I = {
  user:    () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  mail:    () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>,
  lock:    () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  pin:     () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>,
  phone:   () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.38 2 2 0 0 1 3.6 1.2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.8a16 16 0 0 0 6.29 6.29l.96-.96a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
  home:    () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  id:      () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="14" x="3" y="5" rx="2"/><circle cx="9" cy="11" r="2"/><path d="M14 9h4M14 13h4M6.5 17.5c0-1 1-2 2.5-2s2.5 1 2.5 2"/></svg>,
  shield:  () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  data:    () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5"/><path d="M3 12a9 3 0 0 0 18 0"/></svg>,
  layout:  () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M3 9h18"/></svg>,
  tag:     () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
  bag:     () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>,
  star:    () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  message: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  camera:  () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>,
  download: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  trash:   () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  plus:    () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  search:  () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>,
  check:   () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>,
  alert:   () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  arrow:   () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>,
  arrowR:  () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>,
  eye:     (open) => open
    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>,
};

const BAIRROS = ['Santo Amaro Centro','Campo Belo','Brooklin','Granja Julieta','Jardim Marajoara','Vila Cruzeiro','Vila Mascote','Vila Sofia','Outro bairro'];

/* ── Utils ─────────────────────────────────────────────────── */
const maskCPF = (v) => {
  const n = (v || '').replace(/\D/g, '').slice(0, 11);
  if (n.length === 11) return `${n.slice(0,3)}.${n.slice(3,6)}.${n.slice(6,9)}-${n.slice(9)}`;
  return v;
};
const maskPhone = (v) => {
  const n = (v || '').replace(/\D/g, '').slice(0, 11);
  if (n.length === 11) return `(${n.slice(0,2)}) ${n.slice(2,7)}-${n.slice(7)}`;
  if (n.length === 10) return `(${n.slice(0,2)}) ${n.slice(2,6)}-${n.slice(6)}`;
  return v;
};
const maskCEP = (v) => {
  const n = (v || '').replace(/\D/g, '').slice(0, 8);
  if (n.length === 8) return `${n.slice(0,5)}-${n.slice(5)}`;
  return v;
};

/* Componente reutilizável: avatar com foto ou inicial */
const Avatar = ({ usuario, size = 88 }) => {
  const inicial = usuario?.nome ? usuario.nome[0].toUpperCase() : '?';
  return (
    <div className="perfil-avatar" style={{ width: size, height: size, fontSize: size * 0.45 }}>
      {usuario?.foto_perfil
        ? <img src={usuario.foto_perfil} alt={`Foto de ${usuario.nome}`} />
        : inicial}
    </div>
  );
};

/* ════════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
   ════════════════════════════════════════════════════════════ */
const Perfil = () => {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState(null);
  const [estatisticas, setEstatisticas] = useState(null);
  const [aba, setAba] = useState('painel');
  const [carregando, setCarregando] = useState(true);

  // Carrega dados ao montar
  useEffect(() => {
    const token = localStorage.getItem('sd_token');
    if (!token) { navigate('/login'); return; }

    fetch(`${API_URL}/api/usuario/perfil`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.usuario) {
          setUsuario(data.usuario);
          setEstatisticas(data.estatisticas);
        } else {
          localStorage.removeItem('sd_token');
          localStorage.removeItem('sd_usuario');
          navigate('/login');
        }
      })
      .catch(() => alert('Erro ao carregar perfil. O servidor está rodando?'))
      .finally(() => setCarregando(false));
  }, [navigate]);

  if (carregando) {
    return (
      <div className="perfil-wrapper">
        <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--ink-muted)' }}>
          Carregando perfil...
        </div>
      </div>
    );
  }

  if (!usuario) return null;

  return (
    <div className="perfil-wrapper">

      <div className="announcement">
        🌱 Cuidando dos seus dados — Esta página está em conformidade com a LGPD
      </div>

      <header className="site-header">
        <div className="nav-top">
          <Link to="/" className="logo">
            <span className="logo-mark">SD</span>
            Santo <em>Desapego</em>
          </Link>
          <nav className="nav-actions">
            <Link to="/">← Voltar para a home</Link>
          </nav>
        </div>
      </header>

      <div className="perfil-layout">

        {/* ════ SIDEBAR ════ */}
        <aside className="perfil-sidebar">
          <div className="perfil-user-card">
            <AvatarUpload usuario={usuario} setUsuario={setUsuario} />
            <h3>{usuario.nome} {usuario.sobrenome}</h3>
            <span className="user-meta">
              <I.pin />
              {usuario.bairro || 'Bairro não informado'}
            </span>
          </div>

          <nav className="perfil-tabs" role="tablist">
            <button className={`perfil-tab${aba === 'painel' ? ' active' : ''}`}
              onClick={() => setAba('painel')} role="tab">
              <I.layout /> Visão geral
            </button>
            <button className={`perfil-tab${aba === 'dados' ? ' active' : ''}`}
              onClick={() => setAba('dados')} role="tab">
              <I.user /> Dados pessoais
            </button>
            <button className={`perfil-tab${aba === 'endereco' ? ' active' : ''}`}
              onClick={() => setAba('endereco')} role="tab">
              <I.pin /> Endereço
            </button>
            <button className={`perfil-tab${aba === 'seguranca' ? ' active' : ''}`}
              onClick={() => setAba('seguranca')} role="tab">
              <I.shield /> Segurança
            </button>
            <button className={`perfil-tab danger${aba === 'lgpd' ? ' active' : ''}`}
              onClick={() => setAba('lgpd')} role="tab">
              <I.data /> Privacidade (LGPD)
            </button>
          </nav>
        </aside>

        {/* ════ CONTEÚDO ════ */}
        <main className="perfil-content">
          {aba === 'painel'    && <SecaoPainel    usuario={usuario} estatisticas={estatisticas} />}
          {aba === 'dados'     && <SecaoDados     usuario={usuario} setUsuario={setUsuario} />}
          {aba === 'endereco'  && <SecaoEndereco  usuario={usuario} setUsuario={setUsuario} />}
          {aba === 'seguranca' && <SecaoSeguranca />}
          {aba === 'lgpd'      && <SecaoLGPD      usuario={usuario} />}
        </main>
      </div>

      <footer className="site-footer">
        <span>© 2026 Santo Desapego — Projeto acadêmico TCC · SENAC Santo Amaro</span>
      </footer>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════
   AVATAR + UPLOAD DE FOTO
   ════════════════════════════════════════════════════════════ */
const AvatarUpload = ({ usuario, setUsuario }) => {
  const inputRef = useRef();
  const [enviando, setEnviando] = useState(false);

  // Redimensiona a imagem antes de enviar (400×400, JPEG 0.85)
  const redimensionar = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const tamanho = 400;
        // Crop quadrado central
        const min = Math.min(img.width, img.height);
        const sx = (img.width - min) / 2;
        const sy = (img.height - min) / 2;
        canvas.width = tamanho;
        canvas.height = tamanho;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, sx, sy, min, min, 0, 0, tamanho, tamanho);
        // Exporta em JPEG, qualidade 0.85 (boa relação tamanho/qualidade)
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Selecione uma imagem válida (JPEG, PNG ou WebP).');
      return;
    }
    // Limite original: 5MB (será reduzido depois)
    if (file.size > 5 * 1024 * 1024) {
      alert('A imagem é muito grande. Limite: 5MB.');
      return;
    }

    setEnviando(true);
    try {
      const fotoBase64 = await redimensionar(file);

      const resposta = await fetch(`${API_URL}/api/usuario/foto`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('sd_token')}`,
        },
        body: JSON.stringify({ foto_perfil: fotoBase64 }),
      });
      const dados = await resposta.json();
      if (!resposta.ok) {
        alert(dados.erro || 'Erro ao enviar foto.');
      } else {
        setUsuario({ ...usuario, foto_perfil: fotoBase64 });
        // Atualiza no localStorage também
        const stored = JSON.parse(localStorage.getItem('sd_usuario') || '{}');
        localStorage.setItem('sd_usuario', JSON.stringify({ ...stored, foto_perfil: fotoBase64 }));
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao processar imagem.');
    } finally {
      setEnviando(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="perfil-avatar-wrap">
      <Avatar usuario={usuario} size={88} />
      <label className="perfil-avatar-edit" title="Trocar foto">
        {enviando ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M21 12a9 9 0 1 1-6.219-8.56">
              <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/>
            </path>
          </svg>
        ) : <I.camera />}
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFile} disabled={enviando} />
      </label>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════
   SEÇÃO PAINEL — Visão geral [RF13 + RF05]
   ════════════════════════════════════════════════════════════ */
const SecaoPainel = ({ usuario, estatisticas }) => {
  const e = estatisticas || {};

  return (
    <>
      <div className="perfil-section-head">
        <h1>Visão <em>geral</em></h1>
        <p>Tudo o que está acontecendo com sua conta no Santo Desapego.</p>
      </div>

      {/* Estatísticas em cards */}
      <div className="painel-stats">
        <div className="painel-stat">
          <div className="painel-stat-icon terracotta"><I.tag /></div>
          <div className="painel-stat-num">{e.anuncios_ativos ?? 0}</div>
          <div className="painel-stat-label">Anúncios ativos</div>
        </div>
        <div className="painel-stat">
          <div className="painel-stat-icon forest"><I.bag /></div>
          <div className="painel-stat-num">{e.compras_realizadas ?? 0}</div>
          <div className="painel-stat-label">Compras realizadas</div>
        </div>
        <div className="painel-stat">
          <div className="painel-stat-icon mustard"><I.star /></div>
          {e.reputacao_media != null
            ? <div className="painel-stat-num">{e.reputacao_media.toFixed(1)} ★</div>
            : <div className="painel-stat-num empty">sem avaliações</div>}
          <div className="painel-stat-label">
            Reputação{e.total_avaliacoes ? ` (${e.total_avaliacoes})` : ''}
          </div>
        </div>
        <div className="painel-stat">
          <div className="painel-stat-icon ink"><I.message /></div>
          <div className="painel-stat-num">{e.mensagens_nao_lidas ?? 0}</div>
          <div className="painel-stat-label">Mensagens não lidas</div>
        </div>
      </div>

      {/* CTAs — vendedor e comprador */}
      <div className="painel-cta-grid">
        <div className="painel-cta sell">
          <div className="painel-cta-icon"><I.tag /></div>
          <h3>Quer anunciar algo?</h3>
          <p>Transforme o que você não usa em renda extra. Vizinhos do bairro estão à procura.</p>
          <Link to="/anunciar" className="painel-cta-btn">
            <I.plus /> Criar anúncio
          </Link>
        </div>

        <div className="painel-cta buy">
          <div className="painel-cta-icon"><I.bag /></div>
          <h3>Procurando algo?</h3>
          <p>Descubra desapegos perto de você. Tudo a poucos minutos de casa.</p>
          <Link to="/" className="painel-cta-btn">
            <I.search /> Explorar desapegos
          </Link>
        </div>
      </div>

      {/* Lista vazia (futura: meus anúncios e últimas compras) */}
      <div className="painel-empty">
        <div className="painel-empty-icon">📦</div>
        <h4>Você ainda não tem atividade por aqui</h4>
        <p>Quando publicar um anúncio ou fazer uma compra, tudo aparece aqui.</p>
      </div>
    </>
  );
};

/* ════════════════════════════════════════════════════════════
   SEÇÃO DADOS PESSOAIS
   ════════════════════════════════════════════════════════════ */
const SecaoDados = ({ usuario, setUsuario }) => {
  const [form, setForm] = useState({
    nome: usuario.nome || '',
    sobrenome: usuario.sobrenome || '',
    telefone: maskPhone(usuario.telefone),
    recebe_newsletter: usuario.recebe_newsletter || false,
  });
  const [salvando, setSalvando] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const formatPhone = (value) => {
    let v = value.replace(/\D/g, '').slice(0, 11);
    if (v.length > 10) v = `(${v.slice(0,2)}) ${v.slice(2,7)}-${v.slice(7)}`;
    else if (v.length > 6) v = `(${v.slice(0,2)}) ${v.slice(2,6)}-${v.slice(6)}`;
    else if (v.length > 2) v = `(${v.slice(0,2)}) ${v.slice(2)}`;
    else if (v.length > 0) v = `(${v}`;
    setForm({ ...form, telefone: v });
  };

  const salvar = async (e) => {
    e.preventDefault();
    setFeedback(null);
    setSalvando(true);

    try {
      const resposta = await fetch(`${API_URL}/api/usuario/perfil`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('sd_token')}`,
        },
        body: JSON.stringify({
          nome: form.nome.trim(),
          sobrenome: form.sobrenome.trim(),
          telefone: form.telefone.replace(/\D/g, '') || null,
          cep: usuario.cep, logradouro: usuario.logradouro,
          numero: usuario.numero, complemento: usuario.complemento,
          bairro: usuario.bairro,
          recebe_newsletter: form.recebe_newsletter,
        }),
      });
      const dados = await resposta.json();
      if (!resposta.ok) {
        setFeedback({ tipo: 'error', msg: dados.erro || 'Erro ao salvar.' });
      } else {
        const novo = { ...usuario,
          nome: form.nome.trim(),
          sobrenome: form.sobrenome.trim(),
          telefone: form.telefone.replace(/\D/g, ''),
          recebe_newsletter: form.recebe_newsletter,
        };
        setUsuario(novo);
        const stored = JSON.parse(localStorage.getItem('sd_usuario') || '{}');
        localStorage.setItem('sd_usuario', JSON.stringify({
          ...stored, nome: novo.nome, sobrenome: novo.sobrenome
        }));
        setFeedback({ tipo: 'success', msg: 'Perfil atualizado com sucesso!' });
      }
    } catch {
      setFeedback({ tipo: 'error', msg: 'Erro ao conectar com o servidor.' });
    } finally {
      setSalvando(false);
    }
  };

  return (
    <>
      <div className="perfil-section-head">
        <h1>Dados <em>pessoais</em></h1>
        <p>Atualize suas informações de contato. Mantenha tudo atualizado pra negociações fluírem melhor.</p>
      </div>

      {feedback && (
        <div className={`perfil-alert ${feedback.tipo}`}>
          {feedback.tipo === 'success' ? <I.check /> : <I.alert />}
          {feedback.msg}
        </div>
      )}

      <form onSubmit={salvar} className="perfil-form">
        <div className="perfil-form-row">
          <div className="perfil-field">
            <label className="perfil-field-label">Nome <span className="required">*</span></label>
            <div className="perfil-input-wrap">
              <I.user />
              <input className="perfil-input" type="text" value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })} required />
            </div>
          </div>
          <div className="perfil-field">
            <label className="perfil-field-label">Sobrenome <span className="required">*</span></label>
            <div className="perfil-input-wrap">
              <I.user />
              <input className="perfil-input" type="text" value={form.sobrenome}
                onChange={(e) => setForm({ ...form, sobrenome: e.target.value })} required />
            </div>
          </div>
        </div>

        <div className="perfil-form-row">
          <div className="perfil-field">
            <label className="perfil-field-label">
              CPF <span className="lock-badge"><I.lock /> não editável</span>
            </label>
            <div className="perfil-input-wrap">
              <I.id />
              <input className="perfil-input locked" type="text"
                value={maskCPF(usuario.cpf)} disabled readOnly />
            </div>
            <span className="perfil-field-hint">
              CPF é seu identificador único na plataforma e não pode ser alterado (RN02).
            </span>
          </div>

          <div className="perfil-field">
            <label className="perfil-field-label">Telefone / WhatsApp</label>
            <div className="perfil-input-wrap">
              <I.phone />
              <input className="perfil-input" type="tel" placeholder="(11) 99999-9999"
                value={form.telefone}
                onChange={(e) => formatPhone(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="perfil-field">
          <label className="perfil-field-label">
            E-mail <span className="lock-badge"><I.lock /> não editável</span>
          </label>
          <div className="perfil-input-wrap">
            <I.mail />
            <input className="perfil-input locked" type="email"
              value={usuario.email} disabled readOnly />
          </div>
          <span className="perfil-field-hint">
            O e-mail está vinculado à autenticação da conta (incluindo login com Google).
          </span>
        </div>

        <label className="perfil-checkbox" onClick={() => setForm({ ...form, recebe_newsletter: !form.recebe_newsletter })}>
          <div className={`checkbox-custom${form.recebe_newsletter ? ' checked' : ''}`} />
          <div className="perfil-checkbox-label">
            <strong>Receber novidades e alertas por e-mail</strong>
            Avisos sobre novos desapegos perto de você, dicas e atualizações da plataforma.
          </div>
        </label>

        <div className="perfil-actions">
          <button type="submit" className="btn-perfil-primary" disabled={salvando}>
            {salvando ? 'Salvando...' : (<>Salvar alterações <I.check /></>)}
          </button>
        </div>
      </form>
    </>
  );
};

/* ════════════════════════════════════════════════════════════
   SEÇÃO ENDEREÇO
   ════════════════════════════════════════════════════════════ */
const SecaoEndereco = ({ usuario, setUsuario }) => {
  const [form, setForm] = useState({
    cep: maskCEP(usuario.cep),
    logradouro: usuario.logradouro || '',
    numero: usuario.numero || '',
    complemento: usuario.complemento || '',
    bairro: usuario.bairro || '',
  });
  const [salvando, setSalvando] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const formatCEP = (value) => {
    let v = value.replace(/\D/g, '').slice(0, 8);
    if (v.length > 5) v = `${v.slice(0, 5)}-${v.slice(5)}`;
    setForm({ ...form, cep: v });
  };

  const salvar = async (e) => {
    e.preventDefault();
    setFeedback(null);
    setSalvando(true);

    try {
      const resposta = await fetch(`${API_URL}/api/usuario/perfil`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('sd_token')}`,
        },
        body: JSON.stringify({
          nome: usuario.nome, sobrenome: usuario.sobrenome,
          telefone: usuario.telefone,
          recebe_newsletter: usuario.recebe_newsletter,
          cep: form.cep.replace(/\D/g, '') || null,
          logradouro: form.logradouro.trim() || null,
          numero: form.numero.trim() || null,
          complemento: form.complemento.trim() || null,
          bairro: form.bairro || null,
        }),
      });
      const dados = await resposta.json();
      if (!resposta.ok) {
        setFeedback({ tipo: 'error', msg: dados.erro || 'Erro ao salvar.' });
      } else {
        setUsuario({ ...usuario,
          cep: form.cep.replace(/\D/g, ''),
          logradouro: form.logradouro.trim(),
          numero: form.numero.trim(),
          complemento: form.complemento.trim(),
          bairro: form.bairro,
        });
        setFeedback({ tipo: 'success', msg: 'Endereço atualizado com sucesso!' });
      }
    } catch {
      setFeedback({ tipo: 'error', msg: 'Erro ao conectar com o servidor.' });
    } finally {
      setSalvando(false);
    }
  };

  return (
    <>
      <div className="perfil-section-head">
        <h1>Seu <em>endereço</em></h1>
        <p>Usado para calcular a distância até os anúncios e priorizar negócios próximos. Apenas vizinhos veem seu bairro — número e complemento ficam privados.</p>
      </div>

      {feedback && (
        <div className={`perfil-alert ${feedback.tipo}`}>
          {feedback.tipo === 'success' ? <I.check /> : <I.alert />}
          {feedback.msg}
        </div>
      )}

      <form onSubmit={salvar} className="perfil-form">
        <div className="perfil-form-row">
          <div className="perfil-field">
            <label className="perfil-field-label">CEP</label>
            <div className="perfil-input-wrap">
              <I.pin />
              <input className="perfil-input" type="text" placeholder="00000-000"
                value={form.cep} onChange={(e) => formatCEP(e.target.value)} maxLength={9} />
            </div>
          </div>
          <div className="perfil-field">
            <label className="perfil-field-label">Bairro</label>
            <div className="perfil-input-wrap">
              <I.pin />
              <select className="perfil-select" value={form.bairro}
                onChange={(e) => setForm({ ...form, bairro: e.target.value })}>
                <option value="">Selecione...</option>
                {BAIRROS.map((b) => <option key={b}>{b}</option>)}
              </select>
              <span className="perfil-select-arrow"><I.arrow /></span>
            </div>
          </div>
        </div>

        <div className="perfil-field">
          <label className="perfil-field-label">Logradouro</label>
          <div className="perfil-input-wrap">
            <I.home />
            <input className="perfil-input" type="text" placeholder="Rua, Av., Travessa..."
              value={form.logradouro}
              onChange={(e) => setForm({ ...form, logradouro: e.target.value })} />
          </div>
        </div>

        <div className="perfil-form-row">
          <div className="perfil-field">
            <label className="perfil-field-label">Número</label>
            <div className="perfil-input-wrap">
              <I.home />
              <input className="perfil-input" type="text" placeholder="Ex: 123"
                value={form.numero}
                onChange={(e) => setForm({ ...form, numero: e.target.value })} />
            </div>
          </div>
          <div className="perfil-field">
            <label className="perfil-field-label">Complemento</label>
            <div className="perfil-input-wrap">
              <I.home />
              <input className="perfil-input" type="text" placeholder="Apto, Bloco..."
                value={form.complemento}
                onChange={(e) => setForm({ ...form, complemento: e.target.value })} />
            </div>
          </div>
        </div>

        <div className="perfil-actions">
          <button type="submit" className="btn-perfil-primary" disabled={salvando}>
            {salvando ? 'Salvando...' : (<>Salvar endereço <I.check /></>)}
          </button>
        </div>
      </form>
    </>
  );
};

/* ════════════════════════════════════════════════════════════
   SEÇÃO SEGURANÇA — RN03
   ════════════════════════════════════════════════════════════ */
const SecaoSeguranca = () => {
  const [form, setForm] = useState({ senhaAtual: '', novaSenha: '', confirmar: '' });
  const [show, setShow] = useState({ atual: false, nova: false, confirm: false });
  const [salvando, setSalvando] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [strength, setStrength] = useState({ score: 0, label: '', cls: '' });

  const checkStrength = (val) => {
    if (!val) { setStrength({ score: 0, label: '', cls: '' }); return; }
    let score = 0;
    if (val.length >= 8) score++;
    if (/[A-Z]/.test(val) && /[a-z]/.test(val)) score++;
    if (/[0-9]/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;
    const levels = ['weak', 'weak', 'medium', 'strong'];
    const labels = ['Muito fraca', 'Fraca', 'Média', 'Forte'];
    setStrength({ score, cls: levels[score - 1] || 'weak', label: `Força: ${labels[score - 1] || 'Muito fraca'}` });
  };

  const salvar = async (e) => {
    e.preventDefault();
    setFeedback(null);
    if (form.novaSenha !== form.confirmar) {
      setFeedback({ tipo: 'error', msg: 'A nova senha e a confirmação não coincidem.' });
      return;
    }

    setSalvando(true);
    try {
      const resposta = await fetch(`${API_URL}/api/usuario/senha`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('sd_token')}`,
        },
        body: JSON.stringify({ senhaAtual: form.senhaAtual, novaSenha: form.novaSenha }),
      });
      const dados = await resposta.json();
      if (!resposta.ok) {
        setFeedback({ tipo: 'error', msg: dados.erro || 'Erro ao trocar senha.' });
      } else {
        setFeedback({ tipo: 'success', msg: 'Senha alterada com sucesso!' });
        setForm({ senhaAtual: '', novaSenha: '', confirmar: '' });
        setStrength({ score: 0, label: '', cls: '' });
      }
    } catch {
      setFeedback({ tipo: 'error', msg: 'Erro ao conectar com o servidor.' });
    } finally {
      setSalvando(false);
    }
  };

  return (
    <>
      <div className="perfil-section-head">
        <h1>Trocar <em>senha</em></h1>
        <p>Sua senha precisa ter no mínimo 8 caracteres com letras maiúsculas, minúsculas, números e um caractere especial (RN03 — Política de Senhas Robustas).</p>
      </div>

      {feedback && (
        <div className={`perfil-alert ${feedback.tipo}`}>
          {feedback.tipo === 'success' ? <I.check /> : <I.alert />}
          {feedback.msg}
        </div>
      )}

      <form onSubmit={salvar} className="perfil-form">
        <div className="perfil-field">
          <label className="perfil-field-label">Senha atual <span className="required">*</span></label>
          <div className="perfil-input-wrap">
            <I.lock />
            <input className="perfil-input"
              type={show.atual ? 'text' : 'password'}
              value={form.senhaAtual}
              onChange={(e) => setForm({ ...form, senhaAtual: e.target.value })}
              autoComplete="current-password" required />
            <button type="button" className="password-toggle"
              onClick={() => setShow({ ...show, atual: !show.atual })}>
              {I.eye(show.atual)}
            </button>
          </div>
        </div>

        <div className="perfil-field">
          <label className="perfil-field-label">Nova senha <span className="required">*</span></label>
          <div className="perfil-input-wrap">
            <I.lock />
            <input className="perfil-input"
              type={show.nova ? 'text' : 'password'}
              value={form.novaSenha}
              placeholder="Mínimo 8 caracteres com maiúscula, número e símbolo"
              onChange={(e) => { setForm({ ...form, novaSenha: e.target.value }); checkStrength(e.target.value); }}
              autoComplete="new-password" required minLength={8} />
            <button type="button" className="password-toggle"
              onClick={() => setShow({ ...show, nova: !show.nova })}>
              {I.eye(show.nova)}
            </button>
          </div>
          {form.novaSenha && (
            <div className="password-strength">
              <div className="strength-bar">
                {[0,1,2,3].map((i) => (
                  <div key={i} className={`strength-seg${i < strength.score ? ' ' + strength.cls : ''}`} />
                ))}
              </div>
              <span className={`strength-label ${strength.cls}`}>{strength.label}</span>
            </div>
          )}
        </div>

        <div className="perfil-field">
          <label className="perfil-field-label">Confirmar nova senha <span className="required">*</span></label>
          <div className="perfil-input-wrap">
            <I.lock />
            <input className="perfil-input"
              type={show.confirm ? 'text' : 'password'}
              value={form.confirmar}
              onChange={(e) => setForm({ ...form, confirmar: e.target.value })}
              autoComplete="new-password" required />
            <button type="button" className="password-toggle"
              onClick={() => setShow({ ...show, confirm: !show.confirm })}>
              {I.eye(show.confirm)}
            </button>
          </div>
          {form.confirmar && form.confirmar !== form.novaSenha && (
            <span style={{ fontSize: '0.76rem', color: 'var(--terracotta)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <I.alert /> As senhas não coincidem.
            </span>
          )}
        </div>

        <div className="perfil-actions">
          <button type="submit" className="btn-perfil-primary" disabled={salvando}>
            {salvando ? 'Atualizando...' : (<>Alterar senha <I.shield /></>)}
          </button>
        </div>
      </form>
    </>
  );
};

/* ════════════════════════════════════════════════════════════
   SEÇÃO LGPD
   ════════════════════════════════════════════════════════════ */
const SecaoLGPD = ({ usuario }) => {
  const navigate = useNavigate();
  const [exportando, setExportando] = useState(false);
  const [modalExcluir, setModalExcluir] = useState(false);
  const [senhaExcluir, setSenhaExcluir] = useState('');
  const [excluindo, setExcluindo] = useState(false);
  const [erroExcluir, setErroExcluir] = useState('');

  const exportarDados = async () => {
    setExportando(true);
    try {
      const resposta = await fetch(`${API_URL}/api/usuario/exportar`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('sd_token')}` },
      });
      const dados = await resposta.json();
      const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `santo-desapego-meus-dados-${Date.now()}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Erro ao exportar dados.');
    } finally {
      setExportando(false);
    }
  };

  const excluirConta = async () => {
    if (!senhaExcluir) {
      setErroExcluir('Digite sua senha para confirmar.');
      return;
    }
    setExcluindo(true);
    setErroExcluir('');

    try {
      const resposta = await fetch(`${API_URL}/api/usuario/conta`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('sd_token')}`,
        },
        body: JSON.stringify({ senhaConfirmacao: senhaExcluir }),
      });
      const dados = await resposta.json();
      if (!resposta.ok) {
        setErroExcluir(dados.erro || 'Erro ao excluir conta.');
        setExcluindo(false);
        return;
      }
      localStorage.removeItem('sd_token');
      localStorage.removeItem('sd_usuario');
      alert('Sua conta foi excluída. Sentiremos sua falta!');
      navigate('/');
    } catch {
      setErroExcluir('Erro ao conectar com o servidor.');
      setExcluindo(false);
    }
  };

  return (
    <>
      <div className="perfil-section-head">
        <h1>Privacidade <em>e dados</em></h1>
        <p>De acordo com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018), você tem direito de acessar, exportar e solicitar a exclusão dos seus dados a qualquer momento.</p>
      </div>

      <div className="lgpd-card info">
        <div className="lgpd-card-icon"><I.download /></div>
        <div className="lgpd-card-body">
          <h3>Baixar uma cópia dos seus dados</h3>
          <p>
            Faça o download de todos os dados pessoais que mantemos sobre você em formato JSON.
            Direito garantido pelo art. 18, II da LGPD.
          </p>
          <button className="btn-perfil-secondary" onClick={exportarDados} disabled={exportando}>
            {exportando ? 'Gerando arquivo...' : 'Baixar meus dados (.json)'}
          </button>
          <small>Os dados incluem nome, e-mail, CPF, telefone, endereço e preferências.</small>
        </div>
      </div>

      <div className="lgpd-card danger">
        <div className="lgpd-card-icon"><I.trash /></div>
        <div className="lgpd-card-body">
          <h3>Excluir minha conta</h3>
          <p>
            Esta ação é <strong>permanente e irreversível</strong>. Todos os seus dados pessoais serão removidos
            do nosso sistema. Caso possua transações concluídas, os registros financeiros serão anonimizados
            por 5 anos para cumprimento de obrigações legais (RN10).
          </p>
          <button className="btn-perfil-danger" onClick={() => setModalExcluir(true)}>
            Excluir minha conta
          </button>
        </div>
      </div>

      {modalExcluir && (
        <div className="modal-overlay" onClick={() => !excluindo && setModalExcluir(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2>Tem certeza?</h2>
            <p>
              <strong>{usuario.nome}</strong>, esta ação <strong>não pode ser desfeita</strong>.
              Todos os seus dados pessoais serão permanentemente removidos.
              Pra confirmar, digite sua senha:
            </p>
            {erroExcluir && (
              <div className="perfil-alert error">
                <I.alert /> {erroExcluir}
              </div>
            )}
            <div className="perfil-field">
              <label className="perfil-field-label">Senha <span className="required">*</span></label>
              <div className="perfil-input-wrap">
                <I.lock />
                <input className="perfil-input" type="password"
                  placeholder="Digite sua senha pra confirmar"
                  value={senhaExcluir}
                  onChange={(e) => setSenhaExcluir(e.target.value)}
                  autoComplete="current-password" />
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-perfil-secondary"
                onClick={() => { setModalExcluir(false); setSenhaExcluir(''); setErroExcluir(''); }}
                disabled={excluindo}>
                Cancelar
              </button>
              <button className="btn-perfil-danger" onClick={excluirConta} disabled={excluindo}>
                {excluindo ? 'Excluindo...' : 'Sim, excluir conta'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Perfil;