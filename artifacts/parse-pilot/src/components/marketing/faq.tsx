import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { SectionShell, SectionHeading } from "./section-shell";

interface FaqItem {
  q: string;
  a: string;
}

function FaqRow({ q, a }: FaqItem) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border/60 last:border-0">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-4 py-5 text-left text-sm font-medium hover:text-primary transition-colors"
      >
        {q}
        {open ? (
          <ChevronUp className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
        )}
      </button>
      {open && (
        <p className="pb-5 text-sm text-muted-foreground leading-relaxed">{a}</p>
      )}
    </div>
  );
}

interface FaqSectionProps {
  items: FaqItem[];
  title?: string;
  id?: string;
}

export function FaqSection({ items, title = "Frequently asked questions", id = "faq" }: FaqSectionProps) {
  return (
    <SectionShell id={id} narrow>
      <SectionHeading title={title} center />
      <div className="divide-y divide-border/40 border border-border/40 rounded-2xl overflow-hidden bg-card px-6">
        {items.map((item) => (
          <FaqRow key={item.q} {...item} />
        ))}
      </div>
    </SectionShell>
  );
}
