import { html } from '../../core/dom.js';
import { icon } from '../../ui/icons.js';

export default function notFound(ctx) {
  const home = ctx.user ? (ctx.user.role === 'teacher' ? '/guru' : '/belajar') : '/';
  return {
    title: 'Halaman tidak ditemukan',
    render: () => html`<div class="not-found"><div class="empty" style="max-width:520px">
      <div class="empty__icon">${icon('search')}</div>
      <h1 class="h2">Halaman ini tidak ada.</h1>
      <p>Alamat <code>${ctx.path}</code> tidak cocok dengan halaman mana pun. Periksa kembali tautannya atau kembali ke halaman utama.</p>
      <a class="btn" href="${home}">Kembali ke halaman utama</a>
    </div></div>`,
  };
}
