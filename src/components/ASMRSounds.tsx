import { useEffect, useRef } from "react";

interface ASMRSoundsProps {
  enabled: boolean;
  volume?: number;
  isRaining?: boolean;
  isNight?: boolean;
}

export default function ASMRSounds({ enabled, volume = 0.4, isRaining = false, isNight = false }: ASMRSoundsProps) {
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!enabled) return;

    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    const ctx = audioContextRef.current;
    let activeNodes: (OscillatorNode | GainNode)[] = [];
    let isMounted = true;
    let intervals: number[] = [];

    // Bubble pop sound (softer for ASMR)
    const playBubblePop = () => {
      if (!ctx || !isMounted) return;

      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(600 + Math.random() * 200, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.15);

      gainNode.gain.setValueAtTime(volume * 0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.2);

      activeNodes.push(oscillator, gainNode);

      setTimeout(() => {
        try {
          oscillator.disconnect();
          gainNode.disconnect();
        } catch (e) {
          // Already disconnected
        }
      }, 250);
    };

    // Water trickling sound (filter)
    const playTrickling = () => {
      if (!ctx || !isMounted) return;

      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(200 + Math.random() * 150, ctx.currentTime);
      oscillator.frequency.linearRampToValueAtTime(180 + Math.random() * 100, ctx.currentTime + 0.4);

      gainNode.gain.setValueAtTime(volume * 0.15, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(volume * 0.1, ctx.currentTime + 0.2);
      gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.4);

      activeNodes.push(oscillator, gainNode);

      setTimeout(() => {
        try {
          oscillator.disconnect();
          gainNode.disconnect();
        } catch (e) {
          // Already disconnected
        }
      }, 450);
    };

    // Shrimp click sound (rare, subtle)
    const playShrimpClick = () => {
      if (!ctx || !isMounted) return;

      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.type = "square";
      oscillator.frequency.setValueAtTime(1200, ctx.currentTime);

      gainNode.gain.setValueAtTime(volume * 0.08, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.05);

      activeNodes.push(oscillator, gainNode);

      setTimeout(() => {
        try {
          oscillator.disconnect();
          gainNode.disconnect();
        } catch (e) {
          // Already disconnected
        }
      }, 100);
    };

    // Bubble pops: regular, soothing rhythm
    const bubbleInterval = window.setInterval(() => {
      if (isMounted && Math.random() < 0.5) {
        playBubblePop();
      }
    }, 2500);
    intervals.push(bubbleInterval);

    // Water trickling: constant filter sound
    const trickleInterval = window.setInterval(() => {
      if (isMounted) {
        playTrickling();
      }
    }, 3000);
    intervals.push(trickleInterval);

    // Shrimp clicks: rare, adds texture
    const shrimpInterval = window.setInterval(() => {
      if (isMounted && Math.random() < 0.2) {
        playShrimpClick();
      }
    }, 8000);
    intervals.push(shrimpInterval);

    return () => {
      isMounted = false;

      // Clear all intervals
      intervals.forEach(id => clearInterval(id));

      // Cleanup audio nodes
      activeNodes.forEach(node => {
        try {
          node.disconnect();
        } catch (e) {
          // Already disconnected
        }
      });
    };
  }, [enabled, volume]);

  // Rain sound effect
  useEffect(() => {
    if (!isRaining) return;
    let ctx: AudioContext;
    let intervals: number[] = [];
    let isMounted = true;
    try {
      ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch { return; }
    const playRainDrop = () => {
      if (!isMounted) return;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800 + Math.random() * 800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300 + Math.random() * 200, ctx.currentTime + 0.06);
      g.gain.setValueAtTime(volume * 0.08, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.connect(g); g.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + 0.09);
      setTimeout(() => { try { osc.disconnect(); g.disconnect(); } catch {} }, 120);
    };
    intervals.push(window.setInterval(() => { if (isMounted) playRainDrop(); }, 80 + Math.random() * 40));
    return () => {
      isMounted = false;
      intervals.forEach(id => clearInterval(id));
      try { ctx.close(); } catch {}
    };
  }, [isRaining, volume]);

  // Night meditation drone
  useEffect(() => {
    if (!isNight) return;
    let ctx: AudioContext;
    let osc: OscillatorNode | null = null;
    let g: GainNode | null = null;
    try {
      ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch { return; }
    osc = ctx.createOscillator();
    g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 65; // Deep meditation frequency
    g.gain.setValueAtTime(0, ctx.currentTime);
    g.gain.linearRampToValueAtTime(volume * 0.06, ctx.currentTime + 3);
    osc.connect(g); g.connect(ctx.destination);
    osc.start();
    return () => {
      try { osc?.stop(); osc?.disconnect(); g?.disconnect(); ctx.close(); } catch {}
    };
  }, [isNight, volume]);

  // 🌊 Deep underwater resonance — 3-harmonic hum (55Hz + 147Hz + 220Hz)
  // Gives the "you are inside a large body of water" feeling
  useEffect(() => {
    if (!enabled) return;
    let ctx: AudioContext;
    try {
      ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch { return; }
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0, ctx.currentTime);
    masterGain.gain.linearRampToValueAtTime(volume * 0.07, ctx.currentTime + 5);
    masterGain.connect(ctx.destination);
    // Fundamental 55 Hz — deep sub-bass presence
    const osc1 = ctx.createOscillator();
    const g1 = ctx.createGain();
    osc1.type = 'sine'; osc1.frequency.value = 55; g1.gain.value = 1.0;
    osc1.connect(g1); g1.connect(masterGain); osc1.start();
    // 2nd harmonic 147 Hz — mid-low warmth
    const osc2 = ctx.createOscillator();
    const g2 = ctx.createGain();
    osc2.type = 'sine'; osc2.frequency.value = 147; g2.gain.value = 0.40;
    osc2.connect(g2); g2.connect(masterGain); osc2.start();
    // 3rd harmonic 220 Hz — subtle upper presence
    const osc3 = ctx.createOscillator();
    const g3 = ctx.createGain();
    osc3.type = 'triangle'; osc3.frequency.value = 220; g3.gain.value = 0.20;
    osc3.connect(g3); g3.connect(masterGain); osc3.start();
    return () => {
      try {
        osc1.stop(); osc2.stop(); osc3.stop();
        osc1.disconnect(); osc2.disconnect(); osc3.disconnect();
        g1.disconnect(); g2.disconnect(); g3.disconnect();
        masterGain.disconnect(); ctx.close();
      } catch {}
    };
  }, [enabled, volume]);

  // 🫧 Water filter hum — gentle high-pitched whirr of the aquarium filter
  useEffect(() => {
    if (!enabled) return;
    let ctx: AudioContext;
    let isMounted = true;
    let intervals: number[] = [];
    try {
      ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch { return; }
    // Intermittent soft "filter whirr" — sawtooth 380Hz, very brief
    const playFilterWhirr = () => {
      if (!isMounted) return;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(380, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(310, ctx.currentTime + 0.6);
      g.gain.setValueAtTime(0, ctx.currentTime);
      g.gain.linearRampToValueAtTime(volume * 0.04, ctx.currentTime + 0.15);
      g.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6);
      osc.connect(g); g.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + 0.65);
      setTimeout(() => { try { osc.disconnect(); g.disconnect(); } catch {} }, 700);
    };
    intervals.push(window.setInterval(() => { if (isMounted) playFilterWhirr(); }, 9000 + Math.round(Math.random() * 4000)));
    return () => {
      isMounted = false;
      intervals.forEach(id => clearInterval(id));
      try { ctx.close(); } catch {}
    };
  }, [enabled, volume]);

  return null; // No visual component
}
