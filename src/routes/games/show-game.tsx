import { useParams } from "react-router-dom";
import IconButton from "../../components/buttons/icon-button";
import shareIcon from "../../assets/svg/share.svg";
import sendIcon from "../../assets/svg/send.svg";

export default function ShowGame() {
  const { id } = useParams<string>();

  return (
    <div className="sm:container sm:max-w-3xl sm:mx-auto px-2 py-4 h-full border-2">
      <div className="flex flex-col gap-2 h-full">
        <div className="text-center text-3xl py-4">Lobby</div>
        <div className="flex justify-between">
          <button className="btn btn-primary-outlined">Ready</button>
          <div className="flex gap-2">
            <IconButton
              text=""
              onClick={() => console.log("share")}
              className="border-2 border-primary"
              svgIcon={shareIcon}
            />
            <button className="btn btn-orange-outlined w-20">Exit</button>
          </div>
        </div>
        <div className="flex-1 bg-slate-100 border-2 border-primary border-opacity-50 rounded-md " />
        <input
          placeholder="Write something..."
          className="p-2 bg-slate-100 border-2 border-primary border-opacity-40 rounded"
        />
        <div className="flex justify-end">
          <IconButton
            text=""
            onClick={() => console.log("Send")}
            className="border-2 border-primary"
            svgIcon={sendIcon}
          />
        </div>
      </div>
    </div>
  );
}
