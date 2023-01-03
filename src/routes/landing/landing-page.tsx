import Button from "../../components/buttons/button";
import PlayButton from "../../components/buttons/play-button";

export default function LandingPage() {
  return (
    <div className="h-screen flex flex-col">
      <div className="text-3xl text-center font-mono  pt-20">borjessons</div>
      <div className="text-6xl text-center font-bold">Air Hockey</div>

      <div className="flex flex-col grow items-center justify-center gap-2 ">
        <PlayButton />
        <button className="bg-black text-white w-64">Join games</button>
        <button className="bg-black text-white">See who is online</button>
      </div>
    </div>
  );
}
