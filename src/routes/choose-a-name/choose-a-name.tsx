import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { TsForm } from '../../components/form/ts-form';
import Banner from '../../components/misc/banner';

const NameSchema = z.object({
  name: z.string().min(2, { message: 'Too short. Min 1 character' }).max(12, { message: 'Too long. Max 12 characters' })
});

export default function ChooseAName() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';

  const onSubmit = (data: z.infer<typeof NameSchema>) => {
    localStorage.setItem('username', data.name);
    navigate(from, { replace: true });
  };

  return (
    <div className="flex h-screen items-center justify-center">
      <Banner />
      <div className="m-2 flex w-full flex-col items-center gap-4 rounded-lg border-2 border-primary bg-bg p-4 text-primary shadow-xl shadow-primary sm:max-w-sm">
        <div className="text-xl font-bold">Choose a name</div>
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
