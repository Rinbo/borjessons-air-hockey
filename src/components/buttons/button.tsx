type Props = { text: string; children: React.ReactNode };

export default function Button({ text, children }: Props) {
  return (
    <button className="bg-gray-100 hover:bg-teal-200 text-gray-800 font-bold font-mono py-2 px-4 w-56 rounded inline-flex justify-center">
      {children}
      <span>{text}</span>
    </button>
  );
}
