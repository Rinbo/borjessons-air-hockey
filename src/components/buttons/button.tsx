type Props = {
  text: string;
  children?: React.ReactNode;
  svgIcon?: string;
  onClick: () => void;
};

export default function Button({ text, onClick, svgIcon }: Props) {
  return (
    <button
      onClick={onClick}
      className="hover:bg-teal-200 z-10 text-primary font-bold py-2 px-4 w-56 rounded inline-flex justify-center"
    >
      {svgIcon && <img src={svgIcon} className="w-6 h-6 mr-2" />}
      <span>{text}</span>
    </button>
  );
}
