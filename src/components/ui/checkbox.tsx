"use client"

import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox"

import { cn } from "@/lib/utils"

function Checkbox({
  className,
  ...props
}: CheckboxPrimitive.Root.Props & {
  className?: string
}) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer relative h-4 w-4 shrink-0 rounded-sm border border-gray-300 transition-all outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:border-primary dark:border-gray-600 dark:data-[state=checked]:bg-primary dark:data-[state=checked]:border-primary",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className={cn(
          "pointer-events-none flex h-full w-full items-center justify-center text-white",
          "data-[state=checked]:flex data-[state=unchecked]:hidden"
        )}
      >
        <svg
          className="h-3 w-3"
          viewBox="0 0 16 16"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0Z"
            clipRule="evenodd"
          />
        </svg>
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
