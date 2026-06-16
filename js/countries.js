const Countries = (() => {
  const CONFIG = {
    USE_LIVE_API: false,           // true = usar REST Countries v5 en vivo
    V5_API_KEY: 'TU_CLAVE_RESTCOUNTRIES',
    V5_BASE: 'https://api.restcountries.com/countries/v5',
    FLAG_CDN: 'https://flagcdn.com/w320', // banderas por código de país
  };

  const normalize = (s) =>
    (s || '').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

  const flagUrl = (cca2) => `${CONFIG.FLAG_CDN}/${cca2.toLowerCase()}.png`;

  /* Convierte un registro del dataset al objeto que usa la app */
  const toCountry = (r) => ({
    name: r.common,                // clave estable (favoritos/historial)
    nameEs: r.nameEs,
    official: r.officialEs || r.official,
    flag: flagUrl(r.cca2),
    flagAlt: `Bandera de ${r.nameEs}`,
    capital: r.capital,
    population: r.population,
    region: r.region,
    subregion: r.subregion,
    currencyCode: r.currencyCode,
    currencyName: r.currencyName,
    currencySymbol: r.currencySymbol,
    language: r.language,
    coords: r.latlng,
    cca2: r.cca2,
  });

  /* ---- Búsqueda en el dataset local ---- */
  const searchLocal = (query) => {
    const db = window.COUNTRIES_DB || [];
    const q = normalize(query);
    if (!q) throw new Error('empty');

    // 1) Coincidencia exacta de algún término
    let match = db.find((r) => r.terms.includes(q));
    // 2) Algún término empieza por la consulta
    if (!match) match = db.find((r) => r.terms.some((t) => t.startsWith(q)));
    // 3) Algún término contiene la consulta (mín. 3 letras para evitar ruido)
    if (!match && q.length >= 3) match = db.find((r) => r.terms.some((t) => t.includes(q)));

    if (!match) throw new Error('not-found');
    return toCountry(match);
  };

  /* ---- (Opcional) Búsqueda en vivo con REST Countries v5 ---- */
  const searchLiveV5 = async (query) => {
    const url = `${CONFIG.V5_BASE}?q=${encodeURIComponent(query)}&limit=1`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${CONFIG.V5_API_KEY}` } });
    if (!res.ok) throw new Error('v5-error');
    const json = await res.json();
    const obj = json.data && (json.data.objects ? json.data.objects[0] : json.data[0]);
    if (!obj) throw new Error('not-found');
    // Mapeo básico de la respuesta v5 (puede requerir ajustes según los campos solicitados)
    return {
      name: obj['names.common'] || obj.name,
      nameEs: obj['names.common'] || obj.name,
      official: obj['names.official'] || obj.name,
      flag: obj['codes.alpha_2'] ? flagUrl(obj['codes.alpha_2']) : '',
      flagAlt: `Bandera de ${obj['names.common'] || obj.name}`,
      capital: (obj.capital && obj.capital[0]) || 'N/D',
      population: obj.population || 0,
      region: obj.region || 'N/D',
      subregion: obj.subregion || 'N/D',
      currencyCode: obj.currency_code || 'N/D',
      currencyName: obj.currency_name || 'N/D',
      currencySymbol: '',
      language: obj.language || 'N/D',
      coords: obj.latlng || null,
      cca2: obj['codes.alpha_2'] || '',
    };
  };

  /* ---- API pública del módulo ---- */
  const search = async (query) => {
    if (!query || !query.trim()) throw new Error('empty');
    if (CONFIG.USE_LIVE_API && !CONFIG.V5_API_KEY.includes('TU_CLAVE')) {
      try {
        return await searchLiveV5(query);
      } catch (_) {
        // Si la API en vivo falla, usamos el dataset local como respaldo
        return searchLocal(query);
      }
    }
    return searchLocal(query);
  };

  return { search };
})();
