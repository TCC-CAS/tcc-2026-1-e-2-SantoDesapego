import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './Mapa.css';

const API_URL = 'http://localhost:8080/api';

const CENTER_SANTO_AMARO = { lat: -23.6509, lng: -46.7100 };
const CENTER = [CENTER_SANTO_AMARO.lat, CENTER_SANTO_AMARO.lng];
const ZOOM = 14;

/* ── Pin terracota customizado ───────────────────────────── */
const ICONE_PIN = L.divIcon({
  className: 'mapa-marker',
  html: '<span class="mapa-marker-pin"></span>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
  popupAnchor: [0, -10],
});

/* ── Cache de geocodificação no localStorage ─────────────── */
const CACHE_PREFIX = 'sd_geo_';

const cacheGet = (cep) => {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + cep);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};

const cacheSet = (cep, coords) => {
  try { localStorage.setItem(CACHE_PREFIX + cep, JSON.stringify(coords)); } catch {}
};

/* ── Nominatim: busca por endereço completo (muito mais preciso que só CEP) ── */
async function geocodarViaNominatim(cep, logradouro = '') {
  try {
    // Se tiver logradouro, usa ele — resultado bem mais exato
    const query = logradouro
      ? `${logradouro}, São Paulo, Brasil`
      : `${cep}, São Paulo, Brasil`;

    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=br`;
    console.log('[Mapa] Nominatim query:', query);

    const res = await fetch(url, {
      headers: {
        'Accept-Language': 'pt-BR',
        'User-Agent': 'SantoDesapego/1.0',
      },
    });

    const data = await res.json();
    console.log('[Mapa] Nominatim resposta:', data);

    if (data && data[0]) {
      const lat = parseFloat(data[0].lat);
      const lng = parseFloat(data[0].lon);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        const coords = { lat, lng };
        const cepLimpo = String(cep).replace(/\D/g, '');
        cacheSet(cepLimpo, coords);
        console.log('[Mapa] Nominatim coords:', coords);
        return coords;
      }
    }
    return null;
  } catch (e) {
    console.error('[Mapa] Erro Nominatim:', e);
    return null;
  }
}

/* ── Geocodifica CEP — BrasilAPI → ViaCEP + Nominatim ────── */
async function geocodarCep(cep) {
  const cepLimpo = String(cep || '').replace(/\D/g, '');
  if (cepLimpo.length !== 8) {
    console.warn('[Mapa] CEP inválido:', cep);
    return null;
  }

  // 1. Verifica cache primeiro
  const cached = cacheGet(cepLimpo);
  if (cached) {
    console.log('[Mapa] CEP do cache:', cepLimpo, cached);
    return cached;
  }

  try {
    // 2. BrasilAPI — tenta coords diretas
    console.log('[Mapa] BrasilAPI para CEP:', cepLimpo);
    const res = await fetch(`https://brasilapi.com.br/api/cep/v2/${cepLimpo}`);

    if (res.ok) {
      const data = await res.json();
      console.log('[Mapa] BrasilAPI resposta:', data);

      const lat = parseFloat(data?.location?.coordinates?.latitude);
      const lng = parseFloat(data?.location?.coordinates?.longitude);

      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        const coords = { lat, lng };
        cacheSet(cepLimpo, coords);
        console.log('[Mapa] BrasilAPI coords diretas:', coords);
        return coords;
      }

      // BrasilAPI sem coords — usa logradouro para Nominatim
      const logradouro = [data?.street, data?.neighborhood]
        .filter(Boolean)
        .join(', ');

      console.log('[Mapa] BrasilAPI sem coords, usando logradouro:', logradouro);
      const coordsNominatim = await geocodarViaNominatim(cepLimpo, logradouro);
      if (coordsNominatim) return coordsNominatim;
    }

    // 3. Fallback: ViaCEP (para pegar o logradouro caso BrasilAPI falhe)
    console.log('[Mapa] Tentando ViaCEP para:', cepLimpo);
    const resVia = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
    if (resVia.ok) {
      const dataVia = await resVia.json();
      console.log('[Mapa] ViaCEP resposta:', dataVia);

      if (!dataVia.erro) {
        const logradouro = [dataVia.logradouro, dataVia.bairro, dataVia.localidade]
          .filter(Boolean)
          .join(', ');
        console.log('[Mapa] ViaCEP logradouro para Nominatim:', logradouro);
        return await geocodarViaNominatim(cepLimpo, logradouro);
      }
    }

    console.warn('[Mapa] Todas as APIs falharam para CEP:', cepLimpo);
    return null;
  } catch (e) {
    console.error('[Mapa] Erro na geocodificação:', e);
    return null;
  }
}

/* ── Resolve coords para um anúncio ──────────────────────── */
async function resolverCoords(anuncio) {
  // 1. Prioridade: lat/lng direto do banco
  const lat = parseFloat(anuncio.latitude);
  const lng = parseFloat(anuncio.longitude);
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    console.log('[Mapa] Usando coords do banco para anúncio', anuncio.id);
    return { lat, lng };
  }

  // 2. Geocodifica pelo CEP (BrasilAPI → ViaCEP + Nominatim)
  if (anuncio.cep) {
    const coords = await geocodarCep(anuncio.cep);
    if (coords) return coords;
  }

  // 3. Fallback final: centro de Santo Amaro com offset aleatório
  //    (evita empilhar todos os pins no mesmo ponto)
  console.warn('[Mapa] Sem coords para anúncio', anuncio.id, '— usando fallback Santo Amaro');
  return {
    lat: CENTER_SANTO_AMARO.lat + (Math.random() - 0.5) * 0.008,
    lng: CENTER_SANTO_AMARO.lng + (Math.random() - 0.5) * 0.008,
  };
}

/* ── Força Leaflet a recalcular tamanho após mount ────────── */
const InvalidarTamanho = () => {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 120);
    return () => clearTimeout(t);
  }, [map]);
  return null;
};

const formatarPreco = (valor) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(parseFloat(valor) || 0);

/* ════════════════════════════════════════════════════════════
   COMPONENTE
   ════════════════════════════════════════════════════════════ */
const Mapa = () => {
  const [marcadores, setMarcadores] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let cancelado = false;

    const carregar = async () => {
      try {
        const url = `${API_URL}/anuncios?limite=50&status=ativo`;
        console.log('[Mapa] Buscando anúncios em:', url);

        const res = await fetch(url);
        const data = await res.json();
        console.log('[Mapa] Resposta da API:', data);

        const anuncios = data.anuncios || [];
        console.log('[Mapa] Total de anúncios recebidos:', anuncios.length);

        if (anuncios.length === 0) {
          if (!cancelado) setCarregando(false);
          return;
        }

        // Resolve coords em paralelo, em batches de 5
        const BATCH = 5;
        const acumulado = [];

        for (let i = 0; i < anuncios.length; i += BATCH) {
          if (cancelado) return;

          const batch = anuncios.slice(i, i + BATCH);
          const resultados = await Promise.all(
            batch.map(async (a) => {
              const coords = await resolverCoords(a);
              return coords ? { anuncio: a, coords } : null;
            })
          );

          for (const r of resultados) if (r) acumulado.push(r);

          // Atualização incremental — pins aparecem conforme chegam
          if (!cancelado) setMarcadores([...acumulado]);
        }

        console.log('[Mapa] Marcadores resolvidos:', acumulado.length);
        if (!cancelado) setCarregando(false);
      } catch (erro) {
        console.error('[Mapa] Erro ao carregar anúncios:', erro);
        if (!cancelado) setCarregando(false);
      }
    };

    carregar();
    return () => { cancelado = true; };
  }, []);

  return (
    <div className="leaflet-wrapper">
      <MapContainer
        center={CENTER}
        zoom={ZOOM}
        scrollWheelZoom={false}
        className="leaflet-map"
        attributionControl={false}
      >
        <InvalidarTamanho />

        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {marcadores.map(({ anuncio, coords }) => (
          <Marker
            key={anuncio.id}
            position={[coords.lat, coords.lng]}
            icon={ICONE_PIN}
          >
            <Popup>
              <div className="mapa-popup">
                {anuncio.imagem_principal && (
                  <img
                    src={anuncio.imagem_principal}
                    alt={anuncio.titulo}
                    loading="lazy"
                  />
                )}
                <div className="mapa-popup-body">
                  <strong>{anuncio.titulo}</strong>
                  <span className="popup-price">
                    {formatarPreco(anuncio.preco)}
                  </span>
                  <span className="popup-bairro">
                    📍 {anuncio.bairro || 'Santo Amaro'}
                  </span>
                  <Link to={`/anuncio/${anuncio.id}`}>Ver anúncio →</Link>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Badge: status / contagem */}
      <div className="mapa-info">
        {carregando ? (
          <>
            <span className="mapa-spinner" aria-hidden="true" />
            <span>Mapeando anúncios…</span>
          </>
        ) : (
          <>
            <strong>{marcadores.length}</strong>
            <span>
              {marcadores.length === 1 ? 'anúncio aqui perto' : 'anúncios aqui perto'}
            </span>
          </>
        )}
      </div>

      {/* Estado vazio */}
      {!carregando && marcadores.length === 0 && (
        <div className="mapa-empty">
          <span aria-hidden="true">📍</span>
          <p>Ainda não há anúncios<br />com localização mapeada.</p>
        </div>
      )}
    </div>
  );
};

export default Mapa;