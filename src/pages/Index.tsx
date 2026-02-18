import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useGame } from "@/contexts/GameContext";

const Index = () => {
  const navigate = useNavigate();
  const { onboardingComplete } = useGame();

  useEffect(() => {
    if (onboardingComplete) {
      navigate("/aquarium", { replace: true });
    } else {
      navigate("/onboarding", { replace: true });
    }
  }, [onboardingComplete, navigate]);

  return null;
};

export default Index;
