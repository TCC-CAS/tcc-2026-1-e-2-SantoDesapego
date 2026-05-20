import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './Mapa.css';

const API_URL = 'http://localhost:8080/api';

const CENTER = [-23.6400, -46.7020];
const ZOOM   = 13;

/* ── Pin terracota customizado — combina com o design ────── */
const ICONE_PIN = L.divIcon({
  className: 'mapa-marker',
  html: '<span class="mapa-marker-pin"></span>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
  popupAnchor: [0, -10],
});

/* ── Cache de geocodificação no localStorage ───────────────
   Evita pedir o mesmo CEP várias vezes pra BrasilAPI. */
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

/* ── Geocodifica CEP via BrasilAPI v2 ──────────────────────
   Endpoint: https://brasilapi.com.br/api/cep/v2/{cep}
   Retorna { location: { coordinates: { latitude, longitude } } }.
   Nem todo CEP tem coords — devolvemos null nesse caso. */
async function geocodarCep(cep) {
  const cepLimpo = String(cep || '').replace(/\D/g, '');
  if (cepLimpo.length !== 8) return null;

  const cached = cacheGet(cepLimpo);
  if (cached) return cached;

  try {
    const res = await fetch(`https://brasilapi.com.br/api/cep/v2/${cepLimpo}`);
    if (!res.ok) return null;
    const data = await res.json();

    const lat = parseFloat(data?.location?.coordinates?.latitude);
    const lng = parseFloat(data?.location?.coordinates?.longitude);

    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      const coords = { lat, lng };
      cacheSet(cepLimpo, coords);
      return coords;
    }
    return null;
  } catch {
    return null;
  }
}

/* ── Resolve coords pra um anúncio
   Prioridade: lat/lng do backend > geocodar pelo CEP */
async function resolverCoords(anuncio) {
  const lat = parseFloat(anuncio.latitude);
  const lng = parseFloat(anuncio.longitude);
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    return { lat, lng };
  }
  if (anuncio.cep) {
    return await geocodarCep(anuncio.cep);
  }
  return null;
}

/* ── Helper interno: força o Leaflet a recalcular tamanho
   logo depois do mount. Resolve o "mapa cinza" quando o
   container ainda não tinha dimensão na hora da inicialização. */
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

const Mapa = () => {
  const [marcadores, setMarcadores] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let cancelado = false;

    const carregar = async () => {
      try {
        // 1) Busca anúncios ativos
        const res = await fetch(`${API_URL}/anuncios?limite=50&status=ativo`);
        const data = await res.json();
        const anuncios = data.anuncios || [];

        if (anuncios.length === 0) {
          if (!cancelado) setCarregando(false);
          return;
        }

        // 2) Resolve coords em paralelo, em batches de 5
        //    (gentil com a BrasilAPI, e mais rápido que sequencial)
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

          // Atualização incremental — pins vão "pipocando" no mapa
          if (!cancelado) setMarcadores([...acumulado]);
        }

        if (!cancelado) setCarregando(false);
      } catch (erro) {
        console.error('[Mapa] erro ao carregar anúncios:', erro);
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

      {/* Badge no canto: status / contagem */}
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

      {/* Estado vazio sobreposto */}
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