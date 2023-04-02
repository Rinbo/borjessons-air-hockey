import { useTsController } from '@ts-react/form';
import React from 'react';

type Props = { className: string };

export default function TextField({ className }: Props) {
  const { field, error } = useTsController<string>();

  return (
    <React.Fragment>
      <input
        value={field.value ? field.value : ''}
        onChange={e => field.onChange(e.target.value.trim())}
        placeholder="Name"
        className={`w-full rounded-md border-2 border-opacity-50 p-2 ${error?.errorMessage ? 'border-red-500' : 'border-zinc-500'} ${className}`}
      />
      <span className="box-content text-sm text-red-500">{error?.errorMessage}</span>
    </React.Fragment>
  );
}
