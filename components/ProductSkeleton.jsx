"use client";

export function ProductCardSkeleton() {
  return (
    <div className="group max-xl:mx-auto">
      {/* Image Skeleton */}
      <div className="bg-[#F5F5F5] h-40 sm:w-60 sm:h-68 rounded-lg flex items-center justify-center animate-pulse">
        <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gray-300 rounded-md" />
      </div>

      {/* Text + Price Skeleton */}
      <div className="flex justify-between gap-3 pt-2 max-w-60">
        <div className="flex flex-col gap-2 w-full">
          {/* Product name */}
          <div className="h-4 w-32 bg-gray-300 rounded-md animate-pulse" />

          {/* Stars */}
          <div className="flex gap-1">
            {Array(5)
              .fill("")
              .map((_, i) => (
                <div
                  key={i}
                  className="h-3 w-3 bg-gray-300 rounded-full animate-pulse"
                />
              ))}
          </div>
        </div>

        {/* Price */}
        <div className="h-4 w-10 bg-gray-300 rounded-md animate-pulse" />
      </div>
    </div>
  );
}
