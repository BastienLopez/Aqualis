import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
// Eagerly kick off fish image preloads before React even mounts,
// so images are in-flight while the JS bundle hydrates.
import { FISH_CATALOG } from "@/lib/gameData";
import { preloadImages, shouldUseMobileAssets } from "@/lib/imageCache";

const isMobile = shouldUseMobileAssets();

// HIGH priority: first 6 common fish (visible on first aquarium open)
const prioritySrcs = FISH_CATALOG.slice(0, 6).flatMap((f) => [
  isMobile && f.imageMobile ? f.imageMobile : f.image,
]);
preloadImages(prioritySrcs, { priority: "high", maxConcurrency: 4 });

// LOW priority: rest of the catalog, deferred to idle time
const restSrcs = FISH_CATALOG.slice(6).flatMap((f) => [
  isMobile && f.imageMobile ? f.imageMobile : f.image,
]);
preloadImages(restSrcs, { priority: "low", idle: true, maxConcurrency: 2 });

createRoot(document.getElementById("root")!).render(<App />);

