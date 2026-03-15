/* ===================================================
   App Entry Point
   =================================================== */

// Styles
import './styles/variables.css';
import './styles/base.css';
import './styles/components.css';
import './styles/pages.css';
import './styles/animations.css';

// Router
import { addRoute, startRouter } from './router';

// Auth
import { tryRefresh } from './auth/auth-service';

// Dev Gate
import { showDevGate } from './dev-gate';

// Pages
import * as landing from './pages/landing';
import * as login from './pages/login';
import * as availableGames from './pages/available-games';
import * as generateRoom from './pages/generate-room';
import * as gameContainer from './pages/game-container';
import * as onlineUsers from './pages/online-users';
import * as serverStarting from './pages/server-starting';
import * as findMatch from './pages/find-match';
import * as leaderboard from './pages/leaderboard';
import * as profile from './pages/profile';
import * as error from './pages/error';

// Register routes
addRoute('/', landing.mount, landing.unmount);
addRoute('/login', login.mount, login.unmount);
addRoute('/games', availableGames.mount, availableGames.unmount);
addRoute('/games/new', generateRoom.mount, generateRoom.unmount);
addRoute('/games/starting/:gameId', serverStarting.mount, serverStarting.unmount);
addRoute('/games/find-match', findMatch.mount, findMatch.unmount);
addRoute('/games/online', onlineUsers.mount, onlineUsers.unmount);
addRoute('/games/:id', gameContainer.mount, gameContainer.unmount);
addRoute('/leaderboard', leaderboard.mount, leaderboard.unmount);
addRoute('/profile', profile.mount, profile.unmount);
addRoute('/profile/:userId', profile.mount, profile.unmount);
addRoute('/error', error.mount, error.unmount);

// Boot the app — dev gate in production only
async function boot() {
  if (import.meta.env.PROD) {
    await showDevGate();
  }

  const root = document.getElementById('root');
  if (root) {
    tryRefresh().finally(() => {
      startRouter(root);
    });
  }
}

boot();

