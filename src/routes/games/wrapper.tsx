import { ReactNode, FC } from "react";

type Props = { children: ReactNode };

const Wrapper: FC<Props> = ({ children }) => <div>{children}</div>;

export default Wrapper;
