import { Outlet } from "react-router-dom";
import Wrapper from "./wrapper";

export default function GamesLayout() {
  return (
    <div className="w-full">
      <Wrapper>
        <Outlet />
      </Wrapper>
    </div>
  );
}
