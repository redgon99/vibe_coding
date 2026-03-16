/**
 * OCR/텍스트 → 구조화 데이터. 섹션 헤더 기준 블록 분리, 정규식으로 필드 매핑.
 */
export function parseReportText(text) {
  const result = {
    report: {
      title: '',
      org_name: '',
      contact: '',
      period_start: null,
      period_end: null,
      weather_summary: '',
      weather_today: '',
      weather_detail: '',
      total_dispatch_count: 0,
      status: 'draft',
    },
    daily_stats: [],
    incident_reports: [],
    equipment: [],
    personnel: [],
    special_notes: [],
  };

  const lines = text.split(/\r?\n/).map(s => s.trim()).filter(Boolean);

  const periodMatch = text.match(/(\d{4})\s*[.\s]*(\d{1,2})\s*[.\s]*(\d{1,2})[.\s]*(?:\([^)]*\))?\s*(\d{1,2})\s*:\s*(\d{2})\s*~\s*(\d{4})\s*[.\s]*(\d{1,2})\s*[.\s]*(\d{1,2})[.\s]*(?:\([^)]*\))?\s*(\d{1,2})\s*:\s*(\d{2})/);
  if (periodMatch) {
    const [, y1, m1, d1, h1, min1, y2, m2, d2, h2, min2] = periodMatch;
    result.report.period_start = new Date(Number(y1), Number(m1) - 1, Number(d1), Number(h1), Number(min1)).toISOString();
    result.report.period_end = new Date(Number(y2), Number(m2) - 1, Number(d2), Number(h2), Number(min2)).toISOString();
  }

  const orgMatch = text.match(/춘천소방서\s*현장대응단|([가-힣]+소방서[가-힣]*)/);
  if (orgMatch) result.report.org_name = orgMatch[0].trim();

  const contactMatch = text.match(/(\d{2,3})\s*\)\s*(\d{3,4}-\d{4})/);
  if (contactMatch) result.report.contact = contactMatch[0].replace(/\s/g, '');

  const dispatchMatch = text.match(/119\s*출동\s*건수\s*(\d+)\s*건|출동건수\s*(\d+)/);
  if (dispatchMatch) result.report.total_dispatch_count = parseInt(dispatchMatch[1] || dispatchMatch[2], 10) || 0;

  const titleMatch = text.match(/소방활동\s*일일\s*상황보고|119\s*소방활동\s*일일/);
  if (titleMatch) result.report.title = '소방활동 일일 상황보고';

  let weatherBlock = extractBlock(lines, '기상상황', ['일일 소방', '119출동', '119 출동']);
  if (!weatherBlock.length) weatherBlock = extractBlock(lines, '기상', ['일일 소방', '119출동', '119 출동']);
  if (weatherBlock.length) {
    result.report.weather_summary = weatherBlock.find(l => /종합|예보|풍랑|너울|내일|모레/.test(l)) || '';
    result.report.weather_today = weatherBlock.find(l => /오늘|맑음|흐림|강원|대체로/.test(l)) || '';
    result.report.weather_detail = weatherBlock.find(l => /맑음|체감|습도|북풍|°|[\d-]+\.?\d*\s*\/\s*[\d]+/.test(l)) || '';
  }
  if (!result.report.weather_summary && !result.report.weather_today && !result.report.weather_detail) {
    extractWeatherFromFullText(text, result.report);
  }

  const hasTable = /일계|누계/.test(text) && /화재|구조|구급/.test(text);
  if (hasTable) {
    const categories = ['fire', 'rescue', 'emergency', 'other'];
    const nums = text.match(/\d+/g) || [];
    let idx = 0;
    for (const periodType of ['daily', 'cumulative']) {
      for (let i = 0; i < 4; i++) {
        result.daily_stats.push({
          category: categories[i],
          period_type: periodType,
          dispatch_count: parseInt(nums[idx], 10) || 0,
          false_alarm_count: parseInt(nums[idx + 1], 10) || 0,
          person_count: parseInt(nums[idx + 2], 10) || 0,
          death_count: parseInt(nums[idx + 3], 10) || 0,
          injury_count: parseInt(nums[idx + 4], 10) || 0,
          damage_amount_1000: parseInt(nums[idx + 5], 10) || 0,
        });
        idx += 6;
      }
    }
  }

  const incidentBlock = extractBlock(lines, '주요 소방활동', ['금일 소방력', '기타 특이']);
  if (incidentBlock) {
    const addrRe = /([가-힣]+시\s*[가-힣]+동\s*[\d-]+)/g;
    const timeRe = /(\d{1,2})\s*:\s*(\d{2})\s*~\s*(\d{1,2})\s*:\s*(\d{2})/;
    let current = null;
    incidentBlock.forEach(line => {
      const typeMatch = line.match(/\((화재|구조|구급|기타)\)/);
      if (typeMatch) {
        if (current) result.incident_reports.push(current);
        current = { type: typeMatch[1], address_raw: '', time_start: '', time_end: '', description: '', geo_failed: false };
      }
      const addr = line.match(addrRe);
      if (addr && current) current.address_raw = addr[0];
      const time = line.match(timeRe);
      if (time && current) {
        current.time_start = `${time[1]}:${time[2]}`;
        current.time_end = `${time[3]}:${time[4]}`;
      }
      if (current && line.length > 20) current.description = (current.description + ' ' + line).trim();
    });
    if (current) result.incident_reports.push(current);
  }

  const equipmentBlock = extractBlock(lines, '금일 소방력', ['기타 특이', '특이사항']);
  if (equipmentBlock) {
    const pump = text.match(/펌프\s*(\d+)/);
    const tank = text.match(/탱크\s*(\d+)/);
    const amb = text.match(/구급\s*(\d+)/);
    const rescue = text.match(/구조\s*(\d+)/);
    const other = text.match(/기타\s*(\d+)/);
    if (pump) result.equipment.push({ equipment_type: '펌프', count: parseInt(pump[1], 10) });
    if (tank) result.equipment.push({ equipment_type: '탱크', count: parseInt(tank[1], 10) });
    if (amb) result.equipment.push({ equipment_type: '구급', count: parseInt(amb[1], 10) });
    if (rescue) result.equipment.push({ equipment_type: '구조', count: parseInt(rescue[1], 10) });
    if (other) result.equipment.push({ equipment_type: '기타', count: parseInt(other[1], 10) });
  }

  const specialBlock = extractBlock(lines, '특이사항', []);
  if (specialBlock) {
    specialBlock.forEach(line => {
      const media = line.match(/\((강원일보|연합뉴스|[가-힣]+)\)/);
      result.special_notes.push({
        title: line.replace(/\s*\([^)]*\)\s*$/, '').trim(),
        media: media ? media[1] : '',
      });
    });
  }

  return result;
}

function extractWeatherFromFullText(text, report) {
  const summaryMatch = text.match(/(내일[^.\n]*모레[^.\n]*(?:풍랑|너울)[^.\n]*)|(종합[^.\n]{10,80})/);
  if (summaryMatch) report.weather_summary = (summaryMatch[1] || summaryMatch[2] || '').trim();

  const todayMatch = text.match(/(강원내륙[^.\n]{5,60})|(오늘[^.\n]{5,60}(?:맑음|흐림))/);
  if (todayMatch) report.weather_today = (todayMatch[1] || todayMatch[2] || '').trim();

  const detailMatch = text.match(/(맑음[^.\n]{0,40}(?:체감|습도|북풍)[^.\n]*)|(체감\s*[-]?\d+[^.\n]{0,30}(?:습도|북풍)[^.\n]*)|(습도\s*\d+%[^.\n]{0,30})/);
  if (detailMatch) report.weather_detail = (detailMatch[1] || detailMatch[2] || detailMatch[3] || '').trim();

  if (!report.weather_detail && /습도\s*\d+%|북풍\s*[\d.]+/.test(text)) {
    const m = text.match(/맑음[^.\n]{0,80}/);
    if (m) report.weather_detail = m[0].trim();
  }
}

function extractBlock(lines, startKeyword, endKeywords) {
  let start = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(startKeyword)) { start = i + 1; break; }
  }
  if (start < 0) return [];
  let end = lines.length;
  for (let i = start; i < lines.length; i++) {
    if (endKeywords.some(k => lines[i].includes(k))) { end = i; break; }
  }
  return lines.slice(start, end).filter(Boolean);
}

function extractTableByKeywords(lines, rowKeywords, colKeywords) {
  const rows = [];
  let inTable = false;
  for (const line of lines) {
    if (rowKeywords.some(k => line.includes(k))) inTable = true;
    if (inTable && (/\d+/.test(line) || colKeywords.some(k => line.includes(k)))) {
      rows.push(line);
    }
    if (inTable && rows.length >= 8) break;
  }
  return rows;
}
