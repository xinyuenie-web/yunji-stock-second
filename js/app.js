/**
 * 云基公司二次股权激励管理系统 – 应用逻辑
 */

/* ── Helpers ──────────────────────────────────────────── */

const CHINESE_ORDINALS = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];

function chineseOrdinal(n) {
  return CHINESE_ORDINALS[n] !== undefined ? CHINESE_ORDINALS[n] : String(n + 1);
}

function chinesePeriod(period) {
  const idx = period - 1;
  return CHINESE_ORDINALS[idx] !== undefined ? CHINESE_ORDINALS[idx] : String(period);
}

function fmt(n) {
  return Number(n).toLocaleString('zh-CN');
}

function fmtMoney(n) {
  return Number(n).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function getTarget(id) {
  return targets.find(t => t.id === id);
}

function totalShares() {
  return targets.filter(t => t.status !== 'resigned').reduce((s, t) => s + t.shares, 0);
}

function vestedShares(period) {
  // Returns total vested up through the given period (1-indexed); if no argument, all periods
  const maxPeriod = period != null ? period : PLAN_INFO.vestingRatios.length;
  return targets
    .filter(t => t.status !== 'resigned')
    .reduce((sum, t) => {
      let v = 0;
      for (let i = 0; i < maxPeriod; i++) v += Math.floor(t.shares * PLAN_INFO.vestingRatios[i]);
      return sum + v;
    }, 0);
}

function exercisedShares() {
  return exerciseRecords
    .filter(r => r.status === 'completed')
    .reduce((s, r) => s + r.shares, 0);
}

function currentVestingPeriod() {
  const now = new Date();
  for (let i = 0; i < PLAN_INFO.vestingDates.length; i++) {
    if (now < new Date(PLAN_INFO.vestingDates[i])) return i; // 0-indexed: 0 means none vested yet
  }
  return PLAN_INFO.vestingDates.length; // all periods vested
}

/* ── Tab navigation ───────────────────────────────────── */

function initTabs() {
  const items = document.querySelectorAll('.nav-item');
  const sections = document.querySelectorAll('.tab-section');

  items.forEach(item => {
    item.addEventListener('click', () => {
      items.forEach(i => i.classList.remove('active'));
      sections.forEach(s => s.classList.remove('active'));
      item.classList.add('active');
      const tab = item.dataset.tab;
      document.getElementById('tab-' + tab).classList.add('active');
    });
  });
}

/* ── Header date ──────────────────────────────────────── */

function initDate() {
  const now = new Date();
  const opts = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' };
  document.getElementById('currentDate').textContent =
    now.toLocaleDateString('zh-CN', opts);
}

/* ── Dashboard ────────────────────────────────────────── */

function renderDashboard() {
  const total = totalShares();
  const vested = vestedShares(currentVestingPeriod());
  const exercised = exercisedShares();

  document.getElementById('stat-total-targets').textContent =
    targets.filter(t => t.status !== 'resigned').length;
  document.getElementById('stat-total-shares').textContent   = fmt(total);
  document.getElementById('stat-vested-shares').textContent  = fmt(vested);
  document.getElementById('stat-exercised-shares').textContent = fmt(exercised);
  document.getElementById('stat-exercise-price').textContent = fmtMoney(PLAN_INFO.exercisePrice);
  document.getElementById('stat-grant-date').textContent     = PLAN_INFO.grantDate;

  // Dept table
  const deptMap = {};
  targets.filter(t => t.status !== 'resigned').forEach(t => {
    if (!deptMap[t.dept]) deptMap[t.dept] = { count: 0, shares: 0 };
    deptMap[t.dept].count++;
    deptMap[t.dept].shares += t.shares;
  });
  const deptBody = document.getElementById('dept-table-body');
  deptBody.innerHTML = '';
  Object.entries(deptMap)
    .sort((a, b) => b[1].shares - a[1].shares)
    .forEach(([dept, info]) => {
      const pct = total > 0 ? ((info.shares / total) * 100).toFixed(1) : '0.0';
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${dept}</td>
        <td>${info.count}</td>
        <td>${fmt(info.shares)}</td>
        <td>
          <div class="progress-wrap">
            <div class="progress-track">
              <div class="progress-fill progress-fill--part" style="width:${pct}%"></div>
            </div>
            <span class="progress-pct">${pct}%</span>
          </div>
        </td>`;
      deptBody.appendChild(tr);
    });

  // Vesting progress bars
  const vpWrap = document.getElementById('vesting-progress-wrap');
  vpWrap.innerHTML = '';
  const now = new Date();
  PLAN_INFO.vestingDates.forEach((dateStr, i) => {
    const ratio = PLAN_INFO.vestingRatios[i];
    const pct = (ratio * 100).toFixed(0);
    const done = now >= new Date(dateStr);
    const row = document.createElement('div');
    row.className = 'vp-row';
    row.innerHTML = `
      <span class="vp-label">第${chineseOrdinal(i)}归属期（${dateStr}）</span>
      <div class="vp-bar-track">
        <div class="vp-bar-fill ${done ? 'vp-bar-fill--done' : ''}" style="width:${done ? pct : 0}%"></div>
      </div>
      <span class="vp-pct">${done ? pct : 0}%</span>`;
    vpWrap.appendChild(row);
  });
}

/* ── Targets ──────────────────────────────────────────── */

function renderTargets(filter = '') {
  const deptFilter  = document.getElementById('filter-dept').value;
  const levelFilter = document.getElementById('filter-level').value;
  const search      = filter || document.getElementById('search-target').value.toLowerCase();

  const body = document.getElementById('targets-table-body');
  body.innerHTML = '';

  const filtered = targets.filter(t => {
    const matchSearch = !search || t.name.toLowerCase().includes(search) ||
                        t.id.toLowerCase().includes(search);
    const matchDept   = !deptFilter  || t.dept  === deptFilter;
    const matchLevel  = !levelFilter || t.level === levelFilter;
    return matchSearch && matchDept && matchLevel;
  });

  filtered.forEach((t, idx) => {
    const statusBadge = {
      active:   '<span class="badge badge-success">在职</span>',
      resigned: '<span class="badge badge-danger">离职</span>',
      pending:  '<span class="badge badge-warning">待确认</span>',
    }[t.status] || t.status;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${idx + 1}</td>
      <td>${t.id}</td>
      <td><strong>${t.name}</strong></td>
      <td>${t.dept}</td>
      <td>${t.title}</td>
      <td><span class="badge badge-info">${t.level}</span></td>
      <td>${fmt(t.shares)}</td>
      <td>${fmtMoney(PLAN_INFO.exercisePrice)}</td>
      <td>${statusBadge}</td>
      <td>
        <button class="btn-link" onclick="editTarget('${t.id}')">编辑</button>
        &nbsp;
        <button class="btn-danger-sm" onclick="removeTarget('${t.id}')">移除</button>
      </td>`;
    body.appendChild(tr);
  });

  if (filtered.length === 0) {
    const tr = document.createElement('tr');
    tr.innerHTML = '<td colspan="10" style="text-align:center;color:#999;padding:24px">暂无数据</td>';
    body.appendChild(tr);
  }
}

function populateDeptFilter() {
  const depts = [...new Set(targets.map(t => t.dept))].sort();
  const sel = document.getElementById('filter-dept');
  depts.forEach(d => {
    const opt = document.createElement('option');
    opt.value = d;
    opt.textContent = d;
    sel.appendChild(opt);
  });
}

function editTarget(id) {
  const t = getTarget(id);
  if (!t) return;
  document.getElementById('f-emp-id').value = t.id;
  document.getElementById('f-name').value   = t.name;
  document.getElementById('f-dept').value   = t.dept;
  document.getElementById('f-title').value  = t.title;
  document.getElementById('f-level').value  = t.level;
  document.getElementById('f-shares').value = t.shares;
  document.getElementById('modal-target-title').textContent = '编辑激励对象';
  document.getElementById('btn-save-target').dataset.editId = id;
  document.getElementById('modal-target').style.display = 'flex';
}

function removeTarget(id) {
  if (!confirm('确认将该激励对象标记为"离职"并取消其未归属股份？')) return;
  const t = getTarget(id);
  if (t) t.status = 'resigned';
  renderTargets();
  renderDashboard();
  renderGrants();
}

function initTargets() {
  populateDeptFilter();
  renderTargets();

  document.getElementById('search-target').addEventListener('input', () => renderTargets());
  document.getElementById('filter-dept').addEventListener('change', () => renderTargets());
  document.getElementById('filter-level').addEventListener('change', () => renderTargets());

  document.getElementById('btn-add-target').addEventListener('click', () => {
    document.getElementById('f-emp-id').value = '';
    document.getElementById('f-name').value   = '';
    document.getElementById('f-dept').value   = '';
    document.getElementById('f-title').value  = '';
    document.getElementById('f-level').value  = '核心技术人员';
    document.getElementById('f-shares').value = '';
    document.getElementById('modal-target-title').textContent = '新增激励对象';
    delete document.getElementById('btn-save-target').dataset.editId;
    document.getElementById('modal-target').style.display = 'flex';
  });

  document.getElementById('btn-save-target').addEventListener('click', () => {
    const id     = document.getElementById('f-emp-id').value.trim();
    const name   = document.getElementById('f-name').value.trim();
    const dept   = document.getElementById('f-dept').value.trim();
    const title  = document.getElementById('f-title').value.trim();
    const level  = document.getElementById('f-level').value;
    const shares = parseInt(document.getElementById('f-shares').value, 10);

    if (!id || !name || !dept || isNaN(shares) || shares <= 0) {
      alert('请填写必填项（工号、姓名、部门、授予股份）');
      return;
    }

    const editId = document.getElementById('btn-save-target').dataset.editId;
    if (editId) {
      const t = getTarget(editId);
      if (t) { t.id = id; t.name = name; t.dept = dept; t.title = title; t.level = level; t.shares = shares; }
    } else {
      if (targets.find(t => t.id === id)) {
        alert('工号已存在，请重新输入');
        return;
      }
      targets.push({ id, name, dept, title, level, shares, status: 'active' });
    }

    document.getElementById('modal-target').style.display = 'none';
    renderTargets();
    renderDashboard();
    renderGrants();
    renderVesting();
    populateExerciseTargetSelect();
  });
}

/* ── Grants ───────────────────────────────────────────── */

function renderGrants() {
  const body = document.getElementById('grants-table-body');
  body.innerHTML = '';
  targets.forEach((t, idx) => {
    const statusBadge = t.status === 'resigned'
      ? '<span class="badge badge-danger">已取消</span>'
      : '<span class="badge badge-success">有效</span>';
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${idx + 1}</td>
      <td>${t.id}</td>
      <td><strong>${t.name}</strong></td>
      <td>${t.dept}</td>
      <td>${fmt(t.shares)}</td>
      <td>${fmtMoney(PLAN_INFO.exercisePrice)}</td>
      <td>${PLAN_INFO.grantDate}</td>
      <td>${statusBadge}</td>`;
    body.appendChild(tr);
  });
}

/* ── Vesting ──────────────────────────────────────────── */

function renderVestingCards() {
  const container = document.getElementById('vesting-schedule-cards');
  container.innerHTML = '';
  const now = new Date();
  const chineseNums = CHINESE_ORDINALS;

  PLAN_INFO.vestingDates.forEach((dateStr, i) => {
    const ratio = PLAN_INFO.vestingRatios[i];
    const total = totalShares();
    const periodShares = targets
      .filter(t => t.status !== 'resigned')
      .reduce((s, t) => s + Math.floor(t.shares * ratio), 0);
    const done = now >= new Date(dateStr);
    const active = !done && (i === 0 || now >= new Date(PLAN_INFO.vestingDates[i - 1]));

    const card = document.createElement('div');
    card.className = 'vs-card';
    const badge = done
      ? '<span class="badge badge-success vs-card__badge">已归属</span>'
      : active
        ? '<span class="badge badge-warning vs-card__badge">归属中</span>'
        : '<span class="badge badge-default vs-card__badge">未到期</span>';
    card.innerHTML = `
      ${badge}
      <div class="vs-card__period">第${chineseOrdinal(i)}归属期（${(ratio * 100).toFixed(0)}%）</div>
      <div class="vs-card__date">${dateStr}</div>
      <div class="vs-card__rows">
        <div class="vs-card__row">
          <span class="vs-card__row-label">归属股份</span>
          <span class="vs-card__row-val">${fmt(periodShares)} 股</span>
        </div>
        <div class="vs-card__row">
          <span class="vs-card__row-label">占授予总量</span>
          <span class="vs-card__row-val">${(ratio * 100).toFixed(0)}%</span>
        </div>
      </div>`;
    container.appendChild(card);
  });
}

function renderVestingTable() {
  const search  = document.getElementById('search-vesting').value.toLowerCase();
  const period  = document.getElementById('filter-vesting-period').value;
  const body    = document.getElementById('vesting-table-body');
  body.innerHTML = '';

  const now = new Date();
  const vestedPeriods = PLAN_INFO.vestingDates.filter(d => now >= new Date(d)).length;

  targets
    .filter(t => !search || t.name.toLowerCase().includes(search))
    .forEach(t => {
      const p1 = Math.floor(t.shares * PLAN_INFO.vestingRatios[0]);
      const p2 = Math.floor(t.shares * PLAN_INFO.vestingRatios[1]);
      const p3 = Math.floor(t.shares * PLAN_INFO.vestingRatios[2]);
      let vestedTotal = 0;
      if (vestedPeriods >= 1) vestedTotal += p1;
      if (vestedPeriods >= 2) vestedTotal += p2;
      if (vestedPeriods >= 3) vestedTotal += p3;
      const pct = t.shares > 0 ? ((vestedTotal / t.shares) * 100).toFixed(0) : 0;
      const fillClass = pct >= 100 ? 'progress-fill--full' : 'progress-fill--part';

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${t.name}</strong></td>
        <td>${t.dept}</td>
        <td>${fmt(t.shares)}</td>
        <td>${vestedPeriods >= 1 ? fmt(p1) : '<span style="color:#bbb">—</span>'}</td>
        <td>${vestedPeriods >= 2 ? fmt(p2) : '<span style="color:#bbb">—</span>'}</td>
        <td>${vestedPeriods >= 3 ? fmt(p3) : '<span style="color:#bbb">—</span>'}</td>
        <td><strong>${fmt(vestedTotal)}</strong></td>
        <td>
          <div class="progress-wrap">
            <div class="progress-track">
              <div class="progress-fill ${fillClass}" style="width:${pct}%"></div>
            </div>
            <span class="progress-pct">${pct}%</span>
          </div>
        </td>`;
      body.appendChild(tr);
    });
}

function renderVesting() {
  renderVestingCards();
  renderVestingTable();
}

/* ── Exercise records ─────────────────────────────────── */

function populateExerciseTargetSelect() {
  const sel = document.getElementById('f-ex-target');
  sel.innerHTML = '';
  targets
    .filter(t => t.status === 'active')
    .forEach(t => {
      const opt = document.createElement('option');
      opt.value = t.id;
      opt.textContent = `${t.name}（${t.id}）`;
      sel.appendChild(opt);
    });
}

function renderExerciseTable() {
  const body = document.getElementById('exercise-table-body');
  body.innerHTML = '';

  exerciseRecords.forEach((r, idx) => {
    const t = getTarget(r.targetId);
    const statusBadge = {
      completed: '<span class="badge badge-success">已完成</span>',
      pending:   '<span class="badge badge-warning">待审核</span>',
      cancelled: '<span class="badge badge-danger">已取消</span>',
    }[r.status] || r.status;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${idx + 1}</td>
      <td>${r.targetId}</td>
      <td><strong>${t ? t.name : '—'}</strong></td>
      <td>${t ? t.dept : '—'}</td>
      <td>${r.date}</td>
      <td>${fmt(r.shares)}</td>
      <td>${fmtMoney(r.price)}</td>
      <td>${fmtMoney(r.shares * r.price)}</td>
      <td>第${chinesePeriod(r.period)}归属期</td>
      <td>${statusBadge}</td>`;
    body.appendChild(tr);
  });

  if (exerciseRecords.length === 0) {
    const tr = document.createElement('tr');
    tr.innerHTML = '<td colspan="10" style="text-align:center;color:#999;padding:24px">暂无行权记录</td>';
    body.appendChild(tr);
  }

  // Summary
  const completedRecords = exerciseRecords.filter(r => r.status === 'completed');
  const totalExShares = completedRecords.reduce((s, r) => s + r.shares, 0);
  const totalExAmount = completedRecords.reduce((s, r) => s + r.shares * r.price, 0);
  document.getElementById('exercise-summary').innerHTML = `
    <div class="summary-item">
      <span class="summary-item__label">已完成行权记录</span>
      <span class="summary-item__val">${completedRecords.length} 笔</span>
    </div>
    <div class="summary-item">
      <span class="summary-item__label">累计行权股份</span>
      <span class="summary-item__val">${fmt(totalExShares)} 股</span>
    </div>
    <div class="summary-item">
      <span class="summary-item__label">累计行权金额</span>
      <span class="summary-item__val">¥${fmtMoney(totalExAmount)}</span>
    </div>`;
}

function initExercise() {
  populateExerciseTargetSelect();
  renderExerciseTable();

  // Set default date to today
  document.getElementById('f-ex-date').value = new Date().toISOString().slice(0, 10);

  document.getElementById('btn-add-exercise').addEventListener('click', () => {
    document.getElementById('f-ex-date').value = new Date().toISOString().slice(0, 10);
    document.getElementById('f-ex-shares').value = '';
    document.getElementById('f-ex-period').value = '1';
    document.getElementById('modal-exercise').style.display = 'flex';
  });

  document.getElementById('btn-save-exercise').addEventListener('click', () => {
    const targetId = document.getElementById('f-ex-target').value;
    const date     = document.getElementById('f-ex-date').value;
    const shares   = parseInt(document.getElementById('f-ex-shares').value, 10);
    const period   = parseInt(document.getElementById('f-ex-period').value, 10);

    if (!targetId || !date || isNaN(shares) || shares <= 0) {
      alert('请填写完整行权信息');
      return;
    }

    const seq = exerciseRecords.length > 0
      ? Math.max(...exerciseRecords.map(r => r.seq)) + 1
      : 1;

    exerciseRecords.push({
      seq, targetId, date, shares,
      price: PLAN_INFO.exercisePrice,
      period, status: 'pending',
    });

    document.getElementById('modal-exercise').style.display = 'none';
    renderExerciseTable();
    renderDashboard();
  });
}

/* ── Modal close ──────────────────────────────────────── */

function initModals() {
  document.querySelectorAll('.modal-close, [data-modal]').forEach(btn => {
    btn.addEventListener('click', () => {
      const modalId = btn.dataset.modal;
      if (modalId) document.getElementById(modalId).style.display = 'none';
    });
  });

  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) overlay.style.display = 'none';
    });
  });
}

/* ── Vesting filters ──────────────────────────────────── */

function initVestingFilters() {
  document.getElementById('search-vesting').addEventListener('input', renderVestingTable);
  document.getElementById('filter-vesting-period').addEventListener('change', renderVestingTable);
}

/* ── Init ─────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {
  initDate();
  initTabs();
  initModals();

  renderDashboard();
  initTargets();
  renderGrants();
  renderVesting();
  initExercise();
  initVestingFilters();
});
