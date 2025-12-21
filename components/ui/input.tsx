import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 rounded-lg border border-stone-200 bg-white px-4 text-[15px] text-stone-900 transition-all duration-200 outline-none",
        "placeholder:text-stone-400",
        "focus:border-stone-400 focus:ring-2 focus:ring-stone-200",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100 dark:placeholder:text-stone-500 dark:focus:border-stone-600 dark:focus:ring-stone-800",
        "file:text-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium",
        "aria-invalid:border-red-500 aria-invalid:ring-red-200 dark:aria-invalid:ring-red-900",
        className
      )}
      {...props}
    />
  )
}

export { Input }
