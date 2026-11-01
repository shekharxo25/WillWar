/**
 * WillWar 30-Day Timeline Interactive Scrubber
 * Links interactive slider, milestone cards, sticky radial chronometer and phone mockup.
 */

export class TimelineScrubber {
  constructor(options = {}) {
    this.slider = document.getElementById('timeline-slider');
    this.cards = document.querySelectorAll('.milestone-card');
    this.gaugeWater = document.getElementById('radial-gauge-water');
    this.gaugeDayText = document.getElementById('radial-gauge-day-text');
    this.gaugeMilestoneBadge = document.getElementById('radial-gauge-milestone-badge');
    this.gaugePercentText = document.getElementById('radial-gauge-percent-text');
    this.phoneDialTideLevel = document.getElementById('phone-dial-tide-text');
    this.phoneTideCanvas = options.phoneTideCanvas;

    this.milestoneData = {
      1: { percent: 3, label: 'Day 1', milestone: 'Quiet Resolve', brass: false },
      3: { percent: 10, label: 'Day 3', milestone: 'Drift Plan', brass: false },
      7: { percent: 23, label: 'Day 7', milestone: 'Brass Milestone I', brass: true },
      14: { percent: 46, label: 'Day 14', milestone: 'Brass Milestone II', brass: true },
      21: { percent: 70, label: 'Day 21', milestone: 'Brass Milestone III', brass: true },
      30: { percent: 100, label: 'Day 30', milestone: 'Full Brass Horizon', brass: true }
    };

    this.currentDay = 1;
    this.init();
  }

  init() {
    if (this.slider) {
      this.slider.addEventListener('input', (e) => {
        const day = parseInt(e.target.value, 10);
        this.setDay(day);
      });
    }

    this.cards.forEach((card) => {
      card.addEventListener('click', () => {
        const dayAttr = card.getAttribute('data-day');
        if (dayAttr) {
          const day = parseInt(dayAttr, 10);
          if (this.slider) this.slider.value = day;
          this.setDay(day);
        }
      });
    });

    this.setDay(1, true);
  }

  setDay(day, immediate = false) {
    this.currentDay = day;

    // Calculate percentage based on day (1 to 30)
    let percent = Math.round((day / 30) * 100);
    let matchedMilestone = 'In Progress';
    let isBrass = false;

    // Check key milestones
    const days = [1, 3, 7, 14, 21, 30];
    let closestDay = days[0];
    for (const d of days) {
      if (day >= d) closestDay = d;
    }

    const data = this.milestoneData[closestDay];
    if (data) {
      matchedMilestone = data.milestone;
      isBrass = data.brass;
    }

    // Update gauge
    if (this.gaugeWater) {
      this.gaugeWater.style.height = `${percent}%`;
    }

    if (this.gaugeDayText) {
      this.gaugeDayText.textContent = `Day ${day} ${day >= 30 ? 'Achieved' : 'Reached'}`;
    }

    if (this.gaugePercentText) {
      this.gaugePercentText.textContent = `${percent}% Waterline`;
    }

    if (this.gaugeMilestoneBadge) {
      this.gaugeMilestoneBadge.textContent = matchedMilestone;
      if (isBrass && day >= closestDay) {
        this.gaugeMilestoneBadge.className = 'text-label-md font-label-md brass-badge';
      } else {
        this.gaugeMilestoneBadge.className = 'text-label-md font-label-md tide-badge';
      }
    }

    // Update phone dial text and canvas
    if (this.phoneDialTideLevel) {
      const pad = (n) => String(n).padStart(2, '0');
      this.phoneDialTideLevel.textContent = `${pad(day)}d 04h`;
    }

    if (this.phoneTideCanvas) {
      this.phoneTideCanvas.setLevel(percent / 100, immediate);
    }

    // Highlight corresponding card
    this.cards.forEach((c) => {
      const cDay = parseInt(c.getAttribute('data-day') || '0', 10);
      if (cDay === closestDay) {
        c.classList.add('active-scrub');
      } else {
        c.classList.remove('active-scrub');
      }
    });

    // Milestone vibration / glint
    if (isBrass && (day === 7 || day === 14 || day === 21 || day === 30)) {
      if (navigator.vibrate) {
        try { navigator.vibrate(25); } catch {}
      }
    }
  }
}
