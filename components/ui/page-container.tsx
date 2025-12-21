import { cn } from "@/lib/utils";

interface PageContainerProps {
  children: React.ReactNode;
  variant?: "default" | "narrow" | "compact" | "full";
  className?: string;
}

const variantStyles = {
  default: "mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8",
  narrow: "mx-auto max-w-4xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8",
  compact: "mx-auto max-w-2xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8",
  full: "w-full px-4 py-4 sm:px-6 sm:py-6 lg:px-8",
};

export function PageContainer({
  children,
  variant,
  className,
}: PageContainerProps) {
  return (
    <div className={cn(variantStyles[variant ?? "default"], className)}>
      {children}
    </div>
  );
}
