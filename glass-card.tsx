import { clsx } from "clsx";
import type { HTMLAttributes } from "react";

export function GlassCard({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={clsx("glass p-5", className)} {...props} />;
}

export function Button({
  className,
  variant = "primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "danger" }) {
  return (
    <button
      className={clsx(
        "focus-ring inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
        variant === "primary" && "bg-acadly-violet text-white hover:bg-acadly-plum shadow-sm hover:shadow-md",
        variant === "ghost" && "glass hover:bg-white/80 dark:hover:bg-white/10 hover:shadow-sm",
        variant === "danger" && "bg-acadly-coral text-white hover:brightness-95 shadow-sm hover:shadow-md",
        className
      )}
      {...props}
    />
  );
}

export function Badge({ tone = "violet", children }: { tone?: "violet" | "amber" | "mint" | "coral"; children: React.ReactNode }) {
  const dot: Record<string, string> = {
    violet: "bg-acadly-violet",
    amber: "bg-acadly-amber",
    mint: "bg-acadly-mint",
    coral: "bg-acadly-coral",
  };
  const text: Record<string, string> = {
    violet: "text-ink/80 dark:text-white/80",
    amber: "text-ink/80 dark:text-white/80",
    mint: "text-ink/80 dark:text-white/80",
    coral: "text-ink/80 dark:text-white/80",
  };
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-md border border-black/10 bg-white/40 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide backdrop-blur-sm dark:border-white/10 dark:bg-white/5",
        text[tone]
      )}
    >
      <span className={clsx("h-1.5 w-1.5 shrink-0 rounded-full", dot[tone])} />
      {children}
    </span>
  );
}
