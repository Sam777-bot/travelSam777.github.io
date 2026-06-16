const Storage = (() => {
  // Claves usadas en LocalStorage
  const KEYS = {
    USER: 'tpp_user',                 // Nombre, correo, país de residencia
    FAV_COUNTRIES: 'tpp_fav_countries',
    FAV_PLACES: 'tpp_fav_places',
    HISTORY: 'tpp_history',
    THEME: 'tpp_theme',
  };

  /* ---- Helpers genéricos ---- */
  const read = (key, fallback) => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      console.warn('Error leyendo LocalStorage:', e);
      return fallback;
    }
  };
  const write = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn('Error escribiendo LocalStorage:', e);
    }
  };

  /* ---- MÓDULO 1: Usuario ---- */
  const getUser = () => read(KEYS.USER, null);
  const saveUser = (user) => write(KEYS.USER, user);
  const hasUser = () => getUser() !== null;

  /* ---- MÓDULO 7: Países favoritos ---- */
  const getFavCountries = () => read(KEYS.FAV_COUNTRIES, []);
  const isFavCountry = (name) =>
    getFavCountries().some((c) => c.name.toLowerCase() === name.toLowerCase());
  const toggleFavCountry = (country) => {
    const favs = getFavCountries();
    const idx = favs.findIndex((c) => c.name.toLowerCase() === country.name.toLowerCase());
    if (idx >= 0) {
      favs.splice(idx, 1);
    } else {
      favs.push({ name: country.name, flag: country.flag });
    }
    write(KEYS.FAV_COUNTRIES, favs);
    return idx < 0; // true = se agregó, false = se quitó
  };
  const removeFavCountry = (name) => {
    const favs = getFavCountries().filter((c) => c.name.toLowerCase() !== name.toLowerCase());
    write(KEYS.FAV_COUNTRIES, favs);
  };

  /* ---- MÓDULO 8: Atracciones favoritas ---- */
  const getFavPlaces = () => read(KEYS.FAV_PLACES, []);
  const isFavPlace = (id) => getFavPlaces().some((p) => p.id === id);
  const toggleFavPlace = (place) => {
    const favs = getFavPlaces();
    const idx = favs.findIndex((p) => p.id === place.id);
    if (idx >= 0) {
      favs.splice(idx, 1);
    } else {
      favs.push(place);
    }
    write(KEYS.FAV_PLACES, favs);
    return idx < 0;
  };
  const removeFavPlace = (id) => {
    write(KEYS.FAV_PLACES, getFavPlaces().filter((p) => p.id !== id));
  };

  /* ---- MÓDULO 9: Historial de consultas ---- */
  const getHistory = () => read(KEYS.HISTORY, []);
  const addHistory = (country) => {
    const history = getHistory();
    const now = new Date();
    history.unshift({
      name: country.name,
      flag: country.flag,
      date: now.toLocaleDateString('es-CO'),
      time: now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
      ts: now.getTime(),
    });
    // Limitamos el historial a 50 entradas
    write(KEYS.HISTORY, history.slice(0, 50));
  };
  const clearHistory = () => write(KEYS.HISTORY, []);
  // Países únicos consultados (para el dashboard)
  const getUniqueCountriesCount = () => {
    const set = new Set(getHistory().map((h) => h.name.toLowerCase()));
    return set.size;
  };

  /* ---- MÓDULO 10: Tema ---- */
  const getTheme = () => read(KEYS.THEME, 'light');
  const saveTheme = (theme) => write(KEYS.THEME, theme);

  return {
    KEYS,
    getUser, saveUser, hasUser,
    getFavCountries, isFavCountry, toggleFavCountry, removeFavCountry,
    getFavPlaces, isFavPlace, toggleFavPlace, removeFavPlace,
    getHistory, addHistory, clearHistory, getUniqueCountriesCount,
    getTheme, saveTheme,
  };
})();
