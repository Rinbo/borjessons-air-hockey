import Button from "../../components/buttons/button";
import JoinButton from "../../components/buttons/join-button";
import OnlineButton from "../../components/buttons/online-button";
import PlayButton from "../../components/buttons/play-button";

export default function LandingPage() {
  return (
    <div className="h-screen flex flex-col bg-bg text-primary">
      <div className="text-3xl text-center font-mono  pt-20">borjessons</div>
      <div className="text-6xl text-center font-bold">Air Hockey</div>

      <div className="flex flex-col grow items-center justify-center gap-2 ">
        <PlayButton />
        <JoinButton />
        <OnlineButton />
      </div>
    </div>
  );
}
