import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  action,
}: {
  eyebrow: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <header className="mb-7 flex items-end justify-between gap-4">
      <div className="min-w-0">
        <p className="mb-1.5 font-num text-[10px] font-medium uppercase tracking-ultra text-primary">
          {eyebrow}
        </p>
        <h1 className="truncate font-display text-4xl font-bold leading-none">{title}</h1>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}

export function SectionLabel({
  children,
  index,
}: {
  children: ReactNode;
  index?: string;
}) {
  return (
    <p className="mb-3 flex items-baseline gap-2 text-[10px] font-semibold uppercase tracking-editorial text-muted-foreground">
      {index && <span className="font-num text-primary/70">{index}</span>}
      {children}
      <span className="ml-1 h-px flex-1 self-center bg-border" />
    </p>
  );
}
