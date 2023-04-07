import { Link } from 'react-router-dom';

export default function Banner() {
  return (
    <Link className="absolute top-0 m-0 w-full p-0 text-center text-sm text-primary hover:bg-teal-200" to="/">
      <span className="font-mono font-bold">{`< `}</span>
      <span>borjessons air hockey</span>
    </Link>
  );
}
