import { Outlet } from "react-router-dom";

export default function GamesLayout() {
  return (
    <div className="w-full">
      <Outlet />
    </div>
  );
}
