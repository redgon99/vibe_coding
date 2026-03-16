/**
 * 공통 모달: 제목, 본문, 닫기. 포커스 트랩, ESC 닫기.
 */
const container = document.getElementById('modal-container');
let focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

function getFocusables(el) {
  return Array.from(el.querySelectorAll(focusableSelector)).filter(
    n => !n.hasAttribute('disabled') && n.offsetParent !== null
  );
}

function trapFocus(e) {
  if (e.key !== 'Tab') return;
  const dialog = container.querySelector('.modal-dialog');
  if (!dialog) return;
  const focusables = getFocusables(dialog);
  if (focusables.length === 0) return;
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  if (e.shiftKey) {
    if (document.activeElement === first) {
      e.preventDefault();
      last.focus();
    }
  } else {
    if (document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
}

function handleEscape(e) {
  if (e.key === 'Escape') closeModal();
}

export function openModal({ title = '', body = '', onClose } = {}) {
  container.setAttribute('aria-hidden', 'false');
  container.classList.add('is-open');
  const bodyHtml = typeof body === 'string' ? body : (body && body.nodeType === Node.ELEMENT_NODE ? '' : (body && body.innerHTML !== undefined ? body.innerHTML : ''));
  container.innerHTML = `
    <div class="modal-backdrop" data-modal-close></div>
    <div class="modal-dialog" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div class="modal-header">
        <h2 id="modal-title">${escapeHtml(title)}</h2>
        <button type="button" class="modal-close" aria-label="닫기" data-modal-close>&times;</button>
      </div>
      <div class="modal-body">${bodyHtml}</div>
    </div>
  `;
  if (body && body.nodeType === Node.ELEMENT_NODE) {
    container.querySelector('.modal-body').innerHTML = '';
    container.querySelector('.modal-body').appendChild(body);
  }

  container.addEventListener('keydown', trapFocus);
  document.addEventListener('keydown', handleEscape);
  container.querySelectorAll('[data-modal-close]').forEach(el => {
    el.addEventListener('click', () => { closeModal(); if (onClose) onClose(); });
  });
  const firstFocus = container.querySelector(focusableSelector);
  if (firstFocus) firstFocus.focus();
}

export function closeModal() {
  container.classList.remove('is-open');
  container.setAttribute('aria-hidden', 'true');
  container.innerHTML = '';
  container.removeEventListener('keydown', trapFocus);
  document.removeEventListener('keydown', handleEscape);
}

function escapeHtml(s) {
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

export function initModal() {
  container.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-backdrop') || e.target.closest('[data-modal-close]')) closeModal();
  });
}
