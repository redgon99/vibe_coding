/**
 * localStorage 기반 세션·출석 데이터 관리
 */
const STORAGE_SESSIONS = 'qr_attendance_sessions';
const STORAGE_ATTENDANCES = 'qr_attendance_records';

const LOG = {
  prefix: '[QR출석][Storage]',
  log: function (msg, data) {
    if (data !== undefined) console.log(this.prefix, msg, data);
    else console.log(this.prefix, msg);
  },
  warn: function (msg, data) {
    if (data !== undefined) console.warn(this.prefix, msg, data);
    else console.warn(this.prefix, msg);
  }
};

function getSessions() {
  try {
    const raw = localStorage.getItem(STORAGE_SESSIONS);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    LOG.warn('getSessions parse error', e.message);
    return [];
  }
}

function saveSessions(sessions) {
  localStorage.setItem(STORAGE_SESSIONS, JSON.stringify(sessions));
  LOG.log('saveSessions', { count: sessions.length });
}

function getAttendances() {
  try {
    const raw = localStorage.getItem(STORAGE_ATTENDANCES);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    LOG.warn('getAttendances parse error', e.message);
    return [];
  }
}

function saveAttendances(attendances) {
  localStorage.setItem(STORAGE_ATTENDANCES, JSON.stringify(attendances));
  LOG.log('saveAttendances', { count: attendances.length });
}

function generateSessionId() {
  return 'sess_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
}

function createSession(educationName, date) {
  const sessions = getSessions();
  const id = generateSessionId();
  const session = {
    id,
    educationName: educationName.trim(),
    date: date.trim(),
    createdAt: new Date().toISOString()
  };
  sessions.unshift(session);
  saveSessions(sessions);
  LOG.log('createSession', { id: session.id, date: session.date, educationName: session.educationName });
  return session;
}

function getSessionById(sessionId) {
  return getSessions().find(s => s.id === sessionId) || null;
}

function getAttendancesBySessionId(sessionId) {
  return getAttendances().filter(a => a.sessionId === sessionId);
}

function addAttendance(sessionId, name, department) {
  const session = getSessionById(sessionId);
  if (!session) {
    LOG.warn('addAttendance: session not found', { sessionId });
    return { ok: false, error: '세션을 찾을 수 없습니다.' };
  }

  const attendances = getAttendances();
  const record = {
    id: 'att_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9),
    sessionId,
    name: name.trim(),
    department: department.trim(),
    timestamp: new Date().toISOString()
  };
  attendances.push(record);
  saveAttendances(attendances);
  LOG.log('addAttendance', { sessionId, name: record.name, department: record.department, recordId: record.id });
  return { ok: true, record };
}

function getDepartmentStats(sessionId) {
  const list = getAttendancesBySessionId(sessionId);
  const map = {};
  list.forEach(a => {
    const dept = a.department || '(미입력)';
    map[dept] = (map[dept] || 0) + 1;
  });
  return Object.entries(map).map(([label, count]) => ({ label, count }));
}
