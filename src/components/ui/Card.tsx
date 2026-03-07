import type { PropsWithChildren, ReactNode } from "react";

interface CardProps extends PropsWithChildren {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function Card({ title, subtitle, actions, children }: CardProps) {
  return (
    <section className="panel-card">
      <header className="panel-card__header">
        <div>
          <h2 className="panel-card__title">{title}</h2>
          {subtitle ? <p className="panel-card__subtitle">{subtitle}</p> : null}
        </div>
        {actions ? <div className="panel-card__actions">{actions}</div> : null}
      </header>
      <div className="panel-card__body">{children}</div>
    </section>
  );
}
