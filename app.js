// Minimal deforestation tracker
const MAP_ID = 'map';
const DATA_URL = 'data/deforestation.json';
let map, markers = [];

function initMap() {
  map = L.map(MAP_ID).setView([0, 0], 2);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);
}

function colorByArea(ha) {
  if (ha > 1000) return '#b30000';
  if (ha > 500) return '#ff4500';
 if (ha > 200) return '#ff7f00';
  if (ha > 100) return '#ffd43b';
  return '#7fbf7f';
}

function radiusByArea(ha) {
  return Math.max(6, Math.sqrt(ha) * 1.5);
}

function tryParseDate(s) { if (!s) return null; const d = new Date(s); return isNaN(d) ? null : d; }

async function loadData() {
  try {
    const res = await fetch(DATA_URL);
    if (!res.ok) throw new Error('Failed to load data');
    const data = await res.json();
    return data;
  } catch (err) {
    console.error(err);
    return [];
  }
}

function addMarkers(data) {
  markers.forEach(m => map.removeLayer(m));
  markers = [];

  data.forEach(item => {
    const circle = L.circleMarker([item.lat, item.lon], {
      radius: radiusByArea(item.area_ha),
      color: colorByArea(item.area_ha),
      fillOpacity: 0.7,
    }).addTo(map).bindPopup(`<b>${item.country}</b><br>${item.date}<br>${item.area_ha} ha<br>${item.notes}`);
    markers.push(circle);
  });
}

function updateList(data) {
  const list = document.getElementById('list');
  list.innerHTML = '';
  const summary = document.getElementById('summary');
  const total = data.reduce((s,i)=>s+i.area_ha,0);
  summary.textContent = `${data.length} events • ${total} ha`;
  data.slice().sort((a,b)=>b.area_ha-a.area_ha).forEach(item => {
    const li = document.createElement('li');
    li.innerHTML = `<strong>${item.country}</strong> — ${item.area_ha} ha <br><small>${item.date} • ${item.notes}</small>`;
    li.onclick = ()=> {
      map.setView([item.lat, item.lon], 8);
    };
    list.appendChild(li);
  });
}

function applyFilter(data) {
  const country = document.getElementById('country').value;
  const start = tryParseDate(document.getElementById('start').value);
  const end = tryParseDate(document.getElementById('end').value);
  let filtered = data;
  if (country && country !== 'all') filtered = filtered.filter(d=>d.country === country);
  if (start) filtered = filtered.filter(d=>new Date(d.date) >= start);
  if (end) filtered = filtered.filter(d=>new Date(d.date) <= end);
  return filtered;
}

function setCountryOptions(data) {
  const sel = document.getElementById('country');
  const countries = Array.from(new Set(data.map(d=>d.country))).sort();
  countries.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c;
    opt.textContent = c;
    sel.appendChild(opt);
  });
}

async function main() {
  initMap();
  const data = await loadData();
  setCountryOptions(data);
  const filtered = applyFilter(data);
  addMarkers(filtered);
  updateList(filtered);
  if (filtered.length) map.fitBounds(filtered.map(d=>[d.lat,d.lon]));
  // Add simple legend
  const legend = L.control({position: 'bottomright'});
  legend.onAdd = function(){
    const div = L.DomUtil.create('div','legend');
    div.style.background = 'white';
    div.style.padding = '6px';
    div.style.border = '1px solid #ddd';
    div.innerHTML = `<div style="font-weight:600;margin-bottom:4px">Area legend</div>
      <div><span style='display:inline-block;width:12px;height:12px;background:#b30000;margin-right:6px'></span>> 1000 ha</div>
      <div><span style='display:inline-block;width:12px;height:12px;background:#ff4500;margin-right:6px'></span>> 500 ha</div>
      <div><span style='display:inline-block;width:12px;height:12px;background:#ff7f00;margin-right:6px'></span>> 200 ha</div>
      <div><span style='display:inline-block;width:12px;height:12px;background:#ffd43b;margin-right:6px'></span>> 100 ha</div>
      <div><span style='display:inline-block;width:12px;height:12px;background:#7fbf7f;margin-right:6px'></span><= 100 ha</div>`;
    return div;
  }
  legend.addTo(map);

  document.getElementById('apply').onclick = () => {
    const f = applyFilter(data);
    addMarkers(f);
    updateList(f);
    if (f.length) map.fitBounds(f.map(d=>[d.lat,d.lon]));
  };
}

main();
