import JoinButton from "../../components/buttons/join-button";
import OnlineButton from "../../components/buttons/online-button";
import PlayButton from "../../components/buttons/play-button";
import "../../css/landing-bg.css";

export default function LandingPage() {
  return (
    <div className="bg-bg">
      <div className="w-screen h-screen flex flex-col text-primary">
        <div className="text-3xl text-center pt-20">borjessons</div>
        <div className="text-6xl text-center font-bold ripple">Air Hockey</div>

        <div className="flex flex-col grow items-center justify-center gap-2 ">
          <JoinButton />
          <PlayButton />
          <OnlineButton />
        </div>
        <ul className="puck">
          <li></li>
        </ul>
      </div>
    </div>
  );
}
