/* ===================================================
   Leaderboard Page
   =================================================== */

import { gatewayGet } from '../api/api';
import { isAuthenticated, getUser } from '../auth/auth-service';
import { navigate } from '../router';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  eloRating: number;
}

interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[];
}

export function mount(container: HTMLElement): void {
  if (!isAuthenticated()) {
    navigate('/login');
    return;
  }

  container.innerHTML = `
    <div class="leaderboard page-enter">
      <div class="leaderboard__header">
        <button class="btn btn-sm btn-outline" id="btn-back">← Back</button>
        <h1 class="leaderboard__title">Leaderboard</h1>
        <div class="leaderboard__subtitle">Top 100 players by ELO rating</div>
      </div>
      <div class="leaderboard__list" id="leaderboard-list">
        <div class="leaderboard__loading">Loading…</div>
      </div>
    </div>
  `;

  document.getElementById('btn-back')!.addEventListener('click', () => navigate('/'));
  loadLeaderboard();
}

async function loadLeaderboard(): Promise<void> {
  const listEl = document.getElementById('leaderboard-list');
  if (!listEl) return;

  try {
    const data = await gatewayGet<LeaderboardResponse>('/api/rankings/leaderboard');
    const currentUser = getUser();
    const entries = data.leaderboard;

    if (entries.length === 0) {
      listEl.innerHTML = `
        <div class="empty-state">
          <p>No ranked players yet. Play a match to get started!</p>
        </div>
      `;
      return;
    }

    listEl.innerHTML = entries.map(entry => {
      const isMe = currentUser && entry.userId === currentUser.id;
      const initial = entry.displayName.charAt(0).toUpperCase();
      const medalEmoji = entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : '';

      return `
        <div class="leaderboard__row${isMe ? ' leaderboard__row--me' : ''}"
             data-user-id="${entry.userId}"
             style="animation-delay: ${Math.min(entry.rank * 30, 600)}ms">
          <div class="leaderboard__rank">
            ${medalEmoji || `<span class="leaderboard__rank-num">${entry.rank}</span>`}
          </div>
          <div class="leaderboard__avatar">${initial}</div>
          <div class="leaderboard__name">${entry.displayName}</div>
          <div class="leaderboard__elo">${entry.eloRating}</div>
        </div>
      `;
    }).join('');

    // Click rows to view profile
    listEl.querySelectorAll('.leaderboard__row').forEach(row => {
      row.addEventListener('click', () => {
        const userId = (row as HTMLElement).dataset.userId;
        if (userId) navigate(`/profile/${userId}`);
      });
    });
  } catch (e) {
    listEl.innerHTML = `
      <div class="empty-state">
        <p>Failed to load leaderboard. Please try again.</p>
      </div>
    `;
  }
}

export function unmount(): void {}
