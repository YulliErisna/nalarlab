// Demo accounts and their starting activity. All of this is simulated data.

import { scoreAttempt } from '../engine/learning.js';

export const DEMO_PASSWORD = 'nalar123';

export const DEMO_ACCOUNTS = [
  { id: 'u-raka', name: 'Raka Pratama', email: 'siswa@nalarlab.demo', role: 'student', kelas: '8A', note: 'Siswa dengan riwayat belajar 2 minggu' },
  { id: 'u-nadia', name: 'Nadia Putri', email: 'nadia@nalarlab.demo', role: 'student', kelas: '8A', note: 'Siswa baru tanpa riwayat' },
  { id: 'u-sari', name: 'Sari Wulandari', email: 'guru@nalarlab.demo', role: 'teacher', kelas: '8A', note: 'Guru matematika kelas 8A' },
];

export const SCHOOL_NAME = 'SMP Negeri Simulasi';

const DAY = 86400000;

function at(anchor, daysAgo, hour, minute = 0) {
  const d = new Date(anchor - daysAgo * DAY);
  d.setHours(hour, minute, 0, 0);
  return d.getTime();
}

function attempt(anchor, { problemId, daysAgo, hour, minute, ok, bugs = [], hints = 0, duration }) {
  const skills = {};
  for (const [skill, firstTry] of Object.entries(ok)) skills[skill] = { firstTry, tries: firstTry ? 1 : 2 };
  const finishedAt = at(anchor, daysAgo, hour, minute);
  return {
    id: `seed-${problemId}`,
    userId: 'u-raka',
    problemId,
    startedAt: finishedAt - duration * 1000,
    finishedAt,
    durationSec: duration,
    skills,
    bugs,
    hints,
    score: scoreAttempt(skills),
    seeded: true,
  };
}

/** Raka's history: steady progress with a recurring off-by-one habit. */
export function rakaAttempts(anchor) {
  return [
    attempt(anchor, {
      problemId: 'kursi-aula', daysAgo: 13, hour: 15, minute: 10, duration: 742, hints: 1,
      ok: { pahami: true, pola: true, model: false, simbol: false, tafsir: true },
      bugs: ['off-by-one', 'off-by-one'],
    }),
    attempt(anchor, {
      problemId: 'korek-api', daysAgo: 11, hour: 16, minute: 5, duration: 655,
      ok: { pahami: true, pola: true, model: true, simbol: false, tafsir: true },
      bugs: ['konstanta-hilang'],
    }),
    attempt(anchor, {
      problemId: 'tabungan', daysAgo: 8, hour: 19, minute: 40, duration: 590,
      ok: { pahami: true, pola: true, model: false, simbol: true, tafsir: false },
      bugs: ['off-by-one'], hints: 1,
    }),
    attempt(anchor, {
      problemId: 'ojek', daysAgo: 4, hour: 15, minute: 30, duration: 811, hints: 2,
      ok: { pahami: true, pola: true, model: true, simbol: false, tafsir: false },
      bugs: ['tertukar'],
    }),
  ];
}

/** Raka left the "kuota" mission half-way: the lab resumes at the model step. */
export function rakaLabInProgress(anchor) {
  return {
    problemId: 'kuota',
    step: 2,
    startedAt: at(anchor, 0, 7, 15),
    elapsedSec: 214,
    hints: 0,
    bugs: [],
    skills: { pahami: { firstTry: true, tries: 1 }, pola: { firstTry: true, tries: 1 } },
    answers: {
      facts: ['f1', 'f2'],
      ask: 0,
      varMeaning: 0,
      outMeaning: 0,
      diffs: [-1.5, -1.5, -1.5],
      rate: -1.5,
      model: { start: 30, op: '+', amount: 1.5, repeat: 'v' },
    },
    completedSteps: [0, 1],
    updatedAt: at(anchor, 0, 7, 19),
  };
}
