import { html, on, toString } from '../../core/dom.js';
import { icon } from '../../ui/icons.js';
import { toast } from '../../ui/feedback.js';
import { pageHead, initials } from '../../ui/shell.js';
import { updateProfile } from '../../core/auth.js';
import { getAttempts, inProgressLabs } from '../../core/progress.js';
import { formatDate } from '../../engine/learning.js';
import { fieldError } from '../public/auth-layout.js';

export default function account(ctx) {
  let user = ctx.user;
  const state = { name: user.name, kelas: user.kelas, errors: {} };
  const isTeacher = user.role === 'teacher';
  const attempts = isTeacher ? [] : getAttempts(user.id);
  const labs = isTeacher ? [] : inProgressLabs(user.id);

  const form = () => html`<form novalidate data-profile>
    <div class="field"><label class="label" for="name">Nama lengkap</label>
      <input class="input" id="name" name="name" value="${state.name}" ${state.errors.name ? html`aria-invalid="true" aria-describedby="name-err"` : ''} />
      <div id="name-err">${fieldError(state.errors.name)}</div></div>
    <div class="field"><label class="label" for="kelas">${isTeacher ? 'Kelas yang diampu' : 'Kelas'}</label>
      <select class="select" id="kelas" name="kelas">${['8A', '8B', '7A'].map((k) => html`<option value="${k}" ${state.kelas === k ? 'selected' : ''}>Kelas ${k}</option>`)}</select>
      ${isTeacher ? html`<p class="hint">Data kelas simulasi hanya tersedia untuk kelas 8A.</p>` : ''}</div>
    <div class="field"><span class="label">Email</span><p class="muted">${user.email}</p></div>
    <button class="btn" type="submit" style="margin-top:1.25rem">Simpan perubahan</button>
  </form>`;

  return {
    title: 'Profil & data demo',
    crumbs: [{ label: 'Profil & data demo', href: '/akun' }],
    render: () => html`
      ${pageHead({ title: 'Profil & data demo', lead: 'Kelola profil akun demo dan data yang tersimpan di browser ini.' })}
      <div class="dash">
        <div class="dash__col">
          <section class="panel panel--pad" aria-labelledby="profile-title">
            <div style="display:flex;gap:1rem;align-items:center;margin-bottom:1.25rem">
              <span class="avatar avatar--lg ${isTeacher ? 'avatar--teacher' : ''}" aria-hidden="true" data-avatar>${initials(user.name)}</span>
              <div><h2 class="h3" id="profile-title">Profil</h2><p class="subtle">${isTeacher ? 'Guru' : 'Siswa'}, terdaftar ${formatDate(user.createdAt)}</p></div>
            </div>
            <div data-form-host>${form()}</div>
          </section>
        </div>
        <div class="dash__col">
          <section class="panel panel--pad" style="display:grid;gap:1rem" aria-labelledby="data-title">
            <h2 class="h3" id="data-title">Data demo di browser ini</h2>
            <dl class="kv">
              <dt>Penyimpanan akun</dt><dd>localStorage</dd>
              <dt>Sesi login</dt><dd>sessionStorage, berakhir saat tab ditutup</dd>
              ${isTeacher ? '' : html`<dt>Misi selesai</dt><dd>${attempts.length} percobaan</dd><dt>Misi berjalan</dt><dd>${labs.length}</dd>`}
            </dl>
            <div class="callout callout--info">${icon('shield')}<span>Login di demo ini hanya simulasi frontend. Kata sandi disimpan sebagai hash sederhana yang tidak aman. Jangan memakai kata sandi sungguhan.</span></div>
            <div style="display:grid;gap:0.5rem">
              <button type="button" class="btn btn--danger" data-action="reset-demo">${icon('reset')}Reset data demo</button>
              <p class="subtle">Menghapus akun baru, progres, dan riwayat, lalu memulihkan akun demo seperti semula.</p>
            </div>
          </section>
        </div>
      </div>`,
    mount(root) {
      return on(root, 'submit', '[data-profile]', (e) => {
        e.preventDefault();
        state.name = root.querySelector('#name').value;
        state.kelas = root.querySelector('#kelas').value;
        const result = updateProfile(user.id, state);
        if (!result.ok) {
          state.errors = result.errors;
          root.querySelector('[data-form-host]').innerHTML = toString(form());
          root.querySelector('#name')?.focus();
          return;
        }
        user = result.user;
        state.errors = {};
        toast('Profil disimpan.', { type: 'success' });
        ctx.refresh();
      });
    },
  };
}
