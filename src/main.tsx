import React from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import ReactDOM from "react-dom/client";
import GamesLayout from "./routes/games/layout";
import ErrorPage from "./routes/error/error-page";
import Lobby from "./routes/games/lobby";
import LandingPage from "./routes/landing/landing-page";
import ChooseAName from "./routes/choose-a-name/choose-a-name";
import GenerateRoom from "./routes/games/generate-room";
import "./css/index.css";

const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingPage />,
    errorElement: <ErrorPage />,
  },
  {
    path: "/online",
    element: <h1 className="text-3xl text-center pt-16">Online Users</h1>,
  },
  {
    path: "/choose-a-name",
    element: <ChooseAName />,
  },
  {
    path: "/games",
    element: <GamesLayout />,
    children: [
      { index: true, element: <div>Currently running games</div> },
      { path: "new", element: <GenerateRoom /> },
      { path: ":id", element: <Lobby /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <div className="text-primary bg-bg h-screen w-screen">
      <RouterProvider router={router} />
    </div>
  </React.StrictMode>
);
