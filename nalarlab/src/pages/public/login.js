import { html, toString, on, sleep } from '../../core/dom.js';
import { login, validateEmail, homePathFor } from '../../core/auth.js';
import { icon } from '../../ui/icons.js';
import { toast } from '../../ui/feedback.js';
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from '../../data/seed.js';
import { authLayout, fieldError, safeNext } from './auth-layout.js';

const PRESETS = { siswa: 'siswa@nalarlab.demo', guru: 'guru@nalarlab.demo', baru: 'nadia@nalarlab.demo' };

export default function loginPage(ctx) {
  const preset = PRESETS[ctx.query.get('demo')];
  const next = safeNext(ctx.query.get('next'));
  const state = { email: preset || '', password: preset ? DEMO_PASSWORD : '', errors: {}, busy: false, show: false };

  const form = () => html`<form class="form" novalidate data-login>
    ${state.errors.form ? html`<div class="callout callout--error" role="alert" style="margin-bottom:1rem">${icon('alert')}<span>${state.errors.form}</span></div>` : ''}
    <div class="field">
      <label class="label" for="email">Email</label>
      <input class="input" id="email" name="email" type="email" autocomplete="username" value="${state.email}" ${state.errors.email ? html`aria-invalid="true" aria-describedby="email-err"` : ''} />
      <div id="email-err">${fieldError(state.errors.email)}</div>
    </div>
    <div class="field">
      <label class="label" for="password">Kata sandi</label>
      <div class="input-wrap">
        <input class="input" id="password" name="password" type="${state.show ? 'text' : 'password'}" autocomplete="current-password" value="${state.password}" ${state.errors.password ? html`aria-invalid="true" aria-describedby="password-err"` : ''} />
        <button type="button" class="btn btn--ghost btn--icon btn--sm input-wrap__btn" data-toggle-pw aria-label="${state.show ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}" aria-pressed="${state.show}">${icon(state.show ? 'eyeOff' : 'eye')}</button>
      </div>
      <div id="password-err">${fieldError(state.errors.password)}</div>
    </div>
    <div class="auth__row"><span class="subtle">Sesi berakhir saat tab ditutup.</span><a class="link" href="/lupa-sandi">Lupa kata sandi?</a></div>
    <button class="btn btn--lg btn--block" type="submit" ${state.busy ? 'disabled' : ''}>${state.busy ? html`<span class="spinner" aria-hidden="true"></span> Memeriksa akun…` : 'Masuk'}</button>
  </form>`;

  let root;
  const rerender = (focusId) => {
    root.querySelector('[data-form-host]').innerHTML = toString(form());
    if (focusId) root.querySelector(`#${focusId}`)?.focus();
  };

  async function submit() {
    const errors = {};
    if (!state.email.trim()) errors.email = 'Masukkan email.';
    else if (!validateEmail(state.email)) errors.email = 'Format email belum benar, contoh: nama@sekolah.id.';
    if (!state.password) errors.password = 'Masukkan kata sandi.';
    state.errors = errors;
    if (Object.keys(errors).length) {
      rerender(errors.email ? 'email' : 'password');
      return;
    }
    state.busy = true;
    rerender();
    await sleep(450);
    const result = login(state.email, state.password);
    state.busy = false;
    if (!result.ok) {
      state.errors = { form: result.error };
      rerender('password');
      return;
    }
    toast(`Selamat datang, ${result.user.name.split(' ')[0]}.`, { type: 'success' });
    const role = result.user.role;
    const allowed = next && ((next.startsWith('/guru') && role === 'teacher') || (next.startsWith('/belajar') && role === 'student') || next === '/akun');
    const target = allowed ? next : homePathFor(result.user);
    ctx.navigate(target, { replace: true });
  }

  return {
    title: 'Masuk',
    render: () =>
      authLayout({
        title: 'Masuk ke NalarLab',
        intro: next ? 'Masuk terlebih dahulu untuk membuka halaman yang kamu tuju.' : 'Lanjutkan misi matematikamu atau buka dasbor kelas.',
        body: html`<div data-form-host>${form()}</div>`,
        footer: html`Belum punya akun? <a class="link" href="/daftar">Buat akun demo</a>`,
      }),
    mount(el) {
      root = el;
      const offs = [
        on(el, 'input', 'input[name]', (e, input) => {
          state[input.name] = input.value;
        }),
        on(el, 'submit', '[data-login]', (e) => {
          e.preventDefault();
          if (!state.busy) submit();
        }),
        on(el, 'click', '[data-toggle-pw]', () => {
          state.show = !state.show;
          rerender();
          el.querySelector('[data-toggle-pw]')?.focus();
        }),
        on(el, 'click', '[data-demo-login]', (e, btn) => {
          const account = DEMO_ACCOUNTS.find((a) => a.email === btn.dataset.demoLogin);
          state.email = account.email;
          state.password = DEMO_PASSWORD;
          state.errors = {};
          rerender();
          submit();
        }),
      ];
      if (!preset) el.querySelector('#email')?.focus();
      return () => offs.forEach((off) => off());
    },
  };
}
