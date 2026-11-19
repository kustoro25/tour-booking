// One-off: perbaiki NEXT_PUBLIC_SITE_URL produksi ke domain kanonik baru
// (migrasi domain → https://www.haybalitrans.com). Dipakai karena `vercel env
// add` via stdin di PowerShell 5.1 menambah newline ke nilai env.
const fs = require('fs');
const path = require('path');

const AUTH_PATH = path.join(process.env.APPDATA, 'xdg.data', 'com.vercel.cli', 'auth.json');
const PROJECT_ID = 'prj_XSl4XbLkkzaAE0PG0d5F323VTh8L';
const TEAM_ID = 'team_Lq0ESefBtG6RRUJyx5WwqWFr';
const NEW_VALUE = 'https://haybalitrans.com';

async function main() {
  const { token } = JSON.parse(fs.readFileSync(AUTH_PATH, 'utf8'));
  const base = `https://api.vercel.com/v9/projects/${PROJECT_ID}/env`;
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const listRes = await fetch(`${base}?teamId=${TEAM_ID}`, { headers });
  if (!listRes.ok) throw new Error(`list env: HTTP ${listRes.status}`);
  const list = await listRes.json();

  const target = list.envs.find((e) => e.key === 'NEXT_PUBLIC_SITE_URL');
  if (!target) throw new Error('NEXT_PUBLIC_SITE_URL tidak ditemukan di project');

  // Tipe Sensitive tidak bisa diubah → hapus dulu, lalu buat ulang sebagai plain.
  const delRes = await fetch(`${base}/${target.id}?teamId=${TEAM_ID}`, { method: 'DELETE', headers });
  if (!delRes.ok) throw new Error(`delete env: HTTP ${delRes.status}`);

  const createRes = await fetch(`${base}?teamId=${TEAM_ID}`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ key: 'NEXT_PUBLIC_SITE_URL', value: NEW_VALUE, type: 'plain', target: ['production'] }),
  });
  const created = await createRes.json();
  if (created.error) throw new Error(`create env: ${JSON.stringify(created.error)}`);

  console.log('OK —', created.key, '| type:', created.type, '| value:', JSON.stringify(created.value));
}

main().catch((err) => {
  console.error('GAGAL:', err.message);
  process.exit(1);
});
