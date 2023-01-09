import React from "react";
import { Link } from "react-router-dom";
import { Outlet, Navigate } from "react-router-dom";
import Banner from "../../components/misc/banner";

export default function GamesLayout() {
  const name = localStorage.getItem("name");

  if (!name) {
    return (
      <Navigate
        to="/choose-a-name"
        state={{ from: location.pathname }}
        replace
      />
    );
  }

  return (
    <React.Fragment>
      <Banner />
      <Outlet context={{ name }} />
    </React.Fragment>
  );
}
