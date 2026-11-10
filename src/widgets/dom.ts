type Child = Node | string | null | undefined | false;

export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K, attrs: Record<string, any> = {}, ...children: Child[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'class') el.className = v;
    else if (k in el && k !== 'list') (el as any)[k] = v;
    else el.setAttribute(k, String(v));
  }
  for (const c of children) if (c) el.append(c);
  return el;
}

const SVG_NS = 'http://www.w3.org/2000/svg';
export function s(tag: string, attrs: Record<string, any> = {}, ...children: (Node | string)[]): SVGElement {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else el.setAttribute(k, String(v));
  }
  for (const c of children) el.append(c);
  return el;
}

export function select(
  options: { value: string; label: string }[], value: string, onChange: (v: string) => void, ariaLabel?: string
): HTMLSelectElement {
  const el = h('select', { 'aria-label': ariaLabel, onChange: () => onChange(el.value) });
  for (const o of options) el.append(h('option', { value: o.value, selected: o.value === value }, o.label));
  el.value = value;
  return el;
}

export function field(label: string, control: HTMLElement): HTMLLabelElement {
  return h('label', { class: 'w-field' }, h('span', { class: 'w-label' }, label), control);
}

export function button(label: string, onClick: () => void, cls = ''): HTMLButtonElement {
  return h('button', { type: 'button', class: `w-btn ${cls}`.trim(), onClick }, label);
}

export const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

export function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Base class: renders once when connected, into light DOM. */
export abstract class Widget extends HTMLElement {
  private built = false;
  connectedCallback() {
    if (this.built) return;
    this.built = true;
    this.classList.add('widget');
    this.build();
  }
  abstract build(): void;
  attr(name: string, fallback = ''): string { return this.getAttribute(name) ?? fallback; }
  list(name: string, fallback: string[] = []): string[] {
    const v = this.getAttribute(name);
    return v ? v.split(/[,\s]+/).filter(Boolean) : fallback;
  }
}
