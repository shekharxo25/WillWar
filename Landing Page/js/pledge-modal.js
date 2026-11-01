/**
 * WillWar Onboarding Pledge Signature Modal
 * Implements the 3-second tactile "Hold to sign" interaction (DESIGN.md section 4).
 */

export class PledgeModal {
  constructor(showToastFn) {
    this.showToast = showToastFn || console.log;
    this.overlay = document.getElementById('pledge-modal-overlay');
    this.closeBtn = document.getElementById('pledge-modal-close');
    this.openBtns = document.querySelectorAll('.open-pledge-trigger');
    this.handleInput = document.getElementById('pledge-handle-input');
    this.holdBtn = document.getElementById('pledge-hold-btn');
    this.fillBar = document.getElementById('pledge-btn-fill');
    this.btnText = document.getElementById('pledge-btn-text');
    this.signedSeal = document.getElementById('pledge-signed-seal');
    this.sealHandleText = document.getElementById('seal-handle-text');

    this.holdTimer = null;
    this.fillProgress = 0;
    this.isSigned = false;

    this.init();
  }

  init() {
    this.openBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.open();
      });
    });

    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => this.close());
    }

    if (this.overlay) {
      this.overlay.addEventListener('click', (e) => {
        if (e.target === this.overlay) this.close();
      });
    }

    this.bindHoldToSign();
  }

  open() {
    if (this.overlay) {
      this.overlay.classList.add('open');
      document.body.style.overflow = 'hidden';
      if (this.handleInput) this.handleInput.focus();
    }
  }

  close() {
    if (this.overlay) {
      this.overlay.classList.remove('open');
      document.body.style.overflow = '';
    }
  }

  bindHoldToSign() {
    if (!this.holdBtn) return;

    const startHold = (e) => {
      if (this.isSigned) return;
      if (e.cancelable && e.type === 'touchstart') e.preventDefault();

      const handleVal = this.handleInput?.value.trim() || '@quietmile';
      this.btnText.textContent = 'Signing in progress...';

      this.holdTimer = setInterval(() => {
        if (this.fillProgress < 100) {
          this.fillProgress += 3.3; // ~1.5s total hold
          if (this.fillBar) this.fillBar.style.width = `${Math.min(100, this.fillProgress)}%`;
        } else {
          // Completed
          clearInterval(this.holdTimer);
          this.holdTimer = null;
          this.isSigned = true;

          if (this.holdBtn) this.holdBtn.style.display = 'none';
          if (this.signedSeal) {
            this.signedSeal.style.display = 'block';
            if (this.sealHandleText) this.sealHandleText.textContent = handleVal.startsWith('@') ? handleVal : `@${handleVal}`;
          }

          if (navigator.vibrate) {
            try { navigator.vibrate([60, 40, 80]); } catch {}
          }

          this.showToast('Pledge signed. Your clock is running.', 'verified');

          setTimeout(() => {
            this.close();
          }, 2400);
        }
      }, 50);
    };

    const stopHold = () => {
      if (this.holdTimer) {
        clearInterval(this.holdTimer);
        this.holdTimer = null;
      }
      if (!this.isSigned) {
        this.fillProgress = 0;
        if (this.fillBar) this.fillBar.style.width = '0%';
        if (this.btnText) this.btnText.textContent = 'Hold to sign pledge';
      }
    };

    this.holdBtn.addEventListener('mousedown', startHold);
    this.holdBtn.addEventListener('mouseup', stopHold);
    this.holdBtn.addEventListener('mouseleave', stopHold);
    this.holdBtn.addEventListener('touchstart', startHold, { passive: false });
    this.holdBtn.addEventListener('touchend', stopHold);

    // Spacebar support (DESIGN.md section 4)
    window.addEventListener('keydown', (e) => {
      if (this.overlay?.classList.contains('open') && e.code === 'Space' && !this.isSigned && document.activeElement !== this.handleInput) {
        e.preventDefault();
        if (!this.holdTimer) startHold(e);
      }
    });

    window.addEventListener('keyup', (e) => {
      if (this.overlay?.classList.contains('open') && e.code === 'Space') {
        stopHold();
      }
    });
  }
}
