import { RouterProvider, createHashRouter } from 'react-router-dom';
import ReactDOM from 'react-dom/client';
import GamesLayout from './routes/games/layout';
import ErrorPage from './routes/error/error-page';
import LandingPage from './routes/landing/landing-page';
import ChooseAName from './routes/choose-a-name/choose-a-name';
import GenerateRoom from './routes/games/generate-room';
import './css/index.css';
import AvailableGames from './routes/games/available-games';
import GameContainer from './routes/games/game-container';
import TestGame from './routes/games/test-game';
import { OnlineUsers } from './routes/games/online-users';

const router = createHashRouter([
  {
    path: '/',
    element: <LandingPage />,
    errorElement: <ErrorPage />
  },
  {
    path: '/choose-a-name',
    element: <ChooseAName />
  },
  {
    path: '/test',
    element: <TestGame />
  },
  {
    path: '/games',
    element: <GamesLayout />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <AvailableGames /> },
      { path: 'new', element: <GenerateRoom /> },
      { path: ':id', element: <GameContainer /> },
      { path: 'online', element: <OnlineUsers /> }
    ]
  }
]);

document.cookie = `SameSite=None;Secure`;

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <div className="smallest-view-height w-screen bg-bg text-primary">
    <RouterProvider router={router} />
  </div>
);
