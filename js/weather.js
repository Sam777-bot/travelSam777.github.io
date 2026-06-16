const Weather = (() => {
  const BASE = 'https://api.open-meteo.com/v1/forecast';

  /* Tabla oficial WMO de códigos meteorológicos -> estado + emoji */
  const WMO = {
    0:  ['Despejado', '☀️'],
    1:  ['Mayormente despejado', '🌤️'],
    2:  ['Parcialmente nublado', '⛅'],
    3:  ['Nublado', '☁️'],
    45: ['Niebla', '🌫️'],
    48: ['Niebla con escarcha', '🌫️'],
    51: ['Llovizna ligera', '🌦️'],
    53: ['Llovizna moderada', '🌦️'],
    55: ['Llovizna intensa', '🌧️'],
    56: ['Llovizna helada', '🌧️'],
    57: ['Llovizna helada intensa', '🌧️'],
    61: ['Lluvia ligera', '🌦️'],
    63: ['Lluvia moderada', '🌧️'],
    65: ['Lluvia fuerte', '🌧️'],
    66: ['Lluvia helada', '🌧️'],
    67: ['Lluvia helada fuerte', '🌧️'],
    71: ['Nevada ligera', '🌨️'],
    73: ['Nevada moderada', '🌨️'],
    75: ['Nevada intensa', '❄️'],
    77: ['Granos de nieve', '🌨️'],
    80: ['Chubascos ligeros', '🌦️'],
    81: ['Chubascos moderados', '🌧️'],
    82: ['Chubascos violentos', '⛈️'],
    85: ['Chubascos de nieve', '🌨️'],
    86: ['Chubascos de nieve fuertes', '❄️'],
    95: ['Tormenta eléctrica', '⛈️'],
    96: ['Tormenta con granizo', '⛈️'],
    99: ['Tormenta con granizo fuerte', '⛈️'],
  };

  const describe = (code) => WMO[code] || ['Condición desconocida', '🌍'];

  /* Obtiene el clima actual dadas las coordenadas [lat, lon] */
  const fetchByCoords = async ([lat, lon]) => {
    const params = new URLSearchParams({
      latitude: lat,
      longitude: lon,
      current: 'temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code',
      wind_speed_unit: 'kmh',
      timezone: 'auto',
    });
    const res = await fetch(`${BASE}?${params}`);
    if (!res.ok) throw new Error('weather-error');
    const data = await res.json();
    const c = data.current;
    const [state, emoji] = describe(c.weather_code);

    return {
      temperature: Math.round(c.temperature_2m),
      humidity: c.relative_humidity_2m,
      wind: Math.round(c.wind_speed_10m),
      code: c.weather_code,
      state,
      emoji,
      units: {
        temp: data.current_units.temperature_2m,
        wind: data.current_units.wind_speed_10m,
        humidity: data.current_units.relative_humidity_2m,
      },
    };
  };

  return { fetchByCoords };
})();
