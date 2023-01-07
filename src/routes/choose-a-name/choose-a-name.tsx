import React, { ChangeEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function ChooseAName() {
  const [name, setName] = React.useState<string>();
  const [error, setError] = React.useState<string>();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/";

  const onSave = (data: string) => {
    localStorage.setItem("name", data);
    navigate(from, { replace: true });
  };

  const handleOnSave = (callback: (string: string) => void) => {
    if (isValidName()) callback(name!);
  };

  const isValidName = (): boolean => {
    if (name === null || name === undefined) {
      setError("You must provide a name");
      return false;
    }

    if (name.trim().length < 2 || name.trim().length > 12) {
      setError("Name must be between 2 and 12 characters long");
      return false;
    }

    return true;
  };

  const onChange = ({ target }: ChangeEvent<HTMLInputElement>) => {
    setName(target.value);
    setError(undefined);
  };

  return (
    <div className="flex h-screen justify-center items-center">
      <div className="flex flex-col gap-2 m-2 w-full sm:max-w-sm items-center bg-bg border-2 border-primary rounded-lg p-4 text-primary shadow-sm shadow-primary">
        <div className="font-bold text-xl">Choose a name</div>
        <input
          onChange={onChange}
          placeholder="Name"
          name="name"
          className="w-full p-2 border-2 border-opacity-50 border-zinc-500 rounded-md"
        />
        {error && <div className="text-red-400">{error}</div>}
        <button
          className="btn btn-primary w-full"
          onClick={() => handleOnSave(onSave)}
        >
          Save
        </button>
      </div>
    </div>
  );
}
