import { Navigate } from "react-router-dom";

export default function GenerateRoom() {
  const roomId = crypto.randomUUID();

  return <Navigate to={`/games/${roomId}`} replace />;
}
