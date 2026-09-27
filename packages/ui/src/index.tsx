import type { ButtonHTMLAttributes, HTMLAttributes, PropsWithChildren } from 'react';

const cx = (...values: Array<string | false | null | undefined>) => values.filter(Boolean).join(' ');

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx('usn-card', className)} {...props} />;
}

export function Button({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={cx('usn-button', className)} {...props} />;
}

export function Badge({ children, tone = 'gold' }: PropsWithChildren<{ tone?: 'gold' | 'blue' | 'red' | 'green' }>) {
  return <span className={`usn-badge usn-badge--${tone}`}>{children}</span>;
}

export function EmptyState({ title, message }: { title: string; message: string }) {
  return <Card className="empty-state"><div className="empty-state__mark">USN</div><h3>{title}</h3><p>{message}</p></Card>;
}

export function LoadingState({ label = 'Loading' }: { label?: string }) {
  return <div className="loading-state" role="status"><span className="loading-state__spinner" />{label}</div>;
}
