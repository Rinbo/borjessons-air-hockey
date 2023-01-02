import { useRouteError } from "react-router-dom";

type RouterError = { statusText: string; message: string };

export default function ErrorPage() {
  const error = useRouteError() as RouterError;

  return (
    <div
      id="error-page"
      className="flex min-h-screen flex-col justify-center overflow-hidden text-center bg-gray-50 py-6 sm:py-12"
    >
      <div className="mx-auto max-w-md">
        <h1 className="text-3xl">Oops!</h1>
        <p>Sorry, an unexpected error has occurred.</p>
        <p>
          <i>{error.statusText || error.message}</i>
        </p>
      </div>
    </div>
  );
}
