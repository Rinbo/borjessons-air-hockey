import { Link } from "react-router-dom";

export default function Banner() {
  return (
    <Link
      className="text-sm text-center w-screen text-primary m-0 p-0 hover:bg-teal-200 absolute top-0"
      to="/"
    >
      borjessons air hockey
    </Link>
  );
}
