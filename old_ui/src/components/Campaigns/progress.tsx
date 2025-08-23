import * as React from 'react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

const ProgressBar = React.forwardRef<
  React.ElementRef<typeof Progress>,
  React.ComponentPropsWithoutRef<typeof Progress> & { value?: number }
>(({ className, value, ...props }, ref) => (
  <Progress
    ref={ref}
    value={value}
    className={cn('h-2 w-full rounded-full bg-gray-200', className)}
    {...props}
  />
));
ProgressBar.displayName = 'ProgressBar';
export { ProgressBar };
