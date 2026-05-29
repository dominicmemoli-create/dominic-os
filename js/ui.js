// ui.js — tiny DOM toolkit + modal/toast/confirm + image compression.
// No framework: just thin helpers so page code stays readable.

// uid: stable unique ids for new records.
export function uid(prefix = 'id') {
  if (window.crypto && crypto.randomUUID) return prefix + '_' + crypto.randomUUID().slice(0, 8);
  return prefix + '_' + Math.random().toString(36).slice(2, 10);
}

// el('div.card', {onclick}, [children]) — hyperscript-lite.
// First arg supports tag + .class + #id shorthand, e.g. 'button.btn.primary'.
export function el(spec, props = {}, children = []) {
  const [tagPart, ...rest] = String(spec).split(/(?=[.#])/);
  const tag = tagPart || 'div';
  const node = document.createElement(tag);
  for (const token of rest) {
    if (token[0] === '.') node.classList.add(token.slice(1));
    else if (token[0] === '#') node.id = token.slice(1);
  }
  for (const [k, v] of Object.entries(props || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') node.className += (node.className ? ' ' : '') + v;
    else if (k === 'html') node.innerHTML = v;
    else if (k === 'text') node.textContent = v;
    else if (k === 'dataset') Object.assign(node.dataset, v);
    else if (k === 'style' && typeof v === 'object') Object.assign(node.style, v);
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
    else if (k in node && k !== 'list') {
      try { node[k] = v; } catch { node.setAttribute(k, v); }
    } else node.setAttribute(k, v);
  }
  appendChildren(node, children);
  return node;
}

function appendChildren(node, children) {
  const arr = Array.isArray(children) ? children : [children];
  for (const c of arr) {
    if (c == null || c === false) continue;
    node.appendChild(typeof c === 'string' || typeof c === 'number'
      ? document.createTextNode(String(c)) : c);
  }
}

export function clear(node) {
  while (node && node.firstChild) node.removeChild(node.firstChild);
  return node;
}

export function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

// ---- toast ---------------------------------------------------------------
export function toast(msg, kind = 'info') {
  const root = document.getElementById('toast-root');
  if (!root) return;
  const t = el('div.toast', { class: kind }, [msg]);
  root.appendChild(t);
  requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => {
    t.classList.remove('show');
    setTimeout(() => t.remove(), 300);
  }, 2600);
}

// ---- modal ---------------------------------------------------------------
// openModal({ title, body:Node, actions:[{label, kind, onClick->boolean|void}] })
// Returning false from an action keeps the modal open (e.g. validation fail).
export function openModal({ title, body, actions, wide = false }) {
  const root = document.getElementById('modal-root');
  const overlay = el('div.modal-overlay');
  const card = el('div.modal' + (wide ? '.wide' : ''));

  const head = el('div.modal-head', {}, [
    el('h3.modal-title', { text: title || '' }),
    el('button.icon-btn.modal-close', { type: 'button', 'aria-label': 'Close', onclick: close }, ['✕']),
  ]);
  const content = el('div.modal-body');
  if (body) content.appendChild(body);

  const foot = el('div.modal-foot');
  (actions || [{ label: 'Close', kind: 'ghost', onClick: () => true }]).forEach(a => {
    foot.appendChild(el('button.btn', { class: a.kind || 'ghost', type: 'button',
      onclick: () => { const r = a.onClick ? a.onClick() : true; if (r !== false) close(); } },
      [a.label]));
  });

  card.append(head, content, foot);
  overlay.appendChild(card);
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  function escHandler(e) { if (e.key === 'Escape') close(); }
  document.addEventListener('keydown', escHandler);
  function close() {
    document.removeEventListener('keydown', escHandler);
    overlay.classList.remove('show');
    setTimeout(() => overlay.remove(), 180);
  }

  root.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('show'));
  // focus first input for fast entry
  setTimeout(() => { const f = content.querySelector('input,select,textarea,button'); if (f) f.focus(); }, 60);
  return { close };
}

export function confirmDialog(message, { confirmLabel = 'Delete', kind = 'danger' } = {}) {
  return new Promise(resolve => {
    openModal({
      title: 'Are you sure?',
      body: el('p.muted', { text: message }),
      actions: [
        { label: 'Cancel', kind: 'ghost', onClick: () => { resolve(false); return true; } },
        { label: confirmLabel, kind, onClick: () => { resolve(true); return true; } },
      ],
    });
  });
}

// ---- form builder --------------------------------------------------------
// buildForm([{name,label,type,value,options,required,placeholder,min,max,step,hint}])
// Returns { form:Node, values():obj }. Supports text/number/date/textarea/select/checkbox.
export function buildForm(fields) {
  const form = el('form.form', { onsubmit: e => e.preventDefault() });
  const inputs = {};
  for (const f of fields) {
    const id = 'fld_' + f.name;
    const row = el('label.field', { for: id });
    if (f.label) row.appendChild(el('span.field-label', { text: f.label + (f.required ? ' *' : '') }));
    let input;
    if (f.type === 'textarea') {
      input = el('textarea', { id, rows: f.rows || 3, placeholder: f.placeholder || '' });
      input.value = f.value ?? '';
    } else if (f.type === 'select') {
      input = el('select', { id });
      (f.options || []).forEach(o => {
        const opt = typeof o === 'object' ? o : { value: o, label: o };
        input.appendChild(el('option', { value: opt.value, selected: String(opt.value) === String(f.value) }, [opt.label]));
      });
    } else if (f.type === 'checkbox') {
      input = el('input', { id, type: 'checkbox', checked: !!f.value });
      row.classList.add('field-inline');
    } else {
      input = el('input', { id, type: f.type || 'text', placeholder: f.placeholder || '' });
      if (f.min != null) input.min = f.min;
      if (f.max != null) input.max = f.max;
      if (f.step != null) input.step = f.step;
      input.value = f.value ?? '';
    }
    inputs[f.name] = { input, def: f };
    row.appendChild(input);
    if (f.hint) row.appendChild(el('span.field-hint', { text: f.hint }));
    form.appendChild(row);
  }
  function values() {
    const out = {};
    for (const [name, { input, def }] of Object.entries(inputs)) {
      if (def.type === 'checkbox') out[name] = input.checked;
      else if (def.type === 'number') out[name] = input.value === '' ? null : Number(input.value);
      else out[name] = input.value.trim();
    }
    return out;
  }
  function validate() {
    for (const [name, { input, def }] of Object.entries(inputs)) {
      if (def.required && def.type !== 'checkbox' && !String(input.value).trim()) {
        input.focus();
        toast(`${def.label || name} is required`, 'warn');
        return false;
      }
    }
    return true;
  }
  return { form, values, validate, inputs };
}

// ---- image compression (storage-safety rule) -----------------------------
// Downscale to maxEdge px and re-encode JPEG ~quality. Returns a small dataURL.
export function compressImage(file, { maxEdge = 400, quality = 0.6 } = {}) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type || !file.type.startsWith('image/')) {
      reject(new Error('Not an image file')); return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        const scale = Math.min(1, maxEdge / Math.max(width, height));
        width = Math.round(width * scale);
        height = Math.round(height * scale);
        const canvas = el('canvas');
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#0B0B14';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => reject(new Error('Could not decode image'));
      img.src = reader.result;
    };
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.readAsDataURL(file);
  });
}

// Small helper: a section with a header + optional action button.
export function section(title, actionNode) {
  const head = el('div.section-head', {}, [el('h2.section-title', { text: title })]);
  if (actionNode) head.appendChild(actionNode);
  return head;
}

// Empty-state placeholder card.
export function emptyState(text, ctaNode) {
  return el('div.empty', {}, [el('p', { text }), ctaNode].filter(Boolean));
}
