import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("animate-pulse rounded-xl bg-muted", className)} {...props} />;
}

export function ClimateSkeleton() {
  return (
    <div className="rounded-2xl border border-border p-4 space-y-3">
      <Skeleton className="h-4 w-40" />
      <div className="grid grid-cols-2 gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border p-2.5 space-y-1.5">
            <Skeleton className="h-2.5 w-16" />
            <Skeleton className="h-3.5 w-12" />
            <Skeleton className="h-2 w-10" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SoilSkeleton() {
  return (
    <div className="rounded-2xl border border-border p-4 space-y-3">
      <Skeleton className="h-4 w-36" />
      <div className="grid grid-cols-2 gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border p-2.5 space-y-1.5">
            <Skeleton className="h-2.5 w-20" />
            <Skeleton className="h-3.5 w-14" />
          </div>
        ))}
      </div>
      <Skeleton className="h-4 w-full rounded-full" />
    </div>
  );
}

export function HistoricalSkeleton() {
  return (
    <div className="rounded-2xl border border-border p-4 space-y-3">
      <Skeleton className="h-4 w-52" />
      <Skeleton className="h-3 w-64" />
      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border p-2.5 space-y-1.5">
            <Skeleton className="h-2.5 w-16" />
            <Skeleton className="h-3.5 w-10" />
            <Skeleton className="h-2.5 w-12" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function IdeamSkeleton() {
  return (
    <div className="rounded-2xl border border-border p-4 space-y-3">
      <Skeleton className="h-4 w-48" />
      <Skeleton className="h-3 w-56" />
      <div className="rounded-xl border border-border p-3 space-y-2">
        <Skeleton className="h-4 w-40" />
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex justify-between">
              <Skeleton className="h-2.5 w-16" />
              <Skeleton className="h-2.5 w-20" />
            </div>
          ))}
        </div>
      </div>
      <div className="flex gap-1.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-14 flex-shrink-0 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

export function CommoditySkeleton() {
  return (
    <div className="rounded-2xl border border-border p-4 space-y-3">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-3 w-32" />
      <div className="rounded-xl border border-border p-3 space-y-2">
        <Skeleton className="h-2.5 w-16" />
        <Skeleton className="h-6 w-28" />
      </div>
      <div className="flex justify-between rounded-xl border border-border px-3 py-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3.5 w-16" />
      </div>
    </div>
  );
}

export function ViabilitySkeleton() {
  return (
    <div className="rounded-2xl border border-border p-4 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-6 w-20 rounded-xl" />
      </div>
      <div className="space-y-1.5">
        <div className="flex justify-between">
          <Skeleton className="h-2.5 w-20" />
          <Skeleton className="h-2.5 w-8" />
        </div>
        <Skeleton className="h-3 w-full rounded-full" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-16 rounded-xl" />
        <Skeleton className="h-16 rounded-xl" />
      </div>
    </div>
  );
}
