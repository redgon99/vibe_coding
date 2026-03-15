/**
 * 보고서 상세/검수 뷰: 원본 뷰어 + 섹션별 폼, 저장/확정, 이력/로그 모달
 */
import { storage } from '../services/storage.js';
import { navigateTo } from '../router.js';
import { openModal } from '../components/modal.js';

export function reportDetailView(id) {
  const wrap = document.createElement('div');
  wrap.className = 'view-report-detail';

  const report = storage.getReport(id);
  if (!report) {
    wrap.innerHTML = '<p class="text-muted">보고서를 찾을 수 없습니다.</p><a href="#/list">목록으로</a>';
    return wrap;
  }

  const attachments = storage.getAttachments(id);
  const dailyStats = storage.getDailyStats(id);
  const incidents = storage.getIncidentReports(id);
  const equipment = storage.getEquipment(id);
  const personnel = storage.getPersonnel(id);
  const specialNotes = storage.getSpecialNotes(id);

  const layout = document.createElement('div');
  layout.className = 'report-detail-layout';

  const originSection = document.createElement('div');
  originSection.className = 'report-origin';
  originSection.innerHTML = '<h3>원본</h3>';
  const originContent = document.createElement('div');
  if (attachments.length > 0 && attachments[0].file_data) {
    const img = document.createElement('img');
    img.src = attachments[0].file_data;
    img.alt = '보고서 원본';
    originContent.appendChild(img);
  } else {
    originContent.innerHTML = '<p class="text-muted">원본 미리보기 없음</p>';
  }
  originSection.appendChild(originContent);
  layout.appendChild(originSection);

  const formSection = document.createElement('div');
  formSection.innerHTML = `
    <div class="report-form-section">
      <h3>기본정보</h3>
      <div class="form-group"><label>제목</label><input type="text" id="f-title" value="${escapeAttr(report.title)}" /></div>
      <div class="form-group"><label>기관/부서</label><input type="text" id="f-org_name" value="${escapeAttr(report.org_name)}" /></div>
      <div class="form-group"><label>연락처</label><input type="text" id="f-contact" value="${escapeAttr(report.contact)}" /></div>
      <div class="form-row">
        <div class="form-group"><label>보고기간 시작</label><input type="datetime-local" id="f-period_start" value="${toDatetimeLocal(report.period_start)}" /></div>
        <div class="form-group"><label>보고기간 종료</label><input type="datetime-local" id="f-period_end" value="${toDatetimeLocal(report.period_end)}" /></div>
      </div>
    </div>
    <div class="report-form-section">
      <h3>기상상황</h3>
      <div class="form-group"><label>종합예보</label><textarea id="f-weather_summary">${escapeAttr(report.weather_summary)}</textarea></div>
      <div class="form-group"><label>오늘 날씨</label><input type="text" id="f-weather_today" value="${escapeAttr(report.weather_today)}" /></div>
      <div class="form-group"><label>지역 상세</label><textarea id="f-weather_detail">${escapeAttr(report.weather_detail)}</textarea></div>
    </div>
    <div class="report-form-section">
      <h3>총 출동건수</h3>
      <div class="form-group"><label>119 출동건수</label><input type="number" id="f-total_dispatch_count" value="${report.total_dispatch_count ?? ''}" /></div>
    </div>
    <div class="report-form-section">
      <h3>주요 소방활동</h3>
      <div id="incident-list-editor" class="incident-list-editor"></div>
    </div>
    <div class="report-actions">
      <button type="button" class="btn btn-secondary" id="btn-history">수정 이력</button>
      <button type="button" class="btn btn-secondary" id="btn-logs">추출 로그</button>
      <button type="button" class="btn btn-primary" id="btn-save">저장</button>
      <button type="button" class="btn btn-primary" id="btn-confirm">확정</button>
    </div>
  `;

  const incidentEditor = formSection.querySelector('#incident-list-editor');
  (incidents.length ? incidents : [{ type: '화재', address_raw: '', time_start: '', time_end: '', description: '', geo_failed: false }]).forEach((inc, i) => {
    const row = document.createElement('div');
    row.className = 'incident-row';
    row.innerHTML = `
      <div class="form-row">
        <input type="text" placeholder="유형" data-incident="type" data-i="${i}" value="${escapeAttr(inc.type)}" />
        <input type="text" placeholder="주소" data-incident="address_raw" data-i="${i}" value="${escapeAttr(inc.address_raw)}" />
      </div>
      <div class="form-row">
        <input type="text" placeholder="시작 시각" data-incident="time_start" data-i="${i}" value="${escapeAttr(inc.time_start)}" />
        <input type="text" placeholder="종료 시각" data-incident="time_end" data-i="${i}" value="${escapeAttr(inc.time_end)}" />
      </div>
      <textarea placeholder="상세처리내용" data-incident="description" data-i="${i}">${escapeAttr(inc.description)}</textarea>
      ${inc.geo_failed ? '<span class="badge badge-error">주소 변환 실패</span>' : ''}
    `;
    incidentEditor.appendChild(row);
  });

  formSection.querySelector('#btn-history').addEventListener('click', () => {
    const history = storage.getEditHistory(id);
    const body = document.createElement('div');
    body.innerHTML = history.length === 0
      ? '<p class="text-muted">수정 이력이 없습니다.</p>'
      : '<ul>' + history.map(h => `<li>${escapeHtml(h.field_name)}: ${escapeHtml(String(h.old_value))} → ${escapeHtml(String(h.new_value))} (${new Date(h.edited_at).toLocaleString('ko-KR')})</li>`).join('') + '</ul>';
    openModal({ title: '수정 이력', body });
  });

  formSection.querySelector('#btn-logs').addEventListener('click', () => {
    const logs = storage.getExtractionLogs(id);
    const body = document.createElement('div');
    body.innerHTML = logs.length === 0
      ? '<p class="text-muted">추출 로그가 없습니다.</p>'
      : '<pre style="white-space:pre-wrap;font-size:12px;max-height:60vh;overflow:auto">' + logs.map(l => `[${l.log_type}] ${l.content}\n`).join('') + '</pre>';
    openModal({ title: '추출 로그', body });
  });

  formSection.querySelector('#btn-save').addEventListener('click', () => saveReport(id, formSection, incidentEditor, report, incidents, storage));
  formSection.querySelector('#btn-confirm').addEventListener('click', () => confirmReport(id, formSection, incidentEditor, report, incidents, storage));

  const geocodeBtn = document.createElement('button');
  geocodeBtn.type = 'button';
  geocodeBtn.className = 'btn btn-secondary btn-sm';
  geocodeBtn.textContent = '지오코딩 재시도';
  geocodeBtn.style.marginLeft = '8px';
  formSection.querySelector('.report-actions').prepend(geocodeBtn);
  geocodeBtn.addEventListener('click', async () => {
    const currentIncidents = collectIncidents(incidentEditor, incidents);
    const { geocodeIncident } = await import('../services/geocoding.js');
    for (let i = 0; i < currentIncidents.length; i++) {
      if (!currentIncidents[i].address_raw) continue;
      const updated = await geocodeIncident(currentIncidents[i]);
      currentIncidents[i] = updated;
    }
    storage.saveIncidentReports(id, currentIncidents);
    alert('지오코딩 재시도 완료. 주소 변환 실패 건은 목록에 표시됩니다.');
    navigateTo('#/report/' + id);
  });

  layout.appendChild(formSection);
  wrap.appendChild(layout);
  return wrap;
}

function escapeAttr(s) {
  if (s == null) return '';
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

function escapeHtml(s) {
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

function toDatetimeLocal(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function collectIncidents(incidentEditor, existingIncidents = []) {
  const rows = incidentEditor.querySelectorAll('.incident-row');
  const byIndex = {};
  rows.forEach(row => {
    row.querySelectorAll('[data-incident]').forEach(input => {
      const i = parseInt(input.getAttribute('data-i'), 10);
      const field = input.getAttribute('data-incident');
      if (!byIndex[i]) byIndex[i] = { ...(existingIncidents[i] || {}) };
      byIndex[i][field] = input.value;
    });
  });
  return Object.keys(byIndex).sort((a, b) => Number(a) - Number(b)).map(k => byIndex[k]);
}

function saveReport(id, formSection, incidentEditor, report, existingIncidents, storage) {
  const get = (id) => formSection.querySelector('#' + id)?.value ?? '';
  const newReport = {
    ...report,
    title: get('f-title'),
    org_name: get('f-org_name'),
    contact: get('f-contact'),
    period_start: get('f-period_start') ? new Date(get('f-period_start')).toISOString() : report.period_start,
    period_end: get('f-period_end') ? new Date(get('f-period_end')).toISOString() : report.period_end,
    weather_summary: get('f-weather_summary'),
    weather_today: get('f-weather_today'),
    weather_detail: get('f-weather_detail'),
    total_dispatch_count: parseInt(get('f-total_dispatch_count'), 10) || 0,
  };
  const incidents = collectIncidents(incidentEditor, existingIncidents);
  ['title', 'org_name', 'contact', 'period_start', 'period_end', 'weather_summary', 'weather_today', 'weather_detail', 'total_dispatch_count'].forEach(f => {
    if (String(report[f]) !== String(newReport[f])) {
      storage.saveEditHistory(id, f, report[f], newReport[f]);
    }
  });
  storage.saveReport(newReport);
  storage.saveIncidentReports(id, incidents);
  alert('저장되었습니다.');
}

function confirmReport(id, formSection, incidentEditor, report, existingIncidents, storage) {
  saveReport(id, formSection, incidentEditor, report, existingIncidents, storage);
  const r = storage.getReport(id);
  r.status = 'confirmed';
  r.confirmed_at = new Date().toISOString();
  storage.saveReport(r);
  alert('확정되었습니다.');
  navigateTo('#/list');
}
