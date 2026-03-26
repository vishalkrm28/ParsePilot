import { useSearch } from "wouter";
import { Link } from "wouter";
import { Zap, ArrowRight, Clock } from "lucide-react";
import { Button } from "@/components/Button";
import { motion } from "framer-motion";

export default function UnlockSuccess() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const applicationId = params.get("application_id");

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="max-w-md w-full text-center space-y-6"
      >
        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center">
            <Zap className="w-10 h-10 text-amber-500" />
          </div>
        </div>

        {/* Heading */}
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm font-medium tracking-wide uppercase">
            <Zap className="w-4 h-4 text-amber-500" />
            One-time unlock
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            Payment received
          </h1>
          <p className="text-muted-foreground">
            Your result is being unlocked now. It takes a few seconds for the
            access to activate — refresh the result if it isn't showing yet.
          </p>
        </div>

        {/* Notice */}
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-muted-foreground text-left flex gap-3">
          <Clock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <span>
            This unlock applies to <span className="font-medium text-foreground">this result only</span>.
            For unlimited access to all results, consider upgrading to Pro.
          </span>
        </div>

        {/* CTAs */}
        <div className="flex flex-col gap-3 pt-2">
          {applicationId ? (
            <Link href={`/applications/${applicationId}`}>
              <Button className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0 shadow-md w-full">
                View your unlocked result
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          ) : (
            <Link href="/dashboard">
              <Button className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0 shadow-md w-full">
                Go to Dashboard
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          )}
          <Link href="/dashboard">
            <Button variant="outline" className="w-full">
              Back to Dashboard
            </Button>
          </Link>
        </div>

        <p className="text-xs text-muted-foreground">
          You'll receive a confirmation receipt from Stripe at your email address.
        </p>
      </motion.div>
    </div>
  );
}
