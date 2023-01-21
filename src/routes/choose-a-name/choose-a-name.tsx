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
    <div className="flex h-screen justify-center items-center">
      <Banner />
      <div className="flex flex-col gap-4 m-2 w-full sm:max-w-sm items-center bg-bg border-2 border-primary rounded-lg p-4 text-primary shadow-xl shadow-primary">
        <div className="font-bold text-xl">Choose a name</div>
        <TsForm
          schema={NameSchema}
          onSubmit={onSubmit}
          renderAfter={() => (
            <button className="btn btn-primary w-full mt-2" type="submit" onKeyDown={e => (e.key === 'Enter' ? onSubmit : null)}>
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
