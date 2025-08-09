async function postJSON(url, data) {
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || 'Request failed');
  return body;
}

window.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('signupForm');
  const msg = document.getElementById('msg');
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    msg.innerHTML = '';
    const data = Object.fromEntries(new FormData(form).entries());
    try {
      await postJSON('/api/auth/signup', data);
      msg.innerHTML = '<div class="alert alert-success">Account created. You can now sign in.</div>';
      form.reset();
    } catch (err) {
      msg.innerHTML = `<div class="alert alert-danger">${err.message}</div>`;
    }
  });
});


