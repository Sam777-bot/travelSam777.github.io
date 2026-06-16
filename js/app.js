const App = (() => {
  /* ---------- Referencias al DOM ---------- */
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const el = {
    loader: $('#global-loader'),
    toast: $('#toast'),
    // Registro
    registerModal: $('#register-modal'),
    registerForm: $('#register-form'),
    // Tema
    themeToggle: $('#theme-toggle'),
    // Nav
    burger: $('#nav-burger'),
    navLinks: $('#nav-links'),
    // Dashboard
    dashUsername: $('#dash-username'),
    statCountries: $('#stat-countries'),
    statFavCountries: $('#stat-fav-countries'),
    statFavPlaces: $('#stat-fav-places'),
    chartWrap: $('#chart-wrap'),
    // Búsqueda
    searchForm: $('#search-form'),
    searchInput: $('#search-input'),
    searchMessage: $('#search-message'),
    geoBtn: $('#geo-btn'),
    // Resultados
    results: $('#results'),
    countryFlag: $('#country-flag'),
    countryName: $('#country-name'),
    countryNative: $('#country-native'),
    countryInfoCards: $('#country-info-cards'),
    favCountryBtn: $('#fav-country-btn'),
    // Clima
    weatherCity: $('#weather-city'),
    weatherBody: $('#weather-body'),
    // Moneda
    currencyTarget: $('#currency-target'),
    currencyAmount: $('#currency-amount'),
    currencyFrom: $('#currency-from'),
    currencyResult: $('#currency-result'),
    currencyNote: $('#currency-note'),
    // Atracciones
    attractionsCountry: $('#attractions-country'),
    attractionsGrid: $('#attractions-grid'),
    // Favoritos
    favCountriesGrid: $('#fav-countries-grid'),
    favCountriesEmpty: $('#fav-countries-empty'),
    favPlacesGrid: $('#fav-places-grid'),
    favPlacesEmpty: $('#fav-places-empty'),
    // Historial
    historyList: $('#history-list'),
    historyEmpty: $('#history-empty'),
    clearHistory: $('#clear-history'),
    // Modal atracción
    placeModal: $('#place-modal'),
    placeModalClose: $('#place-modal-close'),
    placeModalImg: $('#place-modal-img'),
    placeModalCat: $('#place-modal-cat'),
    placeModalName: $('#place-modal-name'),
    placeModalDesc: $('#place-modal-desc'),
  };

  /* ---------- Estado ---------- */
  let currentCountry = null;
  let leafletMap = null;
  let mapMarkers = [];
  let statsChart = null;

  /* ============================================================
     UTILIDADES (loader, toast)
     ============================================================ */
  const showLoader = () => el.loader.classList.add('active');
  const hideLoader = () => el.loader.classList.remove('active');

  let toastTimer;
  const toast = (msg, icon = 'fa-circle-check') => {
    el.toast.innerHTML = `<i class="fa-solid ${icon}"></i> ${msg}`;
    el.toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.toast.classList.remove('show'), 2800);
  };

  const formatNumber = (n) => n.toLocaleString('es-CO');

  /* ============================================================
     MÓDULO 10 — TEMA OSCURO
     ============================================================ */
  const applyTheme = (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    const icon = el.themeToggle.querySelector('i');
    icon.className = theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
    Storage.saveTheme(theme);
  };
  const initTheme = () => applyTheme(Storage.getTheme());
  const toggleTheme = () => {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    // Si hay gráfico, lo redibujamos con los nuevos colores
    if (statsChart) renderChart();
  };

  /* ============================================================
     MÓDULO 1 — REGISTRO DEL VIAJERO
     ============================================================ */
  const initRegistration = () => {
    if (Storage.hasUser()) {
      const user = Storage.getUser();
      el.registerModal.classList.remove('active');
      toast(`Bienvenido nuevamente, ${user.name.split(' ')[0]} 👋`, 'fa-hand-sparkles');
    } else {
      el.registerModal.classList.add('active');
    }
    updateDashboard();
  };

  const validateRegister = (data) => {
    const errors = {};
    if (!data.name || data.name.trim().length < 3) {
      errors['reg-name'] = 'Ingresa tu nombre completo (mín. 3 caracteres).';
    }
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(data.email)) {
      errors['reg-email'] = 'Ingresa un correo electrónico válido.';
    }
    if (!data.country || data.country.trim().length < 2) {
      errors['reg-country'] = 'Indica tu país de residencia.';
    }
    return errors;
  };

  const handleRegister = (e) => {
    e.preventDefault();
    const data = {
      name: $('#reg-name').value.trim(),
      email: $('#reg-email').value.trim(),
      country: $('#reg-country').value.trim(),
    };
    // Limpiar errores previos
    $$('.error-msg').forEach((s) => (s.textContent = ''));
    $$('#register-form input').forEach((i) => i.classList.remove('invalid'));

    const errors = validateRegister(data);
    if (Object.keys(errors).length > 0) {
      Object.entries(errors).forEach(([field, msg]) => {
        const span = $(`[data-error-for="${field}"]`);
        if (span) span.textContent = msg;
        const input = $(`#${field}`);
        if (input) input.classList.add('invalid');
      });
      return;
    }

    Storage.saveUser(data);
    el.registerModal.classList.remove('active');
    toast(`¡Listo, ${data.name.split(' ')[0]}! Tu pasaporte está activo ✈️`, 'fa-passport');
    updateDashboard();
  };

  /* ============================================================
     MÓDULO 11 — DASHBOARD + GRÁFICO (Chart.js, extra)
     ============================================================ */
  const updateDashboard = () => {
    const user = Storage.getUser();
    el.dashUsername.textContent = user ? user.name.split(' ')[0] : 'viajero';
    el.statCountries.textContent = Storage.getUniqueCountriesCount();
    el.statFavCountries.textContent = Storage.getFavCountries().length;
    el.statFavPlaces.textContent = Storage.getFavPlaces().length;
    renderChart();
  };

  const renderChart = () => {
    if (typeof Chart === 'undefined') return;
    const data = [
      Storage.getUniqueCountriesCount(),
      Storage.getFavCountries().length,
      Storage.getFavPlaces().length,
    ];
    const total = data.reduce((a, b) => a + b, 0);
    if (total === 0) {
      el.chartWrap.hidden = true;
      return;
    }
    el.chartWrap.hidden = false;

    const ctx = $('#stats-chart');
    if (statsChart) statsChart.destroy();

    const text = getComputedStyle(document.documentElement);
    statsChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Países consultados', 'Destinos favoritos', 'Atracciones favoritas'],
        datasets: [{
          data,
          backgroundColor: ['#3fb8af', '#ff6b4a', '#f2a900'],
          borderRadius: 10,
          maxBarThickness: 70,
        }],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: 'rgba(255,255,255,.85)' }, grid: { display: false } },
          y: { beginAtZero: true, ticks: { color: 'rgba(255,255,255,.7)', precision: 0 }, grid: { color: 'rgba(255,255,255,.1)' } },
        },
      },
    });
  };

  /* ============================================================
     MÓDULO 2 — BÚSQUEDA  +  orquestación de resultados
     ============================================================ */
  const showSearchMessage = (msg) => {
    el.searchMessage.textContent = msg;
    el.searchMessage.hidden = false;
  };
  const hideSearchMessage = () => (el.searchMessage.hidden = true);

  const handleSearch = async (query) => {
    if (!query || !query.trim()) {
      showSearchMessage('Escribe el nombre de un país para comenzar.');
      return;
    }
    hideSearchMessage();
    showLoader();
    try {
      const country = await Countries.search(query);
      currentCountry = country;

      // MÓDULO 9 — registrar en historial
      Storage.addHistory(country);

      renderCountry(country);          // Módulo 3
      el.results.hidden = false;
      el.results.scrollIntoView({ behavior: 'smooth', block: 'start' });

      // Cargas paralelas e independientes (cada una maneja su error)
      loadWeather(country);            // Módulo 4
      setupCurrency(country);          // Módulo 5
      loadAttractions(country);        // Módulo 6
      renderMap(country);              // Extra (Leaflet)

      renderHistory();
      updateDashboard();
    } catch (err) {
      el.results.hidden = true;
      showSearchMessage(`No encontramos "${query}". Verifica el nombre e intenta de nuevo (ej.: Japón, Francia, Colombia).`);
    } finally {
      hideLoader();
    }
  };

  /* ============================================================
     MÓDULO 3 — INFORMACIÓN GENERAL DEL PAÍS
     ============================================================ */
  const renderCountry = (c) => {
    el.countryFlag.src = c.flag;
    el.countryFlag.alt = c.flagAlt;
    el.countryName.textContent = c.nameEs;
    el.countryNative.textContent = c.official;

    const cards = [
      { label: 'Capital', value: c.capital, icon: 'fa-landmark' },
      { label: 'Región', value: c.region, icon: 'fa-earth-americas' },
      { label: 'Subregión', value: c.subregion, icon: 'fa-map' },
      { label: 'Población', value: formatNumber(c.population), icon: 'fa-users' },
      { label: 'Moneda', value: `${c.currencyName} (${c.currencyCode})`, icon: 'fa-coins' },
      { label: 'Idioma', value: c.language, icon: 'fa-language' },
    ];
    el.countryInfoCards.innerHTML = cards.map((card) => `
      <div class="info-card">
        <div class="ic-label">${card.label}</div>
        <div class="ic-value"><i class="fa-solid ${card.icon}"></i>${card.value}</div>
      </div>`).join('');

    // Estado del botón de favorito
    updateFavCountryBtn();
  };

  /* ============================================================
     MÓDULO 4 — CLIMA DEL DESTINO
     ============================================================ */
  const loadWeather = async (c) => {
    el.weatherCity.textContent = c.capital;
    el.weatherBody.innerHTML = `<div class="skeleton" style="height:120px"></div>`;
    if (!c.coords) {
      el.weatherBody.innerHTML = `<p class="currency-note">No hay coordenadas disponibles para este destino.</p>`;
      return;
    }
    try {
      const w = await Weather.fetchByCoords(c.coords);
      el.weatherBody.innerHTML = `
        <div class="weather-main">
          <span class="weather-emoji">${w.emoji}</span>
          <div>
            <div class="weather-temp">${w.temperature}${w.units.temp}</div>
            <div class="weather-state">${w.state}</div>
          </div>
        </div>
        <div class="weather-metrics">
          <div class="weather-metric">
            <i class="fa-solid fa-droplet"></i>
            <div class="wm-value">${w.humidity}${w.units.humidity}</div>
            <div class="wm-label">Humedad</div>
          </div>
          <div class="weather-metric">
            <i class="fa-solid fa-wind"></i>
            <div class="wm-value">${w.wind} ${w.units.wind}</div>
            <div class="wm-label">Viento</div>
          </div>
          <div class="weather-metric">
            <i class="fa-solid fa-temperature-half"></i>
            <div class="wm-value">${w.temperature}°</div>
            <div class="wm-label">Sensación</div>
          </div>
        </div>`;
    } catch (e) {
      el.weatherBody.innerHTML = `<p class="currency-note">No se pudo cargar el clima en este momento.</p>`;
    }
  };

  /* ============================================================
     MÓDULO 5 — CONVERSOR DE MONEDA
     ============================================================ */
  let currencyDebounce;
  const setupCurrency = (c) => {
    el.currencyTarget.textContent = `→ ${c.currencyCode}`;
    runConversion();
  };

  const runConversion = async () => {
    if (!currentCountry) return;
    const amount = parseFloat(el.currencyAmount.value) || 0;
    const from = el.currencyFrom.value;
    const to = currentCountry.currencyCode;

    if (to === 'N/D') {
      el.currencyResult.textContent = '—';
      el.currencyNote.textContent = 'Este país no tiene una moneda registrada.';
      return;
    }

    el.currencyResult.textContent = '…';
    el.currencyNote.textContent = '';

    const result = await Currency.convert(amount, from, to);
    if (result.ok) {
      el.currencyResult.textContent = Currency.format(result.value, to);
      el.currencyNote.textContent = `${formatNumber(amount)} ${from} = ${Currency.format(result.value, to)} (1 ${from} ≈ ${result.rate ? result.rate.toFixed(2) : '1'} ${to})`;
    } else {
      el.currencyResult.textContent = '—';
      el.currencyNote.textContent = result.reason;
    }
  };

  const onCurrencyInput = () => {
    clearTimeout(currencyDebounce);
    currencyDebounce = setTimeout(runConversion, 350);
  };

  /* ============================================================
     MÓDULO 6 — ATRACCIONES TURÍSTICAS
     ============================================================ */
  const loadAttractions = async (c) => {
    el.attractionsCountry.textContent = c.nameEs;
    // Skeletons mientras carga
    el.attractionsGrid.innerHTML = Array.from({ length: 5 })
      .map(() => `<div class="skeleton" style="height:300px;border-radius:18px"></div>`).join('');

    if (!c.coords) {
      el.attractionsGrid.innerHTML = `<p class="empty-state" style="grid-column:1/-1">No hay coordenadas para buscar atracciones.</p>`;
      return;
    }

    const res = await Tourism.getAttractions(c.coords);
    if (!res.ok) {
      el.attractionsGrid.innerHTML = `<p class="empty-state" style="grid-column:1/-1"><i class="fa-solid fa-circle-info"></i> ${res.message}</p>`;
      return;
    }
    renderAttractions(res.places);
    // Añadir marcadores al mapa
    addAttractionMarkers(res.places);
  };

  const renderAttractions = (places) => {
    el.attractionsGrid.innerHTML = places.map((p) => attractionCardHTML(p)).join('');
    // Listeners de cada tarjeta
    $$('#attractions-grid .attraction-card').forEach((card) => {
      const id = card.dataset.id;
      const place = places.find((p) => p.id === id);
      card.addEventListener('click', (e) => {
        if (e.target.closest('.mini-fav')) return;
        openPlaceModal(place);
      });
      const favBtn = card.querySelector('.mini-fav');
      favBtn.addEventListener('click', () => {
        const added = Storage.toggleFavPlace(place);
        favBtn.classList.toggle('active', added);
        favBtn.querySelector('i').className = added ? 'fa-solid fa-heart' : 'fa-regular fa-heart';
        toast(added ? `"${place.name}" guardada` : `"${place.name}" eliminada`, added ? 'fa-heart' : 'fa-heart-crack');
        renderFavPlaces();
        updateDashboard();
      });
    });
  };

  const attractionCardHTML = (p) => {
    const fav = Storage.isFavPlace(p.id);
    const img = p.image
      ? `<img class="attraction-img" src="${p.image}" alt="${p.name}" loading="lazy" onerror="this.outerHTML='<div class=\\'attraction-noimg\\'><i class=\\'fa-solid fa-image\\'></i></div>'">`
      : `<div class="attraction-noimg"><i class="fa-solid fa-mountain-sun"></i></div>`;
    return `
      <article class="attraction-card" data-id="${p.id}">
        ${img}
        <div class="attraction-info">
          <span class="place-cat">${p.category}</span>
          <h4>${p.name}</h4>
          <p class="attraction-desc">${p.description}</p>
          <div class="attraction-actions">
            <span style="font-size:.8rem;color:var(--text-soft)"><i class="fa-solid fa-circle-info"></i> Ver detalle</span>
            <button class="mini-fav ${fav ? 'active' : ''}" title="Guardar atracción" aria-label="Guardar atracción">
              <i class="fa-${fav ? 'solid' : 'regular'} fa-heart"></i>
            </button>
          </div>
        </div>
      </article>`;
  };

  const openPlaceModal = (p) => {
    el.placeModalCat.textContent = p.category;
    el.placeModalName.textContent = p.name;
    el.placeModalDesc.textContent = p.description;
    if (p.image) {
      el.placeModalImg.src = p.image;
      el.placeModalImg.style.display = 'block';
    } else {
      el.placeModalImg.style.display = 'none';
    }
    el.placeModal.classList.add('active');
  };

  /* ============================================================
     MÓDULO 7 — DESTINOS FAVORITOS
     ============================================================ */
  const updateFavCountryBtn = () => {
    if (!currentCountry) return;
    const fav = Storage.isFavCountry(currentCountry.name);
    el.favCountryBtn.classList.toggle('active', fav);
    el.favCountryBtn.querySelector('i').className = fav ? 'fa-solid fa-heart' : 'fa-regular fa-heart';
  };

  const toggleFavCountry = () => {
    if (!currentCountry) return;
    const added = Storage.toggleFavCountry(currentCountry);
    updateFavCountryBtn();
    toast(added ? `${currentCountry.nameEs} agregado a favoritos ❤️` : `${currentCountry.nameEs} eliminado de favoritos`, added ? 'fa-heart' : 'fa-heart-crack');
    renderFavCountries();
    updateDashboard();
  };

  const renderFavCountries = () => {
    const favs = Storage.getFavCountries();
    el.favCountriesEmpty.hidden = favs.length > 0;
    el.favCountriesGrid.innerHTML = favs.map((c) => `
      <div class="fav-country" data-name="${c.name}">
        <img src="${c.flag}" alt="Bandera de ${c.name}" loading="lazy" />
        <div class="fav-body">
          <span class="fav-name">${c.name}</span>
          <button class="fav-remove" title="Eliminar" aria-label="Eliminar favorito"><i class="fa-solid fa-trash-can"></i></button>
        </div>
      </div>`).join('');

    $$('#fav-countries-grid .fav-country').forEach((card) => {
      const name = card.dataset.name;
      card.querySelector('.fav-remove').addEventListener('click', (e) => {
        e.stopPropagation();
        Storage.removeFavCountry(name);
        renderFavCountries();
        updateFavCountryBtn();
        updateDashboard();
        toast(`${name} eliminado de favoritos`, 'fa-heart-crack');
      });
      card.querySelector('img').addEventListener('click', () => handleSearch(name));
    });
  };

  /* ============================================================
     MÓDULO 8 — ATRACCIONES FAVORITAS
     ============================================================ */
  const renderFavPlaces = () => {
    const favs = Storage.getFavPlaces();
    el.favPlacesEmpty.hidden = favs.length > 0;
    el.favPlacesGrid.innerHTML = favs.map((p) => attractionCardHTML(p)).join('');

    $$('#fav-places-grid .attraction-card').forEach((card) => {
      const id = card.dataset.id;
      const place = favs.find((p) => p.id === id);
      card.addEventListener('click', (e) => {
        if (e.target.closest('.mini-fav')) return;
        openPlaceModal(place);
      });
      card.querySelector('.mini-fav').addEventListener('click', () => {
        Storage.removeFavPlace(id);
        renderFavPlaces();
        updateDashboard();
        // Sincronizar con la grilla principal si está visible
        const mainCard = $(`#attractions-grid .attraction-card[data-id="${id}"] .mini-fav`);
        if (mainCard) {
          mainCard.classList.remove('active');
          mainCard.querySelector('i').className = 'fa-regular fa-heart';
        }
        toast(`"${place.name}" eliminada`, 'fa-heart-crack');
      });
    });
  };

  /* ============================================================
     MÓDULO 9 — HISTORIAL DE CONSULTAS
     ============================================================ */
  const renderHistory = () => {
    const history = Storage.getHistory();
    el.historyEmpty.hidden = history.length > 0;
    el.historyList.innerHTML = history.map((h, i) => `
      <li class="history-item" data-name="${h.name}">
        ${h.flag ? `<img src="${h.flag}" alt="">` : `<span class="history-flagless"><i class="fa-solid fa-flag"></i></span>`}
        <span class="history-name">${h.name}</span>
        <span class="history-time">${h.date}<br>${h.time}</span>
        <button class="replay" title="Volver a consultar" aria-label="Volver a consultar"><i class="fa-solid fa-rotate-right"></i></button>
      </li>`).join('');

    $$('#history-list .history-item').forEach((item) => {
      const name = item.dataset.name;
      item.querySelector('.replay').addEventListener('click', () => {
        document.getElementById('search-section').scrollIntoView({ behavior: 'smooth' });
        handleSearch(name);
      });
    });
  };

  const handleClearHistory = () => {
    if (Storage.getHistory().length === 0) return;
    Storage.clearHistory();
    renderHistory();
    updateDashboard();
    toast('Historial limpiado', 'fa-broom');
  };

  /* ============================================================
     EXTRA — MAPA CON LEAFLET + OpenStreetMap
     ============================================================ */
  const renderMap = (c) => {
    if (typeof L === 'undefined' || !c.coords) return;
    const [lat, lon] = c.coords;

    if (!leafletMap) {
      leafletMap = L.map('map', { scrollWheelZoom: false }).setView([lat, lon], 5);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 18,
      }).addTo(leafletMap);
    } else {
      leafletMap.setView([lat, lon], 5);
    }
    clearMapMarkers();
    const capMarker = L.marker([lat, lon]).addTo(leafletMap);
    capMarker.bindPopup(`<strong>${c.capital}</strong><br>Capital de ${c.nameEs}`);
    mapMarkers.push(capMarker);
    setTimeout(() => leafletMap.invalidateSize(), 200);
  };

  const clearMapMarkers = () => {
    mapMarkers.forEach((m) => leafletMap.removeLayer(m));
    mapMarkers = [];
  };

  const addAttractionMarkers = (places) => {
    if (!leafletMap) return;
    places.forEach((p) => {
      if (p.lat && p.lon) {
        const m = L.marker([p.lat, p.lon]).addTo(leafletMap);
        m.bindPopup(`<strong>${p.name}</strong><br>${p.category}`);
        mapMarkers.push(m);
      }
    });
  };

  /* ============================================================
     EXTRA — GEOLOCALIZACIÓN DEL USUARIO
     ============================================================ */
  const handleGeolocation = () => {
    if (!navigator.geolocation) {
      toast('Tu navegador no soporta geolocalización', 'fa-triangle-exclamation');
      return;
    }
    showLoader();
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          // Geocodificación inversa gratuita (sin API key)
          const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=es`);
          const data = await res.json();
          hideLoader();
          if (data.countryName) {
            el.searchInput.value = data.countryName;
            handleSearch(data.countryName);
          } else {
            toast('No pudimos determinar tu país', 'fa-triangle-exclamation');
          }
        } catch (_) {
          hideLoader();
          toast('Error al obtener tu ubicación', 'fa-triangle-exclamation');
        }
      },
      () => {
        hideLoader();
        toast('Permiso de ubicación denegado', 'fa-location-dot');
      }
    );
  };

  /* ============================================================
     UI: tabs, nav, modal
     ============================================================ */
  const initTabs = () => {
    $$('.tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        $$('.tab').forEach((t) => t.classList.remove('active'));
        $$('.tab-panel').forEach((p) => p.classList.remove('active'));
        tab.classList.add('active');
        $(`#${tab.dataset.tab}`).classList.add('active');
      });
    });
  };

  const initNav = () => {
    el.burger.addEventListener('click', () => el.navLinks.classList.toggle('open'));
    $$('#nav-links a').forEach((a) =>
      a.addEventListener('click', () => el.navLinks.classList.remove('open'))
    );
  };

  const initModal = () => {
    const close = () => el.placeModal.classList.remove('active');
    el.placeModalClose.addEventListener('click', close);
    el.placeModal.addEventListener('click', (e) => {
      if (e.target === el.placeModal) close();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') close();
    });
  };

  /* ============================================================
     INICIALIZACIÓN
     ============================================================ */
  const bindEvents = () => {
    el.registerForm.addEventListener('submit', handleRegister);
    el.themeToggle.addEventListener('click', toggleTheme);
    el.searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      handleSearch(el.searchInput.value);
    });
    el.geoBtn.addEventListener('click', handleGeolocation);
    $$('#quick-suggestions .chip[data-country]').forEach((chip) =>
      chip.addEventListener('click', () => {
        el.searchInput.value = chip.dataset.country;
        handleSearch(chip.dataset.country);
      })
    );
    el.favCountryBtn.addEventListener('click', toggleFavCountry);
    el.currencyAmount.addEventListener('input', onCurrencyInput);
    el.currencyFrom.addEventListener('change', runConversion);
    el.clearHistory.addEventListener('click', handleClearHistory);
  };

  const init = () => {
    initTheme();
    bindEvents();
    initTabs();
    initNav();
    initModal();
    initRegistration();
    renderFavCountries();
    renderFavPlaces();
    renderHistory();
    updateDashboard();
  };

  return { init };
})();

document.addEventListener('DOMContentLoaded', App.init);
