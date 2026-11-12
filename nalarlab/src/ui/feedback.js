// Toast notifications and the confirm dialog.
import { html, toString, esc } from '../core/dom.js';
import { icon } from './icons.js';

let region = null;

function ensureRegion() {
  if (region && document.body.contains(region)) return region;
  region = document.createElement('div');
  region.className = 'toasts';
  region.setAttribute('role', 'status');
  region.setAttribute('aria-live', 'polite');
  document.body.appendChild(region);
  return region;
}

const ICONS = { success: 'check', error: 'alert', info: 'info' };

export function toast(message, { type = 'info', timeout = 4200 } = {}) {
  const host = ensureRegion();
  const el = document.createElement('div');
  el.className = `toast toast--${type}`;
  el.innerHTML = toString(html`${icon(ICONS[type] || 'info')}<div>${message}</div>
    <button type="button" class="toast__close" aria-label="Tutup notifikasi">${icon('x')}</button>`);
  const close = () => {
    if (!el.isConnected) return;
    el.classList.add('is-leaving');
    setTimeout(() => el.remove(), 200);
  };
  el.querySelector('.toast__close').addEventListener('click', close);
  host.appendChild(el);
  if (timeout) setTimeout(close, timeout);
  return close;
}

/** Accessible confirm dialog. Resolves true when confirmed. */
export function confirmDialog({ title, body, confirmText = 'Lanjutkan', cancelText = 'Batal', tone = 'danger', iconName = 'alert' }) {
  return new Promise((resolve) => {
    const previous = document.activeElement;
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    const titleId = `modal-title-${Date.now()}`;
    backdrop.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="${titleId}">
        <div class="modal__icon ${tone === 'danger' ? '' : 'modal__icon--info'}">${toString(icon(iconName))}</div>
        <h2 class="modal__title" id="${titleId}">${esc(title)}</h2>
        <div class="modal__body">${esc(body)}</div>
        <div class="modal__actions">
          <button type="button" class="btn btn--secondary" data-choice="cancel">${esc(cancelText)}</button>
          <button type="button" class="btn ${tone === 'danger' ? 'btn--danger-solid' : ''}" data-choice="ok">${esc(confirmText)}</button>
        </div>
      </div>`;
    const finish = (value) => {
      document.removeEventListener('keydown', onKey, true);
      backdrop.remove();
      previous?.focus?.();
      resolve(value);
    };
    const focusables = () => Array.from(backdrop.querySelectorAll('button'));
    const onKey = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        finish(false);
      } else if (event.key === 'Tab') {
        const items = focusables();
        const index = items.indexOf(document.activeElement);
        event.preventDefault();
        const nextIndex = event.shiftKey ? (index <= 0 ? items.length - 1 : index - 1) : (index + 1) % items.length;
        items[nextIndex].focus();
      }
    };
    backdrop.addEventListener('click', (event) => {
      if (event.target === backdrop) finish(false);
      const choice = event.target.closest('[data-choice]')?.dataset.choice;
      if (choice) finish(choice === 'ok');
    });
    document.addEventListener('keydown', onKey, true);
    document.body.appendChild(backdrop);
    backdrop.querySelector('[data-choice="cancel"]').focus();
  });
}
