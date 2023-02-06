import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
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

const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
    errorElement: <ErrorPage />
  },
  {
    path: '/online',
    element: <h1 className="pt-8 text-center text-3xl">Online Users</h1>
  },
  {
    path: '/choose-a-name',
    element: <ChooseAName />
  },
  {
    path: '/games',
    element: <GamesLayout />,
    children: [
      { index: true, element: <AvailableGames /> },
      { path: 'new', element: <GenerateRoom /> },
      { path: ':id', element: <GameContainer /> },
      { path: 'test', element: <TestGame /> }
    ]
  }
]);

document.cookie = `SameSite=None;Secure`;

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <div className="h-min w-screen bg-bg text-primary">
    <RouterProvider router={router} />
  </div>
);
