import { Skeleton } from "@/components/ui/skeleton";

export default function AppLoading() {
  return <div className="space-y-8" aria-label="Loading workspace"><div className="space-y-3"><Skeleton className="h-4 w-24"/><Skeleton className="h-10 w-72"/><Skeleton className="h-5 w-96 max-w-full"/></div><div className="grid gap-4 md:grid-cols-3">{[1,2,3].map((item) => <Skeleton key={item} className="h-36 rounded-2xl"/>)}</div><Skeleton className="h-80 rounded-2xl"/></div>;
}
