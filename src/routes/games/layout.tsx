import { Link } from "react-router-dom";
import { Outlet, Navigate } from "react-router-dom";

export default function GamesLayout() {
  const name = localStorage.getItem("name");

  console.log(name, "NAME");

  if (!name)
    return (
      <Navigate
        to="/choose-a-name"
        state={{ from: location.pathname }}
        replace
      />
    );

  return (
    <div>
      <Link to="/">Back</Link>
      {/*TODO pass saved name down to all outlet components*/}
      <Outlet />
    </div>
  );
}
