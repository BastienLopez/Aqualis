import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

interface WaterSoundsProps {
  volume?: number;
}

export default function WaterSounds({ volume = 0.3 }: WaterSoundsProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const oscillatorsRef = useRef<OscillatorNode[]>([]);

  useEffect(() => {
    // Create audio context for ambient water sounds
    if (typeof window !== 'undefined') {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      gainNodeRef.current = audioContextRef.current.createGain();
      gainNodeRef.current.gain.value = volume;
      gainNodeRef.current.connect(audioContextRef.current.destination);
    }

    return () => {
      oscillatorsRef.current.forEach(osc => osc.stop());
      audioContextRef.current?.close();
    };
  }, []);

  const startSounds = () => {
    if (!audioContextRef.current || !gainNodeRef.current) return;

    // Create gentle bubbling sound effect
    const bubbleOsc = audioContextRef.current.createOscillator();
    bubbleOsc.type = 'sine';
    bubbleOsc.frequency.value = 200 + Math.random() * 100;
    
    const bubbleGain = audioContextRef.current.createGain();
    bubbleGain.gain.value = 0.05;
    
    bubbleOsc.connect(bubbleGain);
    bubbleGain.connect(gainNodeRef.current);
    bubbleOsc.start();
    
    // Modulate frequency for bubbling effect
    setInterval(() => {
      if (bubbleOsc && audioContextRef.current) {
        bubbleOsc.frequency.setValueAtTime(
          200 + Math.random() * 150,
          audioContextRef.current.currentTime
        );
      }
    }, 500);

    oscillatorsRef.current.push(bubbleOsc);
    setIsPlaying(true);
  };

  const stopSounds = () => {
    oscillatorsRef.current.forEach(osc => osc.stop());
    oscillatorsRef.current = [];
    setIsPlaying(false);
  };

  return null;
}
