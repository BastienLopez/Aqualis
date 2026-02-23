import { useEffect, useMemo, useState } from "react";
import { pickImageSrc, useCachedImage, type ImagePriority } from "@/lib/imageCache";

interface SafeImageProps {
  src?: string;
  mobileSrc?: string;
  alt?: string;
  className?: string;
  fallbackClassName?: string;
  priority?: ImagePriority;
}

export default function SafeImage({
  src,
  mobileSrc,
  alt = "",
  className = "",
  fallbackClassName = "",
  priority = "low",
}: SafeImageProps) {
  const [error, setError] = useState(false);
  const resolvedSrc = useMemo(() => pickImageSrc(src, mobileSrc), [src, mobileSrc]);
  const cacheStatus = useCachedImage(resolvedSrc, { priority });
  const [lastLoadedSrc, setLastLoadedSrc] = useState<string | null>(() => (cacheStatus === "loaded" ? resolvedSrc || null : null));

  useEffect(() => {
    setError(false);
  }, [resolvedSrc]);

  useEffect(() => {
    if (cacheStatus === "loaded" && resolvedSrc) {
      setLastLoadedSrc(resolvedSrc);
    }
    if (cacheStatus === "error") {
      // keep lastLoadedSrc around as a graceful fallback; don't wipe it immediately
    }
  }, [cacheStatus, resolvedSrc]);

  // If there's no resolved src or an unrecoverable error and no previously loaded image, show skeleton
  if (!resolvedSrc || error || (cacheStatus === "error" && !lastLoadedSrc)) {
    return (
      <div
        aria-hidden
        className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/12 via-white/6 to-transparent border border-white/10 animate-pulse ${fallbackClassName}`}
      />
    );
  }

  // While a new src is loading, prefer to keep rendering the last successfully loaded image
  const displaySrc = cacheStatus === "loaded" ? resolvedSrc : (lastLoadedSrc || resolvedSrc);

  return (
    <img
      src={displaySrc}
      alt={alt}
      className={className}
      loading={priority === "high" ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={priority === "high" ? "high" : "low"}
      onError={() => setError(true)}
    />
  );
}
