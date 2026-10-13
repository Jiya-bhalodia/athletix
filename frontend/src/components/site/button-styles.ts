import { cva, type VariantProps } from "class-variance-authority";

export const buttonStyles = cva(
  "inline-flex items-center justify-center gap-2 rounded-md text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground border border-foreground/10 hover:brightness-95 hover:-translate-y-px",
        outline: "border border-foreground/20 bg-background text-foreground hover:bg-secondary",
        ghost: "text-foreground hover:bg-secondary",
        dark: "bg-ink text-ink-foreground hover:opacity-90",
      },
      size: { sm: "h-9 px-4", md: "h-11 px-5" },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export type ButtonStyleProps = VariantProps<typeof buttonStyles>;
