import { cva } from "class-variance-authority";

export const memoryDashboardViewToggleButtonVariants = cva(
  "flex items-center justify-center rounded-md border border-border px-3 py-1.5 text-sm transition-colors",
  {
    variants: {
      pressed: {
        true: "bg-foreground text-background",
        false: "bg-background text-muted-foreground hover:bg-muted",
      },
    },
    defaultVariants: {
      pressed: false,
    },
  },
);
