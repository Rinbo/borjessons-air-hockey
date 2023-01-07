import { createTsForm } from "@ts-react/form";
import { z } from "zod";
import TextField from "./text-field";

const mapping = [
  [z.string(), TextField],
  //[z.boolean(), CheckBoxField],
  //[z.number(), NumberField],
] as const;

export const TsForm = createTsForm(mapping);
