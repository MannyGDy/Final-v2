async function postJSON(url, data) {
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || 'Request failed');
  return body;
}

window.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('signinForm');
  const msg = document.getElementById('msg');
  const ipField = document.getElementById('clientIp');
  const urlParams = new URLSearchParams(location.search);
  if (urlParams.get('client_ip')) ipField.value = urlParams.get('client_ip');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    msg.innerHTML = '';
    const data = Object.fromEntries(new FormData(form).entries());
    try {
      await postJSON('/api/auth/signin', data);
      msg.innerHTML = '<div class="alert alert-success">Authenticated. You now have access.</div>';
      setTimeout(() => { window.location.href = '/success.html'; }, 800);
    } catch (err) {
      msg.innerHTML = `<div class="alert alert-danger">${err.message}</div>`;
    }
  });
});


