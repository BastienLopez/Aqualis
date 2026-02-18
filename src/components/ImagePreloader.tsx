import { useEffect } from "react";
import { AQUARIUM_THEMES, FISH_CATALOG } from "@/lib/gameData";
import { pickImageSrc, preloadImages } from "@/lib/imageCache";

export default function ImagePreloader() {
  useEffect(() => {
    const fishImages = FISH_CATALOG.map((fish) => pickImageSrc(fish.image, fish.imageMobile));
    preloadImages(fishImages, { priority: "high" });

    const backgroundImages = AQUARIUM_THEMES.map((theme) => pickImageSrc(theme.background, theme.backgroundMobile));
    preloadImages(backgroundImages, { priority: "low", idle: true });
  }, []);

  return null;
}
