import { useEffect, useState } from "react";
import { Maximize, Minimize, Pause, Play, Trophy, Volume2, VolumeX } from "lucide-react";
import { useLanguage } from "./i18n";
import { setSoundMuted, soundIsMuted } from "./sound";

function savedMotionPreference() {
  try { return localStorage.getItem("arena-motion-paused") === "true"; } catch { return false; }
}

export default function StandTools({ onScores, motionPaused, onMotionChange }: {
  onScores: () => void;
  motionPaused: boolean;
  onMotionChange: (paused: boolean) => void;
}) {
  const { copy } = useLanguage();
  const [muted, setMuted] = useState(soundIsMuted);
  const [fullscreen, setFullscreen] = useState(Boolean(document.fullscreenElement));
  const [error, setError] = useState("");
  useEffect(() => {
    const sync = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);
  const toggleFullscreen = async () => {
    setError("");
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch { setError(copy("Tam ekran açılamadı. Tarayıcının tam ekran kontrolünü kullanabilirsin.", "Fullscreen could not open. You can use your browser's fullscreen control.")); }
  };
  return <div className="stand-tools" role="group" aria-label={copy("Stant kontrolleri", "Station controls")}>
    <button className="tools-scores" onClick={onScores} title={copy("Skorlar", "Scores")} aria-label={copy("Skorlar", "Scores")}><Trophy size={18} /><span>{copy("Skorlar", "Scores")}</span></button>
    <button onClick={() => { setSoundMuted(!muted); setMuted(!muted); }} aria-label={muted ? copy("Sesi aç", "Enable sound") : copy("Sesi kapat", "Mute sound")} aria-pressed={!muted} title={muted ? copy("Sesi aç", "Enable sound") : copy("Sesi kapat", "Mute sound")}>{muted ? <VolumeX size={19} /> : <Volume2 size={19} />}</button>
    <button onClick={() => onMotionChange(!motionPaused)} aria-pressed={motionPaused} aria-label={motionPaused ? copy("Menü animasyonlarını sürdür", "Resume menu animations") : copy("Menü animasyonlarını duraklat", "Pause menu animations")} title={motionPaused ? copy("Menü animasyonlarını sürdür", "Resume menu animations") : copy("Menü animasyonlarını duraklat", "Pause menu animations")}>{motionPaused ? <Play size={17} /> : <Pause size={17} />}</button>
    {document.fullscreenEnabled && <button onClick={() => void toggleFullscreen()} aria-pressed={fullscreen} aria-label={fullscreen ? copy("Tam ekrandan çık", "Exit fullscreen") : copy("Tam ekran", "Fullscreen")} title={fullscreen ? copy("Tam ekrandan çık", "Exit fullscreen") : copy("Tam ekran", "Fullscreen")}>{fullscreen ? <Minimize size={18} /> : <Maximize size={18} />}</button>}
    {error && <p className="tools-error" role="status">{error}</p>}
  </div>;
}

export { savedMotionPreference };
