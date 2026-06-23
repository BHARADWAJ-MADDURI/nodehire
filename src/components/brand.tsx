import Link from "next/link";
import { cn } from "@/lib/utils";

export function Brand({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn("inline-flex items-center gap-2.5 font-semibold tracking-tight", className)}
      aria-label="NodeHire home"
    >
      <span className="grid size-9 place-items-center rounded-xl bg-primary text-xs font-bold text-primary-foreground shadow-lg shadow-primary/20">
        NH
      </span>
      <span className="text-lg">NodeHire</span>
    </Link>
  );
}
