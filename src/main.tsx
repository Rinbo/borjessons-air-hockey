import React from "react";
import ReactDOM from "react-dom/client";
import Start from "./views/start/start";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import "./css/index.css";
import ErrorPage from "./views/error/error-page";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Start />,
    errorElement: <ErrorPage />,
  },
]);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
