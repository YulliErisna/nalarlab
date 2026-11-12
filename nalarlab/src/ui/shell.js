// Page layouts: public site, auth (bare) and the signed-in app shell.
import { html, on } from '../core/dom.js';
import { icon, brandMark } from './icons.js';

export const initials = (name) =>
  String(name || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');

const NAV = {
  student: [
    { href: '/belajar', label: 'Beranda', icon: 'home', exact: true },
    { href: '/belajar/misi', label: 'Misi', icon: 'missions' },
    { href: '/belajar/progres', label: 'Progres belajar', icon: 'chart' },
  ],
  teacher: [
    { href: '/guru', label: 'Kelas 8A', icon: 'users', exact: true },
    { href: '/guru/miskonsepsi', label: 'Pustaka miskonsepsi', icon: 'bug' },
    { href: '/guru/misi', label: 'Bank misi', icon: 'library' },
  ],
};

function isActive(item, path) {
  if (item.exact) return path === item.href;
  return path === item.href || path.startsWith(`${item.href}/`);
}

export const skipLink = html`<a class="skip-link" href="#main" data-external>Lompat ke konten utama</a>`;

function siteHeader(ctx) {
  const user = ctx.user;
  return html`<header class="site-header" data-site-header>
    <div class="container site-header__inner">
      <a class="brand" href="/" aria-label="NalarLab, beranda">${brandMark()}<span class="brand__name">NalarLab</span></a>
      <nav class="site-nav" aria-label="Navigasi situs">
        <a href="/#cara-kerja">Cara kerja</a>
        <a href="/#untuk-guru">Untuk guru</a>
        <a href="/tentang">Tentang demo</a>
      </nav>
      <div class="site-header__actions">
        ${user
          ? html`<a class="btn" href="${user.role === 'teacher' ? '/guru' : '/belajar'}">Buka ${user.role === 'teacher' ? 'dasbor guru' : 'ruang belajar'}</a>`
          : html`<a class="btn btn--ghost" href="/masuk">Masuk</a><a class="btn" href="/daftar">Buat akun demo</a>`}
      </div>
    </div>
  </header>`;
}

function siteFooter() {
  return html`<footer class="site-footer">
    <div class="container site-footer__grid">
      <div>
        <a class="brand" href="/">${brandMark(26)}<span class="brand__name" style="font-size:1.2rem">NalarLab</span></a>
        <p style="margin-top:0.75rem;max-width:52ch">Prototipe demo untuk esai kompetisi bertema <em>The Role of the Youth Generation in Realizing Quality Education</em>. Dibangun sebagai aplikasi frontend tanpa server.</p>
      </div>
      <div>
        <p>Data siswa, kelas, dan grafik di dalam aplikasi adalah <strong>data simulasi</strong>, bukan hasil penelitian.</p>
        <p>Angka PISA di halaman depan bersumber dari laporan resmi OECD (2026).</p>
        <p><a class="link" href="/tentang">Keterbatasan demo</a></p>
      </div>
    </div>
  </footer>`;
}

function sidebar(ctx) {
  const items = NAV[ctx.user.role] || [];
  const isTeacher = ctx.user.role === 'teacher';
  return html`<aside class="sidebar" id="sidebar" aria-label="Navigasi utama">
    <div class="sidebar__brand"><a class="brand" href="${isTeacher ? '/guru' : '/belajar'}">${brandMark()}<span class="brand__name">NalarLab</span></a></div>
    <nav>
      <p class="nav__label">${isTeacher ? 'Ruang guru' : 'Ruang belajar'}</p>
      <ul class="nav" role="list">
        ${items.map(
          (item) => html`<li><a class="nav__link" href="${item.href}" ${isActive(item, ctx.path) ? html`aria-current="page"` : ''}>${icon(item.icon)}<span>${item.label}</span></a></li>`,
        )}
      </ul>
      <p class="nav__label" style="margin-top:1.25rem">Akun</p>
      <ul class="nav" role="list">
        <li><a class="nav__link" href="/akun" ${ctx.path === '/akun' ? html`aria-current="page"` : ''}>${icon('user')}<span>Profil & data demo</span></a></li>
        <li><button type="button" class="nav__link" style="width:100%;border:0;background:none;text-align:left" data-action="logout">${icon('logout')}<span>Keluar</span></button></li>
      </ul>
    </nav>
    <div class="sidebar__foot">
      <p class="sim-note"><strong>Mode demo.</strong> Login hanya simulasi di browser. Progres tersimpan di localStorage perangkat ini.</p>
    </div>
  </aside>`;
}

function topbar(ctx, page) {
  const user = ctx.user;
  const crumbs = page.crumbs || [];
  return html`<header class="topbar">
    <button type="button" class="btn btn--ghost btn--icon topbar__menu" data-action="toggle-sidebar" aria-controls="sidebar" aria-expanded="false" aria-label="Buka menu navigasi">${icon('menu')}</button>
    <nav class="topbar__crumbs" aria-label="Lokasi halaman">
      ${crumbs.map((crumb, i) =>
        i < crumbs.length - 1 ? html`<a href="${crumb.href}">${crumb.label}</a>${icon('chevronRight')}` : html`<span aria-current="page">${crumb.label}</span>`,
      )}
    </nav>
    <div class="topbar__right">
      <div class="menu" data-menu>
        <button type="button" class="user-btn" data-action="toggle-menu" aria-haspopup="true" aria-expanded="false" aria-controls="user-menu">
          <span class="avatar ${user.role === 'teacher' ? 'avatar--teacher' : ''}" aria-hidden="true">${initials(user.name)}</span>
          <span class="user-btn__name">${user.name}</span>${icon('chevronDown')}
        </button>
        <div class="menu__panel" id="user-menu" role="menu" hidden>
          <div class="menu__meta"><div style="font-weight:600;font-size:var(--fs-sm)">${user.name}</div><div class="subtle">${user.email}</div>
            <div style="margin-top:0.4rem"><span class="badge ${user.role === 'teacher' ? 'badge--amber' : 'badge--model'}">${user.role === 'teacher' ? 'Guru' : 'Siswa'}, kelas ${user.kelas}</span></div></div>
          <a class="menu__item" role="menuitem" href="/akun">${icon('user')}Profil & data demo</a>
          <button type="button" class="menu__item" role="menuitem" data-action="reset-demo">${icon('reset')}Reset data demo</button>
          <button type="button" class="menu__item menu__item--danger" role="menuitem" data-action="logout">${icon('logout')}Keluar</button>
        </div>
      </div>
    </div>
  </header>`;
}

export function renderLayout(layout, ctx, page, content) {
  if (layout === 'app' && ctx.user) {
    return html`${skipLink}<div class="shell">
      ${sidebar(ctx)}
      <div class="overlay" data-action="close-sidebar" hidden></div>
      <div class="shell__main">
        ${topbar(ctx, page)}
        <main id="main" class="page">${content}</main>
      </div>
    </div>`;
  }
  if (layout === 'public') {
    return html`${skipLink}${siteHeader(ctx)}<main id="main">${content}</main>${siteFooter()}`;
  }
  return html`${skipLink}<main id="main">${content}</main>`;
}

export function mountLayout(layout, root) {
  const offs = [];
  if (layout === 'public') {
    const header = root.querySelector('[data-site-header]');
    const onScroll = () => header?.classList.toggle('is-scrolled', window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    offs.push(() => window.removeEventListener('scroll', onScroll));
  }
  if (layout === 'app') {
    const sidebarEl = root.querySelector('#sidebar');
    const overlay = root.querySelector('.overlay');
    const toggleBtn = root.querySelector('[data-action="toggle-sidebar"]');
    const menuBtn = root.querySelector('[data-action="toggle-menu"]');
    const menuPanel = root.querySelector('#user-menu');

    const setSidebar = (open) => {
      sidebarEl?.classList.toggle('is-open', open);
      if (overlay) overlay.hidden = !open;
      toggleBtn?.setAttribute('aria-expanded', String(open));
      if (open) sidebarEl?.querySelector('a, button')?.focus();
    };
    const setMenu = (open) => {
      if (!menuPanel) return;
      menuPanel.hidden = !open;
      menuBtn.setAttribute('aria-expanded', String(open));
      if (open) menuPanel.querySelector('.menu__item')?.focus();
    };

    offs.push(on(root, 'click', '[data-action="toggle-sidebar"]', () => setSidebar(!sidebarEl.classList.contains('is-open'))));
    offs.push(on(root, 'click', '[data-action="close-sidebar"]', () => setSidebar(false)));
    offs.push(on(root, 'click', '[data-action="toggle-menu"]', (e) => {
      e.stopPropagation();
      setMenu(menuPanel.hidden);
    }));
    const outside = (event) => {
      if (menuPanel && !menuPanel.hidden && !event.target.closest('[data-menu]')) setMenu(false);
    };
    const onKey = (event) => {
      if (event.key !== 'Escape') return;
      if (menuPanel && !menuPanel.hidden) {
        setMenu(false);
        menuBtn.focus();
      }
      if (sidebarEl?.classList.contains('is-open')) {
        setSidebar(false);
        toggleBtn?.focus();
      }
    };
    document.addEventListener('click', outside);
    document.addEventListener('keydown', onKey);
    offs.push(() => document.removeEventListener('click', outside));
    offs.push(() => document.removeEventListener('keydown', onKey));
  }
  return () => offs.forEach((off) => off());
}

/** Shared page heading. */
export function pageHead({ title, lead, actions }) {
  return html`<div class="page-head">
    <div class="page-head__text"><h1 class="h1">${title}</h1>${lead ? html`<p class="lead">${lead}</p>` : ''}</div>
    ${actions ? html`<div style="display:flex;gap:0.6rem;flex-wrap:wrap">${actions}</div>` : ''}
  </div>`;
}

export function emptyState({ iconName = 'info', title, text, action }) {
  return html`<div class="empty">
    <div class="empty__icon">${icon(iconName)}</div>
    <h3 class="h4">${title}</h3>
    <p>${text}</p>
    ${action || ''}
  </div>`;
}
