import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Feature {
  icon: LucideIcon;
  title: string;
  body: string;
  accent?: string;
}

interface FeatureGridProps {
  features: Feature[];
  cols?: 2 | 3 | 4;
}

export function FeatureGrid({ features, cols = 3 }: FeatureGridProps) {
  const colClass = {
    2: "sm:grid-cols-2",
    3: "sm:grid-cols-2 lg:grid-cols-3",
    4: "sm:grid-cols-2 lg:grid-cols-4",
  }[cols];

  return (
    <div className={cn("grid grid-cols-1 gap-6", colClass)}>
      {features.map((f) => {
        const Icon = f.icon;
        return (
          <div key={f.title} className="bg-card border border-border/60 rounded-2xl p-6 hover:border-primary/30 hover:shadow-sm transition-all">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-4", f.accent ?? "bg-primary/10")}>
              <Icon className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-semibold text-sm text-foreground mb-2">{f.title}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">{f.body}</p>
          </div>
        );
      })}
    </div>
  );
}
