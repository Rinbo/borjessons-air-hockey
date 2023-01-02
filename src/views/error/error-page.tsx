import { useRouteError } from "react-router-dom";

type RouterError = { statusText: string; message: string };

export default function ErrorPage() {
  const error = useRouteError() as RouterError;
  console.error(error);

  return (
    <div
      id="error-page"
      className="flex min-h-screen flex-col justify-center overflow-hidden"
    >
      <h1 className="text-3xl">Oops!</h1>
      <p>Sorry, an unexpected error has occurred.</p>
      <p>
        <i>{error.statusText || error.message}</i>
      </p>
    </div>
  );
}
