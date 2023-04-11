import { Navigate } from 'react-router-dom';
import { generateUUID } from '../../utils/misc-utils';

export default function GenerateRoom() {
  const roomId = generateUUID();

  return <Navigate to={`/games/${roomId}`} replace />;
}
