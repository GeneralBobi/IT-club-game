import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Check,
  Keyboard,
  Mouse,
  Move,
  Pause,
  Play,
  RotateCcw,
  Trophy,
} from "lucide-react";
import { ChallengerName, ScoreStatus, useGameSession } from "./arena-data";
import { useLanguage } from "./i18n";
import { gameList, GamePreview, type StandGameId } from "./StandHome";
import {
  markerPositionAt,
  evaluateAlignment,
  type AlignStage,
} from "../games/perfect-align/engine";
import { playSound } from "./sound";
import {
  nextZeroTarget,
  visibleClockScore,
  continuousAlignStage,
  currentStandRules,
} from "../games/stand-rules";
type ShortGame = Exclude<StandGameId, "myth-fact" | "digital-detective">;
type Phase = "intro" | "ready" | "running" | "result" | "complete" | "paused";
function useRun(game: ShortGame, phase: Phase, score: number) {
  return useGameSession(game, phase, score, currentStandRules(game));
}
function useStopKey(active: boolean, action: () => void) {
  const ref = useRef(action);
  ref.current = action;
  useEffect(() => {
    if (!active) return;
    const key = (event: KeyboardEvent) => {
      if (event.repeat || !["Space", "Enter"].includes(event.code)) return;
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) ||
          (target.tagName === "BUTTON" &&
            !target.classList.contains("big-stop")))
      )
        return;
      event.preventDefault();
      ref.current();
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [active]);
}
function useReady(phase: Phase, start: () => void) {
  const ref = useRef(start);
  ref.current = start;
  useEffect(() => {
    if (phase !== "ready") return;
    const timeout = setTimeout(() => ref.current(), 1000);
    return () => clearTimeout(timeout);
  }, [phase]);
}
function Frame({ game, children }: { game: ShortGame; children: ReactNode }) {
  const { copy } = useLanguage();
  const g = gameList.find((g) => g.id === game)!;
  return (
    <main className="stand-game-page">
      <div className="stand-game-heading">
        <h1>{g.name}</h1>
        <p>{copy(g.tr, g.en)}</p>
      </div>
      {children}
    </main>
  );
}
function Setup({
  game,
  tracking,
  onStart,
  description,
  control,
  extra,
}: {
  game: ShortGame;
  tracking: ReturnType<typeof useRun>;
  onStart: () => void;
  description: string;
  control: string;
  extra?: ReactNode;
}) {
  const { copy } = useLanguage();
  return (
    <div className="game-setup">
      <div>
        <GamePreview id={game} />
        <div className="game-instructions">
          <div>
            {control === "mouse" ? (
              <Mouse size={25} />
            ) : control === "arrows" ? (
              <Move size={25} />
            ) : (
              <Keyboard size={25} />
            )}
            <p>{description}</p>
          </div>
          <div>
            <Check size={25} />
            <p>
              {copy(
                "Önce bir tur dene. Sonunda sonucunu göreceksin.",
                "Give it a try. Your result appears at the end.",
              )}
            </p>
          </div>
        </div>
        {extra}
      </div>
      <div className="player-setup">
        <ChallengerName
          value={tracking.challenger}
          onChange={tracking.setChallenger}
        />
        <small>
          {copy(
            "Takma ad isteğe bağlıdır ve skor listesinde görünür.",
            "Your nickname is optional and appears on the scoreboard.",
          )}
        </small>
        <button className="play-link" onClick={onStart}>
          {copy("Başla", "Start")}
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
}
function Final({
  score,
  tracking,
  onAgain,
  children,
}: {
  score: number;
  tracking: ReturnType<typeof useRun>;
  onAgain: () => void;
  children?: ReactNode;
}) {
  const { copy } = useLanguage();
  return (
    <section className="stand-result" aria-live="polite">
      <Trophy size={35} />
      <h2>{copy("GÜZEL TURDU.", "NICE ROUND.")}</h2>
      <div className="stand-result-score">{score.toLocaleString()}</div>
      <p>{copy("puan", "points")}</p>
      {children}
      <ScoreStatus {...tracking} />
      <div className="result-actions">
        <button className="play-link" onClick={onAgain}>
          <RotateCcw size={19} />
          {copy("Bir tur daha", "Play again")}
        </button>
      </div>
      <p>
        {copy(
          "Sıradaki kişi için üstteki Yeni oyuncu düğmesini kullan.",
          "Use Next player above when you hand over the laptop.",
        )}
      </p>
    </section>
  );
}
function Zero() {
  const { copy } = useLanguage();
  const [phase, setPhase] = useState<Phase>("intro"), [elapsed, setElapsed] = useState(0), [error, setError] = useState(0), [target, setTarget] = useState<number | null>(null), [round, setRound] = useState(0);
  const started = useRef<number | null>(null);
  const score = phase === "complete" ? visibleClockScore(error) : 0;
  const tracking = useRun("zero-point", phase, score);
  const start = () => {
    setTarget(nextZeroTarget(target)); setElapsed(0); setError(0); setRound(value => value + 1);
    started.current = performance.now(); setPhase("running");
  };
  useEffect(() => {
    if (phase !== "running") return;
    let frame = 0;
    const tick = () => { setElapsed(performance.now() - started.current!); frame = requestAnimationFrame(tick); };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [phase]);
  const stop = () => {
    if (phase !== "running" || started.current === null || target === null) return;
    const actual = performance.now() - started.current; started.current = null;
    setElapsed(actual); setError(Math.abs(actual - target)); setPhase("complete"); playSound("tap");
  };
  useStopKey(phase === "running" || phase === "complete", () => phase === "complete" ? start() : stop());
  return <Frame game="zero-point">
    {phase === "intro" ? <Setup game="zero-point" tracking={tracking} control="space" onStart={start}
      description={copy("Her raund farklı bir hedef süre gelir. Saati izle, hedefte durdur. Sonuçtan sonra Boşluk ile hemen yeni hedefe geç. Saat hep görünür.", "Each round gives you a different target time. Watch the clock and stop on target. Press Space after the result to start the next target immediately. The clock stays visible.")} /> :
    <section className="game-stage quick-zero">
      <div className="stage-meta"><span>{copy("Raund", "Round")} {round}</span><span>{copy("En fazla 1000 puan", "Up to 1000 points")}</span></div>
      <strong className="zero-target">{copy("Hedef", "Target")}: <span data-testid="zero-target">{((target ?? 0)/1000).toFixed(2)}</span> s</strong>
      <div className="stage-clock"><strong className="visible-clock">{(elapsed/1000).toFixed(2)}</strong></div>
      <div className="zero-feedback" aria-live="polite">{phase === "complete" ? <><span><strong className="zero-points">{score}</strong> {copy("puan", "points")}</span><span>{Math.round(error)} ms {copy("fark", "off target")}</span></> : <span>{copy("Saati izle. Hedefte durdur.", "Watch the clock. Stop on target.")}</span>}</div>
      <button className="big-stop" onClick={phase === "complete" ? start : stop}>{phase === "complete" ? copy("SONRAKİ HEDEF", "NEXT TARGET") : copy("DURDUR", "STOP")}<small>{copy("Boşluk veya Enter", "Space or Enter")}</small></button>
      {phase === "complete" && <ScoreStatus {...tracking}/>}
    </section>}
  </Frame>;
}
function Align() {
  const { copy } = useLanguage();
  const [phase, setPhase] = useState<Phase>("intro"),
    [hits, setHits] = useState(0),
    [stage, setStage] = useState<AlignStage | null>(null),
    [elapsed, setElapsed] = useState(0);
  const started = useRef<number | null>(null);
  const score = hits * 100;
  const tracking = useRun("perfect-align", phase, score);
  const prepare = (count: number) => {
    setStage(continuousAlignStage(count));
    setElapsed(0);
    started.current = performance.now();
    setPhase("running");
  };
  useEffect(() => {
    if (phase !== "running") return;
    let frame = 0;
    const tick = () => {
      setElapsed(performance.now() - started.current!);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [phase]);
  useEffect(() => {
    if (phase !== "result") return;
    const timer = setTimeout(() => prepare(hits), 220);
    return () => clearTimeout(timer);
  }, [phase, hits]);
  const stop = () => {
    if (phase !== "running" || !stage || started.current === null) return;
    const actual = performance.now() - started.current;
    started.current = null;
    const result = evaluateAlignment(stage, actual, 1);
    setElapsed(actual);
    if (result.withinTarget) {
      setHits((value) => value + 1);
      setPhase("result");
    } else setPhase("complete");
    playSound("tap");
  };
  useStopKey(phase === "running", stop);
  return (
    <Frame game="perfect-align">
      {phase === "intro" ? (
        <Setup
          game="perfect-align"
          tracking={tracking}
          onStart={() => {
            setHits(0);
            prepare(0);
          }}
          control="space"
          description={copy(
            "Çizgiyi yeşil alanın içinde durdur. Her isabet 100 puan; yeni hedef otomatik gelir, alan daralır ve çizgi hızlanır. Kaçırınca oyun biter.",
            "Stop the marker inside the green zone. Each hit earns 100 points; the next target arrives automatically, narrows and speeds up. A miss ends the game.",
          )}
        />
      ) : phase === "complete" ? (
        <Final
          score={score}
          tracking={tracking}
          onAgain={() => { setHits(0); prepare(0); }}
        >
          <div className="result-stats">
            <div>
              <strong>{hits}</strong>
              <span>{copy("ardışık isabet", "consecutive hits")}</span>
            </div>
          </div>
        </Final>
      ) : (
        <section className="game-stage align-streak-stage">
          <div className="stage-meta">
            <span>
              {copy("Seviye", "Level")} {hits + (phase === "result" ? 0 : 1)}
            </span>
            <strong>
              {hits} {copy("isabet", "hits")} · {score} {copy("puan", "points")}
            </strong>
          </div>
          <p className="align-streak-feedback" role="status">
            {phase === "result"
              ? copy("İsabet! +100 · Devam ediyor…", "Hit! +100 · Keep going…")
              : phase === "ready"
                ? copy("Hazır ol…", "Get ready…")
                : copy("Yeşil alanda durdur.", "Stop inside the green zone.")}
          </p>
          <div
            className="align-game-track"
            role="img"
            aria-label={copy(
              "Hareketli çizgi ve yeşil hedef bölgesi",
              "Moving marker and green target zone",
            )}
          >
            <span
              className="align-game-zone"
              style={{
                left: `${(stage!.targetCenter - stage!.level.targetWidth / 2) * 100}%`,
                width: `${stage!.level.targetWidth * 100}%`,
              }}
            />
            <i
              className="align-game-marker"
              style={{ left: `${markerPositionAt(stage!, elapsed) * 100}%` }}
            />
          </div>
          <button
            className="big-stop"
            onClick={stop}
            disabled={phase !== "running"}
          >
            {phase === "result"
              ? copy("İSABET!", "HIT!")
              : phase === "ready"
                ? "1"
                : copy("DURDUR", "STOP")}
            <small>{copy("Boşluk veya Enter", "Space or Enter")}</small>
          </button>
          <button
            className="quiet-button align-finish"
            disabled={phase === "ready"}
            onClick={() => {
              started.current = null;
              setPhase("complete");
            }}
          >
            {copy("Bitir ve skoru kaydet", "Finish and save score")}
          </button>
        </section>
      )}
    </Frame>
  );
}
type SprintTarget = { id:number; x:number; y:number; expires:number; golden:boolean; size:number };
function Rush() {
  const { copy } = useLanguage();
  const [phase, setPhase] = useState<Phase>("intro");
  const [view, setView] = useState({hits:0,misses:0,streak:0,best:0,score:0,remaining:20});
  const model = useRef(view), field = useRef<HTMLDivElement>(null), end = useRef(0), nextId = useRef(0), live = useRef<SprintTarget | null>(null);
  const [target,setTarget] = useState<SprintTarget | null>(null), [pop,setPop] = useState<{id:number;x:number;y:number;points:number;golden:boolean}|null>(null);
  const tracking = useRun("target-rush",phase,view.score);
  const update = (next:typeof view) => {model.current=next;setView(next);};
  const spawn = () => {
    const previous=live.current;let x=.2+Math.random()*.6,y=.2+Math.random()*.6;
    for(let n=0;n<10&&previous&&Math.hypot(x-previous.x,y-previous.y)<.25;n++){x=.2+Math.random()*.6;y=.2+Math.random()*.6;}
    const next={id:++nextId.current,x,y,expires:performance.now()+Math.max(750,1700-model.current.hits*20),golden:nextId.current%7===0,size:Math.max(46,76-model.current.hits*.7)};
    live.current=next;setTarget(next);
  };
  const start=()=>{update({hits:0,misses:0,streak:0,best:0,score:0,remaining:20});nextId.current=0;end.current=performance.now()+20000;live.current=null;setPop(null);spawn();setPhase("running");};
  useEffect(()=>{
    if(phase!=="running")return;
    const timer=setInterval(()=>{
      const now=performance.now();
      if(now>=end.current){live.current=null;setTarget(null);update({...model.current,remaining:0});setPhase("complete");return;}
      if(live.current&&now>=live.current.expires){update({...model.current,streak:0,misses:model.current.misses+1});spawn();}
      const remaining=Math.ceil((end.current-now)/1000);if(remaining!==model.current.remaining)update({...model.current,remaining});
    },40);
    return()=>clearInterval(timer);
  },[phase]);
  const hit=(id:number,keyboard=false)=>{
    const t=live.current;if(phase!=="running"||!t||t.id!==id||performance.now()>=t.expires||performance.now()>=end.current)return;
    const m=model.current,streak=m.streak+1,points=100*Math.min(5,1+Math.floor((streak-1)/4))*(t.golden?3:1);
    update({...m,hits:m.hits+1,streak,best:Math.max(m.best,streak),score:m.score+points});setPop({id:t.id,x:t.x,y:t.y,points,golden:t.golden});spawn();playSound("tap");
    if(keyboard)requestAnimationFrame(()=>field.current?.querySelector('button')?.focus({preventScroll:true}));
  };
  return <Frame game="target-rush">
    {phase==="intro"?<Setup game="target-rush" tracking={tracking} control="mouse" onStart={start} description={copy("20 saniyelik hedef yarışı. Vurduğun anda yenisi gelir. Her dört ardışık isabet çarpanı artırır; altın hedef üç kat puan verir. Kaçırınca yalnız seri sıfırlanır.","A 20-second target sprint. Each hit immediately creates the next target. Every four consecutive hits raise your multiplier; gold targets give triple points. A miss only resets your streak.")}/>:
    phase==="complete"?<Final score={view.score} tracking={tracking} onAgain={start}><div className="result-stats"><div><strong>{view.hits}</strong><span>{copy("isabet","hits")}</span></div><div><strong>{view.best}</strong><span>{copy("en iyi seri","best streak")}</span></div></div></Final>:
    <section className="game-stage rush-sprint"><div className="stage-meta"><strong>{view.remaining} s</strong><strong>{view.score} {copy("puan","points")}</strong><span className="rush-combo">{view.streak} {copy("seri","streak")} · ×{Math.min(5,1+Math.floor(view.streak/4))}</span></div>
    <div className="rush-time-track"><span style={{transform:`scaleX(${view.remaining/20})`}}/></div>
    <div className="rush-playfield" ref={field} aria-label={copy("Hedef alanı","Target area")} onPointerDown={event=>{if(event.target===event.currentTarget)update({...model.current,streak:0,misses:model.current.misses+1});}}>
      {target&&<button key={target.id} className={`rush-target${target.golden?' is-golden':''}`} style={{left:`${target.x*100}%`,top:`${target.y*100}%`,width:target.size,height:target.size}} aria-label={target.golden?copy("Altın hedefi vur","Hit gold target"):copy("Hedefi vur","Hit target")} onPointerDown={event=>{event.preventDefault();hit(target.id);}} onClick={event=>{if(event.detail===0)hit(target.id,true);}}/>}
      {pop&&<span key={pop.id} aria-hidden="true" className={`rush-pop${pop.golden?' is-golden':''}`} style={{left:`${pop.x*100}%`,top:`${pop.y*100}%`}}>+{pop.points}</span>}
    </div><div className="rush-reward"><span>{copy("Seriyi koru, çarpanı büyüt.","Keep your streak. Grow your multiplier.")}</span><span>{copy("Altın hedef: ×3","Gold target: ×3")}</span></div></section>}
  </Frame>;
}
type Cell = {
  x: number;
  y: number;
};
type Direction = "up" | "down" | "left" | "right";
const vectors: Record<Direction, Cell> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};
const opposite: Record<Direction, Direction> = {
  up: "down",
  down: "up",
  left: "right",
  right: "left",
};
const keys: Record<string, Direction> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  w: "up",
  s: "down",
  a: "left",
  d: "right",
};
const initialBody = () => [
  { x: 6, y: 10 },
  { x: 5, y: 10 },
  { x: 4, y: 10 },
];
function foodFor(body: Cell[]): Cell | null {
  const free: Cell[] = [];
  for (let y = 0; y < 20; y++)
    for (let x = 0; x < 24; x++)
      if (!body.some((c) => c.x === x && c.y === y)) free.push({ x, y });
  return free.length ? free[Math.floor(Math.random() * free.length)] : null;
}
function Snake() {
  const { copy } = useLanguage();
  const [phase, setPhase] = useState<Phase>("intro"),
    [body, setBody] = useState(initialBody),
    [food, setFood] = useState<Cell | null>(() => foodFor(initialBody())),
    [score, setScore] = useState(0),
    [reason, setReason] = useState("");
  const model = useRef({
      body: initialBody(),
      food: foodFor(initialBody()),
      direction: "right" as Direction,
      turns: [] as Direction[],
      score: 0,
    }),
    board = useRef<HTMLDivElement>(null);
  const tracking = useRun("snake", phase, score);
  const turn = (direction: Direction) => {
    const m = model.current;
    const previous = m.turns.at(-1) ?? m.direction;
    if (
      direction !== previous &&
      direction !== opposite[previous] &&
      m.turns.length < 2
    )
      m.turns.push(direction);
  };
  useReady(phase, () => {
    board.current?.focus();
    setPhase("running");
  });
  useEffect(() => {
    if (phase !== "running") return;
    const timer = setInterval(
      () => {
        const m = model.current;
        const direction = m.turns.shift() ?? m.direction,
          step = vectors[direction],
          head = { x: m.body[0].x + step.x, y: m.body[0].y + step.y };
        const eats = !!m.food && head.x === m.food.x && head.y === m.food.y;
        if (
          head.x < 0 ||
          head.x >= 24 ||
          head.y < 0 ||
          head.y >= 20 ||
          m.body
            .slice(0, eats ? undefined : -1)
            .some((c) => c.x === head.x && c.y === head.y)
        ) {
          setReason(
            copy(
              "Duvara veya kendine çarptın.",
              "You hit a wall or your tail.",
            ),
          );
          setPhase("complete");
          return;
        }
        m.body = [head, ...m.body];
        if (!eats) m.body.pop();
        else {
          m.score += 100;
          m.food = foodFor(m.body);
          setScore(m.score);
          setFood(m.food);
          playSound("tap");
          if (!m.food) {
            setReason(
              copy("Bütün alanı doldurdun!", "You filled the whole board!"),
            );
            setPhase("complete");
          }
        }
        m.direction = direction;
        setBody([...m.body]);
      },
      Math.max(100, 180 - Math.floor(score / 500) * 10),
    );
    return () => clearInterval(timer);
  }, [phase, score, copy]);
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(target.tagName) ||
          target.isContentEditable)
      )
        return;
      if (phase !== "running" && phase !== "paused") return;
      if (keys[event.key]) {
        event.preventDefault();
        if (phase === "running") turn(keys[event.key]);
      } else if (
        (event.code === "Space" || event.code === "Escape") &&
        !event.repeat
      ) {
        event.preventDefault();
        setPhase((p) => (p === "running" ? "paused" : "ready"));
      }
    };
    const blur = () => setPhase((p) => (p === "running" ? "paused" : p));
    window.addEventListener("keydown", key);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", key);
      window.removeEventListener("blur", blur);
    };
  }, [phase]);
  return (
    <Frame game="snake">
      {phase === "intro" ? (
        <Setup
          game="snake"
          tracking={tracking}
          onStart={() => {
            const next = initialBody();
            model.current = {
              body: next,
              food: foodFor(next),
              direction: "right",
              turns: [],
              score: 0,
            };
            setBody(next);
            setFood(model.current.food);
            setScore(0);
            setPhase("ready");
          }}
          control="arrows"
          description={copy(
            "Ok tuşlarıyla yönel, kırmızı yiyeceği topla. Duvara ve kendine çarpma. Boşluk ile duraklat.",
            "Use arrow keys to collect red food. Avoid the walls and your tail. Press Space to pause.",
          )}
        />
      ) : phase === "complete" ? (
        <Final
          score={score}
          tracking={tracking}
          onAgain={() => setPhase("intro")}
        >
          <p>{reason}</p>
        </Final>
      ) : (
        <section className="game-stage">
          <div className="stage-meta">
            <strong>
              {score} {copy("puan", "points")}
            </strong>
            <button
              className="quiet-button"
              onClick={() =>
                setPhase((p) => (p === "paused" ? "ready" : "paused"))
              }
            >
              {phase === "paused" ? <Play size={18} /> : <Pause size={18} />}{" "}
              {copy("Duraklat / sürdür", "Pause / resume")}
            </button>
          </div>
          <div
            className="snake-playfield"
            ref={board}
            tabIndex={0}
            aria-label={copy(
              "Yılan oyun alanı. Ok tuşlarıyla yönlendir.",
              "Snake game board. Use arrow keys to move.",
            )}
          >
            {body.map((c, i) => (
              <i
                className={`snake-cell ${i === 0 ? "snake-head" : ""}`}
                key={i}
                style={{
                  left: `${(c.x / 24) * 100}%`,
                  top: `${(c.y / 20) * 100}%`,
                }}
              />
            ))}
            {food && (
              <i
                className="snake-cell snake-food"
                style={{
                  left: `${(food.x / 24) * 100}%`,
                  top: `${(food.y / 20) * 100}%`,
                }}
              />
            )}
            {phase !== "running" && (
              <div className="snake-overlay">
                <strong>
                  {phase === "ready" ? "1" : copy("DURAKLATILDI", "PAUSED")}
                </strong>
                {phase === "paused" && (
                  <button
                    className="play-link"
                    onClick={() => setPhase("ready")}
                  >
                    {copy("Devam et", "Resume")}
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="snake-touch">
            {(
              [
                ["up", ArrowUp],
                ["left", ArrowLeft],
                ["down", ArrowDown],
                ["right", ArrowRight],
              ] as const
            ).map(([dir, Icon]) => (
              <button
                key={dir}
                aria-label={
                  {
                    up: copy("Yukarı", "Up"),
                    down: copy("Aşağı", "Down"),
                    left: copy("Sol", "Left"),
                    right: copy("Sağ", "Right"),
                  }[dir]
                }
                onClick={() => {
                  turn(dir);
                  board.current?.focus();
                }}
              >
                <Icon size={23} />
              </button>
            ))}
          </div>
        </section>
      )}
    </Frame>
  );
}
type QuizItem = {
  tr: string;
  en: string;
  options: [string, string, string, string];
  answer: number;
  whyTr: string;
  whyEn: string;
};
const quizBank: QuizItem[] = [
  {
    tr: "Bir web adresinin başındaki HTTPS neyi gösterir?",
    en: "What does HTTPS at the start of a web address mean?",
    options: [
      "Encrypted connection",
      "Guaranteed trustworthy shop",
      "Free internet",
      "No tracking",
    ],
    answer: 0,
    whyTr:
      "HTTPS bağlantıyı şifreler; sitenin dürüst olduğunu tek başına kanıtlamaz.",
    whyEn:
      "HTTPS encrypts the connection. It does not prove that the website is honest.",
  },
  {
    tr: "İkili sayı sisteminde hangi iki rakam kullanılır?",
    en: "Which two digits does binary use?",
    options: ["0 / 1", "1 / 2", "0 / 9", "2 / 8"],
    answer: 0,
    whyTr: "İkili sistem yalnızca 0 ve 1 kullanır.",
    whyEn: "Binary uses only 0 and 1.",
  },
  {
    tr: "Bilgisayarda kopyalama kısayolu hangisidir?",
    en: "Which shortcut copies on a Windows computer?",
    options: ["Ctrl + C", "Ctrl + V", "Ctrl + Z", "Ctrl + P"],
    answer: 0,
    whyTr: "Ctrl+C kopyalar; Ctrl+V yapıştırır.",
    whyEn: "Ctrl+C copies; Ctrl+V pastes.",
  },
  {
    tr: "Güneş sisteminin en büyük gezegeni hangisidir?",
    en: "Which is the largest planet in our solar system?",
    options: ["Jupiter", "Earth", "Mars", "Venus"],
    answer: 0,
    whyTr: "Jüpiter, Güneş sisteminin en büyük gezegenidir.",
    whyEn: "Jupiter is the largest planet in our solar system.",
  },
  {
    tr: "Bir QR kodu açmadan önce neyi kontrol etmelisin?",
    en: "What should you check before opening a QR-code link?",
    options: [
      "Destination address",
      "Shape of the paper",
      "Number of squares",
      "Phone colour",
    ],
    answer: 0,
    whyTr: "QR kod bir bağlantı taşıyabilir. Açılacak adresi kontrol et.",
    whyEn:
      "A QR code can contain a link. Check its destination before opening it.",
  },
  {
    tr: "RAM çoğunlukla ne için kullanılır?",
    en: "What is RAM mainly used for?",
    options: [
      "Active working data",
      "Permanent backup",
      "Charging the battery",
      "Increasing Wi-Fi range",
    ],
    answer: 0,
    whyTr: "RAM, çalışan programların geçici çalışma verilerini tutar.",
    whyEn: "RAM holds working data for active programs.",
  },
  {
    tr: "Hangi dosya uzantısı genellikle bir görsele aittir?",
    en: "Which file extension normally belongs to an image?",
    options: [".png", ".mp3", ".txt", ".zip"],
    answer: 0,
    whyTr:
      "PNG bir görsel biçimidir. Bir dosyanın adı içeriğini tek başına garanti etmez.",
    whyEn:
      "PNG is an image format. A filename alone does not guarantee its contents.",
  },
  {
    tr: "Açık kaynak yazılım hakkında hangisi doğrudur?",
    en: "Which statement about open-source software is true?",
    options: [
      "It can have licence conditions",
      "It never has bugs",
      "It needs no maintenance",
      "It is always offline",
    ],
    answer: 0,
    whyTr: "Açık kaynak yazılımın da lisans koşulları vardır.",
    whyEn: "Open-source software can still have licence conditions.",
  },
  {
    tr: "Bir ekranın çözünürlüğü neyi ifade eder?",
    en: "What does a screen's resolution describe?",
    options: [
      "Pixel dimensions",
      "Battery capacity",
      "Network speed",
      "Sound volume",
    ],
    answer: 0,
    whyTr: "Çözünürlük, ekranın piksel boyutlarını ifade eder.",
    whyEn: "Resolution describes the pixel dimensions of the screen.",
  },
  {
    tr: "Bir üçgenin iç açılarının toplamı, düzlem geometrisinde kaç derecedir?",
    en: "What is the sum of a triangle's interior angles in plane geometry?",
    options: ["180°", "90°", "270°", "360°"],
    answer: 0,
    whyTr: "Düzlem geometrisinde üçgenin iç açıları toplamı 180 derecedir.",
    whyEn: "A triangle's interior angles total 180 degrees in plane geometry.",
  },
];
const optionTr: Record<string, string> = {
  "Encrypted connection": "Şifreli bağlantı",
  "Guaranteed trustworthy shop": "Kesinlikle güvenilir mağaza",
  "Free internet": "Ücretsiz internet",
  "No tracking": "Hiç izlenmeme",
  Jupiter: "Jüpiter",
  Earth: "Dünya",
  Mars: "Mars",
  Venus: "Venüs",
  "Destination address": "Hedef adres",
  "Shape of the paper": "Kâğıdın şekli",
  "Number of squares": "Karelerin sayısı",
  "Phone colour": "Telefonun rengi",
  "Active working data": "Etkin çalışma verileri",
  "Permanent backup": "Kalıcı yedek",
  "Charging the battery": "Pili şarj etmek",
  "Increasing Wi-Fi range": "Wi-Fi menzilini artırmak",
  "It can have licence conditions": "Lisans koşulları olabilir",
  "It never has bugs": "Hiç hata içermez",
  "It needs no maintenance": "Bakıma ihtiyaç duymaz",
  "It is always offline": "Her zaman çevrimdışıdır",
  "Pixel dimensions": "Piksel boyutları",
  "Battery capacity": "Pil kapasitesi",
  "Network speed": "Ağ hızı",
  "Sound volume": "Ses seviyesi",
};
type QuizRound = QuizItem & {
  order: number[];
};
function shuffle<T>(values: T[]): T[] {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
function Quiz() {
  const { language, copy } = useLanguage();
  const [phase, setPhase] = useState<Phase>("intro"),
    [questions, setQuestions] = useState<QuizRound[]>([]),
    [index, setIndex] = useState(0),
    [score, setScore] = useState(0),
    [chosen, setChosen] = useState<number | null>(null),
    [left, setLeft] = useState(15);
  const started = useRef(0),
    locked = useRef(false);
  const tracking = useRun("brain-firewall", phase, score);
  const current = questions[index];
  const answer = (value: number | null) => {
    if (phase !== "running" || locked.current) return;
    locked.current = true;
    setChosen(value);
    if (value !== null && current.order[value] === current.answer) {
      setScore(
        (s) =>
          s +
          100 +
          Math.max(
            0,
            Math.round((15000 - (performance.now() - started.current)) / 1000),
          ),
      );
      playSound("tap");
    }
    setPhase("result");
  };
  const answerRef = useRef(answer);
  answerRef.current = answer;
  useEffect(() => {
    if (phase !== "running") return;
    locked.current = false;
    started.current = performance.now();
    setLeft(15);
    const timer = setInterval(() => {
      const remaining = 15000 - (performance.now() - started.current);
      setLeft(Math.max(0, Math.ceil(remaining / 1000)));
      if (remaining <= 0) answerRef.current(null);
    }, 100);
    return () => clearInterval(timer);
  }, [phase, index]);
  useEffect(() => {
    if (phase !== "running") return;
    const key = (e: KeyboardEvent) => {
      if (e.repeat || !/[1-4]/.test(e.key) || e.key.length !== 1) return;
      const target = e.target;
      if (
        target instanceof HTMLElement &&
        ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
      )
        return;
      e.preventDefault();
      answerRef.current(Number(e.key) - 1);
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [phase]);
  return (
    <Frame game="brain-firewall">
      {phase === "intro" ? (
        <Setup
          game="brain-firewall"
          tracking={tracking}
          onStart={() => {
            setQuestions(
              shuffle(quizBank)
                .slice(0, 5)
                .map((q) => ({ ...q, order: shuffle([0, 1, 2, 3]) })),
            );
            setIndex(0);
            setScore(0);
            setChosen(null);
            setPhase("running");
          }}
          control="mouse"
          description={copy(
            "5 kısa soru. Cevaba tıkla veya 1–4 tuşlarını kullan. Her soruda 15 saniyen var.",
            "Five quick questions. Click an answer or press 1–4. You have 15 seconds per question.",
          )}
        />
      ) : phase === "complete" ? (
        <Final
          score={score}
          tracking={tracking}
          onAgain={() => setPhase("intro")}
        />
      ) : (
        <section className="game-stage">
          <div className="stage-meta">
            <span>
              {copy("Soru", "Question")} {index + 1}/5
            </span>
            <strong>{left} s</strong>
            <span>
              {score} {copy("puan", "points")}
            </span>
          </div>
          <h2 className="quiz-question">
            {language === "tr" ? current.tr : current.en}
          </h2>
          <div className="quiz-options">
            {current.order.map((option, i) => (
              <button
                key={i}
                disabled={phase !== "running"}
                data-selected={chosen === i}
                data-correct={phase === "result" && option === current.answer}
                onClick={() => answer(i)}
              >
                {i + 1}.{" "}
                {language === "tr"
                  ? (optionTr[current.options[option]] ??
                    current.options[option])
                  : current.options[option]}
              </button>
            ))}
          </div>
          {phase === "result" && (
            <div className="quiz-feedback" aria-live="polite">
              <strong>
                {chosen === null
                  ? copy("Süre doldu.", "Time is up.")
                  : current.order[chosen] === current.answer
                    ? copy("Doğru!", "Correct!")
                    : copy("Bu kez olmadı.", "Not this time.")}
              </strong>
              <p>{language === "tr" ? current.whyTr : current.whyEn}</p>
              <button
                className="play-link"
                onClick={() => {
                  if (index === 4) setPhase("complete");
                  else {
                    setIndex((i) => i + 1);
                    setChosen(null);
                    setPhase("running");
                  }
                }}
              >
                {index === 4
                  ? copy("Sonucu gör", "See result")
                  : copy("Sonraki soru", "Next question")}
                <ArrowRight size={20} />
              </button>
            </div>
          )}
        </section>
      )}
    </Frame>
  );
}
export default function StandGames({ game }: { game: ShortGame }) {
  return game === "zero-point" ? (
    <Zero />
  ) : game === "perfect-align" ? (
    <Align />
  ) : game === "target-rush" ? (
    <Rush />
  ) : game === "snake" ? (
    <Snake />
  ) : (
    <Quiz />
  );
}

export {
  Frame as GameFrame,
  Setup as GameSetup,
  Final as GameFinal,
  useRun as useStandRun,
};
export type { Phase };
