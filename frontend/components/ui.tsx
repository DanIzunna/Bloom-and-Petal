import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

export function PageContainer({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto w-full max-w-7xl px-5 lg:px-10 ${className}`}>
      {children}
    </div>
  );
}
export function Section({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`py-16 sm:py-20 ${className}`}>{children}</section>
  );
}
export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
}) {
  const styles = {
    primary:
      "rounded-[0.5rem_0.85rem_0.5rem_0.35rem] bg-[var(--primary)] text-white hover:bg-[var(--primary-dark)]",
    secondary:
      "bg-[var(--secondary)] text-[var(--primary)] hover:bg-[var(--border)]",
    ghost: "text-[var(--primary)] hover:bg-[var(--muted)]",
  };
  return (
    <button
      {...props}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-sm)] px-5 text-xs font-bold uppercase tracking-[0.14em] transition disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "success" | "warning" | "info" | "destructive";
}) {
  const styles = {
    neutral: "bg-[var(--muted)] text-[var(--muted-foreground)]",
    success: "status-delivered",
    warning: "status-pending",
    info: "status-processing",
    destructive: "status-cancelled",
  };
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-[0.68rem] font-bold uppercase tracking-[0.12em] ${styles[tone]}`}
    >
      {children}
    </span>
  );
}
export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`min-h-11 w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-white px-3.5 text-sm text-[var(--foreground)] shadow-sm outline-none transition placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[rgb(47_93_80_/_0.15)] ${props.className || ""}`}
    />
  );
}
export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`min-h-11 w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-white px-3.5 text-sm text-[var(--foreground)] shadow-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[rgb(47_93_80_/_0.15)] ${props.className || ""}`}
    />
  );
}
export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-white px-3.5 py-3 text-sm text-[var(--foreground)] shadow-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[rgb(47_93_80_/_0.15)] ${props.className || ""}`}
    />
  );
}
export function EmptyState({
  title,
  detail,
  action,
}: {
  title: string;
  detail?: string;
  action?: ReactNode;
}) {
  return (
    <div className="surface px-6 py-16 text-center">
      <h2 className="font-sans text-3xl text-[var(--foreground)]">{title}</h2>
      {detail && (
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[var(--muted-foreground)]">
          {detail}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
export function LoadingState({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="py-20 text-center text-sm text-[var(--muted-foreground)]">
      <span className="mr-2 inline-block size-3 animate-pulse rounded-full bg-[var(--accent)]" />
      {label}
    </div>
  );
}
export function ErrorState({
  message = "Something went wrong. Please try again.",
}: {
  message?: string;
}) {
  return (
    <div className="surface px-6 py-12 text-center">
      <p className="text-sm text-[var(--destructive)]">{message}</p>
    </div>
  );
}
