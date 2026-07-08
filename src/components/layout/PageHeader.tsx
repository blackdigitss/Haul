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
    <header className="mb-6 flex items-end justify-between gap-4">
      <div>
        <p className="mb-1 text-[11px] font-medium uppercase tracking-ultra text-primary">
          {eyebrow}
        </p>
        <h1 className="font-display text-3xl font-semibold text-foreground">{title}</h1>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="mb-3 text-[11px] font-medium uppercase tracking-editorial text-muted-foreground">
      {children}
    </p>
  );
}
