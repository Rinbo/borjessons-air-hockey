import { useNavigate } from "react-router-dom";
import IconButton from "../../components/buttons/icon-button";
import playIcon from "../../assets/svg/play.svg";
import shareIcon from "../../assets/svg/share.svg";
import wifiIcon from "../../assets/svg/wifi.svg";
import "../../css/landing-bg.css";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="w-full h-full flex flex-col ">
      <div className="text-3xl text-center pt-20">borjessons</div>
      <div className="text-6xl text-center font-bold ripple">Air Hockey</div>

      <div className="flex flex-col grow items-center justify-center gap-2 ">
        <IconButton
          text="Join Games"
          className="w-64"
          svgIcon={shareIcon}
          onClick={() => navigate("/games")}
        />
        <IconButton
          text="Create Game"
          className="w-64"
          svgIcon={playIcon}
          onClick={() => navigate("/games/new")}
        />
        <IconButton
          text="See who is online"
          className="w-64"
          svgIcon={wifiIcon}
          onClick={() => navigate("/online")}
        />
      </div>
      <br />
      <button
        className="fixed top-0 z-10"
        onClick={() => localStorage.removeItem("name")}
      >
        Clear localStorage
      </button>

      <ul className="puck">
        <li></li>
      </ul>
    </div>
  );
}
