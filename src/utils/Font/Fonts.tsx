import { FC } from "react";
import "./Text.css";
import { TextProps } from "./types";

const Text: FC<TextProps> = ({
  variant,
  children,
  className = "",
  ...props
}) => {
  return (
    <>
      <h1 className={`text ${variant} ${className}`} {...props}>
        {children}
      </h1>
    </>
  );
};

export default Text;
