import React from 'react';

type Props = {
  children: React.ReactNode;
};

export default function CenterWrapper({ children }: Props) {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="m-2 flex w-full flex-col items-center gap-4 rounded-lg border-2 border-primary bg-bg p-4 text-primary shadow-xl shadow-primary sm:max-w-sm">
        {children}
      </div>
    </div>
  );
}
