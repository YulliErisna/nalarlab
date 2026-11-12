import { html, raw } from '../../core/dom.js';
import { icon } from '../../ui/icons.js';
import { misconceptionById } from '../../data/misconceptions.js';
import { topicById, SKILLS, skillById } from '../../data/curriculum.js';
import { masteryLevel } from '../../engine/learning.js';
import { masteryMeter } from '../../ui/charts.js';

export function recommendationReason(rec, summary) {
  if (!rec) return '';
  if (rec.reason === 'misconception') {
    const m = misconceptionById(rec.misconceptionId);
    const count = summary.misconceptions.find((x) => x.id === rec.misconceptionId)?.count || 2;
    return `Kesalahan "${m?.name}" muncul ${count} kali di misimu. Misi ini dipilih karena melatih bagian itu.`;
  }
  if (rec.reason === 'next') {
    const weakest = Object.entries(summary.mastery.current).sort((a, b) => a[1] - b[1])[0];
    return `Melanjutkan topik ${topicById(rec.problem.topic).title}. Keterampilan yang paling perlu dilatih: ${skillById(weakest[0]).name.toLowerCase()}.`;
  }
  if (rec.reason === 'review') return 'Semua misi yang terbuka sudah selesai. Ulangi misi dengan skor terendah untuk memperkuat pemahaman.';
  return 'Misi pertama untuk mengenal cara kerja lab. Setiap langkah punya umpan balik, jadi tidak apa-apa salah.';
}

export function skillMeters(mastery, { compact = false } = {}) {
  return html`<div style="display:grid;gap:${compact ? '0.85rem' : '1.1rem'}">
    ${SKILLS.map((skill) => {
      const p = mastery.current[skill.id];
      const level = masteryLevel(p);
      return html`<div>${masteryMeter(skill.name, p, { level, sub: compact ? '' : level.label })}${compact ? '' : html`<p class="subtle" style="margin-top:0.25rem">${skill.desc}</p>`}</div>`;
    })}
  </div>`;
}

export function misconceptionBadges(ids) {
  if (!ids?.length) return html`<span class="subtle">Tidak ada</span>`;
  const unique = [...new Set(ids)];
  return html`${unique.map((id) => html`<span class="badge badge--red" style="margin:0.1rem 0.25rem 0.1rem 0">${misconceptionById(id)?.name || id}</span>`)}`;
}

export const bktTip = html`<span class="tip"><button type="button" class="tip__trigger" aria-label="Cara penguasaan dihitung">${icon('info')}</button>
  <span class="tip__bubble" role="tooltip">Dihitung dengan Bayesian Knowledge Tracing dari jawaban percobaan pertama di setiap langkah. Memakai petunjuk dihitung sebagai belum tepat.</span></span>`;

export const simBadge = raw('<span class="badge badge--sim">Data simulasi</span>');
