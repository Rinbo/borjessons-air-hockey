type Props = {
  text: string;
  children?: React.ReactNode;
  svgIcon?: string;
  className?: string;
  onClick: () => void;
};

export default function IconButton({
  text,
  onClick,
  svgIcon,
  className,
}: Props) {
  return (
    <button
      onClick={onClick}
      className={`btn btn-primary z-10 inline-flex justify-center ${className}`}
    >
      {svgIcon && <img src={svgIcon} className="w-6 h-6" />}
      <span className={text.length === 0 ? "" : "ml-2"}>{text}</span>
    </button>
  );
}
