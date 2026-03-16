/**
 * Hash 라우팅: #/list, #/report/:id, #/dashboard, #/map
 * 라우트 변경 시 #app 만 갱신, 네비 활성 연동.
 */
import { listView } from './views/listView.js';
import { reportDetailView } from './views/reportDetailView.js';
import { dashboardView } from './views/dashboardView.js';
import { mapView } from './views/mapView.js';

const appEl = document.getElementById('app');
const navLinks = document.querySelectorAll('.main-nav .nav-link');

function getRoute() {
  const hash = window.location.hash.slice(1) || 'list';
  const path = hash.startsWith('/') ? hash.slice(1) : hash;
  const parts = path.split('/').filter(Boolean);
  const base = parts[0] || 'list';
  const id = parts[1] || null;
  return { base, id };
}

export function renderView() {
  const { base, id } = getRoute();
  navLinks.forEach(link => {
    const route = link.getAttribute('data-route');
    link.classList.toggle('active', route === base);
  });

  appEl.innerHTML = '';
  if (base === 'list') {
    appEl.appendChild(listView());
  } else if (base === 'report' && id) {
    appEl.appendChild(reportDetailView(id));
  } else if (base === 'dashboard') {
    appEl.appendChild(dashboardView());
  } else if (base === 'map') {
    appEl.appendChild(mapView());
  } else {
    appEl.appendChild(listView());
  }
}

export function navigateTo(path) {
  window.location.hash = path;
}
