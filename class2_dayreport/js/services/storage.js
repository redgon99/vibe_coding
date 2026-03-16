/**
 * 로컬 스토리지 기반 저장소. PRD 7절 데이터 모델 반영.
 * 키: 1dayreport_reports, 1dayreport_attachments, 1dayreport_daily_stats, ...
 */
const PREFIX = '1dayreport_';
const KEYS = {
  reports: PREFIX + 'reports',
  attachments: PREFIX + 'attachments',
  daily_stats: PREFIX + 'daily_stats',
  incident_reports: PREFIX + 'incident_reports',
  extraction_logs: PREFIX + 'extraction_logs',
  edit_history: PREFIX + 'edit_history',
  equipment: PREFIX + 'equipment',
  personnel: PREFIX + 'personnel',
  special_notes: PREFIX + 'special_notes',
};

function load(key, def = []) {
  try {
    const s = localStorage.getItem(key);
    return s ? JSON.parse(s) : def;
  } catch {
    return def;
  }
}

function save(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function nextId(arr) {
  const ids = arr.map(o => o.id).filter(Boolean);
  const num = ids.length ? Math.max(...ids.map(id => parseInt(id, 10) || 0)) + 1 : 1;
  return String(num);
}

export const storage = {
  listReports(opts = {}) {
    let list = load(KEYS.reports);
    if (opts.status) list = list.filter(r => r.status === opts.status);
    if (opts.periodStart) list = list.filter(r => r.period_end >= opts.periodStart);
    if (opts.periodEnd) list = list.filter(r => r.period_start <= opts.periodEnd);
    return list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },

  getReport(id) {
    const list = load(KEYS.reports);
    return list.find(r => r.id === id) || null;
  },

  saveReport(report) {
    const list = load(KEYS.reports);
    const idx = list.findIndex(r => r.id === report.id);
    const toSave = { ...report, updated_at: new Date().toISOString() };
    if (idx >= 0) list[idx] = toSave;
    else {
      toSave.id = toSave.id || nextId(list);
      toSave.created_at = toSave.created_at || new Date().toISOString();
      list.push(toSave);
    }
    save(KEYS.reports, list);
    return toSave.id;
  },

  getAttachments(reportId) {
    return load(KEYS.attachments).filter(a => a.report_id === reportId);
  },

  saveAttachment(att) {
    const list = load(KEYS.attachments);
    att.id = att.id || nextId(list);
    att.uploaded_at = att.uploaded_at || new Date().toISOString();
    list.push(att);
    save(KEYS.attachments, list);
    return att.id;
  },

  getDailyStats(reportId) {
    return load(KEYS.daily_stats).filter(d => d.report_id === reportId);
  },

  saveDailyStats(reportId, rows) {
    const list = load(KEYS.daily_stats).filter(d => d.report_id !== reportId);
    rows.forEach((r, i) => {
      list.push({ ...r, report_id: reportId, id: r.id || nextId(list) });
    });
    save(KEYS.daily_stats, list);
  },

  getIncidentReports(reportId) {
    return load(KEYS.incident_reports).filter(i => i.report_id === reportId).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  },

  saveIncidentReports(reportId, rows) {
    const list = load(KEYS.incident_reports).filter(i => i.report_id !== reportId);
    rows.forEach((r, i) => {
      list.push({ ...r, report_id: reportId, sort_order: i, id: r.id || nextId(list) });
    });
    save(KEYS.incident_reports, list);
  },

  getExtractionLogs(reportId) {
    return load(KEYS.extraction_logs).filter(l => l.report_id === reportId).sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  },

  saveExtractionLog(reportId, log) {
    const list = load(KEYS.extraction_logs);
    list.push({ ...log, report_id: reportId, id: nextId(list), created_at: new Date().toISOString() });
    save(KEYS.extraction_logs, list);
  },

  getEditHistory(reportId) {
    return load(KEYS.edit_history).filter(h => h.report_id === reportId).sort((a, b) => new Date(b.edited_at) - new Date(a.edited_at));
  },

  saveEditHistory(reportId, fieldName, oldValue, newValue, editedBy = null) {
    const list = load(KEYS.edit_history);
    list.push({
      id: nextId(list),
      report_id: reportId,
      field_name: fieldName,
      old_value: oldValue,
      new_value: newValue,
      edited_at: new Date().toISOString(),
      edited_by: editedBy,
    });
    save(KEYS.edit_history, list);
  },

  getEquipment(reportId) {
    return load(KEYS.equipment).filter(e => e.report_id === reportId);
  },

  saveEquipment(reportId, rows) {
    const list = load(KEYS.equipment).filter(e => e.report_id !== reportId);
    rows.forEach(r => list.push({ ...r, report_id: reportId, id: r.id || nextId(list) }));
    save(KEYS.equipment, list);
  },

  getPersonnel(reportId) {
    return load(KEYS.personnel).filter(p => p.report_id === reportId);
  },

  savePersonnel(reportId, rows) {
    const list = load(KEYS.personnel).filter(p => p.report_id !== reportId);
    rows.forEach(r => list.push({ ...r, report_id: reportId, id: r.id || nextId(list) }));
    save(KEYS.personnel, list);
  },

  getSpecialNotes(reportId) {
    return load(KEYS.special_notes).filter(n => n.report_id === reportId).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  },

  saveSpecialNotes(reportId, rows) {
    const list = load(KEYS.special_notes).filter(n => n.report_id !== reportId);
    rows.forEach((r, i) => list.push({ ...r, report_id: reportId, sort_order: i, id: r.id || nextId(list) }));
    save(KEYS.special_notes, list);
  },

  getAllIncidentsForMap(opts = {}) {
    let reports = load(KEYS.reports).filter(r => r.status === 'confirmed');
    if (opts.periodStart) reports = reports.filter(r => r.period_end >= opts.periodStart);
    if (opts.periodEnd) reports = reports.filter(r => r.period_start <= opts.periodEnd);
    const reportIds = reports.map(r => r.id);
    const incidents = load(KEYS.incident_reports).filter(i => reportIds.includes(i.report_id));
    if (opts.type) return incidents.filter(i => i.type === opts.type);
    return incidents;
  },
};
