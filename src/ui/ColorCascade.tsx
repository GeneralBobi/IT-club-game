import { useEffect, useRef, useState } from "react";
import { Heart, Pause, Play } from "lucide-react";
import {
  createCascade,
  selectCascadeTile,
  stepCascade,
  CASCADE_COLORS,
  CASCADE_HEIGHT,
  CASCADE_TILE_HEIGHT,
  type CascadeState,
} from "../games/color-cascade/engine";
import {
  GameFrame,
  GameSetup,
  GameFinal,
  useStandRun,
  type Phase,
} from "./StandGames";
import { useLanguage } from "./i18n";
import { playSound } from "./sound";

export default function ColorCascade() {
  const { copy } = useLanguage();
  const [phase, setPhase] = useState<Phase>("intro"),
    [view, setView] = useState<CascadeState>(() => createCascade());
  const state = useRef(view),
    board = useRef<HTMLDivElement>(null);
  const tracking = useStandRun("color-cascade", phase, view.score);
  const labels = [
    copy("Kırmızı", "Red"),
    copy("Mavi", "Blue"),
    copy("Yeşil", "Green"),
    copy("Sarı", "Yellow"),
  ];
  const apply = (next: CascadeState) => {
    state.current = next;
    setView(next);
    if (next.lives <= 0) setPhase("complete");
  };
  const choose = (id: number) => {
    if (phase !== "running") return;
    const next = selectCascadeTile(state.current, id);
    if (next !== state.current) {
      apply(next);
      playSound("tap");
    }
  };
  const chooseRef = useRef(choose);
  chooseRef.current = choose;
  useEffect(() => {
    if (phase !== "running") return;
    let frame = 0,
      previous = performance.now();
    const tick = (now: number) => {
      const next = stepCascade(state.current, now - previous);
      previous = now;
      apply(next);
      if (next.lives > 0) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [phase]);
  useEffect(() => {
    if (phase !== "running") return;
    const pause = () => setPhase("paused");
    const visibility = () => {
      if (document.hidden) pause();
    };
    window.addEventListener("blur", pause);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      window.removeEventListener("blur", pause);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [phase]);
  useEffect(() => {
    if (phase !== "running" && phase !== "paused") return;
    const key = (event: KeyboardEvent) => {
      if (
        event.repeat ||
        (event.target instanceof HTMLElement &&
          event.target.closest("input,textarea,select,button,a"))
      )
        return;
      if (event.code === "Space") {
        event.preventDefault();
        setPhase((value) => (value === "running" ? "paused" : "running"));
        return;
      }
      const lane = Number(event.key) - 1;
      if (
        phase !== "running" ||
        !Number.isInteger(lane) ||
        lane < 0 ||
        lane >= state.current.lanes
      )
        return;
      event.preventDefault();
      const tile = state.current.tiles
        .filter(
          (tile) =>
            tile.lane === lane && tile.y >= 0 && tile.y < CASCADE_HEIGHT,
        )
        .sort((a, b) => b.y - a.y)[0];
      if (tile) chooseRef.current(tile.id);
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [phase]);
  return (
    <GameFrame game="color-cascade">
      {phase === "intro" ? (
        <GameSetup
          game="color-cascade"
          tracking={tracking}
          control="mouse"
          onStart={() => {
            apply(createCascade());
            setPhase("running");
            requestAnimationFrame(() => board.current?.focus());
          }}
          description={copy(
            "Üstteki renk sırasını takip et. Sıradaki renkle eşleşen düşen bloğa tıkla. Yanlış renk veya kaçan gerekli blok bir can götürür. Üç canın var; seri yaptıkça hız ve sütun sayısı artar.",
            "Follow the color sequence above. Click a falling block matching the next color. A wrong color or missed required block costs a life. You have three lives; streaks increase speed and add lanes.",
          )}
        />
      ) : phase === "complete" ? (
        <GameFinal
          score={view.score}
          tracking={tracking}
          onAgain={() => setPhase("intro")}
        >
          <div className="result-stats">
            <div>
              <strong>{view.completed}</strong>
              <span>{copy("tamamlanan sıra", "completed sequences")}</span>
            </div>
          </div>
        </GameFinal>
      ) : (
        <section className="cascade-stage">
          <div className="cascade-meta">
            <strong>
              {view.score} {copy("puan", "points")}
            </strong>
            <span>
              {copy("Seri", "Combo")} ×{view.combo}
            </span>
            <span
              className="cascade-lives"
              aria-label={`${view.lives} ${copy("can", "lives")}`}
            >
              {[0, 1, 2].map((index) => (
                <Heart
                  key={index}
                  size={20}
                  fill={index < view.lives ? "currentColor" : "none"}
                  opacity={index < view.lives ? 1 : 0.3}
                />
              ))}
            </span>
            <button
              className="quiet-button"
              onClick={() =>
                setPhase((value) => (value === "paused" ? "running" : "paused"))
              }
            >
              {phase === "paused" ? <Play size={17} /> : <Pause size={17} />}{" "}
              {phase === "paused"
                ? copy("Devam et", "Resume")
                : copy("Duraklat", "Pause")}
            </button>
          </div>
          <div
            className="cascade-sequence"
            aria-label={copy("Renk sırası", "Color sequence")}
          >
            <span>{copy("Sıradaki", "Next")}:</span>
            {view.sequence.map((color, index) => (
              <span
                className="cascade-sequence-color"
                key={index}
                data-active={index === view.cursor}
                data-done={index < view.cursor}
                style={{ background: CASCADE_COLORS[color] }}
                aria-label={`${labels[color]}${index === view.cursor ? copy(" — sıradaki", " — next") : ""}`}
              >
                {color + 1}
              </span>
            ))}
          </div>
          <div
            className="cascade-board"
            ref={board}
            tabIndex={0}
            aria-label={copy(
              "Düşen bloklar. Fareyle tıkla veya sütun numarasına bas.",
              "Falling blocks. Click or press a lane number.",
            )}
            style={{ width: `min(100%, ${view.lanes * 100}px)` }}
          >
            <div className="cascade-lanes" aria-hidden="true">
              {Array.from({ length: view.lanes }, (_, lane) => (
                <span key={lane}>{lane + 1}</span>
              ))}
            </div>
            {view.tiles.map((tile) => (
              <button
                key={tile.id}
                className="cascade-tile"
                aria-label={`${labels[tile.color]} · ${copy("sütun", "lane")} ${tile.lane + 1}`}
                disabled={phase !== "running"}
                tabIndex={-1}
                onPointerDown={(event) => {
                  event.preventDefault();
                  choose(tile.id);
                }}
                onClick={(event) => {
                  if (event.detail === 0) choose(tile.id);
                }}
                style={{
                  left: `${(tile.lane / view.lanes) * 100}%`,
                  width: `${100 / view.lanes}%`,
                  height: `${(CASCADE_TILE_HEIGHT / CASCADE_HEIGHT) * 100}%`,
                  transform: `translateY(${(tile.y / CASCADE_TILE_HEIGHT) * 100}%)`,
                  background: CASCADE_COLORS[tile.color],
                }}
              >
                {tile.color + 1}
              </button>
            ))}
            {phase === "paused" && (
              <div className="cascade-paused">
                <strong>{copy("DURAKLATILDI", "PAUSED")}</strong>
                <button
                  className="play-link"
                  onClick={() => {
                    setPhase("running");
                    board.current?.focus();
                  }}
                >
                  {copy("Devam et", "Resume")}
                  <Play size={18} />
                </button>
              </div>
            )}
          </div>
          <p className="cascade-help">
            {copy(
              "Fareyle tıkla · 1–5: o sütunun en alttaki bloğu · Boşluk: duraklat",
              "Click a tile · 1–5: lowest tile in that lane · Space: pause",
            )}
          </p>
        </section>
      )}
    </GameFrame>
  );
}
