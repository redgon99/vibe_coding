/**
 * localStorage 기반 세션·출석 데이터 관리
 */
const STORAGE_SESSIONS = 'qr_attendance_sessions';
const STORAGE_ATTENDANCES = 'qr_attendance_records';

function getSessions() {
  try {
    const raw = localStorage.getItem(STORAGE_SESSIONS);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveSessions(sessions) {
  localStorage.setItem(STORAGE_SESSIONS, JSON.stringify(sessions));
}

function getAttendances() {
  try {
    const raw = localStorage.getItem(STORAGE_ATTENDANCES);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveAttendances(attendances) {
  localStorage.setItem(STORAGE_ATTENDANCES, JSON.stringify(attendances));
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
  if (!session) return { ok: false, error: '세션을 찾을 수 없습니다.' };

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
