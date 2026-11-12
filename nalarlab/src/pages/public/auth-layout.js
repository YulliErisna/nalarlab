import { html } from '../../core/dom.js';
import { icon, brandMark } from '../../ui/icons.js';
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from '../../data/seed.js';
import { initials } from '../../ui/shell.js';

export function authLayout({ title, intro, body, footer }) {
  return html`<div class="auth">
    <div class="auth__form-side">
      <a class="brand" href="/">${brandMark()}<span class="brand__name">NalarLab</span></a>
      <div class="auth__form-wrap">
        <h1 class="h1 auth__title">${title}</h1>
        <p class="auth__intro">${intro}</p>
        ${body}
        ${footer ? html`<div class="auth__footer-note">${footer}</div>` : ''}
      </div>
    </div>
    <aside class="auth__aside gridpaper" aria-labelledby="demo-title">
      <div style="display:grid;gap:0.5rem;max-width:460px">
        <h2 class="h2" id="demo-title">Akun demo siap pakai</h2>
        <p class="muted">Pilih satu akun untuk langsung masuk. Semua data di dalamnya adalah data simulasi.</p>
      </div>
      <div class="demo-list" style="max-width:460px">
        ${DEMO_ACCOUNTS.map(
          (account) => html`<button type="button" class="demo-account" data-demo-login="${account.email}">
            <span class="avatar ${account.role === 'teacher' ? 'avatar--teacher' : ''}" aria-hidden="true">${initials(account.name)}</span>
            <span><span class="demo-account__name">${account.name}</span><br /><span class="demo-account__meta">${account.role === 'teacher' ? 'Guru' : 'Siswa'}, ${account.note.toLowerCase()}</span></span>
            <span class="demo-account__go">Masuk</span>
          </button>`,
        )}
      </div>
      <div class="demo-creds" style="max-width:460px">
        Semua akun demo memakai kata sandi <code>${DEMO_PASSWORD}</code>.
        Login ini hanya simulasi di browser, bukan sistem keamanan.
      </div>
    </aside>
  </div>`;
}

export function fieldError(message) {
  return message ? html`<p class="field-error">${icon('alert')}<span>${message}</span></p>` : '';
}

/** Only allow internal redirect targets such as "/belajar/misi". */
export function safeNext(value) {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') ? value : null;
}
