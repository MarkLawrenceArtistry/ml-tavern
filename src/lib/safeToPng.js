import { toPng } from 'html-to-image';

export async function safeToPng(el, options = {}) {
  // Temporarily patch CSSStyleSheet.cssRules to return [] for
  // cross-origin sheets instead of throwing SecurityError.
  // html-to-image iterates all stylesheets to inline computed styles
  // and crashes on Google Fonts loaded via <link>.
  const orig = Object.getOwnPropertyDescriptor(CSSStyleSheet.prototype, 'cssRules');

  Object.defineProperty(CSSStyleSheet.prototype, 'cssRules', {
    ...orig,
    get() {
      try {
        return orig.get.call(this);
      } catch {
        return [];
      }
    },
  });

  try {
    return await toPng(el, { cacheBust: true, pixelRatio: 2, ...options });
  } finally {
    Object.defineProperty(CSSStyleSheet.prototype, 'cssRules', orig);
  }
}