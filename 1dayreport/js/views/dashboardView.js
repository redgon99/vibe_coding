/**
 * 대시보드: 기간 필터, KPI 카드, 차트
 */
import { storage } from '../services/storage.js';

export function dashboardView() {
  const wrap = document.createElement('div');
  wrap.className = 'view-dashboard';

  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - 30);
  const startStr = start.toISOString().slice(0, 10);
  const endStr = now.toISOString().slice(0, 10);

  wrap.innerHTML = `
    <h2>대시보드</h2>
    <div class="dashboard-filters">
      <label>기간 <input type="date" id="dash-start" value="${startStr}" /></label>
      <label>~ <input type="date" id="dash-end" value="${endStr}" /></label>
      <button type="button" class="btn btn-primary" id="dash-apply">적용</button>
    </div>
    <div class="kpi-grid" id="kpi-grid"></div>
    <div class="chart-container" id="chart-type-ratio">
      <h3>유형별 출동 비율</h3>
      <canvas id="chart-canvas" width="400" height="200"></canvas>
    </div>
  `;

  function renderKpis() {
    const start = document.getElementById('dash-start').value;
    const end = document.getElementById('dash-end').value;
    const periodStart = start ? new Date(start).toISOString() : null;
    const periodEnd = end ? new Date(end + 'T23:59:59').toISOString() : null;

    const reports = storage.listReports({ status: 'confirmed' }).filter(r => {
      if (periodStart && r.period_end < periodStart) return false;
      if (periodEnd && r.period_start > periodEnd) return false;
      return true;
    });

    const allStats = [];
    reports.forEach(r => allStats.push(...storage.getDailyStats(r.id)));

    const dailyByReport = reports.map(r => ({
      reportId: r.id,
      total: r.total_dispatch_count || 0,
      period_start: r.period_start,
    }));
    const totalDispatch = dailyByReport.reduce((s, d) => s + d.total, 0);

    const fireCount = allStats.filter(s => s.category === 'fire' && s.period_type === 'daily').reduce((s, x) => s + (x.dispatch_count || 0), 0);
    const rescueCount = allStats.filter(s => s.category === 'rescue' && s.period_type === 'daily').reduce((s, x) => s + (x.dispatch_count || 0), 0);
    const emergencyCount = allStats.filter(s => s.category === 'emergency' && s.period_type === 'daily').reduce((s, x) => s + (x.dispatch_count || 0), 0);
    const otherCount = allStats.filter(s => s.category === 'other' && s.period_type === 'daily').reduce((s, x) => s + (x.dispatch_count || 0), 0);

    const deaths = allStats.reduce((s, x) => s + (x.death_count || 0), 0);
    const injuries = allStats.reduce((s, x) => s + (x.injury_count || 0), 0);
    const damage = allStats.reduce((s, x) => s + (x.damage_amount_1000 || 0), 0);

    const allReports = storage.listReports();
    const unconfirmed = allReports.filter(r => r.status !== 'confirmed').length;

    const grid = document.getElementById('kpi-grid');
    grid.innerHTML = `
      <div class="kpi-card"><div class="kpi-value" id="kpi-total">${totalDispatch}</div><div class="kpi-label">총 출동 건수</div></div>
      <div class="kpi-card"><div class="kpi-value">${fireCount}</div><div class="kpi-label">화재</div></div>
      <div class="kpi-card"><div class="kpi-value">${rescueCount}</div><div class="kpi-label">구조</div></div>
      <div class="kpi-card"><div class="kpi-value">${emergencyCount}</div><div class="kpi-label">구급</div></div>
      <div class="kpi-card"><div class="kpi-value">${otherCount}</div><div class="kpi-label">기타</div></div>
      <div class="kpi-card"><div class="kpi-value">${deaths + injuries}</div><div class="kpi-label">인명피해(사망+부상)</div></div>
      <div class="kpi-card"><div class="kpi-value">${(damage / 10000).toFixed(0)}만원</div><div class="kpi-label">재산피해</div></div>
      <div class="kpi-card"><div class="kpi-value">${reports.length}</div><div class="kpi-label">확정 보고서</div></div>
      <div class="kpi-card"><div class="kpi-value">${unconfirmed}</div><div class="kpi-label">미검수</div></div>
    `;

    const totalType = fireCount + rescueCount + emergencyCount + otherCount || 1;
    const canvas = document.getElementById('chart-canvas');
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    const data = [
      { label: '화재', value: fireCount, color: '#c62828' },
      { label: '구조', value: rescueCount, color: '#1565c0' },
      { label: '구급', value: emergencyCount, color: '#2e7d32' },
      { label: '기타', value: otherCount, color: '#6d4c41' },
    ];
    let startAngle = 0;
    data.forEach(d => {
      const slice = (d.value / totalType) * 2 * Math.PI;
      ctx.fillStyle = d.color;
      ctx.beginPath();
      ctx.moveTo(w / 2, h / 2);
      ctx.arc(w / 2, h / 2, Math.min(w, h) / 2 - 10, startAngle, startAngle + slice);
      ctx.closePath();
      ctx.fill();
      startAngle += slice;
    });
    ctx.fillStyle = '#333';
    ctx.font = '12px sans-serif';
    data.forEach((d, i) => {
      ctx.fillText(`${d.label}: ${d.value}`, 10, 20 + i * 16);
    });
  }

  wrap.querySelector('#dash-apply').addEventListener('click', renderKpis);
  renderKpis();
  return wrap;
}
