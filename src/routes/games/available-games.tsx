import { useNavigate } from "react-router-dom";

type Row = { id: string; name: string };

const DUMMY_DATA = [
  { id: "12", name: "Albin" },
  { id: "34", name: "Sixten" },
  { id: "56", name: "Robin" },
  { id: "78", name: "Maria" },
  { id: "10", name: "Rolf" },
] as Array<Row>;

export default function AvailableGames() {
  const navigate = useNavigate();

  function renderGameRow(row: Row): React.ReactElement {
    return (
      <div className="flex justify-between items-center border border-black px-2 py-1 border-dashed rounded-sm hover:bg-slate-300 duration-300 hover:transform hover:scale-110">
        <span>{`${row.name}'s game`}</span>
        <button
          className="btn text-primary border border-primary bg-teal-200 hover:bg-teal-400 hover:text-white"
          onClick={() => navigate("/games/" + row.id)}
        >
          Join
        </button>
      </div>
    );
  }

  return (
    <div className="sm:container sm:max-w-3xl min-h-screen sm:mx-auto px-2 py-4">
      <div className="flex flex-col gap-1 h-full">
        <div className="text-center text-3xl pb-4 pt-12">Available Games</div>
        <div className="flex flex-col gap-2 border border-primary rounded-lg p-3">
          {DUMMY_DATA.map((element) => renderGameRow(element))}
        </div>
      </div>
    </div>
  );
}
