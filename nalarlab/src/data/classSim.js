// Deterministic simulated class for the teacher dashboard.
// Generated from a fixed seed so every visit shows the same (clearly labelled) simulated data.

import { PROBLEMS, TOPICS, SKILLS } from './curriculum.js';
import { scoreAttempt } from '../engine/learning.js';

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const NAMES = [
  'Adelia Rahma', 'Bima Saputra', 'Citra Lestari', 'Dafa Ramadhan', 'Eka Nuraini', 'Fajar Hidayat',
  'Gita Maharani', 'Hafiz Akbar', 'Intan Permata', 'Joko Susilo', 'Kirana Ayu', 'Lukman Hakim',
  'Mega Puspita', 'Naufal Rizky', 'Olivia Hutapea', 'Putu Ari Wibawa', 'Qori Amalia', 'Rizal Fauzi',
  'Salsabila Zahra', 'Taufik Maulana', 'Ursula Manurung', 'Vino Kurniawan', 'Wulan Sari', 'Yusuf Ibrahim',
];

const DIFFICULTY = { pahami: -0.08, pola: 0, model: 0.14, simbol: 0.2, tafsir: 0.1 };

const BUG_WEIGHTS = {
  barisan: { 'off-by-one': 4, 'konstanta-hilang': 3, 'konstanta-salah': 2, tertukar: 1 },
  linear: { tertukar: 3, 'off-by-one': 2, 'konstanta-salah': 1, tanda: 1 },
  linearDecreasing: { tanda: 5, tertukar: 2, 'konstanta-salah': 1 },
  rasio: { aditif: 6, 'beda-salah': 3, 'konstanta-salah': 1 },
};

function pickWeighted(rand, weights) {
  const entries = Object.entries(weights);
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let r = rand() * total;
  for (const [id, w] of entries) {
    r -= w;
    if (r <= 0) return id;
  }
  return entries[0][0];
}

const ORDERED = TOPICS.flatMap((t) => PROBLEMS.filter((p) => p.topic === t.id).sort((a, b) => a.order - b.order));
const DAY = 86400000;

export function simulateClass(anchor, seed = 2026) {
  const rand = mulberry32(seed);
  return NAMES.map((name, index) => {
    const ability = 0.3 + rand() * 0.6;
    const missions = 2 + Math.floor(rand() * 6);
    const id = `sim-${index + 1}`;
    const attempts = [];
    let day = 20 - Math.floor(rand() * 3);
    for (let k = 0; k < missions && k < ORDERED.length; k += 1) {
      const problem = ORDERED[k];
      const skills = {};
      const bugs = [];
      let hints = 0;
      for (const skill of SKILLS) {
        const p = Math.min(0.95, Math.max(0.05, ability + 0.04 * k - DIFFICULTY[skill.id] + (rand() - 0.5) * 0.25));
        const firstTry = rand() < p;
        skills[skill.id] = { firstTry, tries: firstTry ? 1 : 2 + Math.floor(rand() * 2) };
        if (!firstTry && (skill.id === 'model' || skill.id === 'simbol')) {
          const key = problem.topic === 'linear' && problem.step < 0 ? 'linearDecreasing' : problem.topic;
          bugs.push(pickWeighted(rand, BUG_WEIGHTS[key]));
        }
        if (!firstTry && rand() < 0.5) hints += 1;
      }
      day = Math.max(0, day - (1 + Math.floor(rand() * 3)));
      const finishedAt = new Date(anchor - day * DAY).setHours(13 + Math.floor(rand() * 7), Math.floor(rand() * 60), 0, 0);
      const durationSec = 360 + Math.floor(rand() * 720);
      attempts.push({
        id: `${id}-${problem.id}`,
        userId: id,
        problemId: problem.id,
        startedAt: finishedAt - durationSec * 1000,
        finishedAt,
        durationSec,
        skills,
        bugs,
        hints,
        score: scoreAttempt(skills),
        simulated: true,
      });
    }
    return { id, name, kelas: '8A', role: 'student', simulated: true, attempts };
  });
}
