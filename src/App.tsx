import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { GameProvider } from "@/contexts/GameContext";
import ImagePreloader from "@/components/ImagePreloader";
import Index from "./pages/Index";
import Onboarding from "./pages/Onboarding";
import Aquarium from "./pages/Aquarium";
import Session from "./pages/Session";
import Shop from "./pages/Shop";
import Collection from "./pages/Collection";
import Encyclopedia from "./pages/Encyclopedia";
import Quests from "./pages/Quests";
import NotFound from "./pages/NotFound";
import BottomNav from "./components/BottomNav";

const queryClient = new QueryClient();

function AppLayout() {
  const location = useLocation();
  const showNav = ["/aquarium", "/session", "/shop", "/collection", "/encyclopedia", "/quests"].includes(location.pathname);

  return (
    <>
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
