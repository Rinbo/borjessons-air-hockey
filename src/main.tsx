import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import ReactDOM from 'react-dom/client';
import GamesLayout from './routes/games/layout';
import ErrorPage from './routes/error/error-page';
import Lobby from './routes/games/lobby';
import LandingPage from './routes/landing/landing-page';
import ChooseAName from './routes/choose-a-name/choose-a-name';
import GenerateRoom from './routes/games/generate-room';
import './css/index.css';
import AvailableGames from './routes/games/available-games';

const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
    errorElement: <ErrorPage />
  },
  {
    path: '/online',
    element: <h1 className="text-3xl text-center pt-8">Online Users</h1>
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
      { path: ':id', element: <Lobby /> }
    ]
  }
]);

document.cookie = `SameSite=None;Secure`;

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <div className="text-primary bg-bg h-min w-screen">
    <RouterProvider router={router} />
  </div>
);
