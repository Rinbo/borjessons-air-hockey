import React from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import ReactDOM from "react-dom/client";
import GamesLayout from "./routes/games/layout";

import "./css/index.css";
import ErrorPage from "./routes/error/error-page";
import ShowGame from "./routes/games/show-game";
import LandingPage from "./routes/landing/landing-page";

const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingPage />,
    errorElement: <ErrorPage />,
  },
  {
    path: "/games",
    element: <GamesLayout />,
    children: [
      { index: true, element: <div>Currently running games</div> },
      { path: "new", element: <div>Create Game</div> },
      { path: ":id", element: <ShowGame /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
