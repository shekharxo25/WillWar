/**
 * WillWar Living Tide Canvas Engine
 * Renders dual drifting sine layers over a nautical water gradient.
 * Respects DESIGN.md physics: 9s/13s cycles, spring damping, idle settling after 20s.
 * Extended with interactive surface disturbance on pointer interaction.
 */

export class TideCanvas {
  constructor(canvasElement, options = {}) {
    this.canvas = canvasElement;
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    if (!this.ctx) return;

    this.level = options.level ?? 0.15; // default 15%
    this.targetLevel = this.level;
    this.still = options.still ?? false;
    this.settleAfterMs = options.settleAfterMs ?? 20000;
    this.showTicks = options.showTicks ?? false;

    this.FRONT_CYCLE_MS = 9000;
    this.BACK_CYCLE_MS = 13000;
    this.LEVEL_STIFFNESS = 120;
    this.LEVEL_DAMPING = 20;

    this.raf = 0;
    this.running = true;
    this.current = this.level;
    this.velocity = 0;
    this.amplitude = this.still ? 0 : 1;
    this.lastInteraction = performance.now();
    this.lastTime = performance.now();
    this.width = 0;
    this.height = 0;

    // Interactive ripple disturbance array
    this.ripples = [];

    this.init();
  }

  init() {
    this.resize = this.resize.bind(this);
    this.draw = this.draw.bind(this);
    this.wake = this.wake.bind(this);
    this.onVisibility = this.onVisibility.bind(this);
    this.onPointer = this.onPointer.bind(this);

    this.resize();
    this.ro = new ResizeObserver(this.resize);
    this.ro.observe(this.canvas);

    this.raf = requestAnimationFrame(this.draw);

    document.addEventListener('visibilitychange', this.onVisibility);
    this.canvas.addEventListener('pointerdown', this.onPointer);
    this.canvas.addEventListener('pointermove', (e) => {
      if (e.buttons > 0) this.onPointer(e);
    });

    window.addEventListener('scroll', this.wake, { passive: true });
  }

  setLevel(newLevel, immediate = false) {
    this.targetLevel = Math.max(0, Math.min(1, newLevel));
    if (immediate) {
      this.current = this.targetLevel;
      this.velocity = 0;
    }
    this.wake();
  }

  onPointer(e) {
    this.wake();
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.x;
    const y = e.clientY - rect.y;
    // Add a ripple disturbance at pointer position
    if (this.ripples.length < 8) {
      this.ripples.push({
        x,
        y,
        radius: 4,
        maxRadius: Math.min(this.width, this.height) * 0.4,
        alpha: 0.8
      });
    }
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = this.canvas.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;
    this.canvas.width = Math.round(this.width * dpr);
    this.canvas.height = Math.round(this.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  wake() {
    this.lastInteraction = performance.now();
    if (!this.raf && this.running) {
      this.lastTime = performance.now();
      this.raf = requestAnimationFrame(this.draw);
    }
  }

  onVisibility() {
    if (document.hidden) {
      this.running = false;
      cancelAnimationFrame(this.raf);
      this.raf = 0;
    } else {
      this.running = true;
      this.wake();
    }
  }

  draw(t) {
    const dt = Math.min(0.05, (t - this.lastTime) / 1000);
    this.lastTime = t;

    // Check prefers-reduced-motion
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Spring physics towards target level
    if (reduced || this.still) {
      this.current = this.targetLevel;
      this.velocity = 0;
      this.amplitude = 0;
    } else {
      const force = this.LEVEL_STIFFNESS * (this.targetLevel - this.current) - this.LEVEL_DAMPING * this.velocity;
      this.velocity += force * dt;
      this.current += this.velocity * dt;

      // Amplitude idle settling
      const idle = this.settleAfterMs > 0 && t - this.lastInteraction > this.settleAfterMs;
      const wantAmp = idle ? 0 : 1;
      this.amplitude += (wantAmp - this.amplitude) * Math.min(1, dt * 1.5);
    }

    const computedStyle = getComputedStyle(document.documentElement);
    const topColor = computedStyle.getPropertyValue('--tide').trim() || '#0b6e7f';
    const floorColor = computedStyle.getPropertyValue('--tide-deep').trim() || '#0a3f55';

    this.ctx.clearRect(0, 0, this.width, this.height);

    const waterline = this.height * (1 - Math.max(0, Math.min(1, this.current)));
    const amp = Math.min(14, this.height * 0.04) * this.amplitude;

    const renderWaveLayer = (cycle, phaseOffset, alpha, ampScale, yOffset) => {
      const phase = ((t % cycle) / cycle) * Math.PI * 2 + phaseOffset;
      const grad = this.ctx.createLinearGradient(0, waterline, 0, this.height);
      grad.addColorStop(0, topColor);
      grad.addColorStop(1, floorColor);

      this.ctx.globalAlpha = alpha;
      this.ctx.fillStyle = grad;
      this.ctx.beginPath();
      this.ctx.moveTo(0, this.height);

      const steps = Math.max(28, Math.round(this.width / 6));
      for (let i = 0; i <= steps; i++) {
        const x = (i / steps) * this.width;
        let y = waterline + yOffset + Math.sin((x / this.width) * Math.PI * 2 + phase) * amp * ampScale;

        // Apply interactive ripple perturbations
        for (const rip of this.ripples) {
          const dist = Math.abs(x - rip.x);
          if (dist < rip.radius) {
            y += Math.sin((dist / rip.radius) * Math.PI) * 6 * rip.alpha;
          }
        }

        this.ctx.lineTo(x, y);
      }

      this.ctx.lineTo(this.width, this.height);
      this.ctx.closePath();
      this.ctx.fill();
    };

    if (this.current > 0.001) {
      // Back layer (subsurface drift)
      renderWaveLayer(this.BACK_CYCLE_MS, Math.PI / 2, 0.45, 0.75, -4);
      // Front layer (surface waterline)
      renderWaveLayer(this.FRONT_CYCLE_MS, 0, 0.95, 1, 0);

      // Highlight waterline rim
      this.ctx.beginPath();
      const steps = Math.max(28, Math.round(this.width / 6));
      const phase = ((t % this.FRONT_CYCLE_MS) / this.FRONT_CYCLE_MS) * Math.PI * 2;
      for (let i = 0; i <= steps; i++) {
        const x = (i / steps) * this.width;
        const y = waterline + Math.sin((x / this.width) * Math.PI * 2 + phase) * amp;
        if (i === 0) this.ctx.moveTo(x, y);
        else this.ctx.lineTo(x, y);
      }
      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
      this.ctx.lineWidth = 1.5;
      this.ctx.globalAlpha = 0.8;
      this.ctx.stroke();
    }

    // Update ripples
    for (let j = this.ripples.length - 1; j >= 0; j--) {
      const rip = this.ripples[j];
      rip.radius += 80 * dt;
      rip.alpha -= 0.8 * dt;
      if (rip.alpha <= 0 || rip.radius >= rip.maxRadius) {
        this.ripples.splice(j, 1);
      }
    }

    this.ctx.globalAlpha = 1;

    // Check if settled
    const settled = this.amplitude < 0.01 &&
                    Math.abs(this.targetLevel - this.current) < 0.0005 &&
                    Math.abs(this.velocity) < 0.0005 &&
                    this.ripples.length === 0;

    if (this.running && !settled) {
      this.raf = requestAnimationFrame(this.draw);
    } else {
      this.raf = 0;
    }
  }

  destroy() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    if (this.ro) this.ro.disconnect();
    document.removeEventListener('visibilitychange', this.onVisibility);
  }
}
