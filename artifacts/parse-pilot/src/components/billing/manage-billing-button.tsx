import { useState } from "react";
import { ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/Button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ManageBillingButtonProps {
  className?: string;
  variant?: "default" | "outline" | "ghost";
  label?: string;
}

export function ManageBillingButton({
  className,
  variant = "outline",
  label = "Manage Billing",
}: ManageBillingButtonProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  async function handleManage() {
    setLoading(true);
    try {
      const response = await fetch("/api/billing/portal", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? "Could not open billing portal");
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (err) {
      setLoading(false);
      toast({
        title: "Could not open billing portal",
        description:
          err instanceof Error ? err.message : "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  }

  return (
    <Button
      variant={variant}
      onClick={handleManage}
      disabled={loading}
      className={cn("gap-2", className)}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <ExternalLink className="w-4 h-4" />
      )}
      {loading ? "Opening portal…" : label}
    </Button>
  );
}
