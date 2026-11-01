/**
 * WillWar Pact Leaderboard Module
 * Segmented metrics filtering, private nudges, and secure friend invitations.
 */

export class PactLeaderboard {
  constructor(showToastFn) {
    this.showToast = showToastFn || console.log;
    this.segmentBtns = document.querySelectorAll('.leader-segment-btn');
    this.rowsContainer = document.getElementById('leaderboard-rows-container');
    this.inviteBtn = document.getElementById('invite-pact-btn');

    this.data = {
      current: [
        { rank: 1, handle: '@dev.s', subtitle: 'Milestone II achieved', score: '14d 08h', action: 'nudge', isYou: false, isBrass: true },
        { rank: 2, handle: '@quietmile', subtitle: 'War Chest: ₹499 locked', score: '06d 14h', action: 'clear', isYou: true, isBrass: false },
        { rank: 3, handle: '@rohan_k', subtitle: 'Approaching Day 7', score: '04d 21h', action: 'nudge', isYou: false, isBrass: false },
        { rank: 4, handle: '@arjun_m', subtitle: 'Clock resting', score: '—', action: 'reach_out', isYou: false, isPaused: true }
      ],
      best: [
        { rank: 1, handle: '@dev.s', subtitle: 'All-time best: Oct 2026', score: '22d 12h', action: 'nudge', isYou: false, isBrass: true },
        { rank: 2, handle: '@quietmile', subtitle: 'All-time best: Sep 2026', score: '19d 04h', action: 'clear', isYou: true, isBrass: false },
        { rank: 3, handle: '@rohan_k', subtitle: 'All-time best: Aug 2026', score: '12d 18h', action: 'nudge', isYou: false, isBrass: false },
        { rank: 4, handle: '@arjun_m', subtitle: 'All-time best: Jul 2026', score: '08d 06h', action: 'reach_out', isYou: false, isBrass: false }
      ],
      days: [
        { rank: 1, handle: '@quietmile', subtitle: 'Total challenge days', score: '28 days', action: 'clear', isYou: true, isBrass: true },
        { rank: 2, handle: '@dev.s', subtitle: 'Total challenge days', score: '26 days', action: 'nudge', isYou: false, isBrass: false },
        { rank: 3, handle: '@rohan_k', subtitle: 'Total challenge days', score: '18 days', action: 'nudge', isYou: false, isBrass: false },
        { rank: 4, handle: '@arjun_m', subtitle: 'Total challenge days', score: '14 days', action: 'reach_out', isYou: false, isBrass: false }
      ]
    };

    this.activeMetric = 'current';
    this.init();
  }

  init() {
    this.segmentBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const metric = btn.getAttribute('data-metric');
        this.segmentBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeMetric = metric;
        this.render();
      });
    });

    if (this.inviteBtn) {
      this.inviteBtn.addEventListener('click', () => {
        navigator.clipboard?.writeText(window.location.origin + '/pact/join/dawn-crew');
        this.showToast('Encrypted pact invite link copied to clipboard.', 'link');
      });
    }

    this.render();
  }

  render() {
    if (!this.rowsContainer) return;
    const items = this.data[this.activeMetric] || this.data.current;

    this.rowsContainer.innerHTML = items.map((item) => `
      <div class="leader-row ${item.isYou ? 'highlighted-user' : ''} ${item.isPaused ? 'opacity-60' : ''}">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div class="rank-badge ${item.isBrass ? 'brass-first' : ''}">
            ${item.rank}
          </div>
          <div>
            <div style="font-weight: 600; display: flex; align-items: center; gap: 6px;">
              <span>${item.handle}</span>
              ${item.isYou ? '<span class="tide-badge" style="font-size: 10px; padding: 2px 6px;">YOU · Backed</span>' : ''}
              ${item.isPaused ? '<span style="font-size: 11px; padding: 2px 6px; border-radius: 4px; background: var(--bg-tertiary); color: var(--label-2);">Paused</span>' : ''}
            </div>
            <div style="font-size: 0.75rem; color: var(--label-2);">${item.subtitle}</div>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 12px;">
          <span class="tnum" style="font-weight: 700; font-size: 0.9375rem; color: ${item.isYou ? 'var(--tide)' : 'var(--label)'};">
            ${item.score}
          </span>
          ${this.renderActionBtn(item)}
        </div>
      </div>
    `).join('');

    this.bindRowActions();
  }

  renderActionBtn(item) {
    if (item.action === 'clear') {
      return '<span style="font-size: 0.75rem; color: var(--label-3); padding: 4px 8px;">Clear</span>';
    }
    if (item.action === 'reach_out') {
      return `<button class="pact-action-btn pressable" data-handle="${item.handle}" data-type="reach" style="font-size: 0.75rem; padding: 4px 12px; border-radius: 9999px; background: var(--bg-tertiary); color: var(--label-2); border: none;">Reach out</button>`;
    }
    return `<button class="pact-action-btn pressable" data-handle="${item.handle}" data-type="nudge" style="font-size: 0.75rem; padding: 4px 12px; border-radius: 9999px; background: var(--tide-wash); color: var(--tide); border: none; font-weight: 600;">Nudge</button>`;
  }

  bindRowActions() {
    const btns = this.rowsContainer.querySelectorAll('.pact-action-btn');
    btns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const handle = btn.getAttribute('data-handle');
        const type = btn.getAttribute('data-type');
        if (type === 'nudge') {
          btn.textContent = 'Nudged ✓';
          btn.disabled = true;
          this.showToast(`Calm check-in nudge sent to ${handle}.`, 'notifications');
        } else {
          btn.textContent = 'Sent ✓';
          btn.disabled = true;
          this.showToast(`Private encouragement broadcast to ${handle}.`, 'shield');
        }
      });
    });
  }
}
