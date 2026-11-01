/**
 * WillWar War Chest Commitment Vault Simulator
 * Implements collateral calculation, 75/25 split progress bar, and cause designation.
 */

export class WarChestModule {
  constructor() {
    this.amountChips = document.querySelectorAll('.amount-preset-chip');
    this.customInput = document.getElementById('chest-custom-input');
    this.totalStakedText = document.getElementById('chest-total-staked');
    this.yoursText = document.getElementById('chest-split-yours-text');
    this.causeText = document.getElementById('chest-split-cause-text');
    this.splitYoursBar = document.getElementById('chest-split-yours-bar');
    this.splitCauseBar = document.getElementById('chest-split-cause-bar');
    this.causeSelect = document.getElementById('chest-cause-select');
    this.designatedCauseLabel = document.getElementById('chest-designated-cause-name');
    this.promiseToggle = document.getElementById('chest-promise-mode-toggle');
    this.modeDescription = document.getElementById('chest-mode-desc');

    this.currentAmount = 499; // default
    this.isPromiseMode = false;

    this.init();
  }

  init() {
    this.amountChips.forEach((chip) => {
      chip.addEventListener('click', () => {
        const val = parseInt(chip.getAttribute('data-amount') || '499', 10);
        this.amountChips.forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');
        this.setAmount(val);
      });
    });

    if (this.customInput) {
      this.customInput.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        if (!isNaN(val) && val >= 50) {
          this.amountChips.forEach((c) => c.classList.remove('active'));
          this.setAmount(val);
        }
      });
    }

    if (this.causeSelect && this.designatedCauseLabel) {
      this.causeSelect.addEventListener('change', (e) => {
        this.designatedCauseLabel.textContent = e.target.value;
      });
    }

    if (this.promiseToggle) {
      this.promiseToggle.addEventListener('change', (e) => {
        this.isPromiseMode = e.target.checked;
        if (this.modeDescription) {
          this.modeDescription.textContent = this.isPromiseMode
            ? 'Promise Mode active: No credit card charged. You donate on honor if reset occurs.'
            : 'Escrow Vault active: Funds held in segregated trust, returned Dec 1.';
        }
      });
    }

    this.setAmount(499);
  }

  setAmount(amount) {
    this.currentAmount = amount;
    const yours = Math.round(amount * 0.75);
    const cause = amount - yours;

    if (this.totalStakedText) {
      this.totalStakedText.textContent = `₹${amount.toLocaleString('en-IN')}`;
    }
    if (this.yoursText) {
      this.yoursText.textContent = `Still yours: ₹${yours.toLocaleString('en-IN')} (75%)`;
    }
    if (this.causeText) {
      this.causeText.textContent = `Given to cause: ₹${cause.toLocaleString('en-IN')} (25%)`;
    }

    if (this.splitYoursBar) {
      this.splitYoursBar.style.width = '75%';
    }
    if (this.splitCauseBar) {
      this.splitCauseBar.style.width = '25%';
    }
  }
}
