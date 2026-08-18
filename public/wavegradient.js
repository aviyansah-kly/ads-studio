export class WaveGradient {
  constructor(canvas, options = {}) {
    if (!canvas) return;
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.options = Object.assign({
      colors: ['#2941CB', '#6348DE', '#2941CB', '#0e1a75'],
      fps: 60,
      seed: 0,
      density: [0.03, 0.08],
      speed: 0.6,
      amplitude: 320,
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
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    this.width = Math.max(1, box.width);
    this.height = Math.max(1, box.height);
    this.canvas.width = Math.round(this.width * dpr);
    this.canvas.height = Math.round(this.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.draw();
  }

  wave(index, color, phase, baseline, opacity) {
    const ctx = this.ctx;
    const amp = Math.min(this.options.amplitude, this.height * 0.43);
    const frequency = this.options.density[0] +
      (this.options.density[1] - this.options.density[0]) * (index / 4);
    ctx.beginPath();
    ctx.moveTo(-40, this.height + 40);
    for (let x = -40; x <= this.width + 40; x += 14) {
      const y = baseline +
        Math.sin(x * frequency * 0.16 + phase) * amp * (0.20 + index * 0.035) +
        Math.cos(x * frequency * 0.075 - phase * 0.7) * amp * 0.16;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(this.width + 40, this.height + 40);
    ctx.closePath();
    const g = ctx.createLinearGradient(0, baseline - amp, this.width, this.height);
    g.addColorStop(0, color);
    g.addColorStop(1, this.options.colors[(index + 1) % this.options.colors.length]);
    ctx.globalAlpha = opacity;
    ctx.fillStyle = g;
    ctx.fill();
  }

  draw() {
    const ctx = this.ctx;
    const colors = this.options.colors;
    const bg = ctx.createLinearGradient(0, 0, this.width, this.height);
    bg.addColorStop(0, colors[3]);
    bg.addColorStop(0.48, colors[0]);
    bg.addColorStop(1, colors[2]);
    ctx.globalAlpha = 1;
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, this.width, this.height);
    ctx.globalCompositeOperation = 'screen';
    this.wave(0, colors[1], this.time + 0.8, this.height * 0.28, 0.72);
    this.wave(1, colors[0], this.time * 0.82 + 2.3, this.height * 0.48, 0.68);
    this.wave(2, colors[1], this.time * 1.12 + 4.1, this.height * 0.67, 0.50);
    this.wave(3, colors[2], this.time * 0.68 + 5.4, this.height * 0.84, 0.48);
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
