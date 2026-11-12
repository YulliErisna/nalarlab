// Hand-drawn stroke icon set (24×24). Decorative by default (aria-hidden).
import { raw } from '../core/dom.js';

const P = {
  home: '<path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1z"/>',
  missions: '<path d="M5 21V4"/><path d="M5 4h11l-2 3.5L16 11H5"/>',
  lab: '<path d="M9 3h6"/><path d="M10 3v6.2L4.8 18a2 2 0 0 0 1.7 3h11a2 2 0 0 0 1.7-3L14 9.2V3"/><path d="M7.5 14h9"/>',
  chart: '<path d="M4 20h16"/><path d="M6 16l4-5 3 3 5-7"/><circle cx="18" cy="7" r="1.2"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8"/><path d="M18 14a6.5 6.5 0 0 1 3.5 6"/>',
  library: '<path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H19v16H5.5A1.5 1.5 0 0 0 4 20.5z"/><path d="M4 20.5A1.5 1.5 0 0 0 5.5 22H19"/><path d="M8 7h7M8 11h5"/>',
  logout: '<path d="M14 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4"/><path d="M10 16l-4-4 4-4"/><path d="M6 12h10"/>',
  reset: '<path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 4v4.5h4.5"/>',
  check: '<path d="M5 12.5 10 17l9-10"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  alert: '<path d="M12 3.5 2.5 20h19z"/><path d="M12 10v4.5"/><circle cx="12" cy="17.3" r="0.6" fill="currentColor"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5"/><circle cx="12" cy="7.8" r="0.6" fill="currentColor"/>',
  bulb: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.3 1.1 2.2h5c0-.9.4-1.6 1.1-2.2A6 6 0 0 0 12 3z"/>',
  play: '<path d="M7 4.5v15l12-7.5z"/>',
  step: '<path d="M5 5v14l9-7z"/><path d="M18 5v14"/>',
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  eyeOff: '<path d="M3 3l18 18"/><path d="M10.6 5.1A10.8 10.8 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.1 3.9M6.3 6.3A17 17 0 0 0 2 12s3.6 7 10 7a10 10 0 0 0 4.2-.9"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  chevronRight: '<path d="M9 5l7 7-7 7"/>',
  chevronLeft: '<path d="M15 5l-7 7 7 7"/>',
  chevronDown: '<path d="M6 9l6 6 6-6"/>',
  lock: '<rect x="5" y="10.5" width="14" height="10" rx="1.5"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  code: '<path d="M8 7l-5 5 5 5M16 7l5 5-5 5M13.5 4l-3 16"/>',
  arrowLeft: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  save: '<path d="M5 4h11l3 3v12a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1z"/><path d="M8 4v5h7V4M8 20v-6h8v6"/>',
  cap: '<path d="M2.5 9 12 4.5 21.5 9 12 13.5z"/><path d="M6.5 11v5c1.8 1.6 3.6 2.4 5.5 2.4s3.7-.8 5.5-2.4v-5"/><path d="M21.5 9v5"/>',
  board: '<rect x="3" y="4" width="18" height="12" rx="1"/><path d="M12 16v4M8 20h8"/><path d="M7 12l3-3 2.5 2 4-4"/>',
  sort: '<path d="M8 4v16M4.5 7.5 8 4l3.5 3.5M16 20V4M12.5 16.5 16 20l3.5-3.5"/>',
  target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="0.8" fill="currentColor"/>',
  bug: '<path d="M8 8.5a4 4 0 0 1 8 0V15a4 4 0 0 1-8 0z"/><path d="M12 11v8M4 13h4M16 13h4M5 7l3 2.5M19 7l-3 2.5M5 19.5l3-2.5M19 19.5 16 17"/>',
  layers: '<path d="M12 3 2.5 8 12 13l9.5-5z"/><path d="M2.5 12.5 12 17.5l9.5-5"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7L11.5 6.8"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1.5-1.5"/>',
  database: '<ellipse cx="12" cy="6" rx="7" ry="2.5"/><path d="M5 6v12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V6M5 12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5"/>',
  shield: '<path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.2 7.5 9.5 4.3-1.3 7.5-4.9 7.5-9.5V6z"/>',
  key: '<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M16 7l3 3"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="1.5"/><path d="M3.5 6l8.5 7 8.5-7"/>',
  flag: '<path d="M5 21V4M5 4c4-2 7 2 11 0v9c-4 2-7-2-11 0"/>',
};

export function icon(name, { label, className = '' } = {}) {
  const body = P[name] || P.info;
  const a11y = label ? `role="img" aria-label="${label}"` : 'aria-hidden="true" focusable="false"';
  return raw(
    `<svg class="icon ${className}" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" ${a11y}>${body}</svg>`,
  );
}

/** NalarLab mark: a grid square with a rising line — a pattern becoming a rule. */
export function brandMark(size = 32) {
  return raw(`<svg class="brand__mark" width="${size}" height="${size}" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
    <rect x="1" y="1" width="30" height="30" rx="7" fill="#15233d"/>
    <path d="M8 1v30M16 1v30M24 1v30M1 8h30M1 16h30M1 24h30" stroke="#ffffff" stroke-opacity=".12"/>
    <path d="M7 23.5 13 18l5 2.5 7-9" fill="none" stroke="#e3f25c" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="7" cy="23.5" r="2" fill="#9fe4dd"/>
  </svg>`);
}
