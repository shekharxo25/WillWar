/**
 * WillWar FAQ Smooth Accordion
 * Accessible disclosure widget with keyboard navigation and spring height interpolation.
 */

export class FaqAccordion {
  constructor() {
    this.items = document.querySelectorAll('.faq-item');
    this.init();
  }

  init() {
    this.items.forEach((item) => {
      const question = item.querySelector('.faq-question');
      if (!question) return;

      question.addEventListener('click', () => {
        const isOpen = item.classList.contains('open');
        // Close others
        this.items.forEach((i) => i.classList.remove('open'));
        if (!isOpen) {
          item.classList.add('open');
        }
      });

      question.setAttribute('tabindex', '0');
      question.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          question.click();
        }
      });
    });
  }
}
