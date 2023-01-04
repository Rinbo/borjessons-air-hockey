type Props = { text: string; children: React.ReactNode };

export default function Button({ text, children }: Props) {
  return (
    <button className="hover:bg-teal-200 z-10 text-primary font-bold py-2 px-4 w-56 rounded inline-flex justify-center">
      {children}
      <span>{text}</span>
    </button>
  );
}
