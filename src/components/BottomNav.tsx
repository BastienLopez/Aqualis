import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const tabs = [
  { path: "/aquarium", label: "Aquarium", color: "hsl(174 60% 45%)", icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12c0-4 4.5-8 10-8s10 4 10 8-4.5 8-10 8S2 16 2 12Z"/><circle cx="8.5" cy="11.5" r="1"/><path d="M16 10s1.5 2 1.5 3"/></svg>
  )},
  { path: "/session", label: "Session", color: "hsl(220 65% 60%)", icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
  )},
  { path: "/quests", label: "Quêtes", color: "hsl(270 65% 65%)", icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
  )},
  { path: "/shop", label: "Boutique", color: "hsl(32 70% 58%)", icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" x2="21" y1="6" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
  )},
  { path: "/encyclopedia", label: "Savoirs", color: "hsl(200 65% 55%)", icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/><path d="M8 7h6"/><path d="M8 11h8"/></svg>
  )},
  { path: "/collection", label: "Collection", color: "hsl(160 55% 48%)", icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>
  )},
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const isAquarium = location.pathname === "/aquarium";

  return (
    <div
      className="fixed bottom-[5px] left-0 right-0 z-50 pb-safe"
      style={isAquarium ? {} : {
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        background: 'rgba(8,18,28,0.60)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '28px',
        marginLeft: '20px',
        marginRight: '20px',
      }}
    >
      <div className="mx-auto max-w-lg px-2 pb-2">
        <div className="rounded-[28px] flex items-center justify-evenly py-2 px-1" style={{ background: 'transparent' }}>
          {tabs.map((tab) => {
            const isActive = location.pathname === tab.path;
            return (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                className="relative flex flex-col items-center gap-1 flex-1 py-2 min-w-0"
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute -top-1 w-6 h-[3px] rounded-full"
                    style={{ background: tab.color }}
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}
                <span
                  className="transition-colors duration-300"
                  style={{ color: isActive ? tab.color : 'hsl(var(--foreground) / 0.35)' }}
                >
                  {tab.icon}
                </span>
                <span
                  className="text-[10px] font-medium tracking-tight truncate max-w-full px-1 transition-colors duration-300"
                  style={{ color: isActive ? tab.color : 'hsl(var(--foreground) / 0.35)' }}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
