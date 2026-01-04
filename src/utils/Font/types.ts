import {ReactNode} from "react";

export type TextProps = {
    variant: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span' | 'div';
    children: ReactNode;
    className?: string;
  };