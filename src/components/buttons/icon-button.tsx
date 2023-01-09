type Size = "small" | "medium" | "large";

type Props = {
  text: string;
  children?: React.ReactNode;
  svgIcon?: string;
  className?: string;
  size?: Size;
  onClick: () => void;
};

const BUTTON_SIZE = {
  small: "h-8 p-2 text-sm",
  medium: "",
  large: "h-14 text-lg",
};

const ICON_SIZE = {
  small: "w-4 h-4",
  medium: "w-6 h-6",
  large: "h-8 w-8",
};

export default function IconButton({
  text,
  onClick,
  svgIcon,
  className,
  size = "medium",
}: Props) {
  return (
    <button
      onClick={onClick}
      className={`btn btn-primary z-10 inline-flex justify-center items-center ${className} ${BUTTON_SIZE[size]}`}
    >
      {svgIcon && <img src={svgIcon} className={ICON_SIZE[size]} />}
      <span className={text.length === 0 ? "" : "ml-2"}>{text}</span>
    </button>
  );
}
