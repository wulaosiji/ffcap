import * as React from "react"

interface SeparatorProps extends React.HTMLAttributes<HTMLHRElement> {
  orientation?: "horizontal" | "vertical"
  decorative?: boolean
}

const Separator = React.forwardRef<HTMLHRElement, SeparatorProps>(
  ({ className = "", orientation = "horizontal", decorative = true, ...props }, ref) => (
    <hr
      ref={ref}
      aria-orientation={orientation}
      aria-hidden={decorative}
      className={
        [
          "shrink-0 bg-border border-0",
          orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
          className
        ].join(" ")
      }
      {...props}
    />
  )
)
Separator.displayName = "Separator"

export { Separator } 