import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { TsForm } from '../../components/form/ts-form';
import Banner from '../../components/misc/banner';
import { generateUUID } from '../../utils/misc-utils';

const NameSchema = z.object({
  name: z
    .string()
    .min(2, { message: 'Too short. Min 1 character' })
    .max(12, { message: 'Too long. Max 12 characters' })
    .regex(new RegExp('^([A-Za-z0-9])([A-Za-z0-9])*([A-Za-z0-9])$'), { message: 'Only alpha numerical characters allowed' })
});

export default function ChooseAName() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';
  const message = location.state?.message;

  const onSubmit = (data: z.infer<typeof NameSchema>) => {
    localStorage.setItem('username', data.name + '$' + generateUUID());
    navigate(from, { replace: true });
  };

  return (
    <div className="flex h-full items-center justify-center">
      <Banner />
      <div className="m-2 flex w-full flex-col items-center gap-4 rounded-lg border-2 border-primary bg-bg p-4 text-primary shadow-xl shadow-primary sm:max-w-sm">
        <div className="text-xl font-bold">{message || 'Choose a name'}</div>
        <TsForm
          schema={NameSchema}
          onSubmit={onSubmit}
          renderAfter={() => (
            <button className="btn btn-primary mt-2 w-full" type="submit" onKeyDown={e => (e.key === 'Enter' ? onSubmit : null)}>
              Save
            </button>
          )}
          formProps={{ className: 'w-full' }}
          props={{
            name: {
              className: 'mb-2'
            }
          }}
        />
      </div>
    </div>
  );
}
