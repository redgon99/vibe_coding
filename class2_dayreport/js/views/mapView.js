/**
 * 지도: 기간/유형 필터, 마커-목록 연동, 클릭 시 사건 요약, 지오코딩 실패 표시
 */
import { storage } from '../services/storage.js';
import { openModal } from '../components/modal.js';

export function mapView() {
  const wrap = document.createElement('div');
  wrap.className = 'view-map';

  const now = new Date();
  const startStr = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const endStr = now.toISOString().slice(0, 10);

  wrap.innerHTML = `
    <h2>지도</h2>
    <div class="map-filters">
      <label>기간 <input type="date" id="map-start" value="${startStr}" /> ~ <input type="date" id="map-end" value="${endStr}" /></label>
      <select id="map-type">
        <option value="">전체</option>
        <option value="화재">화재</option>
        <option value="구조">구조</option>
        <option value="구급">구급</option>
        <option value="기타">기타</option>
      </select>
      <button type="button" class="btn btn-primary" id="map-apply">적용</button>
    </div>
    <div class="map-layout">
      <div class="map-sidebar">
        <div id="incident-list"></div>
      </div>
      <div id="map-container"></div>
    </div>
  `;

  const listEl = wrap.querySelector('#incident-list');
  const mapContainer = wrap.querySelector('#map-container');

  function loadMapAndMarkers() {
    const start = wrap.querySelector('#map-start').value;
    const end = wrap.querySelector('#map-end').value;
    const type = wrap.querySelector('#map-type').value;
    const periodStart = start ? new Date(start).toISOString() : null;
    const periodEnd = end ? new Date(end + 'T23:59:59').toISOString() : null;

    let incidents = storage.getAllIncidentsForMap({ periodStart, periodEnd, type });

    listEl.innerHTML = incidents.length === 0
      ? '<p class="text-muted" style="padding:12px">해당 기간/유형에 사건이 없습니다.</p>'
      : incidents.map((inc, i) => `
        <div class="incident-item" data-index="${i}" data-lat="${inc.lat ?? ''}" data-lng="${inc.lng ?? ''}">
          <strong>${escapeHtml(inc.type || '')}</strong> ${escapeHtml(inc.address_raw || '')}
          ${inc.time_start || ''}~${inc.time_end || ''}
          ${inc.geo_failed ? '<span class="geo-failed">주소 변환 실패</span>' : ''}
        </div>
      `).join('');

    if (typeof kakao === 'undefined' || !kakao.maps) {
      mapContainer.innerHTML = '<p class="text-muted" style="padding:20px">카카오맵 API를 로드한 뒤 새로고침하세요. (개발자도구에서 Kakao API 키 설정 필요)</p>';
      return;
    }

    const center = new kakao.maps.LatLng(37.8813, 127.73);
    const mapOption = { center, level: 10 };
    const map = new kakao.maps.Map(mapContainer, mapOption);

    const markers = [];
    const bounds = new kakao.maps.LatLngBounds();

    incidents.forEach((inc, i) => {
      if (inc.lat != null && inc.lng != null && !inc.geo_failed) {
        const pos = new kakao.maps.LatLng(inc.lat, inc.lng);
        const marker = new kakao.maps.Marker({ position: pos, map });
        marker.incident = inc;
        marker.index = i;
        kakao.maps.event.addListener(marker, 'click', () => {
          listEl.querySelectorAll('.incident-item').forEach(el => el.classList.remove('active'));
          listEl.querySelector(`[data-index="${i}"]`)?.classList.add('active');
          openModal({
            title: '사건 요약',
            body: `<p><strong>유형</strong> ${escapeHtml(inc.type || '')}</p><p><strong>시간</strong> ${escapeHtml(inc.time_start || '')} ~ ${escapeHtml(inc.time_end || '')}</p><p><strong>장소</strong> ${escapeHtml(inc.address_raw || '')}</p><p><strong>내용</strong><br/>${escapeHtml((inc.description || '').slice(0, 300))}</p>`,
          });
        });
        markers.push(marker);
        bounds.extend(pos);
      }
    });

    if (markers.length > 0) map.setBounds(bounds, 50, 50, 50, 50);

    listEl.querySelectorAll('.incident-item').forEach(el => {
      el.addEventListener('click', () => {
        listEl.querySelectorAll('.incident-item').forEach(x => x.classList.remove('active'));
        el.classList.add('active');
        const lat = parseFloat(el.getAttribute('data-lat'));
        const lng = parseFloat(el.getAttribute('data-lng'));
        if (!isNaN(lat) && !isNaN(lng)) {
          map.panTo(new kakao.maps.LatLng(lat, lng));
        }
      });
    });
  }

  wrap.querySelector('#map-apply').addEventListener('click', loadMapAndMarkers);
  loadMapAndMarkers();
  return wrap;
}

function escapeHtml(s) {
  if (s == null) return '';
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}
