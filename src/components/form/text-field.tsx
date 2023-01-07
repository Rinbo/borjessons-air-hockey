import { useTsController } from "@ts-react/form";
import React from "react";

type Props = { className: string };

export default function TextField({ className }: Props) {
  const { field, error } = useTsController<string>();

  console.log(error, "ERROR");

  return (
    <React.Fragment>
      <input
        value={field.value ? field.value : ""}
        onChange={(e) => field.onChange(e.target.value.trim())}
        placeholder="Name"
        className={`w-full p-2 border-2 border-opacity-50 rounded-md ${
          error?.errorMessage ? "border-red-500" : "border-zinc-500"
        } ${className}`}
      />
      <span className="text-red-500 text-sm box-content">
        {error?.errorMessage}
      </span>
    </React.Fragment>
  );
}
