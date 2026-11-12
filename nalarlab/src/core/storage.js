// Namespaced wrappers around localStorage / sessionStorage.
// Every access is guarded: storage can be unavailable (private mode, quota, sandboxed iframes).
// NOTE: this is demo persistence only — never a production database or a place for sensitive data.

const PREFIX = 'nalarlab:v1:';
const memory = { local: new Map(), session: new Map() };

function area(kind) {
  try {
    const store = kind === 'session' ? window.sessionStorage : window.localStorage;
    const probe = `${PREFIX}probe`;
    store.setItem(probe, '1');
    store.removeItem(probe);
    return store;
  } catch {
    return null;
  }
}

function read(kind, key, fallback) {
  const store = area(kind);
  try {
    const rawValue = store ? store.getItem(PREFIX + key) : memory[kind].get(key);
    return rawValue == null ? fallback : JSON.parse(rawValue);
  } catch {
    return fallback;
  }
}

function write(kind, key, value) {
  const serialized = JSON.stringify(value);
  const store = area(kind);
  try {
    if (store) store.setItem(PREFIX + key, serialized);
    else memory[kind].set(key, serialized);
    return true;
  } catch {
    memory[kind].set(key, serialized);
    return false;
  }
}

function remove(kind, key) {
  const store = area(kind);
  try {
    if (store) store.removeItem(PREFIX + key);
  } catch {
    /* ignore */
  }
  memory[kind].delete(key);
}

export const local = {
  get: (key, fallback = null) => read('local', key, fallback),
  set: (key, value) => write('local', key, value),
  remove: (key) => remove('local', key),
};

export const session = {
  get: (key, fallback = null) => read('session', key, fallback),
  set: (key, value) => write('session', key, value),
  remove: (key) => remove('session', key),
};

/** Remove every NalarLab key from both storage areas. */
export function clearAllAppData() {
  for (const kind of ['local', 'session']) {
    const store = area(kind);
    memory[kind].clear();
    if (!store) continue;
    try {
      Object.keys(store)
        .filter((k) => k.startsWith(PREFIX))
        .forEach((k) => store.removeItem(k));
    } catch {
      /* ignore */
    }
  }
}

export const storageAvailable = () => Boolean(area('local'));
