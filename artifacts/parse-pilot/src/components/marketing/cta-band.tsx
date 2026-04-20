import { ArrowRight } from "lucide-react";
import { Link } from "wouter";

interface CtaBandProps {
  title: string;
  subtitle?: string;
  primaryLabel?: string;
  primaryHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
}

export function CtaBand({
  title,
  subtitle,
  primaryLabel = "Get started free",
  primaryHref = "/dashboard",
  secondaryLabel,
  secondaryHref,
}: CtaBandProps) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary to-primary/80 py-20 px-6">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.08),_transparent_60%)] pointer-events-none" />
      <div className="relative max-w-4xl mx-auto text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">{title}</h2>
        {subtitle && (
          <p className="mt-4 text-white/70 text-lg leading-relaxed max-w-xl mx-auto">{subtitle}</p>
        )}
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href={primaryHref}
            className="inline-flex items-center gap-2 bg-white text-primary font-semibold px-6 py-3 rounded-xl hover:bg-white/90 transition-colors text-sm"
          >
            {primaryLabel} <ArrowRight className="w-4 h-4" />
          </Link>
          {secondaryLabel && secondaryHref && (
            <Link
              href={secondaryHref}
              className="inline-flex items-center gap-2 border border-white/30 text-white font-medium px-6 py-3 rounded-xl hover:bg-white/10 transition-colors text-sm"
            >
              {secondaryLabel}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
