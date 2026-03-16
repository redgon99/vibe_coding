/**
 * SPA 진입점. Hash 라우팅 및 뷰 렌더.
 */
import { renderView } from './router.js';
import { initModal } from './components/modal.js';

function init() {
  initModal();
  window.addEventListener('hashchange', () => renderView());
  renderView();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
