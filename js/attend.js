(function () {
  const viewError = document.getElementById('viewError');
  const viewForm = document.getElementById('viewForm');
  const viewDone = document.getElementById('viewDone');
  const formAttend = document.getElementById('formAttend');
  const inputSessionId = document.getElementById('inputSessionId');
  const inputName = document.getElementById('inputName');
  const inputDept = document.getElementById('inputDept');
  const heroDate = document.getElementById('heroDate');
  const heroEducation = document.getElementById('heroEducation');
  const doneMessage = document.getElementById('doneMessage');
  const toast = document.getElementById('toast');

  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(function () {
      toast.classList.remove('show');
    }, 2500);
  }

  function showView(which) {
    viewError.style.display = which === 'error' ? 'block' : 'none';
    viewForm.style.display = which === 'form' ? 'block' : 'none';
    viewDone.style.display = which === 'done' ? 'block' : 'none';
  }

  var params = new URLSearchParams(window.location.search);
  var sessionId = params.get('session');

  if (!sessionId) {
    showView('error');
    return;
  }

  var session = getSessionById(sessionId);
  if (!session) {
    showView('error');
    return;
  }

  inputSessionId.value = sessionId;
  heroDate.textContent = session.date;
  heroEducation.textContent = session.educationName;
  showView('form');

  formAttend.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = inputName.value.trim();
    var dept = inputDept.value.trim();
    if (!name || !dept) {
      showToast('이름과 부서를 모두 입력하세요.');
      return;
    }
    var result = addAttendance(sessionId, name, dept);
    if (!result.ok) {
      showToast(result.error || '출석 처리에 실패했습니다.');
      return;
    }
    doneMessage.textContent = result.record.name + ' (' + result.record.department + ')';
    showView('done');
    showToast('출석이 완료되었습니다.');
  });
})();
