import { Link } from "react-router-dom";
import { Outlet, Navigate } from "react-router-dom";
import Banner from "../../components/misc/banner";

export default function GamesLayout() {
  const name = localStorage.getItem("name");

  console.log(name, "NAME");

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
    <div className="pt-5">
      <Banner />
      {/*TODO pass saved name down to all outlet components*/}
      <Outlet />
    </div>
  );
}
