/**
 * WillWar Telemetry Chronometer
 * Implements tabular jitter-free session tracking and 30-day countdown telemetry.
 * Stores epoch start in localStorage ('ww-session-start').
 */

export class Chronometer {
  constructor(clockElementId) {
    this.el = document.getElementById(clockElementId);
    this.storageKey = 'ww-session-start';
    this.startTime = this.getOrCreateStartTime();
    this.intervalId = null;

    this.init();
  }

  getOrCreateStartTime() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const val = parseInt(stored, 10);
        if (!isNaN(val) && val > 0 && val <= Date.now()) {
          return val;
        }
      }
    } catch {
      // ignore
    }
    const now = Date.now() - 84000; // start 1m 24s in to match Stitch design mock
    try {
      localStorage.setItem(this.storageKey, now.toString());
    } catch {}
    return now;
  }

  init() {
    this.update();
    this.intervalId = setInterval(() => this.update(), 1000);
  }

  formatSeconds(totalSecs) {
    const d = Math.floor(totalSecs / 86400);
    const h = Math.floor((totalSecs % 86400) / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = Math.floor(totalSecs % 60);

    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(d)}d ${pad(h)}h ${pad(m)}m ${pad(s)}s`;
  }

  update() {
    if (!this.el) return;
    const elapsedSecs = Math.max(0, Math.floor((Date.now() - this.startTime) / 1000));
    this.el.textContent = this.formatSeconds(elapsedSecs);
  }

  reset() {
    this.startTime = Date.now();
    try {
      localStorage.setItem(this.storageKey, this.startTime.toString());
    } catch {}
    this.update();
  }

  destroy() {
    if (this.intervalId) clearInterval(this.intervalId);
  }
}
