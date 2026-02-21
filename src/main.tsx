import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
// Eagerly kick off fish image preloads before React even mounts,
// so images are in-flight while the JS bundle hydrates.
import { FISH_CATALOG } from "@/lib/gameData";
import { preloadImages, pickImageSrc, shouldUseMobileAssets } from "@/lib/imageCache";

const isMobile = shouldUseMobileAssets();
const fishSrcs = FISH_CATALOG.flatMap((f) => [
  isMobile && f.imageMobile ? f.imageMobile : f.image,
]);
preloadImages(fishSrcs, { priority: "high", maxConcurrency: 10 });

createRoot(document.getElementById("root")!).render(<App />);

