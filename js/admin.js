(function () {
  const LOG = {
    prefix: '[QR출석][Admin]',
    log: function (msg, data) {
      if (data !== undefined) console.log(this.prefix, msg, data);
      else console.log(this.prefix, msg);
    },
    warn: function (msg, data) {
      if (data !== undefined) console.warn(this.prefix, msg, data);
      else console.warn(this.prefix, msg);
    }
  };

  const formSession = document.getElementById('formSession');
  const inputDate = document.getElementById('inputDate');
  const inputEducation = document.getElementById('inputEducation');
  const cardQr = document.getElementById('cardQr');
  const qrcodeEl = document.getElementById('qrcode');
  const qrSessionInfo = document.getElementById('qrSessionInfo');
  const selectSession = document.getElementById('selectSession');
  const selectSessionManage = document.getElementById('selectSessionManage');
  const attendList = document.getElementById('attendList');
  const attendEmpty = document.getElementById('attendEmpty');
  const attendCount = document.getElementById('attendCount');
  const chartEmpty = document.getElementById('chartEmpty');
  const toast = document.getElementById('toast');
  const panelCreate = document.getElementById('panelCreate');
  const panelManage = document.getElementById('panelManage');
  const sidebarItems = document.querySelectorAll('.sidebar-item');

  let currentSessionId = null;
  let chartDept = null;
  let currentMenu = 'create';

  // 오늘 날짜 기본값
  const today = new Date().toISOString().slice(0, 10);
  if (inputDate && !inputDate.value) inputDate.value = today;

  LOG.log('init', { url: window.location.href });

  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(function () {
      toast.classList.remove('show');
    }, 2500);
  }

  function getAttendPageUrl(sessionId) {
    var path = window.location.pathname.replace(/admin\.html$/, '').replace(/index\.html$/, '') || '/';
    if (!path.endsWith('/')) path += '/';
    var base = window.location.origin + path + 'attend.html';
    return base + '?session=' + encodeURIComponent(sessionId);
  }

  function renderQr(session) {
    if (!session) {
      cardQr.style.display = 'none';
      LOG.log('renderQr cleared (no session)');
      return;
    }
    currentSessionId = session.id;
    var url = getAttendPageUrl(session.id);
    LOG.log('renderQr', { sessionId: session.id, date: session.date, educationName: session.educationName });
    qrcodeEl.innerHTML = '';
    new QRCode(qrcodeEl, {
      text: url,
      width: 180,
      height: 180,
      colorDark: '#D32F2F',
      colorLight: '#ffffff'
    });
    qrSessionInfo.textContent = session.date + ' · ' + session.educationName;
    cardQr.style.display = 'block';
    refreshAttendList();
    refreshChart();
  }

  function refreshSessionSelect() {
    var sessions = getSessions();
    var optionsHtml = '<option value="">세션을 선택하세요</option>';
    sessions.forEach(function (s) {
      var selected = currentSessionId === s.id ? ' selected' : '';
      optionsHtml += '<option value="' + escapeHtml(s.id) + '"' + selected + '>' + escapeHtml(s.date + ' - ' + s.educationName) + '</option>';
    });
    selectSession.innerHTML = optionsHtml;
    if (selectSessionManage) selectSessionManage.innerHTML = optionsHtml;
  }

  function refreshAttendList() {
    var sid = currentSessionId;
    if (!sid) {
      attendList.innerHTML = '';
      attendEmpty.style.display = 'block';
      attendCount.textContent = '(0명)';
      return;
    }
    var list = getAttendancesBySessionId(sid);
    attendCount.textContent = '(' + list.length + '명)';
    if (list.length === 0) {
      attendList.innerHTML = '';
      attendEmpty.style.display = 'block';
      return;
    }
    attendEmpty.style.display = 'none';
    attendList.innerHTML = list.map(function (a) {
      var time = new Date(a.timestamp);
      var timeStr = time.getHours() + ':' + String(time.getMinutes()).padStart(2, '0');
      return '<li><span><span class="name">' + escapeHtml(a.name) + '</span><span class="dept">' + escapeHtml(a.department) + '</span></span><span class="time">' + timeStr + '</span></li>';
    }).join('');
  }

  function refreshChart() {
    var sid = currentSessionId;
    if (!sid) {
      if (chartDept) {
        chartDept.destroy();
        chartDept = null;
      }
      chartEmpty.style.display = 'block';
      return;
    }
    var stats = getDepartmentStats(sid);
    if (stats.length === 0) {
      if (chartDept) {
        chartDept.destroy();
        chartDept = null;
      }
      chartEmpty.style.display = 'block';
      return;
    }
    chartEmpty.style.display = 'none';
    var ctx = document.getElementById('chartDept');
    if (!ctx) return;
    if (chartDept) chartDept.destroy();
    chartDept = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: stats.map(function (s) { return s.label; }),
        datasets: [{
          label: '출석 인원',
          data: stats.map(function (s) { return s.count; }),
          backgroundColor: 'rgba(211, 47, 47, 0.8)',
          borderColor: '#B71C1C',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1 }
          }
        }
      }
    });
  }

  function escapeHtml(s) {
    if (s == null) return '';
    var div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  formSession.addEventListener('submit', function (e) {
    e.preventDefault();
    var date = inputDate.value;
    var education = inputEducation.value;
    if (!date || !education.trim()) {
      LOG.warn('session create validation failed', { date: date, education: education });
      showToast('날짜와 교육명을 입력하세요.');
      return;
    }
    var session = createSession(education, date);
    LOG.log('session created', { sessionId: session.id, date: session.date, educationName: session.educationName });
    showToast('세션이 생성되었습니다.');
    refreshSessionSelect();
    renderQr(session);
  });

  selectSession.addEventListener('change', function () {
    var id = selectSession.value;
    LOG.log('selectSession change', { sessionId: id || null });
    if (!id) {
      currentSessionId = null;
      cardQr.style.display = 'none';
      if (selectSessionManage) selectSessionManage.value = '';
      refreshAttendList();
      refreshChart();
      return;
    }
    currentSessionId = id;
    if (selectSessionManage) selectSessionManage.value = id;
    var session = getSessionById(id);
    if (session) {
      qrcodeEl.innerHTML = '';
      renderQr(session);
    }
  });

  if (selectSessionManage) {
    selectSessionManage.addEventListener('change', function () {
      var id = selectSessionManage.value;
      LOG.log('selectSessionManage change', { sessionId: id || null });
      if (!id) {
        currentSessionId = null;
        refreshAttendList();
        refreshChart();
        return;
      }
      currentSessionId = id;
      selectSession.value = id;
      refreshAttendList();
      refreshChart();
    });
  }

  // 트리 메뉴 클릭: 교육생성 / 교육관리 전환
  sidebarItems.forEach(function (el) {
    el.addEventListener('click', function (e) {
      e.preventDefault();
      var menu = el.getAttribute('data-menu');
      if (menu === currentMenu) return;
      LOG.log('menu change', { from: currentMenu, to: menu });
      currentMenu = menu;
      sidebarItems.forEach(function (item) { item.classList.remove('active'); });
      el.classList.add('active');
      if (menu === 'create') {
        panelCreate.style.display = 'block';
        panelManage.style.display = 'none';
      } else {
        panelCreate.style.display = 'none';
        panelManage.style.display = 'block';
        currentSessionId = selectSessionManage ? selectSessionManage.value || null : null;
        refreshAttendList();
        refreshChart();
      }
    });
  });

  // 실시간 조회: 2초마다 출석 목록 갱신 (교육관리 패널일 때)
  setInterval(function () {
    if (currentSessionId && currentMenu === 'manage') {
      refreshAttendList();
      refreshChart();
    }
  }, 2000);

  // 초기화
  refreshSessionSelect();
  var params = new URLSearchParams(window.location.search);
  var presetSession = params.get('session');
  if (presetSession && getSessionById(presetSession)) {
    LOG.log('preset session from URL', { sessionId: presetSession });
    selectSession.value = presetSession;
    if (selectSessionManage) selectSessionManage.value = presetSession;
    currentSessionId = presetSession;
    renderQr(getSessionById(presetSession));
  }
})();
