import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { database } from '../database';

const lifetime = 30 * 24 * 60 * 60;
const cookieName = (classId: string) => 'riskman_guest_' + classId;
const digest = (token: string) => createHash('sha256').update(token).digest('hex');

export async function guestForClass(req: Request, classId: string) {
  const value = (req.headers.get('cookie') || '').split(';').map(s => s.trim())
    .find(s => s.startsWith(cookieName(classId) + '='))?.split('=')[1];
  if (!value || !/^[a-f0-9]{64}$/.test(value)) return null;
  return database().prepare(`SELECT s.id, s.group_id FROM risk_guest_sessions s
    JOIN risk_memberships m ON m.user_id=s.id AND m.group_id=s.group_id AND m.class_id=s.class_id
    WHERE s.token_hash=? AND s.class_id=? AND s.revoked_at IS NULL AND s.expires_at>?`)
    .bind(digest(value), classId, new Date().toISOString()).first<{id:string;group_id:string}>();
}

export function newGuest(classId: string, groupId: string, req: Request) {
  const token = randomBytes(32).toString('hex');
  return {
    id: 'guest_' + randomUUID(), classId, groupId, hash: digest(token),
    expires: new Date(Date.now() + lifetime * 1000).toISOString(),
    cookie: `${cookieName(classId)}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${lifetime}${new URL(req.url).protocol === 'https:' ? '; Secure' : ''}`,
  };
}
