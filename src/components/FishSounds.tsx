import { useEffect, useRef } from "react";

interface FishSoundsProps {
  fishCount: number;
  volume?: number;
  /** X positions (0–100%) of each fish for stereo panning */
  fishXPositions?: number[];
}

export default function FishSounds({ fishCount, volume = 0.15, fishXPositions = [] }: FishSoundsProps) {
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    const ctx = audioContextRef.current;
    const activeNodes: AudioNode[] = [];
    let isMounted = true;

    /** Pick a random fish's X position and convert to stereo pan -1..1 */
    const getPan = (): number => {
      if (!fishXPositions.length) return 0;
      const x = fishXPositions[Math.floor(Math.random() * fishXPositions.length)];
      return Math.max(-1, Math.min(1, (x / 100) * 2 - 1));
    };

    /** Wire source → gain → optional StereoPanner → destination */
    const connectSpatial = (source: AudioScheduledSourceNode, gain: GainNode) => {
      const pan = getPan();
      source.connect(gain);
      if (pan !== 0 && typeof ctx.createStereoPanner === "function") {
        const panner = ctx.createStereoPanner();
        panner.pan.value = pan;
        gain.connect(panner);
        panner.connect(ctx.destination);
        activeNodes.push(panner);
      } else {
        gain.connect(ctx.destination);
      }
      activeNodes.push(source, gain);
    };

    const playBubbleSound = () => {
      if (!ctx || !isMounted) return;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(800 + Math.random() * 400, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.1);
      gainNode.gain.setValueAtTime(volume, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      connectSpatial(oscillator, gainNode);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.15);
      setTimeout(() => { try { oscillator.disconnect(); gainNode.disconnect(); } catch (_e) { /* ignore */ } }, 200);
    };

    const playSwimSound = () => {
      if (!ctx || !isMounted) return;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(150 + Math.random() * 100, ctx.currentTime);
      oscillator.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.2);
      gainNode.gain.setValueAtTime(volume * 0.5, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.2);
      connectSpatial(oscillator, gainNode);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.2);
      setTimeout(() => { try { oscillator.disconnect(); gainNode.disconnect(); } catch (_e) { /* ignore */ } }, 250);
    };

    const soundInterval = setInterval(() => {
      if (!isMounted) return;
      const randomEvent = Math.random();
      if (randomEvent < fishCount * 0.02) playBubbleSound();
      else if (randomEvent < fishCount * 0.03) playSwimSound();
    }, 2000);

    return () => {
      isMounted = false;
      clearInterval(soundInterval);
      activeNodes.forEach(node => { try { node.disconnect(); } catch (_e) { /* ignore */ } });
    };
  }, [fishCount, volume, fishXPositions]);

  return null;
}
