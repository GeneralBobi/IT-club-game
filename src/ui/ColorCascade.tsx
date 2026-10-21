import { useEffect, useRef, useState } from "react";
import { Maximize } from "lucide-react";
import { GameFrame, GameSetup, useStandRun, type Phase } from "./StandGames";
import { ScoreStatus } from "./arena-data";
import { useLanguage } from "./i18n";

// Runs the upstream HTML/CSS/JS unchanged. This wrapper only observes final scores.
export default function ColorCascade() {
  const { copy } = useLanguage();
  const [phase, setPhase] = useState<Phase>("intro");
  const [score, setScore] = useState(0);
  const frame = useRef<HTMLIFrameElement>(null);
  const observer = useRef<MutationObserver | null>(null);
  const tracking = useStandRun("color-cascade", phase, score);
  useEffect(() => () => observer.current?.disconnect(), []);
  const connect = () => {
    observer.current?.disconnect();
    const doc = frame.current?.contentDocument;
    if (!doc) return;
    const final = doc.getElementById("game-over-screen");
    const scoreDisplay = doc.getElementById("score");
    if (!final || !scoreDisplay) return;
    const sync = () => {
      setScore(Number(scoreDisplay.textContent) || 0);
      setPhase(final.classList.contains("hidden") ? "running" : "complete");
    };
    observer.current = new MutationObserver(sync);
    observer.current.observe(final, { attributes: true, attributeFilter: ["class"] });
    observer.current.observe(scoreDisplay, { childList: true, characterData: true, subtree: true });
    sync();
    frame.current?.focus();
  };
  return <GameFrame game="color-cascade">
    {phase === "intro" ? <GameSetup game="color-cascade" tracking={tracking} control="mouse"
      description={copy("Üstteki renk sırasını izle ve eşleşen düşen bloklara tıkla. Üç canın var. Orijinal Color Cascade oyununu oyna.", "Follow the sequence above and click matching falling blocks. You have three lives. Play the original Color Cascade.")}
      onStart={() => { setScore(0); setPhase("running"); }} /> : <section className="original-cascade">
      <div className="original-cascade-tools">
        <p>{copy("Renk sırasını izle. Eşleşen bloğa tıkla.", "Follow the color sequence. Click a matching block.")}</p>
        <button className="quiet-button" onClick={() => { void frame.current?.requestFullscreen().catch(() => {}); }}><Maximize size={17}/>{copy("Tam ekran", "Fullscreen")}</button>
      </div>
      <iframe ref={frame} title="Color Cascade" src="/games/color-cascade/index.html" onLoad={connect} allowFullScreen className="original-cascade-frame" />
      <ScoreStatus {...tracking} />
    </section>}
  </GameFrame>;
}
