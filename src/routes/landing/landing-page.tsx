import { useNavigate } from "react-router-dom";
import Button from "../../components/buttons/button";
import JoinButton from "../../components/buttons/join-button";
import OnlineButton from "../../components/buttons/online-button";
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
        <Button
          text="Join Games"
          svgIcon={shareIcon}
          onClick={() => navigate("/games")}
        />
        <Button
          text="Create Game"
          svgIcon={playIcon}
          onClick={() => navigate("/games/new")}
        />
        <Button
          text="See who is online"
          svgIcon={wifiIcon}
          onClick={() => navigate("/online")}
        />
      </div>

      <ul className="puck">
        <li></li>
      </ul>
    </div>
  );
}
