import { classRoster } from '../../core/progress.js';
import { studentSummary, average } from '../../engine/learning.js';

/** Roster with a computed summary per student. */
export function classData(kelas) {
  const roster = classRoster(kelas).map((student) => {
    const summary = studentSummary(student.attempts);
    const topMis = summary.misconceptions[0] || null;
    const masteryAvg = student.attempts.length ? summary.mastery.average : null;
    const needsAttention = student.attempts.length > 0 && ((masteryAvg ?? 1) < 0.45 || (topMis?.count ?? 0) >= 4);
    return { ...student, summary, topMis, masteryAvg, needsAttention };
  });
  const active = roster.filter((s) => s.attempts.length);
  const counts = {};
  const affected = {};
  for (const s of roster) {
    for (const m of s.summary.misconceptions) {
      counts[m.id] = (counts[m.id] || 0) + m.count;
      (affected[m.id] ||= []).push(s);
    }
  }
  const misconceptions = Object.entries(counts)
    .map(([id, count]) => ({ id, count, students: affected[id] }))
    .sort((a, b) => b.students.length - a.students.length || b.count - a.count);
  const skillAverages = {};
  for (const skillId of ['pahami', 'pola', 'model', 'simbol', 'tafsir']) {
    skillAverages[skillId] = average(active.map((s) => s.summary.mastery.current[skillId]));
  }
  return {
    roster,
    active,
    misconceptions,
    skillAverages,
    completedTotal: roster.reduce((sum, s) => sum + s.summary.completed, 0),
    masteryAverage: average(active.map((s) => s.masteryAvg)),
  };
}
