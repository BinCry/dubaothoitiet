/* =========================================================
   Smart Weather Assistant • app.js
   (c) 2025 Copyright by Minh Quân
   ========================================================= */

/* =======================
   0) CONFIG & CONSTANTS
   ======================= */
const API_KEY = '31bb9df826339f11169d386a48fd3698'; // <-- ĐIỀN API KEY OPENWEATHER
const OWM_FORECAST = 'https://api.openweathermap.org/data/2.5/forecast';
const OWM_AIR = 'https://api.openweathermap.org/data/2.5/air_pollution';
const OPEN_METEO_UV = 'https://api.open-meteo.com/v1/forecast'; // free, no key, CORS OK
const DEFAULT_CITY = 'Ho Chi Minh';

const REGIONS = {
  north: [
    'Hà Nội','Ha Noi','Hanoi','Hải Phòng','Hai Phong','Quảng Ninh','Quang Ninh','Lạng Sơn','Lang Son','Lào Cai','Lao Cai','Điện Biên',
    'Dien Bien','Yên Bái','Yen Bai','Sơn La','Son La','Hòa Bình','Hoa Binh','Phú Thọ','Phu Tho','Thái Nguyên','Thai Nguyen',
    'Bắc Giang','Bac Giang','Bắc Ninh','Bac Ninh','Vĩnh Phúc','Vinh Phuc','Ninh Bình','Ninh Binh','Nam Định','Nam Dinh','Thái Bình','Thai Binh'
  ],
  central: [
    'Thanh Hóa','Thanh Hoa','Nghệ An','Nghe An','Hà Tĩnh','Ha Tinh','Quảng Bình','Quang Binh','Quảng Trị','Quang Tri','Thừa Thiên Huế','Hue',
    'Đà Nẵng','Da Nang','Quảng Nam','Quang Nam','Quảng Ngãi','Quang Ngai','Bình Định','Binh Dinh','Phú Yên','Phu Yen','Khánh Hòa','Khanh Hoa',
    'Ninh Thuận','Ninh Thuan','Bình Thuận','Binh Thuan','Kon Tum','Gia Lai','Đắk Lắk','Dak Lak','Đắk Nông','Dak Nong','Lâm Đồng','Lam Dong'
  ],
  south: [
    'TP.HCM','Ho Chi Minh','Hồ Chí Minh','Can Tho','Cần Thơ','Bình Dương','Binh Duong','Đồng Nai','Dong Nai','Bà Rịa','Vũng Tàu','Ba Ria','Vung Tau',
    'Long An','Tiền Giang','Tien Giang','Bến Tre','Ben Tre','Trà Vinh','Tra Vinh','Vĩnh Long','Vinh Long','Hậu Giang','Hau Giang',
    'Sóc Trăng','Soc Trang','Bạc Liêu','Bac Lieu','Cà Mau','Ca Mau','Tây Ninh','Tay Ninh','Bình Phước','Binh Phuoc','Kiên Giang','Kien Giang',
  ],
  sea: ['Biển Đông','Bien Dong','Trường Sa','Hoàng Sa','bao','bão','áp thấp','ap thap','gió mạnh','gio manh','lốc xoáy','loc xoay','sóng lớn','song lon','cảnh báo','canh bao']
};

const NEWS_FEEDS = [
  'https://vnexpress.net/rss/tin-moi-nhat.rss',
  'https://thanhnien.vn/rss/home.rss',
  'https://tuoitre.vn/rss/tin-moi-nhat.rss',
  'https://zingnews.vn/rss/xa-hoi.xml'
];

const ALLORIGINS = (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
const JINA_PROXY = (url) => `https://r.jina.ai/http://r.jina.ai/http://r.jina.ai/http://r.jina.ai/${url}`; // trick double pass (fallback)

/* Unit & Format helpers */
const UNIT = {
  metric: { q: 'metric', t: '°C', speed: 'km/h', toSpeed: v => Math.round(v * 3.6) }, // OWM trả m/s
  imperial:{ q: 'imperial', t: '°F', speed: 'mph', toSpeed: v => Math.round(v) }      // OWM trả mph
};

const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

/* =======================
   1) STATE
   ======================= */
const state = {
  unit: localStorage.getItem('unit') || 'metric',
  theme: localStorage.getItem('theme') || 'blue',
  lastCity: localStorage.getItem('lastCity') || DEFAULT_CITY,
  favorites: JSON.parse(localStorage.getItem('favorites') || '[]'),
  history: JSON.parse(localStorage.getItem('history') || '[]'),
  forecast: null,    // dữ liệu forecast OWM
  aqi: null,         // dữ liệu AQI OWM
  uv: null,          // dữ liệu UV Open-Meteo
  charts: { temp:null, humid:null, rain:null, uv:null },
  range: '24h',      // 24h | 48h | 7d
};

/* =======================
   2) DOM HOOKS
   ======================= */
const el = {
  // search
  cityInput:      $('#cityInput'),
  searchBtn:      $('#searchBtn'),
  locationBtn:    $('#locationBtn'),
  cityInputMobile:$('#cityInputMobile'),
  searchBtnMobile:$('#searchBtnMobile'),
  locationBtnMobile:$('#locationBtnMobile'),
  // drawer
  mobileMenuToggle: $('#mobileMenuToggle'),
  drawer:           $('#mobileDrawer'),
  drawerClose:      $('#drawerClose'),
  drawerCityInput:  $('#drawerCityInput'),
  drawerSearchBtn:  $('#drawerSearchBtn'),
  drawerLocationBtn:$('#drawerLocationBtn'),
  drawerTabs:       $$('.drawer-tab'),
  drawerFavorites:  $('#drawerFavorites'),
  // tabs
  tabBtns:          $$('.tab-btn'),
  panels:           $$('.tab-panel'),
  // current
  currentCity:      $('#currentCity'),
  currentDateTime:  $('#currentDateTime'),
  currentDesc:      $('#currentDescription'),
  currentTemp:      $('#currentTemp'),
  feelsLike:        $('#feelsLike'),
  currentHumidity:  $('#currentHumidity'),
  visibility:       $('#visibility'),
  currentWind:      $('#currentWind'),
  windGust:         $('#windGust'),
  pressure:         $('#pressure'),
  seaLevel:         $('#seaLevel'),
  pop:              $('#pop'),
  rain1h:           $('#rain1h'),
  rain3h:           $('#rain3h'),
  rain24h:          $('#rain24h'),
  uvIndex:          $('#uvIndex'),
  uvLabel:          $('#uvLabel'),
  aqiValue:         $('#aqiValue'),
  aqiLabel:         $('#aqiLabel'),
  sunrise:          $('#sunrise'),
  sunset:           $('#sunset'),
  dayLength:        $('#dayLength'),
  flags:            $('#currentFlags'),
  adviceList:       $('#adviceList'),
  favoritesRow:     $('#favoritesRow'),
  // forecast
  segRange:         $$('#tab-forecast .segmented [data-range]'),
  segUnit:          $$('#tab-forecast .segmented [data-unit]'),
  hourlyGrid:       $('#hourlyForecast'),
  dailyList:        $('#dailyForecast'),
  tempChart:        $('#tempChart'),
  humidityChart:    $('#humidityChart'),
  rainChart:        $('#rainChart'),
  uvChart:          $('#uvChart'),
  // news
  newsUpdatedAt:    $('#newsUpdatedAt'),
  newsRefreshBtn:   $('#newsRefreshBtn'),
  newsNorth:        $('#newsNorth'),
  newsCentral:      $('#newsCentral'),
  newsSouth:        $('#newsSouth'),
  newsSea:          $('#newsSea'),
  newsWorld:        $('#newsWorld'),
  // astronomy
  astroDate:        $('#astroDate'),
  moonPhase:        $('#moonPhase'),
  moonIllum:        $('#moonIllumination'),
  zodiac:           $('#zodiacSign'),
  zodiacRange:      $('#zodiacDateRange'),
  julian:           $('#julianDate'),
  astroDayLength:   $('#astroDayLength'),
  newMoon:          $('#newMoon'),
  fullMoon:         $('#fullMoon'),
  moonTilt:         $('#moonTilt'),
  solarTerm:        $('#solarTerm'),
  // settings
  unitBtns:         $$('.unit-btn'),
  themeBtns:        $$('.theme-btn'),
  savedCities:      $('#savedCities'),
  searchHistory:    $('#searchHistory'),
  clearFav:         $('#clearFavoritesBtn'),
  clearHist:        $('#clearHistoryBtn'),
  // misc
  saveCityBtn:      $('#saveCityBtn'),
  refreshBtn:       $('#refreshBtn'),
  darkToggle:       $('#darkModeToggle'),
  quickFavorites:   $('#quickFavorites'),
  alertBanner:      $('#alertBanner'),
};

/* =======================
   3) UTILITIES
   ======================= */
function toast(msg){
  const box = document.createElement('div');
  box.textContent = msg;
  box.style.cssText = `
    position:fixed; left:50%; top:16px; transform:translateX(-50%);
    background:rgba(0,0,0,.75); color:#fff; padding:10px 14px; border-radius:12px;
    z-index:9999; opacity:0; transition:.2s ease; box-shadow:0 10px 30px rgba(0,0,0,.35);
  `;
  document.body.appendChild(box);
  requestAnimationFrame(()=> box.style.opacity = 1);
  setTimeout(()=>{
    box.style.opacity = 0;
    box.addEventListener('transitionend', ()=> box.remove());
  }, 2200);
}

function fmtTemp(v){ return `${Math.round(v)}${UNIT[state.unit].t}`; }
function fmtPercent(p){ return `${Math.round(p*100)}%`; }
function fmtKm(v){ return `${Math.round(v/1000)} km`; }
function fmtTime(ts, tzOffsetSec){
  const dt = new Date((ts + (tzOffsetSec || 0)) * 1000);
  const hh = dt.getUTCHours().toString().padStart(2,'0');
  const mm = dt.getUTCMinutes().toString().padStart(2,'0');
  return `${hh}:${mm}`;
}
function localNowString(tzOffsetSec){
  const now = new Date(Date.now());
  const utc = now.getTime() + now.getTimezoneOffset()*60000;
  const local = new Date(utc + (tzOffsetSec || 0)*1000);
  return local.toLocaleString('vi-VN', { hour12:false });
}
function clamp(n,min,max){ return Math.max(min, Math.min(max, n)); }
function sum(arr){ return arr.reduce((a,b)=>a+b,0); }
function groupByDate(list, tzOffsetSec){
  const map = new Map();
  for(const it of list){
    const d = new Date((it.dt + (tzOffsetSec||0)) * 1000);
    const key = `${d.getUTCFullYear()}-${(d.getUTCMonth()+1).toString().padStart(2,'0')}-${d.getUTCDate().toString().padStart(2,'0')}`;
    if(!map.has(key)) map.set(key, []);
    map.get(key).push(it);
  }
  return map;
}

function setActive(segButtons, value, attr){
  segButtons.forEach(b=>{
    b.classList.toggle('is-active', b.dataset[attr] === value);
  });
}

function setTheme(theme){
  document.body.dataset.theme = theme;
  localStorage.setItem('theme', theme);
  state.theme = theme;
  // Khi đổi theme -> chart cần cập nhật màu + kích thước
  safeResizeCharts();
}

function toggleDarkQuick(){
  const t = document.body.dataset.theme;
  if(t !== 'dark'){ setTheme('dark'); }
  else{ setTheme(localStorage.getItem('lastLightTheme') || 'blue'); }
}

/* =======================
   4) API FETCHERS
   ======================= */
async function fetchForecastByCity(city){
  const url = `${OWM_FORECAST}?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=${UNIT[state.unit].q}&lang=vi`;
  const res = await fetch(url);
  if(!res.ok) throw new Error('Không tìm thấy thành phố hoặc lỗi mạng.');
  return res.json();
}
async function fetchForecastByGeo(lat, lon){
  const url = `${OWM_FORECAST}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=${UNIT[state.unit].q}&lang=vi`;
  const res = await fetch(url);
  if(!res.ok) throw new Error('Không lấy được dự báo theo vị trí.');
  return res.json();
}
async function fetchAQI(lat, lon){
  const url = `${OWM_AIR}?lat=${lat}&lon=${lon}&appid=${API_KEY}`;
  const res = await fetch(url);
  if(!res.ok) throw new Error('Không lấy được AQI.');
  return res.json();
}
async function fetchUV(lat, lon, tzStr='auto'){
  const url = `${OPEN_METEO_UV}?latitude=${lat}&longitude=${lon}&hourly=uv_index&timezone=${encodeURIComponent(tzStr)}&forecast_days=2`;
  const res = await fetch(url);
  if(!res.ok) throw new Error('Không lấy được UV.');
  return res.json();
}

/* =======================
   5) CORE LOAD & RENDER
   ======================= */
async function loadWeatherByCity(city){
  try{
    showSkeleton(true);
    const forecast = await fetchForecastByCity(city);
    const { lat, lon } = forecast.city.coord;
    const aqi = await fetchAQI(lat, lon).catch(()=>null);
    const uv  = await fetchUV(lat, lon).catch(()=>null);

    state.forecast = forecast;
    state.aqi = aqi;
    state.uv = uv;
    state.lastCity = forecast.city.name;
    localStorage.setItem('lastCity', state.lastCity);
    recordHistory(state.lastCity);

    renderAll();
  }catch(e){
    console.error(e);
    toast(e.message || 'Lỗi tải dữ liệu.');
  }finally{
    showSkeleton(false);
  }
}
async function loadWeatherByGeo(){
  if(!navigator.geolocation){ toast('Trình duyệt không hỗ trợ định vị.'); return; }
  navigator.geolocation.getCurrentPosition(async pos=>{
    try{
      showSkeleton(true);
      const { latitude:lat, longitude:lon } = pos.coords;
      const forecast = await fetchForecastByGeo(lat,lon);
      const aqi = await fetchAQI(lat, lon).catch(()=>null);
      const uv  = await fetchUV(lat, lon).catch(()=>null);

      state.forecast = forecast;
      state.aqi = aqi;
      state.uv = uv;
      state.lastCity = forecast.city.name;
      localStorage.setItem('lastCity', state.lastCity);
      recordHistory(state.lastCity);

      renderAll();
    }catch(e){
      console.error(e); toast('Không thể lấy dữ liệu theo vị trí.');
    }finally{ showSkeleton(false); }
  }, err=>{
    toast('Bạn đã từ chối truy cập vị trí.');
  }, { enableHighAccuracy:true, timeout: 10000 });
}

function renderAll(){
  if(!state.forecast) return;
  const fc = state.forecast;
  const tz = fc.city.timezone || 0;

  // cập nhật top hero
  el.currentCity.textContent = `${fc.city.name}, ${fc.city.country}`;
  el.currentDesc.textContent = (fc.list[0]?.weather?.[0]?.description || '--')
    .replace(/^./, c=>c.toUpperCase());

  // current: lấy item gần hiện tại nhất
  const now = Math.floor(Date.now()/1000);
  const nearest = fc.list.reduce((best, it)=>{
    return Math.abs(it.dt - now) < Math.abs(best.dt - now) ? it : best;
  }, fc.list[0]);

  // metrics
  const temp = nearest.main.temp;
  el.currentTemp.textContent = fmtTemp(temp);
  el.feelsLike.textContent   = fmtTemp(nearest.main.feels_like);
  el.currentHumidity.textContent = `${nearest.main.humidity}%`;
  el.visibility.textContent  = nearest.visibility!=null ? fmtKm(nearest.visibility) : '--';
  const windSpeedDisplay = UNIT[state.unit].toSpeed(nearest.wind.speed);
  el.currentWind.textContent = `${windSpeedDisplay} ${UNIT[state.unit].speed}`;
  el.windGust.textContent    = nearest.wind.gust ? `${UNIT[state.unit].toSpeed(nearest.wind.gust)} ${UNIT[state.unit].speed}` : '—';
  el.pressure.textContent    = `${nearest.main.pressure} hPa`;
  el.seaLevel.textContent    = nearest.main.sea_level ? `${nearest.main.sea_level} hPa` : '—';

  // rain
  const pop = nearest.pop || 0;
  el.pop.textContent = fmtPercent(pop);
  el.rain1h.textContent = nearest.rain?.['1h'] ? `${nearest.rain['1h']} mm` : '—';
  el.rain3h.textContent = nearest.rain?.['3h'] ? `${nearest.rain['3h']} mm` : '—';
  const next8 = fc.list.slice(0,8);
  const rain24 = sum(next8.map(i=> (i.rain?.['3h'] || 0)));
  el.rain24h.textContent = rain24 ? `${rain24.toFixed(1)} mm` : '—';

  // sun
  el.sunrise.textContent  = fmtTime(fc.city.sunrise, tz);
  el.sunset.textContent   = fmtTime(fc.city.sunset, tz);
  const dayLenSec = (fc.city.sunset - fc.city.sunrise);
  const h = Math.floor(dayLenSec/3600), m = Math.round((dayLenSec%3600)/60);
  el.dayLength.textContent = `${h}g ${m}p`;

  // uv & aqi
  renderUVAndAQI();

  // flags & outfit suggestions
  renderFlags(nearest);
  renderOutfit(nearest);

  // favorites row
  renderFavoritesChips();

  // forecast tab
  renderHourly(fc);
  renderDaily(fc);

  // charts
  renderCharts(fc);

  // astronomy
  renderAstronomy(fc);

  // alert banner
  renderAlerts(nearest);

  // time ticker
  startClock(tz);
}

/* =======================
   6) UV & AQI
   ======================= */
function renderUVAndAQI(){
  if(state.aqi?.list?.[0]){
    const a = state.aqi.list[0].main.aqi;
    const map = {1:'Tốt',2:'Khá',3:'Trung bình',4:'Kém',5:'Rất kém'};
    el.aqiValue.textContent = a;
    el.aqiLabel.textContent = map[a] || '--';
    el.aqiLabel.className = 'tag ' + (a<=2 ? 'ok' : a===3 ? 'warn' : 'danger');
  }else{
    el.aqiValue.textContent = '—';
    el.aqiLabel.textContent = '—';
    el.aqiLabel.className = 'tag';
  }

  const uv = state.uv;
  if(uv?.hourly?.time && uv.hourly.uv_index){
    const nowISO = new Date().toISOString().slice(0,13); // yyyy-mm-ddThh
    let idx = uv.hourly.time.findIndex(t => t.startsWith(nowISO));
    if(idx < 0) idx = 0;
    const uvNow = uv.hourly.uv_index[idx] ?? null;

    if(uvNow!=null){
      el.uvIndex.textContent = uvNow.toFixed(1);
      const {label, cls} = uvLabel(uvNow);
      el.uvLabel.textContent = label;
      el.uvLabel.className = 'tag ' + cls;
    }else{
      el.uvIndex.textContent = '—';
      el.uvLabel.textContent = '—';
      el.uvLabel.className = 'tag';
    }
  }else{
    el.uvIndex.textContent = '—';
    el.uvLabel.textContent = '—';
    el.uvLabel.className = 'tag';
  }
}
function uvLabel(u){
  if(u<3)   return {label:'Thấp', cls:'ok'};
  if(u<6)   return {label:'Trung bình', cls:'warn'};
  if(u<8)   return {label:'Cao', cls:'warn'};
  if(u<11)  return {label:'Rất cao', cls:'danger'};
  return       {label:'Cực đoan', cls:'danger'};
}

/* =======================
   7) FLAGS & OUTFIT
   ======================= */
function renderFlags(nearest){
  el.flags.innerHTML = '';
  const list = [];
  const temp = nearest.main.temp;
  const pop  = nearest.pop || 0;
  const wind = UNIT[state.unit].toSpeed(nearest.wind.speed);
  const uvText = parseFloat(el.uvIndex.textContent) || 0;

  if(temp >= 35 || (state.unit==='imperial' && temp>=95)) list.push({t:'Nóng bức', cls:'warn'});
  if(pop >= 0.6) list.push({t:'Mưa lớn', cls:'warn'});
  if((nearest.wind.gust && UNIT[state.unit].toSpeed(nearest.wind.gust) >= 50) || wind >= 40) list.push({t:'Gió mạnh', cls:'danger'});
  if(uvText >= 8) list.push({t:'UV cao', cls:'danger'});

  if(list.length===0) list.push({t:'Ổn định', cls:'ok'});
  for(const f of list){
    const li = document.createElement('li');
    li.className = 'tag '+f.cls;
    li.textContent = f.t;
    el.flags.appendChild(li);
  }
}

function renderOutfit(nearest){
  const L = el.adviceList;
  L.innerHTML = '';
  const adv = [];
  const temp = nearest.main.temp;
  const hum  = nearest.main.humidity || 0;
  const pop  = nearest.pop || 0;
  const wind = UNIT[state.unit].toSpeed(nearest.wind.speed);
  const uvV  = parseFloat(el.uvIndex.textContent) || 0;
  const rain3h = nearest.rain?.['3h'] || 0;

  if(temp >= 33) adv.push('Áo thun mỏng, quần short; uống nhiều nước.');
  else if(temp >= 27) adv.push('Trang phục thoáng; áo khoác mỏng khi tối.');
  else if(temp >= 20) adv.push('Áo dài tay/áo khoác mỏng khi ra ngoài.');
  else adv.push('Áo ấm/áo len, giữ ấm khi đi tối/sáng sớm.');

  if(pop >= 0.3 || rain3h>0){ adv.push('Mang áo mưa mỏng/ô (dù); giày chống thấm.'); }
  if(wind >= 30){ adv.push('Áo khoác chắn gió; hạn chế dùng ô khi gió mạnh.'); }
  if(hum >= 85 && temp >= 28){ adv.push('Chọn vải thấm hút mồ hôi, tránh chất liệu dày.'); }
  if(uvV >= 6){ adv.push('Bôi kem chống nắng, mũ rộng vành, kính râm.'); }

  const uniq = [...new Set(adv)].slice(0,6);
  uniq.forEach(t=>{
    const li = document.createElement('li'); li.textContent = t; L.appendChild(li);
  });
}

/* =======================
   8) HOURLY / DAILY
   ======================= */
function renderHourly(fc){
  const tz = fc.city.timezone || 0;
  el.hourlyGrid.innerHTML = '';

  const count = state.range === '48h' ? 16 : 8; // 16 ô cho 48h, 8 ô cho 24h (7d vẫn giữ 24h để tránh quá dài)
  const list = fc.list.slice(0, count);
  for(const it of list){
    const d = new Date((it.dt + tz) * 1000);
    const hh = d.getUTCHours().toString().padStart(2,'0') + ':00';
    const temp = fmtTemp(it.main.temp);
    const rain = (it.rain?.['3h'] || 0).toFixed(1);
    const wind = UNIT[state.unit].toSpeed(it.wind.speed);
    const pop  = Math.round((it.pop || 0)*100);

    const div = document.createElement('div');
    div.className = 'hour-item';
    div.innerHTML = `
      <div class="h-time">${hh}</div>
      <div class="h-temp">${temp}</div>
      <div class="h-mini"><span>POP</span><strong>${pop}%</strong></div>
      <div class="h-mini"><span>Mưa</span><strong>${rain} mm</strong></div>
      <div class="h-mini"><span>Gió</span><strong>${wind} ${UNIT[state.unit].speed}</strong></div>
    `;
    el.hourlyGrid.appendChild(div);
  }
}

function renderDaily(fc){
  const tz = fc.city.timezone || 0;
  el.dailyList.innerHTML = '';
  const grouped = groupByDate(fc.list, tz);
  const days = Array.from(grouped.keys()).sort();

  const take = days.slice(0,7);
  for(const key of take){
    const arr = grouped.get(key);
    const temps = arr.map(i=>i.main.temp);
    const min = Math.min(...temps), max = Math.max(...temps);
    const pops = arr.map(i=>i.pop || 0);
    const pop = Math.round(Math.max(...pops)*100);
    const desc = (arr[2]?.weather?.[0]?.description || arr[0]?.weather?.[0]?.description || '--')
      .replace(/^./, c=>c.toUpperCase());

    const dateObj = new Date(key+'T00:00:00Z');
    const dayName = dateObj.toLocaleDateString('vi-VN', { weekday:'long' });

    const item = document.createElement('div');
    item.className = 'day-item';
    item.innerHTML = `
      <div class="day-name">${dayName}</div>
      <div class="day-range">${fmtTemp(min)} – ${fmtTemp(max)}</div>
      <div class="day-extra"><span>POP: ${pop}%</span><span>${desc}</span></div>
    `;
    el.dailyList.appendChild(item);
  }
}

/* =======================
   9) CHARTS (anti-overflow)
   ======================= */
function destroyChart(ref){ if(ref && typeof ref.destroy==='function') ref.destroy(); }

/** Lấy màu lưới & chữ hiện tại từ CSS variables */
function readChartColors(){
  const grid = getComputedStyle(document.documentElement).getPropertyValue('--chart-grid').trim() || 'rgba(255,255,255,.15)';
  const text = getComputedStyle(document.documentElement).getPropertyValue('--chart-text').trim() || '#eaf0ff';
  return { grid, text };
}

/** Tạo options chung cho tất cả biểu đồ để chống tràn */
function baseChartOptions(){
  const { grid, text } = readChartColors();
  return {
    responsive:true,
    maintainAspectRatio:false,
    layout:{ padding:{ top:10, right:10, bottom:10, left:10 } },
    scales:{
      x:{
        grid:{ color:grid },
        ticks:{ color:text, maxRotation:0, autoSkip:true }
      },
      y:{
        grid:{ color:grid },
        ticks:{ color:text }
      }
    },
    plugins:{
      legend:{ labels:{ color:text }},
      tooltip:{ mode:'index', intersect:false }
    },
    animation:{ duration:250 }
  };
}

/** Vẽ lại toàn bộ biểu đồ */
function renderCharts(fc){
  const tz = fc.city.timezone || 0;

  const labels24 = fc.list.slice(0,8).map(i=>{
    const d = new Date((i.dt + tz)*1000);
    return d.getUTCHours().toString().padStart(2,'0')+':00';
  });
  const temps24 = fc.list.slice(0,8).map(i=> i.main.temp);
  const hums24  = fc.list.slice(0,8).map(i=> i.main.humidity);
  const rains24 = fc.list.slice(0,8).map(i=> i.rain?.['3h'] || 0);

  // UV chart dữ liệu 24h tới
  let uvLabels = [], uvData = [];
  if(state.uv?.hourly?.time && state.uv?.hourly?.uv_index){
    uvLabels = state.uv.hourly.time.slice(0,24).map(t=> t.slice(11,16)); // "HH:MM"
    uvData   = state.uv.hourly.uv_index.slice(0,24);
  }else{
    uvLabels = labels24;
    uvData   = Array(labels24.length).fill(null);
  }

  // Destroy trước khi vẽ
  destroyChart(state.charts.temp);
  destroyChart(state.charts.humid);
  destroyChart(state.charts.rain);
  destroyChart(state.charts.uv);

  const opts = baseChartOptions();

  // Temp
  state.charts.temp = new Chart(el.tempChart.getContext('2d'), {
    type:'line',
    data:{ labels:labels24, datasets:[{ label:`Nhiệt độ (${UNIT[state.unit].t})`, data: temps24, borderWidth:2, fill:true }]},
    options: opts
  });

  // Humidity
  state.charts.humid = new Chart(el.humidityChart.getContext('2d'), {
    type:'line',
    data:{ labels:labels24, datasets:[{ label:'Độ ẩm (%)', data: hums24, borderWidth:2, fill:true }]},
    options: { ...opts, scales:{ ...opts.scales, y:{ ...opts.scales.y, min:0, max:100 }} }
  });

  // Rain
  state.charts.rain = new Chart(el.rainChart.getContext('2d'), {
    type:'bar',
    data:{ labels:labels24, datasets:[{ label:'Mưa (mm / 3h)', data: rains24, borderWidth:1 }]},
    options: { ...opts, scales:{ ...opts.scales, y:{ ...opts.scales.y, beginAtZero:true }} }
  });

  // UV
  state.charts.uv = new Chart(el.uvChart.getContext('2d'), {
    type:'line',
    data:{ labels: uvLabels, datasets:[{ label:'UV Index', data: uvData, borderWidth:2, fill:false }]},
    options:{ ...opts, scales:{ ...opts.scales, y:{ ...opts.scales.y, min:0, max:12 }} }
  });

  // Bảo đảm sau khi vẽ xong, nếu card đổi kích thước (responsive), ta trigger resize
  safeResizeCharts();
}

/** Gọi update/resize an toàn cho mọi chart đang có */
function safeResizeCharts(){
  const charts = [state.charts.temp, state.charts.humid, state.charts.rain, state.charts.uv];
  charts.forEach(c => { try { c && c.resize(); c && c.update('none'); } catch(_){} });
}

/* =======================
   10) ASTRONOMY (approx)
   ======================= */
function julianDate(d=new Date()){
  return (d/86400000) + 2440587.5;
}
function moonInfo(d=new Date()){
  const j = julianDate(d);
  const synodic = 29.53058867;
  const daysSince = j - 2451550.1;
  const age = ((daysSince % synodic) + synodic) % synodic;
  const phase = age / synodic;
  const illum = (1 - Math.cos(2*Math.PI*phase)) / 2; // 0..1
  let name = '';
  if(phase < 0.03 || phase > 0.97) name = 'Trăng non';
  else if(phase < 0.22) name = 'Lưỡi liềm đầu tháng';
  else if(phase < 0.28) name = 'Trăng bán nguyệt đầu';
  else if(phase < 0.47) name = 'Trăng khuyết đầu';
  else if(phase < 0.53) name = 'Trăng tròn';
  else if(phase < 0.72) name = 'Trăng khuyết cuối';
  else if(phase < 0.78) name = 'Trăng bán nguyệt cuối';
  else name = 'Lưỡi liềm cuối tháng';

  const daysToNew = synodic - age;
  const nextNew = new Date(d.getTime() + daysToNew*86400000);
  const distToFull = (0.5 - phase + 1) % 1 * synodic;
  const nextFull = new Date(d.getTime() + distToFull*86400000);

  return { age, phase, illum, name, nextNew, nextFull };
}
function zodiacByDate(d=new Date()){
  const z = [
    ['Ma Kết',   '12-22','01-19'],
    ['Bảo Bình', '01-20','02-18'],
    ['Song Ngư', '02-19','03-20'],
    ['Bạch Dương','03-21','04-19'],
    ['Kim Ngưu', '04-20','05-20'],
    ['Song Tử',  '05-21','06-20'],
    ['Cự Giải',  '06-21','07-22'],
    ['Sư Tử',    '07-23','08-22'],
    ['Xử Nữ',    '08-23','09-22'],
    ['Thiên Bình','09-23','10-22'],
    ['Bọ Cạp',   '10-23','11-21'],
    ['Nhân Mã',  '11-22','12-21'],
  ];
  const mm = d.getMonth()+1, dd = d.getDate();
  const md = (m,d)=> m*100 + d;
  const val = md(mm,dd);
  for(const [name, s, e] of z){
    const [sm,sd] = s.split('-').map(n=>+n);
    const [em,ed] = e.split('-').map(n=>+n);
    if(sm <= em){
      if(val >= md(sm,sd) && val <= md(em,ed)) return { name, range: `${s} → ${e}` };
    }else{
      if(val >= md(sm,sd) || val <= md(em,ed)) return { name, range: `${s} → ${e}` };
    }
  }
  return { name:'—', range:'—' };
}
function currentSolarTerm(d=new Date()){
  const TERMS = [
    [  5,'Tiểu hàn'],[ 20,'Đại hàn'],[  4,'Lập xuân'],[ 19,'Vũ thủy'],
    [  6,'Kinh trập'],[ 21,'Xuân phân'],[  5,'Thanh minh'],[ 20,'Cốc vũ'],
    [  6,'Lập hạ'],[ 21,'Tiểu mãn'],[  6,'Mang chủng'],[ 21,'Hạ chí'],
    [  7,'Tiểu thử'],[ 23,'Đại thử'],[  8,'Lập thu'],[ 23,'Xử thử'],
    [  8,'Bạch lộ'],[ 23,'Thu phân'],[  8,'Hàn lộ'],[ 24,'Sương giáng'],
    [  8,'Lập đông'],[ 22,'Tiểu tuyết'],[  7,'Đại tuyết'],[ 22,'Đông chí'],
  ];
  const dayOfYear = Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(d.getFullYear(),0,0))/86400000);
  const idx = Math.floor(((dayOfYear+10) % 365)/15.2) % 24;
  return TERMS[idx]?.[1] || '—';
}
function renderAstronomy(fc){
  const d = new Date();
  el.astroDate.textContent = 'Ngày: ' + d.toLocaleDateString('vi-VN');
  el.julian.textContent = julianDate(d).toFixed(2);

  const m = moonInfo(d);
  el.moonPhase.textContent = `${m.name} (tuổi trăng ~ ${m.age.toFixed(1)} ngày)`;
  el.moonIllum.textContent = `Độ chiếu sáng: ${(m.illum*100).toFixed(0)}%`;
  el.newMoon.textContent = m.nextNew.toLocaleString('vi-VN', { hour12:false });
  el.fullMoon.textContent = m.nextFull.toLocaleString('vi-VN', { hour12:false });

  const z = zodiacByDate(d);
  el.zodiac.textContent = z.name;
  el.zodiacRange.textContent = z.range;

  el.astroDayLength.textContent = el.dayLength.textContent || '—';
  el.moonTilt.textContent = '≈ 5.1°';
  el.solarTerm.textContent = currentSolarTerm(d);
}

/* =======================
   11) NEWS (RSS via proxy)
   ======================= */
async function fetchRSS(url){
  let res = await fetch(ALLORIGINS(url)).catch(()=>null);
  if(!res || !res.ok){
    res = await fetch(ALLORIGINS(JINA_PROXY(url))).catch(()=>null);
  }
  if(!res || !res.ok) throw new Error('RSS lỗi');
  const txt = await res.text();
  const xml = (new window.DOMParser()).parseFromString(txt, 'text/xml');
  return Array.from(xml.querySelectorAll('item')).map(it=>{
    return {
      title: it.querySelector('title')?.textContent?.trim() || '',
      link: it.querySelector('link')?.textContent?.trim() || '#',
      pubDate: new Date(it.querySelector('pubDate')?.textContent || Date.now()),
      desc: it.querySelector('description')?.textContent || ''
    };
  });
}
function classifyNews(item){
  const t = (item.title + ' ' + item.desc).toLowerCase();
  const weatherKeywords = ['thời tiết','thoi tiet','mưa','bao','bão','áp thấp','ap thap','gió mùa','gio mua','nắng nóng','nong','lũ','lu','ngập','ngap','sạt lở','sat lo','nhiệt độ','nhiet do','không khí lạnh','khong khi lanh','giông','sấm sét','loc xoay','lốc xoáy','bão số'];
  if(!weatherKeywords.some(k => t.includes(k))) return 'world';

  const titleAll = item.title;
  for(const k of REGIONS.north){ if(titleAll.includes(k)) return 'north'; }
  for(const k of REGIONS.central){ if(titleAll.includes(k)) return 'central'; }
  for(const k of REGIONS.south){ if(titleAll.includes(k)) return 'south'; }
  for(const k of REGIONS.sea){ if(t.includes(k.toLowerCase())) return 'sea'; }
  return 'world';
}
function renderNewsBuckets(buckets){
  const tpl = (it)=> {
    const li = document.createElement('li');
    li.className = 'news-item';
    li.innerHTML = `
      <div class="title"><a href="${it.link}" target="_blank" rel="noopener noreferrer">${it.title}</a></div>
      <div class="meta">${it.pubDate.toLocaleString('vi-VN', { hour12:false })}</div>
    `;
    return li;
  };
  el.newsNorth.innerHTML = ''; el.newsCentral.innerHTML=''; el.newsSouth.innerHTML=''; el.newsSea.innerHTML=''; el.newsWorld.innerHTML='';

  buckets.north.slice(0,6).forEach(i=> el.newsNorth.appendChild(tpl(i)));
  buckets.central.slice(0,6).forEach(i=> el.newsCentral.appendChild(tpl(i)));
  buckets.south.slice(0,6).forEach(i=> el.newsSouth.appendChild(tpl(i)));
  buckets.sea.slice(0,6).forEach(i=> el.newsSea.appendChild(tpl(i)));
  buckets.world.slice(0,6).forEach(i=> el.newsWorld.appendChild(tpl(i)));

  el.newsUpdatedAt.textContent = 'Cập nhật: ' + new Date().toLocaleString('vi-VN', { hour12:false });
}
async function loadNews(){
  try{
    const all = [];
    for(const feed of NEWS_FEEDS){
      const items = await fetchRSS(feed).catch(()=>[]);
      all.push(...items);
    }
    all.sort((a,b)=> b.pubDate - a.pubDate);
    const buckets = { north:[], central:[], south:[], sea:[], world:[] };
    for(const it of all){
      buckets[classifyNews(it)].push(it);
    }
    renderNewsBuckets(buckets);
  }catch(e){
    console.error(e);
    const mk = (elList)=>{ elList.innerHTML = `<li class="news-item"><div class="title">Không tải được tin tức do CORS. Thử lại sau.</div></li>`; };
    mk(el.newsNorth); mk(el.newsCentral); mk(el.newsSouth); mk(el.newsSea); mk(el.newsWorld);
    el.newsUpdatedAt.textContent = 'Cập nhật: lỗi';
  }
}

/* =======================
   12) FAVORITES / HISTORY
   ======================= */
function renderFavoritesChips(){
  const mountPoints = [el.favoritesRow, el.quickFavorites, el.drawerFavorites, el.savedCities];
  mountPoints.forEach(mp => mp && (mp.innerHTML=''));

  state.favorites.forEach(city=>{
    const chip = document.createElement('button');
    chip.className = 'chip';
    chip.textContent = city;
    chip.addEventListener('click', ()=> loadWeatherByCity(city));
    mountPoints.forEach(mp=> mp && mp.appendChild(chip.cloneNode(true)));
  });

  if(el.savedCities){
    el.savedCities.innerHTML='';
    state.favorites.forEach(city=>{
      const b = document.createElement('button');
      b.className='chip';
      b.textContent=city;
      b.addEventListener('click', ()=> loadWeatherByCity(city));
      el.savedCities.appendChild(b);
    });
  }

  if(el.searchHistory){
    el.searchHistory.innerHTML='';
    state.history.slice(0,10).forEach(h=>{
      const b = document.createElement('button');
      b.className='chip';
      b.textContent=h;
      b.addEventListener('click', ()=> loadWeatherByCity(h));
      el.searchHistory.appendChild(b);
    });
  }
}
function saveFavorite(city){
  if(!city) return;
  if(!state.favorites.includes(city)){
    state.favorites.push(city);
    localStorage.setItem('favorites', JSON.stringify(state.favorites));
    renderFavoritesChips();
    toast('Đã lưu yêu thích!');
  }else{
    toast('Thành phố đã nằm trong yêu thích.');
  }
}
function recordHistory(city){
  if(!city) return;
  const arr = state.history.filter(c=> c.toLowerCase() !== city.toLowerCase());
  arr.unshift(city);
  state.history = arr.slice(0,20);
  localStorage.setItem('history', JSON.stringify(state.history));
  renderFavoritesChips();
}

/* =======================
   13) TABS / DRAWER / UI
   ======================= */
function switchTab(tabId){
  el.tabBtns.forEach(b=>{
    const active = b.dataset.tab === tabId;
    b.classList.toggle('is-active', active);
    b.setAttribute('aria-selected', active?'true':'false');
  });
  el.panels.forEach(p=>{
    const isActive = p.id === 'tab-'+tabId;
    p.classList.toggle('is-active', isActive);
  });

  // Khi chuyển sang tab "forecast", đảm bảo chart resize để không tràn
  if(tabId === 'forecast'){
    // delay 1 frame để DOM layout ổn định rồi resize chart
    requestAnimationFrame(()=> safeResizeCharts());
  }
}
function openDrawer(open=true){
  el.drawer.classList.toggle('open', open);
  el.drawer.setAttribute('aria-hidden', open?'false':'true');
}
function showSkeleton(show){
  document.body.classList.toggle('loading', show);
}

/* =======================
   14) ALERT BANNER
   ======================= */
function renderAlerts(nearest){
  const temp = nearest.main.temp;
  const pop  = nearest.pop || 0;
  const wind = UNIT[state.unit].toSpeed(nearest.wind.speed);
  const gust = nearest.wind.gust ? UNIT[state.unit].toSpeed(nearest.wind.gust) : 0;

  let msg = '';
  if(temp >= 36 || (state.unit==='imperial' && temp>=97)) msg = 'Cảnh báo nắng nóng: uống đủ nước, tránh ra ngoài giờ trưa.';
  if(pop >= 0.7) msg = 'Cảnh báo mưa lớn: mang áo mưa, hạn chế di chuyển vùng ngập.';
  if(gust >= 55 || wind >= 45) msg = 'Cảnh báo gió mạnh: tránh dùng ô (dù), quan sát cây cối/vật rơi.';

  if(msg){
    el.alertBanner.textContent = msg;
    el.alertBanner.classList.add('show');
  }else{
    el.alertBanner.classList.remove('show');
  }
}

/* =======================
   15) CLOCK
   ======================= */
let clockTimer=null;
function startClock(tz){
  if(clockTimer) clearInterval(clockTimer);
  const tick = ()=> el.currentDateTime.textContent = localNowString(tz);
  tick();
  clockTimer = setInterval(tick, 30000);
}

/* =======================
   16) EVENT BINDINGS
   ======================= */
function bindEvents(){
  // search desktop
  el.searchBtn.addEventListener('click', ()=>{
    const q = el.cityInput.value.trim();
    if(q) loadWeatherByCity(q);
  });
  el.cityInput.addEventListener('keydown', e=>{
    if(e.key==='Enter'){ el.searchBtn.click(); }
  });

  // search mobile quick
  el.searchBtnMobile.addEventListener('click', ()=>{
    const q = el.cityInputMobile.value.trim();
    if(q){ loadWeatherByCity(q); openDrawer(false); }
  });
  el.cityInputMobile.addEventListener('keydown', e=>{
    if(e.key==='Enter'){ el.searchBtnMobile.click(); }
  });

  // location
  el.locationBtn.addEventListener('click', loadWeatherByGeo);
  el.locationBtnMobile.addEventListener('click', ()=>{ loadWeatherByGeo(); openDrawer(false); });
  el.drawerLocationBtn.addEventListener('click', ()=>{ loadWeatherByGeo(); });

  // drawer search
  el.mobileMenuToggle.addEventListener('click', ()=> openDrawer(true));
  el.drawerClose.addEventListener('click', ()=> openDrawer(false));
  el.drawerSearchBtn.addEventListener('click', ()=>{
    const q = el.drawerCityInput.value.trim();
    if(q){ loadWeatherByCity(q); }
  });

  // switch tabs (header)
  el.tabBtns.forEach(b=> b.addEventListener('click', ()=> switchTab(b.dataset.tab)));
  // switch tabs (drawer)
  el.drawerTabs.forEach(b=> b.addEventListener('click', ()=>{
    switchTab(b.dataset.tab); openDrawer(false);
  }));

  // segmented: range
  el.segRange.forEach(b=> b.addEventListener('click', ()=>{
    state.range = b.dataset.range;
    setActive(el.segRange, state.range, 'range');
    if(state.forecast) renderHourly(state.forecast);
  }));

  // segmented: unit (ở tab forecast)
  el.segUnit.forEach(b=> b.addEventListener('click', ()=>{
    const pick = b.dataset.unit;
    if(pick !== state.unit){
      state.unit = pick;
      localStorage.setItem('unit', state.unit);
      setActive(el.segUnit, state.unit, 'unit');
      setActive(el.unitBtns, state.unit, 'unit');
      if(state.lastCity) loadWeatherByCity(state.lastCity);
    }
  }));

  // settings: unit
  el.unitBtns.forEach(b=> b.addEventListener('click', ()=>{
    const pick = b.dataset.unit;
    if(pick !== state.unit){
      state.unit = pick;
      localStorage.setItem('unit', state.unit);
      setActive(el.unitBtns, state.unit, 'unit');
      setActive(el.segUnit, state.unit, 'unit');
      if(state.lastCity) loadWeatherByCity(state.lastCity);
    }
  }));

  // settings: theme
  el.themeBtns.forEach(b=> b.addEventListener('click', ()=>{
    const theme = b.dataset.theme;
    setTheme(theme);
    localStorage.setItem('lastLightTheme', theme!=='dark'?theme:(localStorage.getItem('lastLightTheme')||'blue'));
    setActive(el.themeBtns, theme, 'theme');
  }));

  // quick dark toggle on header
  el.darkToggle.addEventListener('click', toggleDarkQuick);

  // save favorite
  el.saveCityBtn.addEventListener('click', ()=> saveFavorite(state.lastCity));

  // refresh
  el.refreshBtn.addEventListener('click', ()=>{
    if(state.lastCity) loadWeatherByCity(state.lastCity);
  });

  // clear btns
  el.clearFav.addEventListener('click', ()=>{
    state.favorites = [];
    localStorage.setItem('favorites', '[]');
    renderFavoritesChips();
  });
  el.clearHist.addEventListener('click', ()=>{
    state.history = [];
    localStorage.setItem('history', '[]');
    renderFavoritesChips();
  });

  // news refresh
  el.newsRefreshBtn.addEventListener('click', loadNews);

  // cửa sổ resize -> cập nhật chart
  window.addEventListener('resize', debounce(safeResizeCharts, 120));
}

/* Debounce helper để không resize liên tục */
function debounce(fn, wait=120){
  let t; return (...args)=>{ clearTimeout(t); t=setTimeout(()=>fn(...args), wait); };
}

/* ResizeObserver: nếu card/charts container đổi kích thước do layout responsive */
let chartsRO = null;
function observeCharts(){
  const container = $('#tab-forecast .grid.charts');
  if(!container) return;
  if(chartsRO){ chartsRO.disconnect(); chartsRO = null; }
  chartsRO = new ResizeObserver(()=> safeResizeCharts());
  chartsRO.observe(container);
}

/* =======================
   17) INIT
   ======================= */
function init(){
  setTheme(state.theme);
  setActive(el.unitBtns, state.unit, 'unit');
  setActive(el.segUnit, state.unit, 'unit');
  setActive(el.themeBtns, state.theme, 'theme');

  renderFavoritesChips();
  bindEvents();

  // ưu tiên vị trí, nếu user không cho thì tải default city
  if(navigator.geolocation){
    navigator.geolocation.getCurrentPosition(
      ()=> loadWeatherByGeo(),
      ()=> loadWeatherByCity(state.lastCity || DEFAULT_CITY),
      { timeout: 7000 }
    );
  }else{
    loadWeatherByCity(state.lastCity || DEFAULT_CITY);
  }

  loadNews(); // tin tức
  observeCharts(); // theo dõi kích thước vùng charts
}

/* =======================
   18) START
   ======================= */
document.addEventListener('DOMContentLoaded', init);
