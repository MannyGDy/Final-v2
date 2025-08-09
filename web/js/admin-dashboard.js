async function getJSON(url) {
  const res = await fetch(url);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || 'Request failed');
  return body;
}
async function postJSON(url, data) {
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || 'Request failed');
  return body;
}
function bytesToGB(n) { return (Number(n||0) / (1024**3)).toFixed(2); }
function secondsToHHMM(n) { const s = Number(n||0); const h = Math.floor(s/3600); const m = Math.floor((s%3600)/60); return `${h}h ${m}m`; }

async function loadOverview() {
  const data = await getJSON('/api/stats/overview');
  document.getElementById('totalUsers').innerText = data.totals.totalUsers;
  document.getElementById('activeUsers').innerText = data.totals.activeUsers;
  document.getElementById('totalData').innerText = bytesToGB(data.totals.totalBytes) + ' GB';
}
async function loadUsers() {
  const data = await getJSON('/api/admin/users');
  const tbody = document.querySelector('#usersTable tbody');
  tbody.innerHTML = '';
  for (const u of data.users) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${u.full_name}</td><td>${u.company_name||''}</td><td>${u.email}</td><td>${u.phone_number}</td><td>${new Date(u.created_at).toLocaleString()}</td>`;
    tbody.appendChild(tr);
  }
  const filter = document.getElementById('filterInput');
  filter.addEventListener('input', () => {
    const q = filter.value.toLowerCase();
    for (const row of tbody.querySelectorAll('tr')) {
      row.style.display = row.innerText.toLowerCase().includes(q) ? '' : 'none';
    }
  });
}
async function loadPerUser() {
  const data = await getJSON('/api/stats/per-user');
  const tbody = document.querySelector('#statsTable tbody');
  tbody.innerHTML = '';
  const labels=[]; const totals=[];
  for (const u of data.users) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${u.username}</td><td>${u.full_name}</td><td>${u.company_name||''}</td><td>${u.sessions}</td><td>${u.last_login ? new Date(u.last_login).toLocaleString() : '-'}</td><td>${secondsToHHMM(u.total_seconds)}</td><td>${bytesToGB(u.input_octets)} GB</td><td>${bytesToGB(u.output_octets)} GB</td>`;
    tbody.appendChild(tr);
    labels.push(u.username);
    totals.push((Number(u.input_octets)+Number(u.output_octets))/(1024**3));
  }
  const ctx = document.getElementById('usageChart');
  if (ctx) new Chart(ctx, { type: 'bar', data: { labels, datasets: [{ label: 'Total Data (GB)', data: totals, backgroundColor: 'rgba(54,162,235,.6)' }] }, options: { responsive: true, plugins: { legend: { display:false } } } });
}

window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('logoutBtn').addEventListener('click', async () => {
    await postJSON('/api/admin/logout', {}); location.href='/admin/index.html';
  });
  (async function init(){
    try { await loadOverview(); await loadUsers(); await loadPerUser(); } catch(e){ alert('Session expired or error. Please login again.'); location.href='/admin/index.html'; }
  })();
});


