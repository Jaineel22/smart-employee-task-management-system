// Reusable skeleton loading card — drop-in replacement for Loader
// when you want shimmer placeholder instead of a spinner
const SkeletonCard = () => (
  <div className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
    <div className="flex items-center gap-4 mb-4">
      <div className="w-10 h-10 bg-gray-200 rounded-xl" />
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-gray-200 rounded w-1/2" />
        <div className="h-5 bg-gray-200 rounded w-1/4" />
      </div>
    </div>
    <div className="space-y-2">
      <div className="h-2.5 bg-gray-100 rounded w-full" />
      <div className="h-2.5 bg-gray-100 rounded w-3/4" />
    </div>
  </div>
);

export const SkeletonGrid = ({ count = 4 }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
);

export default SkeletonCard;