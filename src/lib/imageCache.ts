import { useEffect, useMemo, useState } from "react";

export type ImagePriority = "high" | "low";
export type ImageStatus = "idle" | "loading" | "loaded" | "error";

type CacheEntry = {
  status: ImageStatus;
  promise: Promise<boolean>;
  img?: HTMLImageElement;
  lastAccess: number;
};

const cache = new Map<string, CacheEntry>();
const MAX_CACHE_ENTRIES = 80;

const getConnection = () => {
  if (typeof navigator === "undefined") return undefined;
  return (navigator as unknown as { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
};

const getDefaultConcurrency = () => {
  const connection = getConnection();
  if (connection?.saveData) return 2;
  if (connection?.effectiveType && connection.effectiveType.includes("2g")) return 2;
  return 4;
};

export const shouldUseMobileAssets = () => {
  if (typeof window === "undefined") return false;
  const connection = getConnection();
  const reduceData = Boolean(connection?.saveData) || connection?.effectiveType === "2g" || connection?.effectiveType === "slow-2g";
  return window.matchMedia("(max-width: 640px)").matches || reduceData;
};

export const pickImageSrc = (src?: string, mobileSrc?: string) => {
  if (!src) return src;
  return shouldUseMobileAssets() && mobileSrc ? mobileSrc : src;
};

const trimCache = () => {
  if (cache.size <= MAX_CACHE_ENTRIES) return;
  const entries = Array.from(cache.entries()).sort((a, b) => a[1].lastAccess - b[1].lastAccess);
  const overflow = entries.length - MAX_CACHE_ENTRIES;
  for (let i = 0; i < overflow; i += 1) {
    cache.delete(entries[i][0]);
  }
};

export const getImageStatus = (src?: string): ImageStatus => {
  if (!src) return "idle";
  const entry = cache.get(src);
  if (!entry) return "idle";
  entry.lastAccess = Date.now();
  return entry.status;
};

export const preloadImage = (src: string, options: { priority?: ImagePriority } = {}) => {
  if (!src) return Promise.resolve(false);
  const cached = cache.get(src);
  if (cached) {
    cached.lastAccess = Date.now();
    return cached.promise;
  }

  let resolvePromise: (value: boolean) => void = () => undefined;
  const promise = new Promise<boolean>((resolve) => {
    resolvePromise = resolve;
  });

  const entry: CacheEntry = {
    status: "loading",
    promise,
    lastAccess: Date.now(),
  };
  cache.set(src, entry);
  trimCache();

  const img = new Image();
  entry.img = img;
  img.decoding = "async";
  img.loading = options.priority === "high" ? "eager" : "lazy";
  img.setAttribute("fetchpriority", options.priority === "high" ? "high" : "low");

  img.onload = async () => {
    try {
      if (img.decode) await img.decode();
    } catch {
      // Ignore decode failures; the image is still usable.
    }
    entry.status = "loaded";
    entry.lastAccess = Date.now();
    resolvePromise(true);
  };

  img.onerror = () => {
    entry.status = "error";
    entry.lastAccess = Date.now();
    resolvePromise(false);
  };

  img.src = src;

  return promise;
};

export const preloadImages = (
  sources: Array<string | null | undefined>,
  options: { priority?: ImagePriority; idle?: boolean; maxConcurrency?: number } = {},
) => {
  const unique = Array.from(new Set(sources.filter(Boolean))) as string[];
  if (unique.length === 0) return Promise.resolve();

  const maxConcurrency = options.maxConcurrency ?? getDefaultConcurrency();

  const run = () => new Promise<void>((resolve) => {
    let index = 0;
    let active = 0;

    const pump = () => {
      if (index >= unique.length && active === 0) {
        resolve();
        return;
      }
      while (active < maxConcurrency && index < unique.length) {
        const src = unique[index++];
        active += 1;
        preloadImage(src, { priority: options.priority })
          .finally(() => {
            active -= 1;
            pump();
          });
      }
    };

    pump();
  });

  if (options.idle && typeof window !== "undefined" && "requestIdleCallback" in window) {
    return new Promise<void>((resolve) => {
      (window as unknown as { requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => void })
        .requestIdleCallback(() => {
          run().then(resolve);
        }, { timeout: 2000 });
    });
  }

  if (options.idle) {
    return new Promise<void>((resolve) => {
      window.setTimeout(() => {
        run().then(resolve);
      }, 200);
    });
  }

  return run();
};

export const useCachedImage = (src?: string, options: { priority?: ImagePriority } = {}) => {
  const resolvedSrc = useMemo(() => src, [src]);
  const [status, setStatus] = useState<ImageStatus>(() => getImageStatus(resolvedSrc));

  useEffect(() => {
    if (!resolvedSrc) {
      setStatus("idle");
      return;
    }

    const current = getImageStatus(resolvedSrc);
    if (current === "loaded" || current === "error") {
      setStatus(current);
      return;
    }

    setStatus("loading");
    let active = true;
    preloadImage(resolvedSrc, { priority: options.priority }).then((success) => {
      if (!active) return;
      setStatus(success ? "loaded" : "error");
    });

    return () => {
      active = false;
    };
  }, [resolvedSrc, options.priority]);

  return status;
};
