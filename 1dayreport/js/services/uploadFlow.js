/**
 * 업로드 플로우: 파일 저장 → OCR/PDF 추출 → 파서 → DB 저장 + 추출 로그
 */
import { storage } from './storage.js';
import { extractTextFromFile } from './ocr.js';
import { parseReportText } from '../parser/reportParser.js';

export async function runUpload(file) {
  const id = String(Date.now());

  const fileData = await readFileAsDataUrl(file);
  storage.saveAttachment({
    report_id: id,
    file_name: file.name,
    file_path_or_url: '',
    file_data: fileData,
    mime_type: file.type,
    file_size: file.size,
  });

  let rawText = '';
  try {
    rawText = await extractTextFromFile(file);
  } catch (err) {
    storage.saveExtractionLog(id, { log_type: 'error', content: String(err.message) });
  }

  storage.saveExtractionLog(id, { log_type: 'ocr_text', content: rawText.slice(0, 5000) });

  let parsed = null;
  try {
    parsed = parseReportText(rawText);
  } catch (err) {
    storage.saveExtractionLog(id, { log_type: 'error', content: 'parse: ' + err.message });
    parsed = {
      report: { title: '', org_name: '', contact: '', period_start: null, period_end: null, weather_summary: '', weather_today: '', weather_detail: '', total_dispatch_count: 0, status: 'draft' },
      daily_stats: [],
      incident_reports: [],
      equipment: [],
      personnel: [],
      special_notes: [],
    };
  }

  storage.saveExtractionLog(id, { log_type: 'field_mapping', content: JSON.stringify(parsed.report, null, 2).slice(0, 2000) });

  const report = {
    id,
    ...parsed.report,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    status: 'in_review',
  };
  storage.saveReport(report);

  if (parsed.daily_stats && parsed.daily_stats.length) {
    storage.saveDailyStats(id, parsed.daily_stats);
  }
  if (parsed.incident_reports && parsed.incident_reports.length) {
    storage.saveIncidentReports(id, parsed.incident_reports);
  }
  if (parsed.equipment && parsed.equipment.length) {
    storage.saveEquipment(id, parsed.equipment);
  }
  if (parsed.personnel && parsed.personnel.length) {
    storage.savePersonnel(id, parsed.personnel);
  }
  if (parsed.special_notes && parsed.special_notes.length) {
    storage.saveSpecialNotes(id, parsed.special_notes);
  }

  return id;
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
