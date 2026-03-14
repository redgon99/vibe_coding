(function () {
  const LOG = {
    prefix: '[QR출석][Attend]',
    log: function (msg, data) {
      if (data !== undefined) console.log(this.prefix, msg, data);
      else console.log(this.prefix, msg);
    },
    warn: function (msg, data) {
      if (data !== undefined) console.warn(this.prefix, msg, data);
      else console.warn(this.prefix, msg);
    }
  };

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

  LOG.log('page load', { url: window.location.href });

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
    LOG.warn('no session in URL');
    showView('error');
    return;
  }

  var session = getSessionById(sessionId);
  if (!session) {
    LOG.warn('session not found', { sessionId: sessionId });
    showView('error');
    return;
  }

  LOG.log('session valid', { sessionId: sessionId, date: session.date, educationName: session.educationName });
  inputSessionId.value = sessionId;
  heroDate.textContent = session.date;
  heroEducation.textContent = session.educationName;
  showView('form');

  formAttend.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = inputName.value.trim();
    var dept = inputDept.value.trim();
    if (!name || !dept) {
      LOG.warn('submit validation failed', { name: name, dept: dept });
      showToast('이름과 부서를 모두 입력하세요.');
      return;
    }
    LOG.log('submit attendance', { sessionId: sessionId, name: name, department: dept });
    var result = addAttendance(sessionId, name, dept);
    if (!result.ok) {
      LOG.warn('addAttendance failed', { error: result.error });
      showToast(result.error || '출석 처리에 실패했습니다.');
      return;
    }
    LOG.log('attendance success', { recordId: result.record.id, name: result.record.name, department: result.record.department });
    doneMessage.textContent = result.record.name + ' (' + result.record.department + ')';
    showView('done');
    showToast('출석이 완료되었습니다.');
  });
})();
