import { FeedSkeleton, FeedGridSkeleton } from "./FeedSkeleton";

export function CommunityFeedListSkeletons({ t }: { t: (key: string) => string }) {
  return (
    <>
      <div className="md:hidden">
        <FeedGridSkeleton t={t} />
      </div>
      <div className="hidden md:block">
        <FeedSkeleton count={3} t={t} />
      </div>
    </>
  );
}
