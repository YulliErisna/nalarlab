import { html, toString, on, sleep } from '../../core/dom.js';
import { validateEmail } from '../../core/auth.js';
import { icon } from '../../ui/icons.js';
import { DEMO_PASSWORD } from '../../data/seed.js';
import { authLayout, fieldError } from './auth-layout.js';

export default function forgotPage(ctx) {
  const state = { email: '', error: '', busy: false, sent: false };

  const body = () =>
    state.sent
      ? html`<div class="callout callout--info" role="status">${icon('mail')}<div class="callout__body">
          <strong>Simulasi selesai.</strong>
          <span>Di aplikasi sungguhan, tautan reset akan dikirim ke <strong>${state.email}</strong>. Demo ini tidak mengirim email apa pun.</span>
          <span>Untuk akun demo, kata sandinya <code>${DEMO_PASSWORD}</code>. Untuk akun yang kamu buat sendiri, gunakan tombol "Reset data demo" lalu daftar ulang.</span>
        </div></div>
        <a class="btn btn--block" style="margin-top:1.25rem" href="/masuk">Kembali ke halaman masuk</a>`
      : html`<form novalidate data-forgot>
          <div class="field">
            <label class="label" for="email">Email akun</label>
            <input class="input" id="email" name="email" type="email" autocomplete="email" value="${state.email}" ${state.error ? html`aria-invalid="true" aria-describedby="email-err"` : ''} />
            <div id="email-err">${fieldError(state.error)}</div>
          </div>
          <button class="btn btn--lg btn--block" type="submit" style="margin-top:1.25rem" ${state.busy ? 'disabled' : ''}>${state.busy ? html`<span class="spinner" aria-hidden="true"></span> Memproses…` : 'Kirim tautan reset'}</button>
        </form>`;

  let root;
  const rerender = () => {
    root.querySelector('[data-host]').innerHTML = toString(body());
  };

  return {
    title: 'Lupa kata sandi',
    render: () =>
      authLayout({
        title: 'Lupa kata sandi',
        intro: 'Masukkan email akunmu. Langkah ini hanya simulasi antarmuka.',
        body: html`<div data-host>${body()}</div>`,
        footer: html`Ingat kata sandimu? <a class="link" href="/masuk">Masuk</a>`,
      }),
    mount(el) {
      root = el;
      const offs = [
        on(el, 'input', 'input[name="email"]', (e, input) => {
          state.email = input.value;
        }),
        on(el, 'submit', '[data-forgot]', async (e) => {
          e.preventDefault();
          if (!validateEmail(state.email)) {
            state.error = 'Masukkan email yang valid.';
            rerender();
            el.querySelector('#email')?.focus();
            return;
          }
          state.error = '';
          state.busy = true;
          rerender();
          await sleep(500);
          state.busy = false;
          state.sent = true;
          rerender();
        }),
        on(el, 'click', '[data-demo-login]', (e, btn) => ctx.navigate(`/masuk?demo=${btn.dataset.demoLogin.startsWith('guru') ? 'guru' : btn.dataset.demoLogin.startsWith('nadia') ? 'baru' : 'siswa'}`)),
      ];
      el.querySelector('#email')?.focus();
      return () => offs.forEach((off) => off());
    },
  };
}
