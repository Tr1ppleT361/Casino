"use client";

import { useEffect } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { configureSound, startMusic, stopMusic } from "@/lib/sound";
import { useSettings } from "@/store/settings";

/**
 * Applies persisted preferences to the document and the audio engine.
 * Dark mode is the default; the light class is only added when the player
 * explicitly turns dark mode off.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const sound = useSettings((state) => state.sound);
  const music = useSettings((state) => state.music);
  const animations = useSettings((state) => state.animations);
  const darkMode = useSettings((state) => state.darkMode);

  useEffect(() => {
    configureSound({ enabled: sound });
  }, [sound]);

  useEffect(() => {
    if (music && sound) startMusic();
    else stopMusic();
    return () => stopMusic();
  }, [music, sound]);

  useEffect(() => {
    document.documentElement.dataset.animations = animations ? "on" : "off";
  }, [animations]);

  useEffect(() => {
    document.documentElement.classList.toggle("light", !darkMode);
  }, [darkMode]);

  return <TooltipProvider delayDuration={200}>{children}</TooltipProvider>;
}
