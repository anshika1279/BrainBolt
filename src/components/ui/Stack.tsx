import type { HTMLAttributes } from "react";
import clsx from "clsx";

type StackProps = HTMLAttributes<HTMLDivElement> & {
  direction?: "row" | "column";
  gap?: "2" | "3" | "4" | "5" | "6" | "8" | "10";
  align?: "start" | "center" | "end" | "stretch";
  justify?: "start" | "center" | "end" | "between";
};

const gapMap = {
  2: "gap-2",
  3: "gap-3",
  4: "gap-4",
  5: "gap-5",
  6: "gap-6",
  8: "gap-8",
  10: "gap-10",
};

const alignMap = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  stretch: "items-stretch",
};

const justifyMap = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  between: "justify-between",
};

export function Stack({
  direction = "column",
  gap = "4",
  align = "stretch",
  justify = "start",
  className,
  ...props
}: StackProps) {
  return (
    <div
      className={clsx(
        "flex",
        direction === "row" ? "flex-row" : "flex-col",
        gapMap[gap],
        alignMap[align],
        justifyMap[justify],
        className
      )}
      {...props}
    />
  );
}
