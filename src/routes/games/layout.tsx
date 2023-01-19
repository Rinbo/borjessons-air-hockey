import React from 'react';
import { Link } from 'react-router-dom';
import { Outlet, Navigate } from 'react-router-dom';
import Banner from '../../components/misc/banner';

export default function GamesLayout() {
  const username = localStorage.getItem('username');

  if (!username) {
    return <Navigate to="/choose-a-name" state={{ from: location.pathname }} replace />;
  }

  return (
    <React.Fragment>
      <Banner />
      <Outlet context={{ username }} />
    </React.Fragment>
  );
}
