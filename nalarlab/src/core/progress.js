// Attempts and in-progress lab state, persisted per user in localStorage.

import { local } from './storage.js';
import { getUsers, seededAt } from './auth.js';
import { simulateClass } from '../data/classSim.js';

export const getAttempts = (userId) => local.get(`attempts:${userId}`, []);

export function addAttempt(userId, attempt) {
  const list = getAttempts(userId);
  list.push(attempt);
  local.set(`attempts:${userId}`, list);
  return list;
}

export const getLabState = (userId, problemId) => local.get(`lab:${userId}:${problemId}`, null);

export function saveLabState(userId, problemId, state) {
  local.set(`lab:${userId}:${problemId}`, { ...state, updatedAt: Date.now() });
  const index = local.get(`labs:${userId}`, []);
  if (!index.includes(problemId)) local.set(`labs:${userId}`, [...index, problemId]);
}

export function clearLabState(userId, problemId) {
  local.remove(`lab:${userId}:${problemId}`);
  local.set(
    `labs:${userId}`,
    local.get(`labs:${userId}`, []).filter((id) => id !== problemId),
  );
}

/** Labs started but not finished, newest first. */
export function inProgressLabs(userId) {
  return local
    .get(`labs:${userId}`, [])
    .map((problemId) => getLabState(userId, problemId))
    .filter(Boolean)
    .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
}

/** Real local students of a class + the simulated classmates. */
export function classRoster(kelas = '8A') {
  const anchor = seededAt() || Date.now();
  const realStudents = getUsers()
    .filter((u) => u.role === 'student' && u.kelas === kelas)
    .map((u) => ({ id: u.id, name: u.name, kelas: u.kelas, simulated: false, attempts: getAttempts(u.id) }));
  const simulated = kelas === '8A' ? simulateClass(anchor) : [];
  return [...realStudents, ...simulated];
}
