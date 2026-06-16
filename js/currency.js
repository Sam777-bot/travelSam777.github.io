const Currency = (() => {
  const BASE = 'https://api.frankfurter.app';
  let supportedCache = null; // { CODE: 'Nombre', ... }

  /* Lista de monedas soportadas por Frankfurter (se cachea) */
  const getSupported = async () => {
    if (supportedCache) return supportedCache;
    try {
      const res = await fetch(`${BASE}/currencies`);
      if (!res.ok) throw new Error();
      supportedCache = await res.json();
    } catch (_) {
      supportedCache = {};
    }
    return supportedCache;
  };

  const isSupported = async (code) => {
    const list = await getSupported();
    return Object.prototype.hasOwnProperty.call(list, code);
  };

  /* Convierte `amount` de la moneda `from` a la moneda `to`.
     Devuelve { ok, value?, rate?, reason? } */
  const convert = async (amount, from, to) => {
    from = from.toUpperCase();
    to = to.toUpperCase();

    if (from === to) {
      return { ok: true, value: amount, rate: 1 };
    }

    const list = await getSupported();
    const fromOk = Object.prototype.hasOwnProperty.call(list, from);
    const toOk = Object.prototype.hasOwnProperty.call(list, to);

    if (!fromOk || !toOk) {
      const missing = [!fromOk ? from : null, !toOk ? to : null].filter(Boolean).join(' y ');
      return {
        ok: false,
        reason: `Frankfurter no maneja ${missing}. Prueba con USD, EUR o GBP.`,
      };
    }

    try {
      const params = new URLSearchParams({ amount, from, to });
      const res = await fetch(`${BASE}/latest?${params}`);
      if (!res.ok) throw new Error('rate-error');
      const data = await res.json();
      const value = data.rates[to];
      return { ok: true, value, rate: value / amount, date: data.date };
    } catch (_) {
      return { ok: false, reason: 'No se pudo obtener la tasa de cambio. Intenta más tarde.' };
    }
  };

  /* Da formato a un número como moneda */
  const format = (value, code) => {
    try {
      return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: code,
        maximumFractionDigits: 2,
      }).format(value);
    } catch (_) {
      // Si el código no es ISO válido, formato simple
      return `${value.toLocaleString('es-CO', { maximumFractionDigits: 2 })} ${code}`;
    }
  };

  return { convert, isSupported, getSupported, format };
})();
