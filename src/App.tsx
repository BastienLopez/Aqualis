import { lazy, Suspense } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { GameProvider } from "@/contexts/GameContext";
import ImagePreloader from "@/components/ImagePreloader";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import BottomNav from "./components/BottomNav";

// Lazy-load heavy pages — each gets its own chunk, loaded on navigation
const Onboarding  = lazy(() => import("./pages/Onboarding"));
const Aquarium    = lazy(() => import("./pages/Aquarium"));
const Session     = lazy(() => import("./pages/Session"));
const Shop        = lazy(() => import("./pages/Shop"));
const Collection  = lazy(() => import("./pages/Collection"));
const Encyclopedia = lazy(() => import("./pages/Encyclopedia"));
const Quests      = lazy(() => import("./pages/Quests"));
const NotFound    = lazy(() => import("./pages/NotFound"));

// Minimal fallback — no spinner, just keeps the dark background
function PageSkeleton() {
  return <div className="min-h-screen bg-background" aria-hidden />;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Don't refetch on window focus — mobile user switching apps
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 min stale time
    },
  },
});

function AppLayout() {
  const location = useLocation();
  const showNav = ["/aquarium", "/session", "/shop", "/collection", "/encyclopedia", "/quests"].includes(location.pathname);

  return (
    <>
      <ErrorBoundary>
        <Suspense fallback={<PageSkeleton />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/aquarium" element={<Aquarium />} />
            <Route path="/session" element={<Session />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/collection" element={<Collection />} />
            <Route path="/encyclopedia" element={<Encyclopedia />} />
            <Route path="/quests" element={<Quests />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
      {showNav && <BottomNav />}
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <GameProvider>
        <ImagePreloader />
        <BrowserRouter>
          <AppLayout />
        </BrowserRouter>
      </GameProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
