type Props = {
  children: React.ReactNode;
};

export default function SimpleModal({ children }: Props) {
  return (
    <div className="bg-slate-200 bg-opacity-50 z-50 inset-0 fixed">
      <div className="flex h-screen justify-center items-center">
        <div className="flex flex-col gap-2 m-2 w-full sm:max-w-sm items-center bg-bg border-2 border-primary rounded-lg p-4 text-primary shadow-sm shadow-primary">
          {children}
        </div>
      </div>
    </div>
  );
}
