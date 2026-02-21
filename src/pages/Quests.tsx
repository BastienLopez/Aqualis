import { useGame } from "@/contexts/GameContext";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { toast } from "sonner";

const ALL_ACHIEVEMENTS = [
  { id: "first_fish",   icon: "🐠", title: "Premier Résident",    desc: "Achète ton premier poisson" },
  { id: "first_session", icon: "⏱️", title: "Focus Débutant",      desc: "Complète ta 1re session" },
  { id: "sessions_10",  icon: "🔥", title: "Série de 10",         desc: "10 sessions au compteur" },
  { id: "one_hour",     icon: "⌛", title: "Marathonien",          desc: "Session d'1h ou plus" },
  { id: "feed_10",      icon: "🍖", title: "Bon Soignant",         desc: "Nourri 10 fois" },
  { id: "feed_100",     icon: "👨‍🍳", title: "Chef Cuisinier",      desc: "Nourri 100 fois" },
  { id: "legend_owned", icon: "✨", title: "Légende Vivante",      desc: "Possède un poisson légendaire" },
  { id: "collector",   icon: "🗂️", title: "Collectionneur",       desc: "5 espèces différentes" },
  { id: "aquarium_2",  icon: "🪸", title: "Double Aqua",          desc: "Possède 2 aquariums" },
  { id: "breeder",     icon: "🥚", title: "Éleveur",              desc: "Fais éclore un œuf" },
];

export default function Quests() {
  const { quests, claimQuestReward, gold, level, completedQuestHistory, unlockedAchievements } = useGame() as ReturnType<typeof useGame> & { unlockedAchievements: string[] };
  const activeQuests = quests.filter(q => !q.completed);
  const [claimedId, setClaimedId] = useState<string | null>(null);

  const TOTAL_QUESTS = 50;
  const completedCount = (completedQuestHistory || []).length;

  const handleClaim = (questId: string, questTitle: string, reward: { gold?: number; xp?: number }) => {
    setClaimedId(questId);
    claimQuestReward(questId);
    const parts: string[] = [];
    if (reward.gold) parts.push(`+${reward.gold} 🪙`);
    if (reward.xp) parts.push(`+${reward.xp} XP`);
    toast.success(`${questTitle} — ${parts.join(' ')} !`);
    setTimeout(() => setClaimedId(null), 600);
  };

  return (
    <div className="min-h-screen pb-28" style={{ background: 'linear-gradient(160deg, hsl(270 40% 8%) 0%, hsl(220 35% 6%) 50%, hsl(180 30% 5%) 100%)' }}>
      {/* Header */}
      <div className="px-5 pt-14 pb-5">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl"
            style={{ background: 'linear-gradient(135deg, hsl(280 70% 50%), hsl(220 70% 55%))' }}>
            🎯
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-foreground">Quêtes</h1>
            <p className="text-xs text-muted-foreground font-medium">Niveau {level} · {gold} 🪙</p>
          </div>
        </div>
      </div>

      {/* Progress toward 50 quests */}
      <div className="px-5 mb-5">
        <div className="rounded-2xl p-4" style={{ background: 'linear-gradient(135deg, hsl(270 40% 14%), hsl(220 40% 12%))' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-foreground/70">Progression totale</span>
            <span className="text-sm font-extrabold" style={{ color: 'hsl(280 70% 65%)' }}>
              {completedCount}/{TOTAL_QUESTS}
            </span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'hsl(270 20% 20%)' }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, hsl(280 70% 55%), hsl(200 70% 60%))' }}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((completedCount / TOTAL_QUESTS) * 100, 100)}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5">3 quêtes disponibles à la fois — la suivante apparaît quand tu réclames ta récompense</p>
        </div>
      </div>

      {/* Stats */}
      <div className="px-5 mb-5 flex gap-2.5">
        <div className="rounded-2xl px-4 py-3 flex-1 text-center" style={{ background: 'linear-gradient(135deg, hsl(38 60% 18%), hsl(30 50% 12%))' }}>
          <p className="text-xl font-extrabold text-gold">{activeQuests.length}</p>
          <p className="text-[9px] text-foreground/60 font-semibold uppercase">Actives</p>
        </div>
        <div className="rounded-2xl px-4 py-3 flex-1 text-center" style={{ background: 'linear-gradient(135deg, hsl(174 50% 14%), hsl(180 40% 10%))' }}>
          <p className="text-xl font-extrabold text-accent">{completedCount}</p>
          <p className="text-[9px] text-foreground/60 font-semibold uppercase">Complétées</p>
        </div>
        <div className="rounded-2xl px-4 py-3 flex-1 text-center" style={{ background: 'linear-gradient(135deg, hsl(220 50% 16%), hsl(230 40% 11%))' }}>
          <p className="text-xl font-extrabold text-blue-400">{TOTAL_QUESTS - completedCount}</p>
          <p className="text-[9px] text-foreground/60 font-semibold uppercase">Restantes</p>
        </div>
      </div>

      {/* Active Quests */}
      <div className="px-5 mb-6">
        <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
          ⚡ Quêtes actives
          <span className="text-[10px] text-muted-foreground font-normal">(3 max en parallèle)</span>
        </h2>

        {activeQuests.length === 0 ? (
          <div className="rounded-2xl px-6 py-8 text-center" style={{ background: 'hsl(240 8% 10%)' }}>
            <div className="text-4xl mb-3">🎉</div>
            <p className="text-sm font-bold text-foreground">Toutes réclamsées !</p>
            <p className="text-xs text-muted-foreground mt-1">Les nouvelles quêtes arrivent…</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeQuests.map((quest, index) => {
              const progress = Math.min((quest.progress / quest.requirement) * 100, 100);
              const isReady = progress >= 100;
              const isClaiming = claimedId === quest.id;

              return (
                <motion.div
                  key={quest.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.08 }}
                  className="rounded-2xl p-4 border"
                  style={{
                    background: isReady
                      ? 'linear-gradient(135deg, hsl(140 40% 12%), hsl(160 35% 9%))'
                      : 'hsl(240 8% 10%)',
                    borderColor: isReady ? 'hsl(140 50% 35% / 0.6)' : 'hsl(240 6% 20% / 0.4)',
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-start gap-3 flex-1">
                      {quest.emoji && (
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl shrink-0"
                          style={{ background: isReady ? 'hsl(140 40% 18%)' : 'hsl(240 8% 16%)' }}>
                          {quest.emoji}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          {isReady && <span className="text-green-400 text-[10px] font-bold">✓ PRÊTE</span>}
                          <h3 className="text-sm font-bold text-foreground truncate">{quest.title}</h3>
                        </div>
                        <p className="text-xs text-muted-foreground">{quest.description}</p>
                      </div>
                    </div>
                    <div className="text-right ml-3 shrink-0">
                      {quest.reward.gold && (
                        <span className="text-xs font-bold text-gold">+{quest.reward.gold} 🪙</span>
                      )}
                      {quest.reward.xp && (
                        <div className="text-[10px] text-accent font-semibold">+{quest.reward.xp} XP</div>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-muted-foreground">{quest.progress}/{quest.requirement}</span>
                      <span className="text-[10px] text-foreground font-bold">{Math.round(progress)}%</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: 'hsl(240 8% 18%)' }}>
                      <motion.div
                        className="h-full rounded-full"
                        style={{
                          background: isReady
                            ? 'linear-gradient(90deg, hsl(140 60% 45%), hsl(160 70% 50%))'
                            : 'linear-gradient(90deg, hsl(280 60% 55%), hsl(200 60% 55%))',
                        }}
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                      />
                    </div>
                  </div>

                  {/* Claim button */}
                  <AnimatePresence>
                    {isReady && (
                      <motion.button
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: isClaiming ? [1, 1.1, 1] : 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        onClick={() => handleClaim(quest.id, quest.title, quest.reward)}
                        className="w-full py-2.5 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2"
                        style={{ background: 'linear-gradient(90deg, hsl(140 55% 38%), hsl(160 60% 42%))' }}
                        whileTap={{ scale: 0.96 }}
                      >
                        <span>🎁</span>
                        Réclamer la récompense
                        {quest.reward.gold && <span className="text-yellow-200">+{quest.reward.gold} 🪙</span>}
                      </motion.button>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quest History */}
      {completedQuestHistory && completedQuestHistory.length > 0 && (
        <div className="px-5 mb-6">
          <h2 className="text-sm font-bold text-foreground mb-3">✅ Historique récent</h2>
          <div className="space-y-2">
            {completedQuestHistory.slice(0, 8).map((q, i) => (
              <motion.div
                key={`${q.id}-${i}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.04 }}
                className="rounded-xl px-4 py-2.5 flex items-center justify-between opacity-60"
                style={{ background: 'hsl(240 8% 10%)' }}
              >
                <div>
                  <p className="text-xs font-bold text-foreground">{q.title}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(q.completedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
                <div className="text-right">
                  {q.gold && <div className="text-[10px] font-bold text-gold">+{q.gold} 🪙</div>}
                  {q.xp && <div className="text-[10px] text-accent">+{q.xp} XP</div>}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Trophy footer */}
      <div className="px-5 mb-6">
        <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
          🏆 Trophées
          <span className="text-[10px] text-muted-foreground font-normal">{(unlockedAchievements || []).length}/{ALL_ACHIEVEMENTS.length} débloqués</span>
        </h2>
        <div className="grid grid-cols-2 gap-2.5">
          {ALL_ACHIEVEMENTS.map((a, i) => {
            const unlocked = (unlockedAchievements || []).includes(a.id);
            return (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-2xl p-3.5 border flex items-start gap-3"
                style={{
                  background: unlocked
                    ? 'linear-gradient(135deg, hsl(38 50% 16%), hsl(32 45% 11%))'
                    : 'hsl(240 8% 10%)',
                  borderColor: unlocked ? 'hsl(42 70% 45% / 0.55)' : 'hsl(240 6% 18% / 0.3)',
                }}
              >
                <div
                  className="text-2xl shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{
                    background: unlocked ? 'hsl(38 60% 22%)' : 'hsl(240 8% 16%)',
                    filter: unlocked ? 'none' : 'grayscale(1) opacity(0.35)',
                  }}
                >{a.icon}</div>
                <div>
                  <p className="text-xs font-bold leading-none mb-1"
                    style={{ color: unlocked ? 'hsl(42 90% 72%)' : 'hsl(215 15% 45%)' }}>
                    {a.title}
                  </p>
                  <p className="text-[10px] leading-tight"
                    style={{ color: unlocked ? 'hsl(215 15% 55%)' : 'hsl(215 15% 35%)' }}>
                    {a.desc}
                  </p>
                  {unlocked && (
                    <p className="text-[9px] font-bold mt-1" style={{ color: 'hsl(140 60% 50%)' }}>✓ Débloqué</p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Trophy footer */}
      <div className="px-5">
        <div className="rounded-2xl p-4 border border-primary/20"
          style={{ background: 'linear-gradient(135deg, hsl(38 40% 12%), hsl(30 35% 9%))' }}>
          <div className="flex items-center gap-3">
            <div className="text-3xl">🏆</div>
            <div className="flex-1">
              <p className="text-sm font-bold text-foreground">Pool de 50 quêtes</p>
              <p className="text-xs text-muted-foreground">Complète toutes les quêtes pour débloquer le titre <span className="text-gold font-semibold">Maître Aquanaute</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
