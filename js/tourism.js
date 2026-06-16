const Tourism = (() => {
  const CONFIG = {
    API_KEY: 'TU_CLAVE_OPENTRIPMAP', // ← reemplaza por tu clave gratuita de OpenTripMap
    BASE: 'https://api.opentripmap.com/0.1/en/places',
    RADIUS: 60000, // metros alrededor de la capital
    FETCH_LIMIT: 14, // candidatos a obtener
    SHOW_MIN: 5,     // mínimo a mostrar (requisito del proyecto)
  };

  const hasKey = () => CONFIG.API_KEY && !CONFIG.API_KEY.includes('TU_CLAVE');

  /* Traducción de "kinds" de OpenTripMap a categorías legibles */
  const KIND_LABELS = {
    architecture: 'Arquitectura',
    historic: 'Sitio histórico',
    historic_architecture: 'Arquitectura histórica',
    cultural: 'Cultura',
    museums: 'Museo',
    monuments_and_memorials: 'Monumento',
    religion: 'Sitio religioso',
    churches: 'Iglesia',
    natural: 'Naturaleza',
    beaches: 'Playa',
    gardens_and_parks: 'Parque',
    bridges: 'Puente',
    towers: 'Torre',
    fortifications: 'Fortaleza',
    palaces: 'Palacio',
    theatres_and_entertainments: 'Teatro',
    urban_environment: 'Lugar urbano',
    view_points: 'Mirador',
    skyscrapers: 'Rascacielos',
    interesting_places: 'Lugar de interés',
  };

  const labelFromKinds = (kinds = '') => {
    const list = kinds.split(',');
    for (const k of list) {
      if (KIND_LABELS[k]) return KIND_LABELS[k];
    }
    return 'Atracción turística';
  };

  /* Búsqueda por radio alrededor de unas coordenadas */
  const radiusSearch = async ([lat, lon]) => {
    const params = new URLSearchParams({
      radius: CONFIG.RADIUS,
      lon, lat,
      kinds: 'interesting_places,architecture,museums,monuments_and_memorials,cultural,historic',
      rate: '3', // solo lugares con calificación alta
      format: 'json',
      limit: CONFIG.FETCH_LIMIT,
      apikey: CONFIG.API_KEY,
    });
    const res = await fetch(`${CONFIG.BASE}/radius?${params}`);
    if (!res.ok) throw new Error('otm-radius-error');
    return res.json();
  };

  /* Detalle de un lugar por su xid */
  const placeDetail = async (xid) => {
    const res = await fetch(`${CONFIG.BASE}/xid/${xid}?apikey=${CONFIG.API_KEY}`);
    if (!res.ok) throw new Error('otm-detail-error');
    return res.json();
  };

  /* Normaliza el detalle a un objeto limpio para la UI */
  const parseDetail = (d) => {
    const desc =
      (d.wikipedia_extracts && d.wikipedia_extracts.text) ||
      (d.info && d.info.descr) ||
      `${labelFromKinds(d.kinds)} destacado en la región. Explora más sobre este lugar.`;
    return {
      id: d.xid,
      name: d.name,
      image: (d.preview && d.preview.source) || null,
      category: labelFromKinds(d.kinds),
      description: desc.length > 220 ? desc.slice(0, 217) + '…' : desc,
      lat: d.point ? d.point.lat : null,
      lon: d.point ? d.point.lon : null,
      url: d.otm || (d.wikipedia || null),
    };
  };

  /* Función pública: obtiene atracciones para unas coordenadas.
     Devuelve { ok, places?, reason? } */
  const getAttractions = async (coords) => {
    if (!hasKey()) {
      return {
        ok: false,
        reason: 'no-key',
        message: 'Para ver atracciones turísticas, agrega tu clave gratuita de OpenTripMap en js/tourism.js (CONFIG.API_KEY).',
      };
    }
    try {
      const features = await radiusSearch(coords);
      const named = features.filter((f) => f.name && f.xid);
      if (named.length === 0) {
        return { ok: false, reason: 'empty', message: 'No se encontraron atracciones cercanas a la capital.' };
      }

      // Obtenemos detalles en paralelo (con tolerancia a fallos individuales)
      const details = await Promise.allSettled(
        named.slice(0, CONFIG.FETCH_LIMIT).map((f) => placeDetail(f.xid))
      );

      const places = details
        .filter((r) => r.status === 'fulfilled' && r.value && r.value.name)
        .map((r) => parseDetail(r.value));

      // Priorizamos los que tienen imagen para una mejor presentación
      places.sort((a, b) => (b.image ? 1 : 0) - (a.image ? 1 : 0));

      if (places.length === 0) {
        return { ok: false, reason: 'empty', message: 'No se pudieron cargar los detalles de las atracciones.' };
      }
      return { ok: true, places };
    } catch (e) {
      return { ok: false, reason: 'error', message: 'Error al consultar OpenTripMap. Verifica tu clave o conexión.' };
    }
  };

  return { getAttractions, hasKey };
})();
