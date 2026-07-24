import { Skeleton } from "@/components/ui/skeleton";

export const ListingCardSkeleton = () => (
  <div className="overflow-hidden rounded-md border border-border bg-card">
    <Skeleton className="aspect-[4/3] w-full rounded-none" />
    <div className="space-y-2 p-3">
      <Skeleton className="h-5 w-1/2" />
      <Skeleton className="h-3.5 w-full" />
      <Skeleton className="h-3.5 w-2/3" />
      <div className="flex justify-between pt-0.5">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-14" />
      </div>
    </div>
  </div>
);

export const ListingCardSkeletonRow = ({ count = 5 }: { count?: number }) => (
  <>
    {Array.from({ length: count }).map((_, i) => (
      <ListingCardSkeleton key={i} />
    ))}
  </>
);
