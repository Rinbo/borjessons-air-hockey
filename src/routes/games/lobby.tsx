import React from "react";
import { useOutletContext, useParams } from "react-router-dom";
import IconButton from "../../components/buttons/icon-button";
import shareIcon from "../../assets/svg/share.svg";
import sendIcon from "../../assets/svg/send.svg";

type Message = { username: string; message: string; datetime: string };
type OutletContext = { name: string };
const CHAT = ["Waiting for opponent to join...", "Opponent joined..."];

let stompClient: any;

export default function Lobby() {
  const { id } = useParams<string>();
  const { name } = useOutletContext<OutletContext>();
  const [messages, setMessages] = React.useState<Array<Message>>([]);

  React.useEffect(() => {
    if (!stompClient) connect();
  }, []);

  function connect() {
    const Stomp = require("stompjs");
    let SockJS = require("sockjs-client");

    const socket = new SockJS("http://localhost:8080/air-hockey-server");
    stompClient = Stomp.over(socket);
    stompClient.connect({}, function (frame: string) {
      console.log("Connected: " + frame);
      stompClient.subscribe("/topic/public", function (message: Message) {
        setMessages((prevState) => [...prevState, message]);
      });
    });
  }

  return (
    <div className="sm:container sm:max-w-3xl h-screen sm:mx-auto px-2 py-4">
      <div className="flex flex-col gap-2 h-full">
        <div className="text-center text-3xl py-4">Lobby</div>
        <div className="flex justify-between">
          <div className="flex items-center gap-2">
            <button className="btn btn-primary-outlined">Ready</button>
            <div className="inline-flex flex-col gap-2">
              <span className="text-xs whitespace-nowrap overflow-hidden">
                P1: {name}
              </span>
              <span className="text-xs whitespace-nowrap overflow-hidden">
                P2:
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <IconButton
              text=""
              onClick={() => console.log("share")}
              className="border border-primary"
              svgIcon={shareIcon}
            />
            <button className="btn btn-orange-outlined w-20">Exit</button>
          </div>
        </div>
        <div className="flex-1 flex flex-col justify-end bg-slate-100 p-2 border-2 border-primary border-opacity-50 rounded-md ">
          {CHAT.map((line) => (
            <span>{line}</span>
          ))}
        </div>
        <input
          placeholder="Write something..."
          className="p-2 bg-slate-100 border-2 border-primary border-opacity-40 rounded"
        />
        <div className="flex justify-end">
          <IconButton
            text=""
            onClick={() => console.log("Send")}
            className="border border-primary"
            svgIcon={sendIcon}
          />
        </div>
      </div>
    </div>
  );
}
