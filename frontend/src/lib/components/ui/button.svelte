<script lang="ts">
  import { cn } from '$lib/utils/cn'

  type ButtonVariant = 'default' | 'ghost' | 'outline' | 'destructive'
  type ButtonSize = 'default' | 'sm' | 'lg' | 'icon'

  let {
    variant = 'default',
    size = 'default',
    class: className = '',
    children,
    onclick,
    ...props
  }: {
    variant?: ButtonVariant
    size?: ButtonSize
    class?: string
    children?: import('svelte').Snippet
    onclick?: (event: MouseEvent) => void
    [key: string]: any
  } = $props()

  const variantClasses = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90',
    destructive:
      'bg-destructive text-destructive-foreground hover:bg-destructive/90',
    outline:
      'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
    ghost: 'hover:bg-accent hover:text-accent-foreground',
  }

  const sizeClasses = {
    default: 'h-10 px-4 py-2',
    sm: 'h-9 rounded-md px-3',
    lg: 'h-11 rounded-md px-8',
    icon: 'h-10 w-10',
  }
</script>

<button
  class={cn(
    'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
    'disabled:pointer-events-none disabled:opacity-50',
    variantClasses[variant],
    sizeClasses[size],
    className
  )}
  {onclick}
  {...props}
>
  {@render children?.()}
</button>
