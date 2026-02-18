import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useGame } from "@/contexts/GameContext";
import aquariumDeep from "@/assets/aquarium-deep.jpg";
import neonTetra from "@/assets/fish/neon-tetra.png";
import betta from "@/assets/fish/betta.png";
import jellyfish from "@/assets/fish/jellyfish.png";
import Bubbles from "@/components/Bubbles";

const goals = [
  { id: "work", label: "Travail", icon: "💼" },
  { id: "study", label: "Études", icon: "📚" },
  { id: "sport", label: "Sport", icon: "🏃" },
];

const aquariums = [
  { id: "deep", label: "Nuit Profonde", icon: "🌊" },
  { id: "reef", label: "Récif Lumineux", icon: "🐠" },
];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState("work");
  const [aquarium, setAquarium] = useState("deep");
  const [userName, setUserName] = useState("");
  const navigate = useNavigate();
  const { completeOnboarding } = useGame();

  const finish = () => {
    completeOnboarding(goal, aquarium, userName);
    navigate("/aquarium");
  };

  return (
    <div className="fixed inset-0 bg-background overflow-hidden">
      <div className="absolute inset-0">
        <img src={aquariumDeep} alt="" className="w-full h-full object-cover opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/30" />
      </div>
      <Bubbles count={8} />

      <div className="relative z-10 h-full flex flex-col">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="s0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.4 }}
              className="flex-1 flex flex-col"
            >
              <div className="flex-1 flex items-center justify-center">
                <motion.img
                  src={betta}
                  alt="Fish"
                  className="w-64 h-64 object-contain drop-shadow-2xl"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.8 }}
                />
              </div>

              <div className="px-6 pb-12">
                <div className="w-12 h-1 bg-muted-foreground/30 rounded-full mx-auto mb-8" />
                <h1 className="text-[28px] font-bold text-foreground text-center leading-tight mb-3">
                  Construis ton aquarium{"\n"}avec de <span className="text-primary">vrais efforts</span>
                </h1>
                <p className="text-sm text-muted-foreground text-center mb-8 leading-relaxed">
                  Ton temps de concentration devient un monde vivant et magnifique.
                </p>

                <button
                  onClick={() => setStep(1)}
                  className="w-full flex items-center justify-between card-dark rounded-2xl px-5 py-4"
                >
                  <div className="w-10 h-10 rounded-full bg-foreground flex items-center justify-center">
                    <span className="text-background text-lg">›</span>
                  </div>
                  <span className="text-sm font-semibold text-foreground">Commencer</span>
                  <span className="text-muted-foreground text-sm">› › ›</span>
                </button>
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="s1"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.4 }}
              className="flex-1 flex flex-col"
            >
              <div className="flex-1 flex items-center justify-center">
                <div className="flex gap-4 items-end">
                  <motion.img src={neonTetra} alt="" className="w-24 h-24 object-contain opacity-50"
                    animate={{ y: [0, -8, 0] }} transition={{ duration: 4, repeat: Infinity }} />
                  <motion.img src={jellyfish} alt="" className="w-32 h-32 object-contain"
                    animate={{ y: [0, -12, 0] }} transition={{ duration: 5, repeat: Infinity }} />
                  <motion.img src={betta} alt="" className="w-24 h-24 object-contain opacity-60"
                    animate={{ y: [0, -6, 0] }} transition={{ duration: 3.5, repeat: Infinity }} />
                </div>
              </div>

              <div className="px-6 pb-12">
                <h1 className="text-[28px] font-bold text-foreground text-center leading-tight mb-3">
                  Focus. Étudie. Bouge.
                </h1>
                <p className="text-sm text-muted-foreground text-center mb-8">
                  Ton temps devient de la <span className="text-primary">vie</span>.
                </p>

                <button
                  onClick={() => setStep(2)}
                  className="w-full flex items-center justify-between card-dark rounded-2xl px-5 py-4"
                >
                  <div className="w-10 h-10 rounded-full bg-foreground flex items-center justify-center">
                    <span className="text-background text-lg">›</span>
                  </div>
                  <span className="text-sm font-semibold text-foreground">Continuer</span>
                  <span className="text-muted-foreground text-sm">› › ›</span>
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="s2"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="flex-1 flex flex-col px-6 pt-16 pb-12"
            >
              <h1 className="text-[24px] font-bold text-foreground text-center mb-8">Choisis ton chemin</h1>

              <div className="mb-5">
                <p className="text-xs text-muted-foreground mb-3 font-semibold uppercase tracking-wider">Ton prénom</p>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Aquanaute"
                  className="w-full card-dark rounded-2xl px-5 py-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="mb-5">
                <p className="text-xs text-muted-foreground mb-3 font-semibold uppercase tracking-wider">Objectif principal</p>
                <div className="grid grid-cols-3 gap-3">
                  {goals.map(g => (
                    <button
                      key={g.id}
                      onClick={() => setGoal(g.id)}
                      className={`card-dark rounded-2xl py-4 flex flex-col items-center gap-2 transition-all duration-300 ${
                        goal === g.id ? "ring-2 ring-primary glow-gold" : ""
                      }`}
                    >
                      <span className="text-2xl">{g.icon}</span>
                      <span className="text-xs font-semibold text-foreground">{g.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-8">
                <p className="text-xs text-muted-foreground mb-3 font-semibold uppercase tracking-wider">Premier aquarium</p>
                <div className="grid grid-cols-2 gap-3">
                  {aquariums.map(a => (
                    <button
                      key={a.id}
                      onClick={() => setAquarium(a.id)}
                      className={`card-dark rounded-2xl py-4 flex flex-col items-center gap-2 transition-all duration-300 ${
                        aquarium === a.id ? "ring-2 ring-primary glow-gold" : ""
                      }`}
                    >
                      <span className="text-2xl">{a.icon}</span>
                      <span className="text-xs font-semibold text-foreground">{a.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-auto">
                <button
                  onClick={finish}
                  className="w-full flex items-center justify-between card-dark rounded-2xl px-5 py-4"
                >
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-primary-foreground text-lg font-bold">›</span>
                  </div>
                  <span className="text-sm font-semibold text-foreground">Commencer l'aventure</span>
                  <span className="text-primary text-sm">› › ›</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
          {[0, 1, 2].map(i => (
            <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? "bg-primary w-6" : "bg-muted w-1.5"}`} />
          ))}
        </div>
      </div>
    </div>
  );
}
