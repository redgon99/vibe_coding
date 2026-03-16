/**
 * 보고서 목록 뷰: 업로드 일시, 기관, 보고기간, 상태, 업로드 버튼
 */
import { storage } from '../services/storage.js';
import { navigateTo } from '../router.js';
import { openModal, closeModal } from '../components/modal.js';

export function listView() {
  const wrap = document.createElement('div');
  wrap.className = 'view-list';

  const toolbar = document.createElement('div');
  toolbar.className = 'list-toolbar';
  const title = document.createElement('h2');
  title.textContent = '보고서 목록';
  const uploadBtn = document.createElement('button');
  uploadBtn.className = 'btn btn-primary';
  uploadBtn.textContent = '보고서 업로드';
  uploadBtn.addEventListener('click', () => openUploadModal(wrap));
  toolbar.appendChild(title);
  toolbar.appendChild(uploadBtn);
  wrap.appendChild(toolbar);

  const tableWrap = document.createElement('div');
  const reports = storage.listReports();
  tableWrap.innerHTML = `
    <table class="report-table">
      <thead>
        <tr>
          <th>업로드 일시</th>
          <th>기관</th>
          <th>보고기간</th>
          <th>상태</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        ${reports.length === 0
          ? '<tr><td colspan="5" class="text-muted">등록된 보고서가 없습니다. 업로드 버튼으로 추가하세요.</td></tr>'
          : reports.map(r => `
          <tr>
            <td>${formatDateTime(r.created_at)}</td>
            <td>${escapeHtml(r.org_name || '-')}</td>
            <td>${formatPeriod(r.period_start, r.period_end)}</td>
            <td><span class="badge badge-${r.status || 'draft'}">${statusLabel(r.status)}</span></td>
            <td class="col-actions">
              <button type="button" class="btn btn-sm btn-secondary" data-view="${r.id}">검수</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
  tableWrap.querySelectorAll('[data-view]').forEach(btn => {
    btn.addEventListener('click', () => navigateTo('#/report/' + btn.getAttribute('data-view')));
  });
  wrap.appendChild(tableWrap);
  return wrap;
}

function formatDateTime(s) {
  if (!s) return '-';
  const d = new Date(s);
  return isNaN(d.getTime()) ? s : d.toLocaleString('ko-KR');
}

function formatPeriod(start, end) {
  if (!start && !end) return '-';
  return [start, end].map(s => s ? new Date(s).toLocaleDateString('ko-KR') : '').join(' ~ ');
}

function statusLabel(s) {
  return { draft: '미검수', in_review: '검수중', confirmed: '확정' }[s] || (s || '미검수');
}

function escapeHtml(s) {
  if (s == null) return '';
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

function openUploadModal(wrap) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/jpeg,image/png,image/jpg,application/pdf';
  input.multiple = false;
  const body = document.createElement('div');
  body.innerHTML = `
    <p>JPG, PNG, PDF 파일을 선택하세요.</p>
    <div class="upload-zone" id="upload-zone">
      <span>클릭하거나 파일을 끌어다 놓으세요</span>
      <input type="file" accept="image/jpeg,image/png,image/jpg,application/pdf" id="upload-input" />
    </div>
    <p id="upload-status" class="text-muted"></p>
  `;
  const zone = body.querySelector('#upload-zone');
  const fileInput = body.querySelector('#upload-input');
  const status = body.querySelector('#upload-status');
  zone.addEventListener('click', () => fileInput.click());
  zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('dragover'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.classList.remove('dragover');
    const file = e.dataTransfer?.files?.[0];
    if (file) handleFile(file, status, wrap);
  });
  fileInput.addEventListener('change', () => {
    const file = fileInput.files?.[0];
    if (file) handleFile(file, status, wrap);
  });
  openModal({ title: '보고서 업로드', body });
}

async function handleFile(file, statusEl, wrap) {
  statusEl.textContent = '처리 중: ' + file.name + '...';
  const { runUpload } = await import('../services/uploadFlow.js');
  try {
    const reportId = await runUpload(file);
    statusEl.textContent = '저장 완료. 검수 화면으로 이동합니다.';
    setTimeout(() => {
      closeModal();
      navigateTo('#/report/' + reportId);
    }, 800);
  } catch (err) {
    statusEl.textContent = '오류: ' + (err.message || err);
    statusEl.classList.add('badge-error');
  }
}