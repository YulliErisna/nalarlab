import { html, toString, on, sleep } from '../../core/dom.js';
import { register, homePathFor } from '../../core/auth.js';
import { icon } from '../../ui/icons.js';
import { toast } from '../../ui/feedback.js';
import { authLayout, fieldError } from './auth-layout.js';

const CLASSES = ['8A', '8B', '7A'];

export default function registerPage(ctx) {
  const state = { name: '', email: '', password: '', role: 'student', kelas: '8A', errors: {}, busy: false, show: false };

  const describedBy = (key) => (state.errors[key] ? html`aria-invalid="true" aria-describedby="${key}-err"` : '');

  const form = () => html`<form novalidate data-register>
    <fieldset style="border:0;padding:0;margin:0 0 1rem">
      <legend class="label" style="margin-bottom:0.4rem">Saya mendaftar sebagai</legend>
      <div class="segmented">
        <label class="segmented__opt"><input type="radio" name="role" value="student" ${state.role === 'student' ? 'checked' : ''} /><span>${icon('cap')}Siswa</span></label>
        <label class="segmented__opt"><input type="radio" name="role" value="teacher" ${state.role === 'teacher' ? 'checked' : ''} /><span>${icon('board')}Guru</span></label>
      </div>
      <div id="role-err">${fieldError(state.errors.role)}</div>
    </fieldset>
    <div class="field">
      <label class="label" for="name">Nama lengkap</label>
      <input class="input" id="name" name="name" autocomplete="name" value="${state.name}" ${describedBy('name')} />
      <div id="name-err">${fieldError(state.errors.name)}</div>
    </div>
    <div class="field">
      <label class="label" for="email">Email</label>
      <input class="input" id="email" name="email" type="email" autocomplete="email" value="${state.email}" ${describedBy('email')} />
      <p class="hint">Email tidak diverifikasi dan tidak pernah dikirim ke mana pun.</p>
      <div id="email-err">${fieldError(state.errors.email)}</div>
    </div>
    <div class="field">
      <label class="label" for="password">Kata sandi</label>
      <div class="input-wrap">
        <input class="input" id="password" name="password" type="${state.show ? 'text' : 'password'}" autocomplete="new-password" value="${state.password}" ${describedBy('password')} />
        <button type="button" class="btn btn--ghost btn--icon btn--sm input-wrap__btn" data-toggle-pw aria-label="${state.show ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}" aria-pressed="${state.show}">${icon(state.show ? 'eyeOff' : 'eye')}</button>
      </div>
      <p class="hint">Minimal 6 karakter. Jangan pakai kata sandi yang kamu gunakan di layanan lain.</p>
      <div id="password-err">${fieldError(state.errors.password)}</div>
    </div>
    <div class="field">
      <label class="label" for="kelas">${state.role === 'teacher' ? 'Kelas yang diampu' : 'Kelas'}</label>
      <select class="select" id="kelas" name="kelas" ${describedBy('kelas')}>
        ${CLASSES.map((k) => html`<option value="${k}" ${state.kelas === k ? 'selected' : ''}>Kelas ${k}${k === '8A' ? ' (berisi data kelas simulasi)' : ''}</option>`)}
      </select>
      <div id="kelas-err">${fieldError(state.errors.kelas)}</div>
    </div>
    <button class="btn btn--lg btn--block" type="submit" style="margin-top:1.5rem" ${state.busy ? 'disabled' : ''}>${state.busy ? html`<span class="spinner" aria-hidden="true"></span> Membuat akun…` : 'Buat akun'}</button>
  </form>`;

  let root;
  const rerender = (focusId) => {
    root.querySelector('[data-form-host]').innerHTML = toString(form());
    if (focusId) root.querySelector(`#${focusId}`)?.focus();
  };

  async function submit() {
    state.busy = true;
    rerender();
    await sleep(450);
    const result = register(state);
    state.busy = false;
    if (!result.ok) {
      state.errors = result.errors;
      rerender(['name', 'email', 'password', 'kelas'].find((k) => result.errors[k]));
      return;
    }
    toast(`Akun dibuat. Selamat datang, ${result.user.name.split(' ')[0]}.`, { type: 'success' });
    ctx.navigate(homePathFor(result.user), { replace: true });
  }

  return {
    title: 'Buat akun',
    render: () =>
      authLayout({
        title: 'Buat akun demo',
        intro: 'Akun tersimpan hanya di browser ini. Cocok untuk mencoba pengalaman siswa baru dari awal.',
        body: html`<div data-form-host>${form()}</div>`,
        footer: html`Sudah punya akun? <a class="link" href="/masuk">Masuk</a>`,
      }),
    mount(el) {
      root = el;
      const offs = [
        on(el, 'input', 'input[name]:not([type="radio"])', (e, input) => {
          state[input.name] = input.value;
        }),
        on(el, 'change', 'input[name="role"], select[name="kelas"]', (e, input) => {
          state[input.name] = input.value;
          if (input.name === 'role') {
            rerender();
            el.querySelector(`input[name="role"][value="${state.role}"]`)?.focus();
          }
        }),
        on(el, 'click', '[data-toggle-pw]', () => {
          state.show = !state.show;
          rerender();
          el.querySelector('[data-toggle-pw]')?.focus();
        }),
        on(el, 'submit', '[data-register]', (e) => {
          e.preventDefault();
          if (!state.busy) submit();
        }),
        on(el, 'click', '[data-demo-login]', (e, btn) => ctx.navigate(`/masuk?demo=${btn.dataset.demoLogin.startsWith('guru') ? 'guru' : btn.dataset.demoLogin.startsWith('nadia') ? 'baru' : 'siswa'}`)),
      ];
      el.querySelector('#name')?.focus();
      return () => offs.forEach((off) => off());
    },
  };
}
