import { useParams } from "react-router-dom";

export default function ShowGame() {
  const { id } = useParams<string>();

  return (
    <div>
      <div className="text-center text-5xl">Game number {id}</div>
    </div>
  );
}
