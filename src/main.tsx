import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
// Eagerly kick off fish image preloads before React even mounts,
// so images are in-flight while the JS bundle hydrates.
import { FISH_CATALOG } from "@/lib/gameData";
import { preloadImages, shouldUseMobileAssets } from "@/lib/imageCache";

const isMobile = shouldUseMobileAssets();
const highConcurrency = isMobile ? 2 : 4;
const lowConcurrency = isMobile ? 1 : 2;

// HIGH priority: first 6 common fish (visible on first aquarium open)
const prioritySrcs = FISH_CATALOG.slice(0, 6).flatMap((f) => [
  isMobile && f.imageMobile ? f.imageMobile : f.image,
]);
preloadImages(prioritySrcs, { priority: "high", maxConcurrency: highConcurrency });

// LOW priority: rest of the catalog, deferred to idle time
const restSrcs = FISH_CATALOG.slice(6).flatMap((f) => [
  isMobile && f.imageMobile ? f.imageMobile : f.image,
]);
preloadImages(restSrcs, { priority: "low", idle: true, maxConcurrency: lowConcurrency });

createRoot(document.getElementById("root")!).render(<App />);

// ── Mobile-style scroll on #page-scroll: mouse wheel + drag, contained to mobile column ──
(function setupDragScroll() {
  function init() {
    const el = document.getElementById("page-scroll");
    if (!el) return;

    // Allow wheel scroll only inside #page-scroll (already scoped since it's the scroll container)
    // Nothing to block — browser will scroll el naturally via wheel when hovering over it.

    // Drag-to-scroll (simulates mobile touch drag)
    let isDragging = false;
    let startY = 0;
    let startScrollTop = 0;

    el.addEventListener("mousedown", (e) => {
      isDragging = true;
      startY = e.clientY;
      startScrollTop = el.scrollTop;
      el.style.userSelect = "none";
    });

    document.addEventListener("mousemove", (e) => {
      if (!isDragging) return;
      const delta = e.clientY - startY;
      if (Math.abs(delta) > 4) {
        el.scrollTop = startScrollTop - delta;
      }
    });

    document.addEventListener("mouseup", () => {
      isDragging = false;
      el.style.userSelect = "";
    });
  }

  // #page-scroll is created by React after render — wait for it
  const observer = new MutationObserver(() => {
    if (document.getElementById("page-scroll")) {
      observer.disconnect();
      init();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
  init();
})();
