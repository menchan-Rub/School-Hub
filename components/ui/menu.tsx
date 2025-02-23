import * as React from 'react'
import * as MenuPrimitive from '@radix-ui/react-dropdown-menu'
import { cn } from '@/lib/utils'

const Menu = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md',
      className
    )}
    {...props}
  />
))
Menu.displayName = 'Menu'

const MenuItem = React.forwardRef<
  HTMLDivElement,
  React.ButtonHTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground',
      className
    )}
    {...props}
  />
))
MenuItem.displayName = 'MenuItem'

const MenuSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('-mx-1 my-1 h-px bg-muted', className)}
    {...props}
  />
))
MenuSeparator.displayName = 'MenuSeparator'

export { Menu, MenuItem, MenuSeparator } 