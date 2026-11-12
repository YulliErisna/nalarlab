// History-API router with role-based guards and lazy-loaded pages.
// Static hosts need an SPA fallback (see vercel.json, netlify.toml, public/_redirects).

import { setHtml, html } from './dom.js';
import { currentUser, homePathFor } from './auth.js';
import { toast } from '../ui/feedback.js';
import { renderLayout, mountLayout } from '../ui/shell.js';

let routes = [];
let outlet = null;
let cleanup = null;
let navToken = 0;
let firstRender = true;

export function defineRoutes(list) {
  routes = list.map((route) => {
    if (route.path === '*') return { ...route, keys: [], pattern: /(?!)/ }; // fallback, matched last
    const keys = [];
    const pattern = new RegExp(
      `^${route.path.replace(/\/:([a-zA-Z]+)/g, (_, key) => {
        keys.push(key);
        return '/([^/]+)';
      })}/?$`,
    );
    return { ...route, keys, pattern };
  });
}

function match(pathname) {
  for (const route of routes) {
    const m = pathname.match(route.pattern);
    if (m) {
      const params = Object.fromEntries(route.keys.map((key, i) => [key, decodeURIComponent(m[i + 1])]));
      return { route, params };
    }
  }
  return { route: routes.find((r) => r.path === '*'), params: {} };
}

export function navigate(to, { replace = false } = {}) {
  if (to === location.pathname + location.search && !replace) {
    render({ keepScroll: false });
    return;
  }
  history[replace ? 'replaceState' : 'pushState']({}, '', to);
  render();
}

export function refresh() {
  render({ keepScroll: true, keepFocus: true });
}

function guard(route, user) {
  const here = location.pathname + location.search;
  if (route.guestOnly && user) return homePathFor(user);
  if (route.auth && !user) {
    toast('Masuk terlebih dahulu untuk membuka halaman itu.', { type: 'info' });
    return `/masuk?next=${encodeURIComponent(here)}`;
  }
  if (route.auth && route.auth !== 'any' && user.role !== route.auth) {
    toast(route.auth === 'teacher' ? 'Halaman itu khusus akun guru.' : 'Halaman itu khusus akun siswa.', { type: 'info' });
    return homePathFor(user);
  }
  return null;
}

async function render({ keepScroll = false, keepFocus = false } = {}) {
  const token = ++navToken;
  const { route, params } = match(location.pathname);
  const user = currentUser();
  const redirect = guard(route, user);
  if (redirect) {
    history.replaceState({}, '', redirect);
    return render();
  }

  const scrollY = window.scrollY;
  const ctx = {
    params,
    query: new URLSearchParams(location.search),
    user,
    navigate,
    refresh,
    path: location.pathname,
  };

  // Loading state while the page module loads (only visible on slow connections).
  const loadingTimer = setTimeout(() => {
    if (token !== navToken) return;
    setHtml(outlet, renderLayout(route.layout, ctx, { title: '', crumbs: [] }, html`<div class="page" aria-busy="true">
      <div class="skeleton" style="height:42px;width:40%;margin-bottom:1.5rem"></div>
      <div class="skeleton" style="height:180px;margin-bottom:1rem"></div>
      <div class="skeleton" style="height:120px"></div></div>`));
  }, 120);

  let page;
  try {
    const module = await route.load();
    page = module.default(ctx);
  } catch (error) {
    console.error(error);
    clearTimeout(loadingTimer);
    setHtml(outlet, html`<div class="not-found"><div class="empty">
      <h1 class="h2">Halaman gagal dimuat</h1>
      <p>Muat ulang halaman. Jika masalah berlanjut, jalankan ulang server pengembangan.</p>
      <button class="btn" type="button" onclick="location.reload()">Muat ulang</button></div></div>`);
    return;
  }
  clearTimeout(loadingTimer);
  if (token !== navToken) return;

  if (typeof cleanup === 'function') cleanup();
  cleanup = null;

  document.title = page.title ? `${page.title} | NalarLab` : 'NalarLab | Dari kode ke konsep';
  setHtml(outlet, renderLayout(route.layout, ctx, page, page.render()));
  const layoutCleanup = mountLayout(route.layout, outlet, ctx);
  const main = outlet.querySelector('#main');
  const pageCleanup = page.mount ? page.mount(main || outlet) : null;
  cleanup = () => {
    layoutCleanup?.();
    pageCleanup?.();
  };

  if (keepScroll) window.scrollTo(0, scrollY);
  else window.scrollTo(0, 0);
  if (!firstRender && !keepFocus) {
    const heading = outlet.querySelector('h1');
    if (heading) {
      heading.setAttribute('tabindex', '-1');
      heading.focus({ preventScroll: true });
    }
  }
  firstRender = false;
}

export function startRouter(root) {
  outlet = root;
  window.addEventListener('popstate', () => render());
  document.addEventListener('click', (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest('a[href]');
    if (!link || link.target || link.hasAttribute('download') || link.dataset.external !== undefined) return;
    const url = new URL(link.href, location.href);
    if (url.origin !== location.origin) return;
    if (url.pathname === location.pathname && url.hash) return;
    event.preventDefault();
    navigate(url.pathname + url.search + url.hash);
  });
  render();
}
