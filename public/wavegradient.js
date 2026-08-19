const COPY_REPLACEMENTS = [
  ['Temukan solusi iklan KLY yang tepat.', 'Temukan solusi ber-iklan yang tepat di KLY.'],
  ['Susun Kampanye', 'Buat Campaign']
];

function normalizeKlyAdsCopy(value) {
  if (typeof value !== 'string' || !value) return value;
  let next = value;
  for (const [from, to] of COPY_REPLACEMENTS) {
    next = next.split(from).join(to);
  }
  return next
    .replace(/KAMPANYE/g, 'CAMPAIGN')
    .replace(/Kampanye/g, 'Campaign')
    .replace(/kampanye/g, 'campaign');
}

function normalizeElementCopy(root) {
  if (!root || typeof document === 'undefined') return;

  const shouldSkipTextNode = (node) => {
    const tag = node.parentElement && node.parentElement.tagName;
    return tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT';
  };

  const normalizeTextNode = (node) => {
    if (shouldSkipTextNode(node)) return;
    const current = node.nodeValue;
    const next = normalizeKlyAdsCopy(current);
    if (next !== current) node.nodeValue = next;
  };

  if (root.nodeType === Node.TEXT_NODE) {
    normalizeTextNode(root);
    return;
  }

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let textNode;
  while ((textNode = walker.nextNode())) normalizeTextNode(textNode);

  const elements = root.nodeType === Node.ELEMENT_NODE
    ? [root, ...root.querySelectorAll('*')]
    : [...document.querySelectorAll('*')];

  const copyAttributes = ['aria-label', 'placeholder', 'title', 'content'];
  for (const element of elements) {
    if (element.tagName === 'SCRIPT' || element.tagName === 'STYLE') continue;
    for (const attr of copyAttributes) {
      if (!element.hasAttribute || !element.hasAttribute(attr)) continue;
      const current = element.getAttribute(attr);
      const next = normalizeKlyAdsCopy(current);
      if (next !== current) element.setAttribute(attr, next);
    }
  }
}

function installKlyAdsCopyNormalizer() {
  if (typeof document === 'undefined') return;

  const run = () => normalizeElementCopy(document);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run, { once: true });
  } else {
    run();
  }

  const startObserver = () => {
    if (!document.documentElement || typeof MutationObserver === 'undefined') return;
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'characterData') {
          normalizeElementCopy(mutation.target);
          continue;
        }
        for (const node of mutation.addedNodes) normalizeElementCopy(node);
      }
    });
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      characterData: true
    });
  };

  if (document.documentElement) startObserver();
  else document.addEventListener('DOMContentLoaded', startObserver, { once: true });

  try {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      const originalWriteText = navigator.clipboard.writeText.bind(navigator.clipboard);
      navigator.clipboard.writeText = (text) => originalWriteText(normalizeKlyAdsCopy(text));
    }
  } catch (error) {
    // Clipboard methods can be read-only in some browsers; UI copy remains normalized.
  }
}

function installCampaignResultMetricStyles() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('kly-campaign-result-metric-styles')) return;

  const style = document.createElement('style');
  style.id = 'kly-campaign-result-metric-styles';
  style.textContent = `
    .resultMetric {
      margin-top: 22px !important;
      padding: 20px 20px 22px !important;
      border-radius: 16px !important;
    }

    .resultMetricLabel {
      font-size: 13px !important;
      font-weight: 750 !important;
      line-height: 1.2 !important;
      letter-spacing: .09em !important;
    }

    .resultMetricGrid {
      grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
      align-items: stretch !important;
      margin-top: 18px !important;
    }

    .resultMetricPrimary,
    .resultHighlight {
      min-width: 0 !important;
      padding: 2px 16px 0 !important;
    }

    .resultMetricPrimary {
      padding-left: 0 !important;
    }

    .resultHighlight {
      border-left: 1px solid #D7DBE6 !important;
    }

    .resultMetricPrimary strong,
    .resultHighlight strong {
      display: block !important;
      margin: 0 !important;
      font-size: 20px !important;
      font-weight: 900 !important;
      line-height: 1.08 !important;
      letter-spacing: -.03em !important;
      overflow-wrap: anywhere !important;
    }

    .resultMetricPrimary strong {
      font-size: 20px !important;
    }

    .resultMetricPrimary strong > .sc-interp,
    .resultHighlight strong > .sc-interp {
      display: inline !important;
      margin: 0 !important;
      font-size: inherit !important;
      font-weight: inherit !important;
      line-height: inherit !important;
      letter-spacing: inherit !important;
      color: inherit !important;
    }

    .resultMetricPrimary > span,
    .resultHighlight > span {
      display: block !important;
      margin-top: 10px !important;
      font-size: 14px !important;
      font-weight: 560 !important;
      line-height: 1.4 !important;
      color: #626B7D !important;
    }

    @media (max-width: 1100px) {
      .resultMetric {
        padding: 18px 18px 20px !important;
      }

      .resultMetricPrimary,
      .resultHighlight {
        padding-left: 13px !important;
        padding-right: 13px !important;
      }

      .resultMetricPrimary {
        padding-left: 0 !important;
      }

      .resultMetricPrimary strong,
      .resultHighlight strong {
        font-size: 20px !important;
      }
    }

    @media (max-width: 700px) {
      .resultMetricGrid {
        gap: 0 !important;
      }

      .resultMetricPrimary,
      .resultHighlight {
        padding-left: 11px !important;
        padding-right: 11px !important;
      }

      .resultMetricPrimary {
        padding-left: 0 !important;
      }

      .resultMetricPrimary strong,
      .resultHighlight strong {
        font-size: 20px !important;
      }

      .resultMetricPrimary > span,
      .resultHighlight > span {
        font-size: 13px !important;
      }
    }
  `;
  document.head.appendChild(style);
}

installKlyAdsCopyNormalizer();
installCampaignResultMetricStyles();

export class WaveGradient {
  constructor(canvas, options = {}) {
    if (!canvas) return;
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.options = Object.assign({
      colors: ['#233EB8', '#3D56D6', '#2948B8', '#172B8F'],
      fps: 30,
      seed: 0,
      density: [0.018, 0.046],
      speed: 0.26,
      amplitude: 280,
      time: 0
    }, options);
    this.time = this.options.time || 0;
    this.last = 0;
    this.reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.resize = this.resize.bind(this);
    this.frame = this.frame.bind(this);
    this.observer = new ResizeObserver(this.resize);
    this.observer.observe(canvas.parentElement || canvas);
    this.resize();
    requestAnimationFrame(this.frame);
  }

  resize() {
    const box = this.canvas.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 1);
    this.width = Math.max(1, box.width);
    this.height = Math.max(1, box.height);
    this.canvas.width = Math.round(this.width * dpr);
    this.canvas.height = Math.round(this.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.draw();
  }

  wave(index, color, phase, baseline, opacity, endColor) {
    const ctx = this.ctx;
    const amp = Math.min(this.options.amplitude, this.height * 0.36);
    const frequency = this.options.density[0] +
      (this.options.density[1] - this.options.density[0]) * (index / 4);
    const points = [];
    for (let x = -120; x <= this.width + 120; x += 44) {
      points.push({ x, y: baseline +
        Math.sin(x * frequency * 0.13 + phase) * amp * (0.16 + index * 0.026) +
        Math.cos(x * frequency * 0.058 - phase * 0.58) * amp * 0.12 });
    }
    ctx.beginPath();
    ctx.moveTo(-80, this.height + 80);
    ctx.lineTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length - 1; i++) {
      const p = points[i];
      const next = points[i + 1];
      ctx.quadraticCurveTo(p.x, p.y, (p.x + next.x) / 2, (p.y + next.y) / 2);
    }
    const last = points[points.length - 1];
    ctx.lineTo(last.x, last.y);
    ctx.lineTo(this.width + 80, this.height + 80);
    ctx.closePath();
    const g = ctx.createLinearGradient(0, baseline - amp, this.width, this.height);
    g.addColorStop(0, color);
    g.addColorStop(1, endColor || this.options.colors[(index + 1) % this.options.colors.length]);
    ctx.globalAlpha = opacity;
    ctx.filter = 'blur(18px)';
    ctx.fillStyle = g;
    ctx.fill();
    ctx.filter = 'none';
  }

  blob(index, color, phase, opacity) {
    const ctx = this.ctx;
    const radius = Math.max(this.width, this.height) * (0.28 + index * 0.025);
    const x = this.width * (0.5 + Math.sin(phase * (0.34 + index * 0.035)) * 0.46);
    const y = this.height * (0.48 + Math.cos(phase * (0.27 + index * 0.028)) * 0.34);
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, color);
    gradient.addColorStop(0.52, color);
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.filter = 'blur(24px)';
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);
    ctx.restore();
  }

  draw() {
    const ctx = this.ctx;
    const colors = this.options.colors;
    const bg = ctx.createLinearGradient(0, 0, this.width, this.height);
    bg.addColorStop(0, '#304DCA');
    bg.addColorStop(0.48, '#3553CD');
    bg.addColorStop(1, '#2B48BB');
    ctx.globalAlpha = 1;
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, this.width, this.height);
    ctx.globalCompositeOperation = 'screen';
    this.blob(0, colors[1], this.time + 0.4, 0.12);
    this.blob(1, colors[2], this.time + 3.2, 0.10);
    ctx.globalCompositeOperation = 'source-over';
    this.wave(0, '#142A87', this.time * 0.48 + 0.8, this.height * 0.47, 0.72, '#1C3598');
    this.wave(1, '#1D3797', this.time * 0.36 + 2.9, this.height * 0.67, 0.60, '#2440AD');
    this.wave(2, '#2646B7', this.time * 0.27 + 5.1, this.height * 0.86, 0.48, '#2B4BC0');
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  }

  frame(now) {
    const interval = 1000 / this.options.fps;
    if (!this.last || now - this.last >= interval) {
      if (!this.reduceMotion) this.time += 0.008 * this.options.speed;
      this.draw();
      this.last = now;
    }
    this.raf = requestAnimationFrame(this.frame);
  }
}
