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

  useEffect(() => {
    setError(false);
  }, [resolvedSrc]);

  if (!resolvedSrc || error || cacheStatus === "error") {
    return (
      <div
        aria-hidden
        className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/12 via-white/6 to-transparent border border-white/10 animate-pulse ${fallbackClassName}`}
      />
    );
  }

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      className={className}
      loading={priority === "high" ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={priority === "high" ? "high" : "low"}
      onError={() => setError(true)}
    />
  );
}
