import { cn } from "@/lib/utils";

interface SectionShellProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
  muted?: boolean;
  narrow?: boolean;
}

export function SectionShell({ children, className, id, muted, narrow }: SectionShellProps) {
  return (
    <section
      id={id}
      className={cn(
        "py-20 px-6",
        muted && "bg-muted/30 border-y border-border/40",
        className,
      )}
    >
      <div className={cn("mx-auto", narrow ? "max-w-3xl" : "max-w-6xl")}>
        {children}
      </div>
    </section>
  );
}

export function SectionHeading({
  label,
  title,
  subtitle,
  center,
}: {
  label?: string;
  title: string;
  subtitle?: string;
  center?: boolean;
}) {
  return (
    <div className={cn("mb-12", center && "text-center")}>
      {label && (
        <span className="inline-block text-xs font-semibold tracking-widest uppercase text-primary/80 mb-3">
          {label}
        </span>
      )}
      <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">{title}</h2>
      {subtitle && (
        <p className="mt-4 text-muted-foreground text-lg leading-relaxed max-w-2xl" style={center ? { margin: "1rem auto 0" } : {}}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
