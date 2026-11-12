// FRONTEND-ONLY AUTH SIMULATION.
// Accounts live in localStorage and the session in sessionStorage. This is NOT security:
// anyone with access to the browser can read or change this data. Never reuse it in production.

import { local, session, clearAllAppData } from './storage.js';
import { DEMO_ACCOUNTS, DEMO_PASSWORD, rakaAttempts, rakaLabInProgress } from '../data/seed.js';

const USERS_KEY = 'users';
const SESSION_KEY = 'session';
const SEEDED_KEY = 'seededAt';

/** Non-cryptographic hash (FNV-1a). Only avoids storing the demo password as plain text. */
export function demoHash(password, salt) {
  let h = 0x811c9dc5;
  const input = `${salt}::${password}`;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

export function seededAt() {
  return local.get(SEEDED_KEY, null);
}

export function ensureSeeded() {
  if (local.get(SEEDED_KEY) && local.get(USERS_KEY)) return;
  const anchor = Date.now();
  const createdAt = anchor - 21 * 86400000;
  const users = DEMO_ACCOUNTS.map((account) => ({
    id: account.id,
    name: account.name,
    email: account.email,
    role: account.role,
    kelas: account.kelas,
    school: 'SMP Negeri Simulasi',
    passwordHash: demoHash(DEMO_PASSWORD, account.id),
    createdAt,
    demo: true,
  }));
  local.set(USERS_KEY, users);
  local.set('attempts:u-raka', rakaAttempts(anchor));
  local.set('attempts:u-nadia', []);
  const lab = rakaLabInProgress(anchor);
  local.set(`lab:u-raka:${lab.problemId}`, lab);
  local.set('labs:u-raka', [lab.problemId]);
  local.set(SEEDED_KEY, anchor);
}

export function resetDemoData() {
  clearAllAppData();
  ensureSeeded();
}

export const getUsers = () => local.get(USERS_KEY, []);
export const getUser = (id) => getUsers().find((u) => u.id === id) || null;
const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

export function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normalizeEmail(email));
}

export function login(email, password) {
  const user = getUsers().find((u) => u.email === normalizeEmail(email));
  if (!user || user.passwordHash !== demoHash(password, user.id)) {
    return { ok: false, error: 'Email atau kata sandi tidak cocok. Periksa kembali, atau gunakan salah satu akun demo.' };
  }
  session.set(SESSION_KEY, { userId: user.id, role: user.role, at: Date.now() });
  return { ok: true, user };
}

export function logout() {
  session.remove(SESSION_KEY);
}

export function currentUser() {
  const current = session.get(SESSION_KEY);
  if (!current) return null;
  const user = getUser(current.userId);
  if (!user) {
    session.remove(SESSION_KEY);
    return null;
  }
  return user;
}

export function register({ name, email, password, role, kelas }) {
  const errors = {};
  const cleanName = String(name || '').trim();
  if (cleanName.length < 3) errors.name = 'Nama minimal 3 huruf.';
  if (!validateEmail(email)) errors.email = 'Masukkan email yang valid, misalnya nama@sekolah.id.';
  else if (getUsers().some((u) => u.email === normalizeEmail(email))) errors.email = 'Email ini sudah terdaftar. Masuk dengan email tersebut atau pakai email lain.';
  if (String(password || '').length < 6) errors.password = 'Kata sandi minimal 6 karakter.';
  if (!['student', 'teacher'].includes(role)) errors.role = 'Pilih peran terlebih dahulu.';
  if (!kelas) errors.kelas = 'Pilih kelas.';
  if (Object.keys(errors).length) return { ok: false, errors };

  const id = `u-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const user = {
    id,
    name: cleanName,
    email: normalizeEmail(email),
    role,
    kelas,
    school: 'SMP Negeri Simulasi',
    passwordHash: demoHash(password, id),
    createdAt: Date.now(),
    demo: false,
  };
  local.set(USERS_KEY, [...getUsers(), user]);
  if (role === 'student') local.set(`attempts:${id}`, []);
  session.set(SESSION_KEY, { userId: id, role, at: Date.now() });
  return { ok: true, user };
}

export function updateProfile(userId, patch) {
  const users = getUsers();
  const index = users.findIndex((u) => u.id === userId);
  if (index === -1) return { ok: false, errors: { form: 'Akun tidak ditemukan.' } };
  const name = String(patch.name ?? users[index].name).trim();
  if (name.length < 3) return { ok: false, errors: { name: 'Nama minimal 3 huruf.' } };
  users[index] = { ...users[index], name, kelas: patch.kelas || users[index].kelas };
  local.set(USERS_KEY, users);
  return { ok: true, user: users[index] };
}

export function homePathFor(user) {
  return user?.role === 'teacher' ? '/guru' : '/belajar';
}
