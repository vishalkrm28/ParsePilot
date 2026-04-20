/**
 * Dynamic DB-backed SEO page.
 * Fetches the page data from the API using the slug param.
 * Renders a generic but well-structured page from the seo_pages table.
 */

import { useRoute, Link } from "wouter";
import { useEffect, useState } from "react";
import { Loader2, ArrowRight } from "lucide-react";
import { Footer } from "@/components/layout/footer";
import { LogoBrand } from "@/components/brand/logo";
import { CtaBand } from "@/components/marketing/cta-band";

interface SeoPageData {
  id: string;
  slug: string;
  title: string;
  description: string;
  pageType: string;
  heroTitle: string | null;
  heroSubtitle: string | null;
  bodyJson: {
    sections?: Array<{
      heading?: string;
      body?: string;
      bullets?: string[];
    }>;
  };
  ctaLabel: string | null;
  ctaHref: string | null;
  isPublished: boolean;
}

export default function DynamicSeoPage() {
  const [, params] = useRoute("/seo/:slug");
  const slug = params?.slug ?? "";

  const [page, setPage] = useState<SeoPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setNotFound(false);
    fetch(`/api/marketing/seo-pages/${slug}`)
      .then(res => {
        if (!res.ok) {
          setNotFound(true);
          return null;
        }
        return res.json();
      })
      .then(data => {
        if (data?.page) setPage(data.page);
        else setNotFound(true);
        setLoading(false);
      })
      .catch(() => {
        setNotFound(true);
        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound || !page) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 text-center px-6">
        <h1 className="text-3xl font-bold text-foreground">Page not found</h1>
        <p className="text-muted-foreground">This page doesn't exist or hasn't been published yet.</p>
        <Link href="/" className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-colors text-sm">
          Go home <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  const heroTitle = page.heroTitle ?? page.title;
  const heroSubtitle = page.heroSubtitle ?? page.description;
  const ctaLabel = page.ctaLabel ?? "Get started free";
  const ctaHref = page.ctaHref ?? "/dashboard";

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border/40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/"><LogoBrand className="h-7 w-auto" /></Link>
          <div className="hidden sm:flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/features" className="hover:text-foreground transition-colors">Features</Link>
            <Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
            <Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link>
          </div>
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground text-sm font-semibold px-4 py-2 rounded-xl hover:bg-primary/90 transition-colors">
            Get started <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-4xl mx-auto px-6 pt-16 pb-12 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground leading-tight">
          {heroTitle}
        </h1>
        <p className="mt-5 text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
          {heroSubtitle}
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href={ctaHref}>
            <a className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors text-sm">
              {ctaLabel} <ArrowRight className="w-4 h-4" />
            </a>
          </Link>
        </div>
      </div>

      {/* Body sections */}
      {page.bodyJson?.sections && page.bodyJson.sections.length > 0 && (
        <div className="max-w-3xl mx-auto px-6 pb-16 space-y-12">
          {page.bodyJson.sections.map((section, i) => (
            <div key={i}>
              {section.heading && (
                <h2 className="text-2xl font-bold text-foreground mb-4">{section.heading}</h2>
              )}
              {section.body && (
                <p className="text-muted-foreground leading-relaxed">{section.body}</p>
              )}
              {section.bullets && section.bullets.length > 0 && (
                <ul className="mt-4 space-y-2">
                  {section.bullets.map((b, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                      {b}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      <CtaBand
        title={ctaLabel}
        subtitle="Free to start — no credit card required."
        primaryLabel={ctaLabel}
        primaryHref={ctaHref}
      />

      <Footer />
    </div>
  );
}
