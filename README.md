# 🌍 Travel Planner Pro

**Plataforma Inteligente de Planificación de Viajes**
Proyecto Final — Asignatura: *Diseño Web*

Aplicación web que centraliza, en una sola interfaz, toda la información necesaria para
planificar un viaje: datos del país, clima actual, conversión de moneda y atracciones
turísticas. Construida **100 % con tecnologías web nativas** (sin frameworks).

---

## ✨ Características principales

| Módulo | Descripción |
|--------|-------------|
| 1. Registro del viajero | Nombre, correo y país de residencia guardados en LocalStorage. Bienvenida personalizada al volver. |
| 2. Buscador de destinos | Busca cualquier país del mundo (tolerante a nombres en español). |
| 3. Información del país | Bandera, nombre, capital, región, subregión, moneda, idioma y población. |
| 4. Clima del destino | Temperatura, humedad, viento y estado del clima vía Open-Meteo. |
| 5. Conversor de moneda | Conversión en tiempo real entre COP, USD, EUR, GBP y la moneda local. |
| 6. Atracciones turísticas | Mínimo 5 lugares con imagen, nombre, categoría y descripción. |
| 7. Destinos favoritos | Guarda y elimina países favoritos (LocalStorage). |
| 8. Atracciones favoritas | Guarda y elimina atracciones favoritas (LocalStorage). |
| 9. Historial de consultas | Registro automático con fecha y hora de cada país consultado. |
| 10. Tema claro / oscuro | Preferencia persistida en LocalStorage. |
| 11. Dashboard principal | Estadísticas dinámicas del usuario. |

### 🎁 Funcionalidades extra
- 🚀 Listo para **GitHub Pages**.
- 🎬 **Animaciones CSS** (loader, transiciones, micro-interacciones).
- 📍 **Geolocalización** del usuario (botón "Mi ubicación").
- 📊 **Chart.js** para estadísticas en el dashboard.
- 🗺️ **Mapa interactivo** con Leaflet.js + OpenStreetMap.

---

## 🛠️ Tecnologías utilizadas

- **HTML5** semántico
- **CSS3** (variables, grid, flexbox, animaciones, responsive)
- **JavaScript (Vanilla)** modular
- **Fetch API** + **async / await**
- **LocalStorage**
- Librerías de apoyo (permitidas como puntos extra): Chart.js, Leaflet.js, Font Awesome.

> ❌ No se utilizan frameworks como React, Angular, Vue o Svelte.

---

## 🌐 APIs y fuentes de datos

| Fuente | Uso | Clave requerida |
|-----|-----|-----------------|
| REST Countries (dataset) | Información general del país | No |
| [Open-Meteo](https://open-meteo.com) | Clima actual por coordenadas | No |
| [Frankfurter](https://frankfurter.dev) | Conversión de monedas | No |
| [OpenTripMap](https://opentripmap.io) | Atracciones turísticas | **Sí (gratuita)** |

### ⚠️ Importante: cambio en REST Countries
La API pública **REST Countries v3.1 (gratuita y sin clave) fue dada de baja**. Sus
versiones v1–v4 ahora devuelven un error de "API deprecada" y la nueva **v5 exige
registrarse y enviar una API key**. Como el clima, la moneda, las atracciones y el mapa
dependen de los datos del país, esto hacía que la aplicación dejara de funcionar por completo.

**Solución aplicada:** el módulo `js/countries.js` ahora usa el **mismo conjunto de datos
de REST Countries** (su fuente open-source) integrado localmente en `js/countries-data.js`
(variable global `window.COUNTRIES_DB`, 250 países), y construye las banderas con el CDN
gratuito **flagcdn.com**. Así la app funciona **siempre, sin clave y aunque se abra como
archivo local** (`file://`).

> **Opcional — usar REST Countries v5 en vivo:** crea una clave gratuita en
> <https://restcountries.com/sign-up>, pégala en `CONFIG.V5_API_KEY` dentro de
> `js/countries.js` y pon `CONFIG.USE_LIVE_API = true`. Si la API falla, el sistema
> vuelve automáticamente al dataset local.

### 🔑 Configurar OpenTripMap (atracciones)
1. Regístrate gratis en <https://opentripmap.io/product>.
2. Copia tu API key.
3. Ábrela en `js/tourism.js` y reemplaza el valor de `CONFIG.API_KEY`.
> Si no agregas la clave, el resto de la app funciona igual; solo la sección de
> atracciones mostrará un aviso explicativo.

> **Nota sobre monedas:** Frankfurter usa tasas oficiales del BCE y no incluye el peso
> colombiano (COP). Cuando una moneda no está disponible, la app lo informa de forma
> amigable y sugiere usar USD, EUR o GBP.

---

## 📁 Estructura del proyecto

```
TravelPlannerPro/
├── index.html
├── css/
│   └── styles.css
├── js/
│   ├── app.js        # Orquestador principal (DOM + lógica)
│   ├── countries.js  # Datos de países (REST Countries dataset)
│   ├── countries-data.js # Dataset integrado (250 países)
│   ├── weather.js    # API Open-Meteo
│   ├── currency.js   # API Frankfurter
│   ├── tourism.js    # API OpenTripMap
│   └── storage.js    # Capa de LocalStorage
├── assets/
│   ├── images/
│   └── icons/
└── README.md
```

---

## ▶️ Cómo ejecutar

**Opción A — Abrir directamente**
Abre `index.html` en tu navegador.

**Opción B — Servidor local (recomendado)**
```bash
# Python
python -m http.server 5500
# luego abre http://localhost:5500
```
o usa la extensión **Live Server** de VS Code.

**Opción C — GitHub Pages**
1. Sube el proyecto a un repositorio público.
2. Settings → Pages → Branch: `main` / `root`.
3. Visita la URL generada.

---

## 📦 LocalStorage utilizado

| Clave | Contenido |
|-------|-----------|
| `tpp_user` | Nombre, correo y país de residencia |
| `tpp_fav_countries` | Destinos favoritos |
| `tpp_fav_places` | Atracciones favoritas |
| `tpp_history` | Historial de consultas |
| `tpp_theme` | Preferencia de tema |

---

## 👥 Integrantes
|-----------------|--------------------|
| Samuel Prada |
|-----------------|--------------------|

---

## 📄 Licencia
Proyecto académico desarrollado con fines educativos.
