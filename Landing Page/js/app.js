/**
 * WillWar Landing Page Master Controller
 * Initializes all interactive modules, floating HUD toast system, and theme preferences.
 */

import { TideCanvas } from './tide-canvas.js';
import { Chronometer } from './chronometer.js';
import { TimelineScrubber } from './timeline-scrubber.js';
import { RideItOutModule } from './ride-it-out.js';
import { PactLeaderboard } from './pact-leaderboard.js';
import { WarChestModule } from './war-chest.js';
import { MorningLineModule } from './morning-line.js';
import { FaqAccordion } from './faq-accordion.js';
import { PledgeModal } from './pledge-modal.js';

class App {
  constructor() {
    this.toastEl = document.getElementById('hud-toast');
    this.toastText = document.getElementById('hud-toast-text');
    this.toastIcon = document.getElementById('hud-toast-icon');
    this.toastTimer = null;

    this.initToast();
    this.initTheme();
    this.initScrollHeader();
    this.initMobileMenu();
    this.initModules();
  }

  showToast(message, icon = 'info') {
    if (!this.toastEl) return;
    if (this.toastText) this.toastText.textContent = message;
    if (this.toastIcon) this.toastIcon.textContent = icon;

    this.toastEl.classList.add('visible');

    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.toastEl.classList.remove('visible');
    }, 2800);
  }

  initToast() {
    if (this.toastEl) {
      this.toastEl.addEventListener('click', () => {
        this.toastEl.classList.remove('visible');
      });
    }
  }

  initTheme() {
    const themeBtn = document.getElementById('theme-toggle-btn');
    const themeIcon = document.getElementById('theme-toggle-icon');

    // Retrieve saved theme or system preference
    const saved = localStorage.getItem('ww-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const currentTheme = saved || (prefersDark ? 'dark' : 'light');

    document.documentElement.setAttribute('data-theme', currentTheme);
    if (themeIcon) {
      themeIcon.textContent = currentTheme === 'dark' ? 'light_mode' : 'dark_mode';
    }

    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        const active = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
        const next = active === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('ww-theme', next);

        if (themeIcon) {
          themeIcon.textContent = next === 'dark' ? 'light_mode' : 'dark_mode';
        }
        this.showToast(`Switched to ${next} appearance.`, next === 'dark' ? 'dark_mode' : 'light_mode');
      });
    }
  }

  initScrollHeader() {
    const header = document.querySelector('.header-fixed');
    if (!header) return;

    window.addEventListener('scroll', () => {
      if (window.scrollY > 30) {
        header.style.paddingTop = '8px';
        header.style.paddingBottom = '8px';
      } else {
        header.style.paddingTop = '16px';
        header.style.paddingBottom = '8px';
      }
    }, { passive: true });
  }

  initMobileMenu() {
    const mobileBtn = document.getElementById('mobile-menu-btn');
    const mobileNav = document.getElementById('mobile-nav-drawer');
    const mobileLinks = document.querySelectorAll('.mobile-nav-link');

    if (mobileBtn && mobileNav) {
      mobileBtn.addEventListener('click', () => {
        const isOpen = mobileNav.classList.contains('open');
        if (isOpen) {
          mobileNav.classList.remove('open');
        } else {
          mobileNav.classList.add('open');
        }
      });

      mobileLinks.forEach((link) => {
        link.addEventListener('click', () => {
          mobileNav.classList.remove('open');
        });
      });
    }
  }

  initModules() {
    const showToastBound = this.showToast.bind(this);

    // 1. Phone Tide Canvas
    const phoneCanvasEl = document.getElementById('phone-tide-canvas');
    let phoneTide = null;
    if (phoneCanvasEl) {
      phoneTide = new TideCanvas(phoneCanvasEl, {
        level: 0.15,
        settleAfterMs: 20000
      });
    }

    // 2. Active Session Chronometer
    new Chronometer('hero-clock');

    // 3. 30-Day Timeline Scrubber
    new TimelineScrubber({
      phoneTideCanvas: phoneTide
    });

    // 4. Ride It Out Urge Lab
    new RideItOutModule(showToastBound);

    // 5. Pact Leaderboard
    new PactLeaderboard(showToastBound);

    // 6. War Chest Module
    new WarChestModule();

    // 7. Morning Line Tone Switcher
    new MorningLineModule(showToastBound);

    // 8. FAQ Accordion
    new FaqAccordion();

    // 9. Pledge Signature Modal
    new PledgeModal(showToastBound);
  }
}

// Bootstrap on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new App());
} else {
  new App();
}
