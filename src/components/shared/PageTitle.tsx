import type { PropsWithChildren } from 'react';
import { cn } from '@/lib/utils';

interface PageTitleProps extends PropsWithChildren {
  title: string;
  description?: string;
  className?: string;
}

export function PageTitle({ title, description, className, children }: PageTitleProps) {
  return (
    <div className={cn("mb-8", className)}>
      <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        {title}
      </h1>
      {description && (
        <p className="mt-2 text-lg text-muted-foreground">
          {description}
        </p>
      )}
      {children}
    </div>
  );
}
