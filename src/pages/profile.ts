/* ===================================================
   Player Profile Page
   =================================================== */

import { gatewayGet } from '../api/api';
import { isAuthenticated, getUser } from '../auth/auth-service';
import { navigate } from '../router';

interface MatchEntry {
  matchId: string;
  player1Id: string;
  player2Id: string;
  score1: number;
  score2: number;
  winnerId: string;
  durationSeconds: number;
  playedAt: string;
}

interface ProfileResponse {
  userId: string;
  displayName: string;
  eloRating: number;
  wins: number;
  losses: number;
  draws: number;
  recentMatches: MatchEntry[];
}

export function mount(container: HTMLElement, params: Record<string, string>): void {
  if (!isAuthenticated()) {
    navigate('/login');
    return;
  }

  container.innerHTML = `
    <div class="profile page-enter">
      <div class="profile__header">
        <button class="btn btn-sm btn-outline" id="btn-back">← Back</button>
      </div>
      <div class="profile__content" id="profile-content">
        <div class="profile__loading">Loading…</div>
      </div>
    </div>
  `;

  document.getElementById('btn-back')!.addEventListener('click', () => navigate('/'));

  const userId = params.userId;
  loadProfile(userId);
}

async function loadProfile(userId?: string): Promise<void> {
  const contentEl = document.getElementById('profile-content');
  if (!contentEl) return;

  try {
    const path = userId ? `/api/rankings/profile/${userId}` : '/api/rankings/profile';
    const data = await gatewayGet<ProfileResponse>(path);
    const currentUser = getUser();

    const totalGames = data.wins + data.losses + data.draws;
    const winRate = totalGames > 0 ? Math.round((data.wins / totalGames) * 100) : 0;
    const initial = data.displayName.charAt(0).toUpperCase();
    const isOwnProfile = currentUser && data.userId === currentUser.id;

    contentEl.innerHTML = `
      <div class="profile__card">
        <div class="profile__avatar-lg">${initial}</div>
        <h2 class="profile__name">${data.displayName}${isOwnProfile ? ' <span class="profile__you">(you)</span>' : ''}</h2>

        <div class="profile__elo-badge">
          <span class="profile__elo-label">ELO Rating</span>
          <span class="profile__elo-value">${data.eloRating}</span>
        </div>

        <div class="profile__stats">
          <div class="profile__stat">
            <span class="profile__stat-value profile__stat-value--win">${data.wins}</span>
            <span class="profile__stat-label">Wins</span>
          </div>
          <div class="profile__stat">
            <span class="profile__stat-value profile__stat-value--loss">${data.losses}</span>
            <span class="profile__stat-label">Losses</span>
          </div>
          <div class="profile__stat">
            <span class="profile__stat-value">${data.draws}</span>
            <span class="profile__stat-label">Draws</span>
          </div>
          <div class="profile__stat">
            <span class="profile__stat-value">${winRate}%</span>
            <span class="profile__stat-label">Win Rate</span>
          </div>
        </div>
      </div>

      ${data.recentMatches.length > 0 ? `
        <div class="profile__matches">
          <h3 class="profile__matches-title">Recent Matches</h3>
          <div class="profile__matches-list">
            ${data.recentMatches.map(match => renderMatch(match, data.userId)).join('')}
          </div>
        </div>
      ` : `
        <div class="empty-state">
          <p>No match history yet.</p>
        </div>
      `}
    `;
  } catch (e) {
    contentEl.innerHTML = `
      <div class="empty-state">
        <p>Failed to load profile. Please try again.</p>
      </div>
    `;
  }
}

function renderMatch(match: MatchEntry, profileUserId: string): string {
  const isPlayer1 = match.player1Id === profileUserId;
  const myScore = isPlayer1 ? match.score1 : match.score2;
  const theirScore = isPlayer1 ? match.score2 : match.score1;
  const won = match.winnerId === profileUserId;
  const draw = match.winnerId === '';
  const resultClass = draw ? 'draw' : won ? 'win' : 'loss';
  const resultText = draw ? 'Draw' : won ? 'Won' : 'Lost';
  const date = new Date(match.playedAt);
  const dateStr = date.toLocaleDateString('en-SE', { month: 'short', day: 'numeric' });

  return `
    <div class="profile__match profile__match--${resultClass}">
      <div class="profile__match-result">${resultText}</div>
      <div class="profile__match-score">${myScore} – ${theirScore}</div>
      <div class="profile__match-date">${dateStr}</div>
    </div>
  `;
}

export function unmount(): void {}
