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
  const tones: Record<string, string> = {
    violet: "bg-acadly-violet/15 text-acadly-violet dark:text-[#c3bbff]",
    amber: "bg-acadly-amber/15 text-[#946313] dark:text-acadly-amber",
    mint: "bg-acadly-mint/15 text-[#1d7d5c] dark:text-acadly-mint",
    coral: "bg-acadly-coral/15 text-[#c23f3f] dark:text-acadly-coral",
  };
  return (
    <span className={clsx("rounded-full px-2.5 py-1 text-xs font-medium", tones[tone])}>{children}</span>
  );
}
