import { cn } from "@/lib/utils"

interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "default" | "lg"
}

export function LoadingSpinner({
  className,
  size = "default",
  ...props
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    default: "h-8 w-8",
    lg: "h-12 w-12"
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center",
        className
      )}
      {...props}
    >
      <div
        className={cn(
          "animate-spin rounded-full border-4 border-primary/30 border-t-primary",
          sizeClasses[size]
        )}
      />
    </div>
  )
} 