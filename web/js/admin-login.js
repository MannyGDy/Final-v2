async function postJSON(url, data) {
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || 'Request failed');
  return body;
}

window.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');
  const msg = document.getElementById('msg');
  form.addEventListener('submit', async (e) => {
    e.preventDefault(); msg.innerHTML='';
    const data = Object.fromEntries(new FormData(form).entries());
    try {
      await postJSON('/api/admin/login', data);
      window.location.href = '/admin/dashboard.html';
    } catch (err) {
      msg.innerHTML = `<div class="alert alert-danger">${err.message}</div>`;
    }
  });
});


