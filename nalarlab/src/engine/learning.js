// Mastery estimation (Bayesian Knowledge Tracing), unlocking, recommendations and summaries.
// Everything is derived from attempt records, so charts always agree with the activity log.

import { SKILLS, TOPICS, PROBLEMS, UNLOCK_AFTER, problemById, problemsByTopic } from '../data/curriculum.js';

export const BKT = { prior: 0.25, learn: 0.18, guess: 0.2, slip: 0.1 };

/** One BKT update for a single observation. */
export function bktUpdate(pKnown, correct, params = BKT) {
  const { guess, slip, learn } = params;
  const posterior = correct
    ? (pKnown * (1 - slip)) / (pKnown * (1 - slip) + (1 - pKnown) * guess)
    : (pKnown * slip) / (pKnown * slip + (1 - pKnown) * (1 - guess));
  return posterior + (1 - posterior) * learn;
}

export const sortAttempts = (attempts) => [...attempts].sort((a, b) => a.finishedAt - b.finishedAt);

/** Replay all attempts to get the current mastery and its history. */
export function computeMastery(attempts) {
  const current = Object.fromEntries(SKILLS.map((s) => [s.id, BKT.prior]));
  const history = [];
  for (const attempt of sortAttempts(attempts)) {
    for (const skill of SKILLS) {
      const result = attempt.skills?.[skill.id];
      if (result) current[skill.id] = bktUpdate(current[skill.id], Boolean(result.firstTry));
    }
    history.push({ at: attempt.finishedAt, problemId: attempt.problemId, values: { ...current }, average: average(Object.values(current)) });
  }
  return { current, history, average: average(Object.values(current)) };
}

export function average(values) {
  const list = values.filter((v) => Number.isFinite(v));
  return list.length ? list.reduce((s, v) => s + v, 0) / list.length : 0;
}

export function masteryLevel(p) {
  if (p >= 0.85) return { id: 'kuat', label: 'Menguasai' };
  if (p >= 0.6) return { id: 'berkembang', label: 'Berkembang' };
  if (p >= 0.4) return { id: 'awal', label: 'Mulai paham' };
  return { id: 'perlu', label: 'Perlu latihan' };
}

export function completedIds(attempts) {
  return new Set(attempts.map((a) => a.problemId));
}

export function topicProgress(attempts) {
  const done = completedIds(attempts);
  return TOPICS.map((topic, index) => {
    const problems = problemsByTopic(topic.id);
    const completed = problems.filter((p) => done.has(p.id)).length;
    let unlocked = index === 0;
    if (index > 0) {
      const previous = problemsByTopic(TOPICS[index - 1].id);
      unlocked = previous.filter((p) => done.has(p.id)).length >= UNLOCK_AFTER;
    }
    return { topic, problems, completed, total: problems.length, unlocked };
  });
}

export function isProblemUnlocked(problemId, attempts) {
  const problem = problemById(problemId);
  if (!problem) return false;
  return topicProgress(attempts).find((t) => t.topic.id === problem.topic)?.unlocked ?? false;
}

/** Count misconceptions, newest first. */
export function misconceptionCounts(attempts, { recent } = {}) {
  const list = sortAttempts(attempts);
  const slice = recent ? list.slice(-recent) : list;
  const counts = {};
  for (const attempt of slice) for (const bug of attempt.bugs || []) counts[bug] = (counts[bug] || 0) + 1;
  return Object.entries(counts)
    .map(([id, count]) => ({ id, count }))
    .sort((a, b) => b.count - a.count);
}

/** Adaptive recommendation: target a recurring misconception first, then the weakest unlocked topic. */
export function recommendNext(attempts) {
  const progress = topicProgress(attempts);
  const done = completedIds(attempts);
  const unlockedProblems = progress.filter((t) => t.unlocked).flatMap((t) => t.problems);
  const openProblems = unlockedProblems.filter((p) => !done.has(p.id));
  const recurring = misconceptionCounts(attempts, { recent: 4 }).find((m) => m.count >= 2);

  if (recurring) {
    const targeted = openProblems.find((p) => p.targets.includes(recurring.id)) || unlockedProblems.find((p) => p.targets.includes(recurring.id));
    if (targeted) return { problem: targeted, reason: 'misconception', misconceptionId: recurring.id };
  }
  if (openProblems.length) {
    const ranked = [...openProblems].sort((a, b) => {
      const ta = progress.findIndex((t) => t.topic.id === a.topic);
      const tb = progress.findIndex((t) => t.topic.id === b.topic);
      return ta - tb || a.order - b.order;
    });
    return { problem: ranked[0], reason: attempts.length ? 'next' : 'start' };
  }
  // Everything unlocked is done: suggest repeating the lowest-scoring mission.
  const worst = sortAttempts(attempts).reduce((acc, a) => (!acc || a.score < acc.score ? a : acc), null);
  return worst ? { problem: problemById(worst.problemId), reason: 'review' } : { problem: PROBLEMS[0], reason: 'start' };
}

/** Score an attempt: share of skills solved on the first try. */
export function scoreAttempt(skills) {
  const entries = Object.values(skills);
  if (!entries.length) return 0;
  return Math.round((entries.filter((s) => s.firstTry).length / entries.length) * 100);
}

export function studentSummary(attempts) {
  const mastery = computeMastery(attempts);
  const totalSeconds = attempts.reduce((s, a) => s + (a.durationSec || 0), 0);
  const scores = attempts.map((a) => a.score);
  return {
    mastery,
    completed: completedIds(attempts).size,
    attempts: attempts.length,
    totalSeconds,
    averageScore: scores.length ? Math.round(average(scores)) : 0,
    hints: attempts.reduce((s, a) => s + (a.hints || 0), 0),
    misconceptions: misconceptionCounts(attempts),
    topics: topicProgress(attempts),
    lastActive: attempts.length ? Math.max(...attempts.map((a) => a.finishedAt)) : null,
  };
}

export function formatDuration(seconds) {
  const s = Math.max(0, Math.round(seconds));
  if (s < 60) return `${s} dtk`;
  const minutes = Math.floor(s / 60);
  if (minutes < 60) return `${minutes} mnt`;
  return `${Math.floor(minutes / 60)} j ${minutes % 60} mnt`;
}

const dateFormatter = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' });
const dateTimeFormatter = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
export const formatDate = (ts) => dateFormatter.format(new Date(ts));
export const formatDateTime = (ts) => dateTimeFormatter.format(new Date(ts));

export function relativeDay(ts, now = Date.now()) {
  const day = 86400000;
  const startOf = (t) => {
    const d = new Date(t);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  };
  const diff = Math.round((startOf(now) - startOf(ts)) / day);
  if (diff <= 0) return 'Hari ini';
  if (diff === 1) return 'Kemarin';
  if (diff < 7) return `${diff} hari lalu`;
  return formatDate(ts);
}
