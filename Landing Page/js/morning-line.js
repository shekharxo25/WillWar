/**
 * WillWar Morning Line Tone Switcher
 * Calibrated 15-second orientation voice previews (Steady, Stoic, Coach, Playful).
 */

export class MorningLineModule {
  constructor(showToastFn) {
    this.showToast = showToastFn || console.log;
    this.cards = document.querySelectorAll('.morning-card');
    this.activePreviewText = document.getElementById('morning-preview-quote');
    this.activeToneLabel = document.getElementById('morning-preview-tone-label');
    this.playAudioBtn = document.getElementById('morning-play-audio-btn');

    this.quotes = {
      steady: {
        tone: 'Steady',
        quote: '"Day 9. You\'ve already handled nine evenings like this one. Handle tonight the same way."',
        time: 'Delivered at 07:00 AM'
      },
      stoic: {
        tone: 'Stoic',
        quote: '"Day 9. The urge asks for your attention. Give it three minutes of breathing instead."',
        time: 'Delivered at 07:00 AM'
      },
      coach: {
        tone: 'Coach',
        quote: '"Day 9. Phone out of the bedroom tonight. That\'s the whole plan."',
        time: 'Delivered at 07:00 AM'
      },
      playful: {
        tone: 'Playful',
        quote: '"Day 9. Single digits for one more day. Make tomorrow a double."',
        time: 'Delivered at 07:00 AM'
      }
    };

    this.currentTone = 'steady';
    this.init();
  }

  init() {
    this.cards.forEach((card) => {
      card.addEventListener('click', () => {
        const toneKey = card.getAttribute('data-tone');
        if (toneKey && this.quotes[toneKey]) {
          this.setTone(toneKey);
        }
      });
    });

    if (this.playAudioBtn) {
      this.playAudioBtn.addEventListener('click', () => {
        this.playSimulatedVoice();
      });
    }
  }

  setTone(toneKey) {
    this.currentTone = toneKey;
    const item = this.quotes[toneKey];

    this.cards.forEach((c) => {
      if (c.getAttribute('data-tone') === toneKey) {
        c.classList.add('selected-tone');
      } else {
        c.classList.remove('selected-tone');
      }
    });

    if (this.activePreviewText) this.activePreviewText.textContent = item.quote;
    if (this.activeToneLabel) this.activeToneLabel.textContent = item.tone;

    this.showToast(`Morning voice calibrated to ${item.tone}.`, 'record_voice_over');
  }

  playSimulatedVoice() {
    const item = this.quotes[this.currentTone];
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(item.quote.replace(/"/g, ''));
      utterance.rate = 0.92;
      utterance.pitch = 0.95;
      window.speechSynthesis.speak(utterance);
      this.showToast(`Playing ${item.tone} orientation audio...`, 'volume_up');
    } else {
      this.showToast(`Audio preview for ${item.tone} voice line.`, 'volume_up');
    }
  }
}
