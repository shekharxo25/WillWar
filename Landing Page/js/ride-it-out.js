/**
 * WillWar "Ride it out" Cognitive Load Protocol Module
 * Implements tactile wave compression, Swell breathing pacer, and Drift spatial game.
 */

export class RideItOutModule {
  constructor(showToastFn) {
    this.showToast = showToastFn || console.log;
    this.holdBtn = document.getElementById('wave-hold-btn');
    this.waveFill = document.getElementById('interactive-wave-fill');
    this.waveStatus = document.getElementById('wave-status-text');
    this.waveBtnText = document.getElementById('wave-btn-text');
    this.waveTimerText = document.getElementById('wave-timer-text');

    this.holdTimer = null;
    this.progress = 38; // initial wave fill %
    this.isCompleted = false;

    // Exercise switcher
    this.exerciseChips = document.querySelectorAll('.exercise-chip');
    this.exercisePanels = document.querySelectorAll('.exercise-panel');

    // Breathing cadence
    this.breathingStateText = document.getElementById('breathing-cadence-state');
    this.breathingSecText = document.getElementById('breathing-cadence-sec');
    this.breathingInterval = null;

    this.init();
  }

  init() {
    this.bindHoldWave();
    this.bindExerciseTabs();
    this.startBreathingCadence();
  }

  bindHoldWave() {
    if (!this.holdBtn) return;

    const startHold = (e) => {
      if (e.cancelable && e.type === 'touchstart') e.preventDefault();
      if (this.isCompleted) {
        // Reset if already completed
        this.isCompleted = false;
        this.progress = 38;
        if (this.waveFill) this.waveFill.style.height = '38%';
      }

      this.waveBtnText.textContent = 'Holding steady...';
      if (this.waveStatus) this.waveStatus.textContent = 'Riding through crest...';

      let secondsLeft = 180; // 3 min

      this.holdTimer = setInterval(() => {
        if (this.progress > 4) {
          this.progress -= 1.8;
          if (this.waveFill) this.waveFill.style.height = `${this.progress}%`;

          // Tick down timer visual
          secondsLeft -= 3;
          if (this.waveTimerText) {
            const m = Math.floor(secondsLeft / 60);
            const s = secondsLeft % 60;
            this.waveTimerText.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')} Remaining`;
          }
        } else {
          // Completed
          clearInterval(this.holdTimer);
          this.holdTimer = null;
          this.isCompleted = true;
          if (this.waveFill) this.waveFill.style.height = '0%';
          if (this.waveStatus) {
            this.waveStatus.textContent = 'Wave passed.';
            this.waveStatus.style.color = 'var(--tide)';
          }
          if (this.waveBtnText) this.waveBtnText.textContent = 'Wave subsided. Breathe.';
          if (this.waveTimerText) this.waveTimerText.textContent = '00:00 Complete';

          if (navigator.vibrate) {
            try { navigator.vibrate([40, 60, 40]); } catch {}
          }

          this.showToast('Wave passed. Steady horizon held.', 'waves');
        }
      }, 50);
    };

    const stopHold = () => {
      if (this.holdTimer) {
        clearInterval(this.holdTimer);
        this.holdTimer = null;
      }
      if (!this.isCompleted) {
        this.progress = 38;
        if (this.waveFill) this.waveFill.style.height = '38%';
        if (this.waveBtnText) this.waveBtnText.textContent = 'Hold to ride a wave';
        if (this.waveStatus) {
          this.waveStatus.textContent = 'Wave in progress';
          this.waveStatus.style.color = '';
        }
        if (this.waveTimerText) this.waveTimerText.textContent = '03:00 Remaining';
      }
    };

    this.holdBtn.addEventListener('mousedown', startHold);
    this.holdBtn.addEventListener('mouseup', stopHold);
    this.holdBtn.addEventListener('mouseleave', stopHold);
    this.holdBtn.addEventListener('touchstart', startHold, { passive: false });
    this.holdBtn.addEventListener('touchend', stopHold);
  }

  bindExerciseTabs() {
    this.exerciseChips.forEach((chip) => {
      chip.addEventListener('click', () => {
        const exerciseId = chip.getAttribute('data-exercise');
        this.exerciseChips.forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');

        this.exercisePanels.forEach((panel) => {
          if (panel.getAttribute('data-panel') === exerciseId) {
            panel.style.display = 'block';
          } else {
            panel.style.display = 'none';
          }
        });
      });
    });
  }

  startBreathingCadence() {
    if (!this.breathingStateText || !this.breathingSecText) return;
    let cycleSec = 0; // 0 to 9 (0-3 Inhale 4s, 4-9 Exhale 6s)

    this.breathingInterval = setInterval(() => {
      cycleSec = (cycleSec + 1) % 10;
      if (cycleSec < 4) {
        this.breathingStateText.textContent = 'Inhale';
        this.breathingSecText.textContent = `${4 - cycleSec}s`;
      } else {
        this.breathingStateText.textContent = 'Exhale';
        this.breathingSecText.textContent = `${10 - cycleSec}s`;
      }
    }, 1000);
  }

  destroy() {
    if (this.holdTimer) clearInterval(this.holdTimer);
    if (this.breathingInterval) clearInterval(this.breathingInterval);
  }
}
