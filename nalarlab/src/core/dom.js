// Tiny, dependency-free templating helpers.
// `html` escapes every interpolated value unless it was produced by `html` or `raw`.

const RAW = Symbol('nalarlab.raw');

export function raw(value) {
  return { [RAW]: true, value: String(value ?? '') };
}

export function esc(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderValue(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'boolean') return value ? 'true' : 'false'; // for aria-* attributes
  if (Array.isArray(value)) return value.map(renderValue).join('');
  if (typeof value === 'object' && value[RAW]) return value.value;
  return esc(value);
}

export function html(strings, ...values) {
  let out = '';
  strings.forEach((chunk, i) => {
    out += chunk;
    if (i < values.length) out += renderValue(values[i]);
  });
  return raw(out);
}

export const toString = (value) => renderValue(value);

export const qs = (selector, root = document) => root.querySelector(selector);
export const qsa = (selector, root = document) => Array.from(root.querySelectorAll(selector));

/** Delegated event listener. Returns a function that removes it. */
export function on(root, type, selector, handler, options) {
  const listener = (event) => {
    const target = event.target instanceof Element ? event.target.closest(selector) : null;
    if (target && root.contains(target)) handler(event, target);
  };
  root.addEventListener(type, listener, options);
  return () => root.removeEventListener(type, listener, options);
}

export function setHtml(element, template) {
  element.innerHTML = toString(template);
}

export function uid(prefix = 'id') {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-3)}`;
}

export function classNames(...parts) {
  return parts.filter(Boolean).join(' ');
}

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
