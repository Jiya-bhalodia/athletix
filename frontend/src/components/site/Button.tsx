import { cn } from "@/lib/utils";
import { buttonStyles, type ButtonStyleProps } from "./button-styles";

export function Button({
  className,
  variant,
  size,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & ButtonStyleProps) {
  return <button className={cn(buttonStyles({ variant, size }), className)} {...props} />;
}
