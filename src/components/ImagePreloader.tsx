import { useEffect } from "react";
import { AQUARIUM_THEMES, FISH_CATALOG } from "@/lib/gameData";
import { pickImageSrc, preloadImages } from "@/lib/imageCache";

export default function ImagePreloader() {
  useEffect(() => {
    // Fish images are the most critical – load all in parallel at highest priority
    const fishImages = FISH_CATALOG.flatMap((fish) => [
      pickImageSrc(fish.image, fish.imageMobile),
      // preload both variants so switching network conditions works seamlessly
      fish.imageMobile && fish.imageMobile !== fish.image ? fish.imageMobile : null,
    ]).filter(Boolean) as string[];

    preloadImages(fishImages, { priority: "high", maxConcurrency: 8 });

    const backgroundImages = AQUARIUM_THEMES.map((theme) =>
      pickImageSrc(theme.background, theme.backgroundMobile)
    );
    preloadImages(backgroundImages, { priority: "low", idle: true });
  }, []);

  return null;
}

