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

// Pages
import * as landing from './pages/landing';
import * as chooseName from './pages/choose-name';
import * as availableGames from './pages/available-games';
import * as generateRoom from './pages/generate-room';
import * as gameContainer from './pages/game-container';
import * as onlineUsers from './pages/online-users';
import * as error from './pages/error';

// SameSite cookie
document.cookie = `SameSite=None;Secure`;

// Register routes
addRoute('/', landing.mount, landing.unmount);
addRoute('/choose-a-name', chooseName.mount, chooseName.unmount);
addRoute('/games', availableGames.mount, availableGames.unmount);
addRoute('/games/new', generateRoom.mount, generateRoom.unmount);
addRoute('/games/online', onlineUsers.mount, onlineUsers.unmount);
addRoute('/games/:id', gameContainer.mount, gameContainer.unmount);
addRoute('/error', error.mount, error.unmount);

// Start
const root = document.getElementById('root');
if (root) {
  startRouter(root);
}
