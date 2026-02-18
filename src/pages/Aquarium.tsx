import { useState, useCallback, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useGame } from "@/contexts/GameContext";
import { AQUARIUM_THEMES, FISH_CATALOG, MAX_FISH_PER_AQUARIUM } from "@/lib/gameData";
import type { Fish } from "@/lib/gameData";
import SafeImage from "@/components/SafeImage";
import { pickImageSrc } from "@/lib/imageCache";
import Bubbles from "@/components/Bubbles";
import { motion, AnimatePresence } from "framer-motion";

export default function Aquarium() {
  const navigate = useNavigate();
  const location = useLocation();
  const { gold, level, xpProgress, totalXP, activeAquarium, aquariumFish, userName, setActiveAquarium, ownedAquariums, sessions, companionLevel, setUserName } = useGame();
  const theme = AQUARIUM_THEMES.find(t => t.id === activeAquarium) || AQUARIUM_THEMES[0];
  const themeBackground = pickImageSrc(theme.background, theme.backgroundMobile);
  const fishInTank = (aquariumFish[activeAquarium] || [])
    .map(id => FISH_CATALOG.find(f => f.id === id))
    .filter((fish): fish is Fish => Boolean(fish));
  const schoolFish = useMemo(() => {
    const base = fishInTank.length ? fishInTank : FISH_CATALOG;
    if (base.length === 0) return [];
    const targetCount = 9;
    return Array.from({ length: targetCount }, (_, i) => base[i % base.length]);
  }, [fishInTank]);

  const [showWelcome, setShowWelcome] = useState(false);
  const [cinemaMode, setCinemaMode] = useState(false);
  const [showAquariumPicker, setShowAquariumPicker] = useState(false);
  const [showRareEvent, setShowRareEvent] = useState<string | null>(null);
  const [schoolDirection, setSchoolDirection] = useState<"left" | "right">("right");
  const [waterTint, setWaterTint] = useState(0);
  const [lightIntensity, setLightIntensity] = useState(0.4);
  const [showSettings, setShowSettings] = useState(false);
  const [nameDraft, setNameDraft] = useState(userName);
  const [sessionComplete, setSessionComplete] = useState<{
    reward: { gold: number; xp: number };
    activityLabel: string;
    durationLabel: string;
  } | null>(null);

  // Welcome message on first open without session
  useEffect(() => {
    const today = new Date().toDateString();
    const hasSessionToday = sessions.some(s => new Date(s.date).toDateString() === today);
    if (!hasSessionToday && sessions.length > 0) {
      setShowWelcome(true);
      const t = setTimeout(() => setShowWelcome(false), 4000);
      return () => clearTimeout(t);
    }
  }, []);

  useEffect(() => {
    const payload = (location.state as { sessionComplete?: {
      reward: { gold: number; xp: number };
      activityLabel: string;
      durationLabel: string;
    } } | null)?.sessionComplete;

    if (payload) {
      setSessionComplete(payload);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    if (!sessionComplete) return;
    const t = setTimeout(() => setSessionComplete(null), 2800);
    return () => clearTimeout(t);
  }, [sessionComplete]);

  useEffect(() => {
    setNameDraft(userName);
  }, [userName]);

  // Cinema mode auto-hide after 30s
  useEffect(() => {
    if (cinemaMode) {
      const t = setTimeout(() => setCinemaMode(false), 30000);
      return () => clearTimeout(t);
    }
  }, [cinemaMode]);

  // Rare visual events (passive, after long sessions)
  useEffect(() => {
    const lastSession = sessions[0];
    if (lastSession && lastSession.duration >= 60) {
      const timeSince = Date.now() - new Date(lastSession.date).getTime();
      if (timeSince < 30000) { // within 30s of returning
        const rand = Math.random();
        if (rand < 0.3) {
          setShowRareEvent("light-ray");
          setTimeout(() => setShowRareEvent(null), 5000);
        } else if (rand < 0.5) {
          setSchoolDirection(Math.random() < 0.5 ? "right" : "left");
          setShowRareEvent("school");
          setTimeout(() => setShowRareEvent(null), 6000);
        }
      }
    }
  }, [sessions]);

  const availableAquariums = AQUARIUM_THEMES.filter(t => ownedAquariums.includes(t.id));

  // Companion fish scale based on total time
  const companionScale = 1 + Math.min(companionLevel * 0.05, 0.5);

  const getFishStyle = useCallback((i: number) => {
    const fish = fishInTank[i];
    const speed = fish?.swimSpeed || "normal";
    const baseDuration = speed === "slow" ? 20 : speed === "fast" ? 9 : 14;
    
    // Distribute fish across the tank more naturally
    const row = Math.floor(i / 4);
    const col = i % 4;
    return {
      top: `${12 + row * 18 + (i * 7) % 12}%`,
      left: `${8 + col * 20 + (i * 11) % 15}%`,
      duration: baseDuration + (i * 1.3),
      scaleX: i % 3 === 0 ? -1 : 1,
      size: fish?.rarity === "legendary" ? "w-20 h-20" : fish?.rarity === "epic" ? "w-18 h-18" : "w-14 h-14",
    };
  }, [fishInTank]);

  const tintHue = waterTint; // 0-360
  const schoolStartX = schoolDirection === "right" ? "-30%" : "130%";
  const schoolEndX = schoolDirection === "right" ? "130%" : "-30%";

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden">
      {/* Background with water tint */}
      <div className="absolute inset-0">
        <motion.img 
          key={theme.id}
          src={themeBackground} 
          alt="" 
          className="w-full h-full object-cover"
          loading="eager"
          decoding="async"
          fetchPriority="high"
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2 }}
        />
        {/* Water tint overlay */}
        {waterTint > 0 && (
          <div className="absolute inset-0" style={{ 
            background: `hsla(${tintHue}, 60%, 30%, 0.15)`,
            mixBlendMode: "overlay"
          }} />
        )}
        {/* Light intensity overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-background/30" 
          style={{ opacity: 1 - lightIntensity + 0.3 }} />
        
        {/* Surface reflections - animated light caustics */}
        <div className="absolute top-0 left-0 right-0 h-32 overflow-hidden opacity-20 pointer-events-none">
          <motion.div 
            className="w-[200%] h-full"
            style={{
              background: "repeating-linear-gradient(90deg, transparent, rgba(255,255,255,0.03) 2px, transparent 4px)",
            }}
            animate={{ x: [0, -100] }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          />
        </div>

        {/* Water distortion effect */}
        <motion.div 
          className="absolute inset-0 pointer-events-none"
          style={{ 
            background: "radial-gradient(ellipse at 50% 20%, rgba(255,255,255,0.02) 0%, transparent 70%)" 
          }}
          animate={{ opacity: [0.3, 0.7, 0.3], scale: [1, 1.02, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <Bubbles count={20} />

      {/* Rare event: Light ray */}
      <AnimatePresence>
        {showRareEvent === "light-ray" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2 }}
            className="absolute inset-0 pointer-events-none z-10"
          >
            <div className="absolute top-0 left-[30%] w-32 h-full bg-gradient-to-b from-gold/10 via-gold/5 to-transparent rotate-12 blur-xl" />
            <div className="absolute top-0 left-[50%] w-20 h-full bg-gradient-to-b from-primary/8 via-primary/3 to-transparent -rotate-6 blur-lg" />
          </motion.div>
        )}
        {showRareEvent === "school" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute top-[34%] left-0 right-0 pointer-events-none z-10 overflow-visible"
          >
            <motion.div
              initial={{ x: schoolStartX }}
              animate={{ x: schoolEndX, y: [0, -12, 0, 8, 0] }}
              transition={{
                x: { duration: 7.2, ease: "linear" },
                y: { duration: 3.6, repeat: Infinity, ease: "easeInOut" },
              }}
              className="flex items-center gap-4"
            >
              {schoolFish.map((fish, i) => {
                const offset = i % 2 === 0 ? -10 : 10;
                const sizeClass = i % 3 === 0 ? "w-14 h-14" : "w-12 h-12";
                const bubbleSize = i % 3 === 0 ? 6 : i % 3 === 1 ? 4 : 5;
                const bubbleDelay = 0.6 + (i % 4) * 0.9;
                const bubbleDuration = 2.6 + (i % 3) * 0.4;
                const bubbleRepeatDelay = 3 + (i % 3) * 1.4;
                const bubbleSideStyle = schoolDirection === "right"
                  ? { left: -4, bottom: "30%" }
                  : { right: -4, bottom: "30%" };
                return (
                  <motion.div
                    key={`${fish.id}-${i}`}
                    className={`relative ${sizeClass}`}
                    initial={{ y: offset }}
                    animate={{
                      y: [offset, offset - 8, offset + 4, offset],
                      x: [0, 6, -4, 0],
                      rotate: [0, 3, -2, 0],
                      scale: [1, 1.02, 0.98, 1],
                    }}
                    transition={{ duration: 2.2, delay: i * 0.12, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <motion.div style={{ scaleX: schoolDirection === "right" ? 1 : -1 }}>
                      <SafeImage
                        src={fish.image}
                        mobileSrc={fish.imageMobile}
                        alt=""
                        className="w-full h-full object-contain drop-shadow-2xl"
                        fallbackClassName="w-full h-full"
                      />
                    </motion.div>
                    <motion.span
                      className="absolute rounded-full bg-white/20 border border-white/30"
                      style={{ width: bubbleSize, height: bubbleSize, ...bubbleSideStyle }}
                      initial={{ opacity: 0, y: 0, scale: 0.6 }}
                      animate={{ opacity: [0, 0.6, 0], y: [0, -90, -140], scale: [0.6, 1, 1.1] }}
                      transition={{
                        duration: bubbleDuration,
                        delay: bubbleDelay,
                        repeat: Infinity,
                        repeatDelay: bubbleRepeatDelay,
                        ease: "easeOut",
                      }}
                    />
                  </motion.div>
                );
              })}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* UI layer */}
      <AnimatePresence>
        {!cinemaMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Top bar header */}
            <div className="relative z-20 px-5 pt-14 pb-3">
              <div className="glass-nav rounded-2xl px-4 py-3 flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-[11px] text-foreground/50 font-medium">Bonjour, {userName} 👋</p>
                  <button 
                    onClick={() => setShowAquariumPicker(true)}
                    className="text-sm font-bold text-foreground flex items-center gap-1.5"
                  >
                    {theme.name}
                    <span className="text-foreground/30 text-xs">▾</span>
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-[9px] text-foreground/40 font-semibold uppercase">Niv. {level}</p>
                    <div className="w-16 h-1 rounded-full bg-foreground/10 mt-0.5 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-accent"
                        initial={{ width: 0 }}
                        animate={{ width: `${xpProgress}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                  <div className="h-6 w-px bg-foreground/10" />
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs">🪙</span>
                    <span className="text-sm font-bold text-gold">{gold}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Welcome message */}
            <AnimatePresence>
              {showWelcome && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="relative z-20 px-5 mb-2"
                >
                  <div className="glass-nav rounded-xl px-4 py-2.5 text-center">
                    <p className="text-xs text-foreground/70">Bienvenue. Ton aquarium t'attend. 🐠</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fish swimming area */}
      <div className="relative z-10 flex-1 overflow-hidden" onClick={() => cinemaMode && setCinemaMode(false)}>
        {/* Companion fish - always present */}
        <motion.div
          className="absolute z-10"
          style={{ bottom: "15%", left: "10%", transform: `scale(${companionScale})` }}
          animate={{
            x: [0, 40, -20, 30, 0],
            y: [0, -10, 15, -8, 0],
          }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        >
          <motion.div
            className="w-20 h-20"
            animate={{ 
              scaleX: [1, 1, -1, -1, 1],
              rotate: [0, 2, -1, 1, 0]
            }}
            transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
          >
            <SafeImage
              src={FISH_CATALOG.find(f => f.id === "betta")?.image}
              mobileSrc={FISH_CATALOG.find(f => f.id === "betta")?.imageMobile}
              alt=""
              className="w-full h-full object-contain drop-shadow-[0_4px_20px_rgba(200,160,50,0.3)]"
              fallbackClassName="w-full h-full"
            />
          </motion.div>
          {/* Companion glow */}
          <div className="absolute inset-0 rounded-full bg-gold/10 blur-xl -z-10" />
        </motion.div>

        {/* Tank fish */}
        {fishInTank.map((fish, i) => {
          const style = getFishStyle(i);
          return (
            <motion.div
              key={`${fish!.id}-${i}`}
              className={`absolute ${style.size}`}
              style={{ top: style.top, left: style.left }}
              animate={{
                x: [0, 30 + i * 5, -25, 20, -15, 0],
                y: [0, -15 - i * 2, 12, -18, 8, 0],
                scaleX: [style.scaleX, style.scaleX, -style.scaleX, -style.scaleX, style.scaleX, style.scaleX],
              }}
              transition={{
                duration: style.duration,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <SafeImage
                src={fish.image}
                mobileSrc={fish.imageMobile}
                alt=""
                className="w-full h-full object-contain drop-shadow-2xl"
                fallbackClassName="w-full h-full"
              />
            </motion.div>
          );
        })}

        {fishInTank.length === 0 && !cinemaMode && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center glass-nav rounded-3xl px-8 py-6">
              <p className="text-sm font-medium text-foreground/80">Ton aquarium est vide</p>
              <p className="text-xs text-muted-foreground mt-1.5">Lance une session pour gagner de l'or !</p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom controls */}
      <AnimatePresence>
        {!cinemaMode && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.4 }}
          >
            {/* Cinema mode + fish count + settings */}
            <div className="relative z-20 flex items-center justify-between px-6 pb-2">
              <p className="text-[10px] text-foreground/30 font-semibold uppercase tracking-widest">{theme.name}</p>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-foreground/30">{fishInTank.length}/{MAX_FISH_PER_AQUARIUM} 🐟</span>
                <button 
                  onClick={() => setShowSettings(true)}
                  className="text-[10px] text-foreground/40 glass-nav rounded-full px-3 py-1"
                >
                  ⚙️
                </button>
                <button 
                  onClick={() => setCinemaMode(true)}
                  className="text-[10px] text-foreground/40 glass-nav rounded-full px-3 py-1"
                >
                  🎬 Cinéma
                </button>
              </div>
            </div>

            {/* Start Session CTA */}
            <div className="relative z-20 px-6 pb-24">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/session")}
                className="w-full flex items-center justify-between card-dark rounded-2xl px-5 py-4 glow-gold"
              >
                <div className="w-11 h-11 rounded-full bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground text-xl font-bold">▶</span>
                </div>
                <span className="text-sm font-bold text-foreground">Lancer une session</span>
                <span className="text-primary text-sm font-medium">› › ›</span>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Aquarium Picker Modal */}
      <AnimatePresence>
        {showAquariumPicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] bg-background/80 backdrop-blur-sm flex items-end"
            onClick={() => setShowAquariumPicker(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full bg-card rounded-t-3xl p-6"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-10 h-1 bg-muted rounded-full mx-auto mb-5" />
              <h3 className="text-lg font-bold text-foreground mb-4">Choisir un aquarium</h3>
              <div className="space-y-3">
                {availableAquariums.map(t => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setActiveAquarium(t.id);
                      setShowAquariumPicker(false);
                    }}
                    className={`w-full card-dark rounded-2xl overflow-hidden flex items-center gap-4 pr-4 transition-all ${
                      t.id === activeAquarium ? "ring-2 ring-primary" : ""
                    }`}
                  >
                    <div className="w-20 h-16 overflow-hidden rounded-l-2xl flex-shrink-0">
                      <img
                        src={pickImageSrc(t.background, t.backgroundMobile)}
                        alt=""
                        className="w-full h-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground">{t.name}</p>
                      <p className="text-[10px] text-muted-foreground">{t.subtitle}</p>
                    </div>
                    {t.id === activeAquarium && (
                      <span className="text-primary text-xs font-bold flex-shrink-0">✓</span>
                    )}
                  </button>
                ))}
              </div>
              <div className="h-8" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Modal - Water customization */}
      {/* Settings Modal - Water customization */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] bg-background/85 backdrop-blur-sm overflow-y-auto"
            onClick={() => setShowSettings(false)}
          >
            <button
              onClick={() => setShowSettings(false)}
              className="fixed top-12 left-5 z-[90] w-10 h-10 rounded-full card-dark flex items-center justify-center"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-foreground">
                <path d="M15 18l-6-6 6-6"/>
              </svg>
            </button>
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -10, opacity: 0 }}
              transition={{ type: "spring", damping: 24, stiffness: 260 }}
              className="relative z-10 min-h-full w-full px-6 pt-16 pb-10 flex items-start justify-center"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-full max-w-lg bg-card rounded-3xl p-6">
                <div className="w-10 h-1 bg-muted rounded-full mx-auto mb-5" />
                <h3 className="text-lg font-bold text-foreground mb-6">Personnalisation</h3>
                
                <div className="space-y-6">
                  <div>
                    <p className="text-xs text-muted-foreground mb-3 font-semibold uppercase tracking-wider">Nom du profil</p>
                    <div className="card-dark rounded-2xl px-4 py-3">
                      <input
                        value={nameDraft}
                        onChange={(event) => setNameDraft(event.target.value)}
                        onBlur={() => setUserName(nameDraft)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            (event.currentTarget as HTMLInputElement).blur();
                          }
                        }}
                        className="w-full bg-transparent text-sm font-semibold text-foreground outline-none placeholder:text-muted-foreground/60"
                        placeholder="Aquanaute"
                      />
                    </div>
                    <p className="text-[9px] text-muted-foreground/70 mt-2">Appuie sur Entree pour valider</p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground mb-3 font-semibold uppercase tracking-wider">Intensite lumineuse</p>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={lightIntensity * 100}
                      onChange={e => setLightIntensity(Number(e.target.value) / 100)}
                      className="w-full accent-primary h-1"
                    />
                    <div className="flex justify-between text-[9px] text-muted-foreground mt-1">
                      <span>Sombre</span>
                      <span>Lumineux</span>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground mb-3 font-semibold uppercase tracking-wider">Teinte de l'eau</p>
                    <input
                      type="range"
                      min="0"
                      max="360"
                      value={waterTint}
                      onChange={e => setWaterTint(Number(e.target.value))}
                      className="w-full accent-primary h-1"
                    />
                    <div className="flex justify-between text-[9px] text-muted-foreground mt-1">
                      <span>Naturel</span>
                      <span>Teinte personnalisee</span>
                    </div>
                  </div>
                </div>
                <div className="h-8" />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {sessionComplete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-background/60 backdrop-blur-sm flex items-center justify-center px-6"
            onClick={() => setSessionComplete(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 12, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.98, y: 8, opacity: 0 }}
              transition={{ type: "spring", damping: 18, stiffness: 240 }}
              className="card-dark rounded-3xl px-6 py-7 text-center w-full max-w-sm"
              onClick={e => e.stopPropagation()}
            >
              <div className="text-2xl mb-3 font-semibold text-accent">Pas mal!</div>
              <h2 className="text-lg font-bold text-foreground mb-1">Belle session.</h2>
              <p className="text-[11px] text-muted-foreground mb-5">
                {sessionComplete.durationLabel} - {sessionComplete.activityLabel.toLowerCase()}
              </p>

              <div className="flex gap-3 justify-center mb-5">
                <div className="card-warm rounded-2xl px-5 py-4 text-center min-w-[110px]">
                  <p className="text-2xl font-extrabold text-gold">+{sessionComplete.reward.gold}</p>
                  <p className="text-[10px] text-foreground/60 font-semibold mt-1">Or</p>
                </div>
                <div className="card-cool rounded-2xl px-5 py-4 text-center min-w-[110px]">
                  <p className="text-2xl font-extrabold text-accent">+{sessionComplete.reward.xp}</p>
                  <p className="text-[10px] text-foreground/60 font-semibold mt-1">XP</p>
                </div>
              </div>

              <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground/60">
                Retour a l'aquarium
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
