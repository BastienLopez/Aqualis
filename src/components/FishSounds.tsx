import { useEffect, useRef } from "react";

interface FishSoundsProps {
  fishCount: number;
  volume?: number;
}

export default function FishSounds({ fishCount, volume = 0.15 }: FishSoundsProps) {
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    const ctx = audioContextRef.current;
    let activeNodes: (OscillatorNode | GainNode)[] = [];
    let isMounted = true;

    const playBubbleSound = () => {
      if (!ctx || !isMounted) return;

      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      // High-pitched bubble pop sound
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(800 + Math.random() * 400, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.1);

      gainNode.gain.setValueAtTime(volume, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.15);

      // Track nodes for cleanup
      activeNodes.push(oscillator, gainNode);

      // Auto cleanup after sound finishes
      setTimeout(() => {
        try {
          oscillator.disconnect();
          gainNode.disconnect();
        } catch (e) {
          // Already disconnected
        }
      }, 200);
    };

    const playSwimSound = () => {
      if (!ctx || !isMounted) return;

      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      // Gentle swoosh sound
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(150 + Math.random() * 100, ctx.currentTime);
      oscillator.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.2);

      gainNode.gain.setValueAtTime(volume * 0.5, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.2);

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.2);

      // Track nodes for cleanup
      activeNodes.push(oscillator, gainNode);

      // Auto cleanup after sound finishes
      setTimeout(() => {
        try {
          oscillator.disconnect();
          gainNode.disconnect();
        } catch (e) {
          // Already disconnected
        }
      }, 250);
    };

    // Play random fish sounds based on fish count
    const soundInterval = setInterval(() => {
      if (!isMounted) return;
      
      const randomEvent = Math.random();
      
      // More fish = more frequent sounds
      if (randomEvent < fishCount * 0.02) {
        playBubbleSound();
      } else if (randomEvent < fishCount * 0.03) {
        playSwimSound();
      }
    }, 2000);

    return () => {
      isMounted = false;
      clearInterval(soundInterval);
      
      // Cleanup all active audio nodes
      activeNodes.forEach(node => {
        try {
          node.disconnect();
        } catch (e) {
          // Already disconnected
        }
      });
    };
  }, [fishCount, volume]);

  return null; // No visual component
}
