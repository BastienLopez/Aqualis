import { useEffect, useRef, useState } from "react";

interface AmbientMusicProps {
  theme: string;
  volume?: number;
  season?: string;
}

// Music tracks per theme (using web audio API with procedural generation)
const generateThemeMusic = (theme: string, season?: string) => {
  const frequencies: Record<string, number[]> = {
    tropical: [261.63, 329.63, 392.00, 523.25], // C Major pentatonic
    ocean: [220.00, 246.94, 293.66, 329.63], // A Minor
    reef: [293.66, 369.99, 440.00, 554.37], // D Major
  };
  const base = frequencies[theme] || frequencies.ocean;
  // Adjust pitch per season: spring=1.05x bright, summer=1.1x warm, autumn=0.92x mellow, winter=0.82x cold
  const seasonMult: Record<string, number> = { spring: 1.05, summer: 1.1, autumn: 0.92, winter: 0.82 };
  const mult = seasonMult[season || ""] ?? 1.0;
  return base.map((f) => f * mult);
};

export default function AmbientMusic({ theme, volume = 0.2, season }: AmbientMusicProps) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    // Initialize Web Audio API
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    const ctx = audioContextRef.current;
    const frequencies = generateThemeMusic(theme, season);
    let oscillators: OscillatorNode[] = [];
    let gainNodes: GainNode[] = [];
    let timeoutId: number | undefined;
    let isMounted = true;

    const playAmbientTone = () => {
      if (!ctx || !isMounted) return;

      // Cleanup previous oscillators
      oscillators.forEach(osc => {
        try {
          osc.stop();
          osc.disconnect();
        } catch (e) {
          // Already stopped
        }
      });
      gainNodes.forEach(gain => {
        try {
          gain.disconnect();
        } catch (e) {
          // Already disconnected
        }
      });
      oscillators = [];
      gainNodes = [];

      // Create multiple oscillators for ambient soundscape
      frequencies.forEach((freq, i) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.type = i % 2 === 0 ? "sine" : "triangle";
        oscillator.frequency.value = freq * 0.5; // Lower octave for ambiance

        gainNode.gain.setValueAtTime(0, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(volume * 0.3, ctx.currentTime + 2 + i * 0.5);
        gainNode.gain.linearRampToValueAtTime(volume * 0.15, ctx.currentTime + 8 + i);
        gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 12 + i);

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.start(ctx.currentTime + i * 1.5);
        oscillator.stop(ctx.currentTime + 15 + i);

        oscillators.push(oscillator);
        gainNodes.push(gainNode);
      });

      setIsPlaying(true);

      // Schedule next ambient cycle
      timeoutId = window.setTimeout(() => {
        if (isMounted && audioContextRef.current?.state === "running") {
          playAmbientTone();
        }
      }, 18000); // Every 18 seconds
    };

    playAmbientTone();

    return () => {
      isMounted = false;
      
      // Clear timeout
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }
      
      // Cleanup oscillators
      oscillators.forEach(osc => {
        try {
          osc.stop();
          osc.disconnect();
        } catch (e) {
          // Oscillator may already be stopped
        }
      });
      
      // Cleanup gain nodes
      gainNodes.forEach(gain => {
        try {
          gain.disconnect();
        } catch (e) {
          // Already disconnected
        }
      });
    };
  }, [theme, volume, season]);

  return null; // No visual component
}
