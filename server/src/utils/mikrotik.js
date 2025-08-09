import { RouterOSAPI } from 'node-routeros';

export async function addHotspotUser({ host, user, password, tls, port, username, profile, comment }) {
  const conn = new RouterOSAPI({ host, user, password, tls: !!tls, port: Number(port || 8728), keepalive: true, timeout: 5000 });
  try {
    await conn.connect();
    const existing = await conn.write('/ip/hotspot/user/print', { '.proplist': '.id,name', '?name': username });
    if (existing && existing.length > 0) {
      await conn.close();
      return { ok: true, alreadyExisted: true };
    }
    await conn.write('/ip/hotspot/user/add', { name: username, profile: profile || 'default', comment: comment || '' });
    await conn.close();
    return { ok: true };
  } catch (err) {
    try { await conn.close(); } catch {}
    return { ok: false, error: err.message };
  }
}

export async function authorizeByAddressList({ host, user, password, tls, port, ipAddress, comment }) {
  const conn = new RouterOSAPI({ host, user, password, tls: !!tls, port: Number(port || 8728), keepalive: true, timeout: 5000 });
  try {
    await conn.connect();
    await conn.write('/ip/firewall/address-list/add', { list: 'allowed', address: ipAddress, comment: comment || '' });
    await conn.close();
    return { ok: true };
  } catch (err) {
    try { await conn.close(); } catch {}
    return { ok: false, error: err.message };
  }
}


