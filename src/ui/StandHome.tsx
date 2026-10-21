import {
  ArrowRight,
  Keyboard,
  Mouse,
  Move,
  HelpCircle,
  Search,
  ShieldQuestion,
  CornerDownLeft,
  MousePointer2,
  Palette,
} from "lucide-react";
import { useEffect, useRef } from "react";
import { useLanguage } from "./i18n";
export type Design = "lobby" | "festival" | "classic";
export const gameList = [
  {
    id: "zero-point",
    name: "Zero Point",
    tr: "Zamanı hisset.",
    en: "Feel the time.",
    control: "space",
  },
  {
    id: "target-rush",
    name: "Target Rush",
    tr: "Hedefleri yakala.",
    en: "Catch the targets.",
    control: "mouse",
  },
  {
    id: "perfect-align",
    name: "Perfect Align",
    tr: "Tam çizgide dur.",
    en: "Stop in the zone.",
    control: "space",
  },
  {
    id: "color-cascade",
    name: "Color Cascade",
    tr: "Renkleri sırayla yakala.",
    en: "Catch the colors in order.",
    control: "mouse",
  },
  {
    id: "snake",
    name: "Snake",
    tr: "Yiyecekleri topla. Daha da büyü.",
    en: "Collect food. Keep growing.",
    control: "arrows",
  },
  {
    id: "brain-firewall",
    name: "Brain Firewall",
    tr: "Hızlı düşün. Doğru cevabı seç.",
    en: "Think fast. Choose your answer.",
    control: "mouse",
  },
  {
    id: "myth-fact",
    name: "Myth or Fact",
    tr: "Gerçek mi, efsane mi? Bilgini test et.",
    en: "Fact or fiction? Test your instincts.",
    control: "mouse",
  },
  {
    id: "digital-detective",
    name: "Digital Detective",
    tr: "İpuçlarını incele. Dijital gizemi çöz.",
    en: "Follow the clues. Solve the case.",
    control: "mouse",
  },
] as const;
export type StandGameId = (typeof gameList)[number]["id"];
export function GamePreview({ id }: { id: StandGameId }) {
  const { copy } = useLanguage();
  return (
    <div className={`game-preview preview-${id}`} aria-hidden="true">
      {(id === "zero-point" || id === "perfect-align") && (
        <>
          <div className="preview-stars">
            {[0, 1, 2, 3, 4].map((star) => (
              <img
                key={star}
                src={`/event/star-${(star % 2) + 1}.svg`}
                alt=""
              />
            ))}
          </div>
          <img className="preview-horizon" src="/event/planet-1.svg" alt="" />
        </>
      )}
      {id === "zero-point" && (
        <>
          <strong>05.00</strong>
          <div className="preview-time-track">
            <i />
          </div>
        </>
      )}
      {id === "target-rush" && (
        <div className="preview-targets">
          <i />
          <i />
          <i />
          <i />
          <MousePointer2 className="preview-cursor" size={38} fill="#f3efe6" />
        </div>
      )}
      {id === "perfect-align" && (
        <div className="preview-align-track">
          <span />
          <i />
        </div>
      )}
      {id === "snake" && (
        <div className="preview-snake-shape">
          <i />
          <i />
          <i />
          <i />
          <i />
          <b />
        </div>
      )}
      {id === "color-cascade" && (
        <>
          {[0, 1, 2].map((color) => (
            <span
              key={color}
              style={{ background: ["#ff5252", "#448aff", "#4caf50"][color] }}
            >
              {color + 1}
            </span>
          ))}
        </>
      )}
      {id === "brain-firewall" && (
        <>
          <strong className="preview-question">
            {copy("Bir kilobayt kaç bayttır?", "How many bytes in a kilobyte?")}
          </strong>
          <span className="preview-answers">
            {["1000", "100", "10", "1"].map((answer) => (
              <span key={answer}>{answer}</span>
            ))}
          </span>
        </>
      )}
      {id === "myth-fact" && (
        <>
          <strong className="preview-question">
            {copy("Her QR kod güvenlidir.", "Every QR code is safe.")}
          </strong>
          <span className="preview-answer-choice">
            <span>{copy("Efsane", "Myth")}</span>
            <span>{copy("Gerçek", "Fact")}</span>
          </span>
        </>
      )}
      {id === "digital-detective" && (
        <>
          <div className="preview-case-record">
            <strong>
              {copy("Kayıp Kulüp Dosyası", "The Missing Club File")}
            </strong>
            <span>
              <time>14:02</time>
              {copy("Şüpheli e-posta.", "Suspicious email.")}
            </span>
            <span>
              <time>14:05</time>
              {copy("Sahte sayfaya giriş.", "Fake-page sign-in.")}
            </span>
            <span>
              <time>14:07</time>
              {copy("Dosya indirildi.", "File downloaded.")}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
export function ControlHint({
  control,
  expanded = false,
}: {
  control: string;
  expanded?: boolean;
}) {
  const { copy } = useLanguage();
  return (
    <span className="control-hint">
      {control === "space" ? (
        <>
          {!expanded && <Keyboard size={21} />}
          <kbd>{copy("Boşluk", "Space")}</kbd>
          {expanded && <span>{copy("tuşuna bas.", "to stop.")}</span>}
        </>
      ) : control === "arrows" ? (
        <>
          <Move size={21} />
          {copy("Ok tuşları", "Arrow keys")}
        </>
      ) : (
        <>
          <Mouse size={21} />
          {expanded
            ? copy("Fare ile tıkla.", "Click with the mouse.")
            : copy("Fare", "Mouse")}
        </>
      )}
    </span>
  );
}
const extraIcons = {
  "color-cascade": Palette,
  snake: Move,
  "brain-firewall": HelpCircle,
  "myth-fact": ShieldQuestion,
  "digital-detective": Search,
};
export default function StandHome({
  design,
  onPlay,
}: {
  design: Design;
  onPlay: (id: StandGameId) => void;
}) {
  const { language, copy } = useLanguage();
  const homeRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const home = homeRef.current;
    if (!home) return;
    let visible = true;
    const update = () => {
      home.dataset.motion = visible && !document.hidden ? "running" : "paused";
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      update();
    });
    observer.observe(home);
    document.addEventListener("visibilitychange", update);
    update();
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", update);
    };
  }, []);
  const main = design === "classic" ? gameList : gameList.slice(0, 3);
  return (
    <main ref={homeRef} className={`stand-home layout-${design}`}>
      {design === "festival" && (
        <aside className="festival-poster">
          <div className="festival-wordmark">
            <span className="festival-title">EMUCON</span>
            <span className="festival-year">2026</span>
          </div>
          <strong className="festival-club">IT CLUB</strong>
          <h1>{copy("OYUNA GEL.", "COME PLAY.")}</h1>
          <p>
            {copy("Bir oyun seç, bir tur dene.", "Pick a game. Give it a go.")}
          </p>
          <img
            className="festival-rocket"
            src="/event/rocket-flame.svg"
            alt=""
          />
          <img className="festival-planet" src="/event/planet-1.svg" alt="" />
          <div className="festival-date">
            {copy("24 EKİM · DAÜ STADYUMU", "24 OCTOBER · EMU STADIUM")}
          </div>
        </aside>
      )}
      <div className="home-programme">
        <div className="home-intro">
          <h1>
            {design === "festival"
              ? copy("Ne oynamak istersin?", "What will you play?")
              : design === "classic"
                ? copy("OYUNUNU SEÇ.", "PICK YOUR GAME.")
                : copy("BİR TUR OYNA.", "PLAY A ROUND.")}
          </h1>
          {design !== "festival" && (
            <p>
              {design === "classic"
                ? copy(
                    "IT Club standında bir tur eğlence.",
                    "A round of fun at the IT Club stand.",
                  )
                : copy(
                    "Bir oyun seç. Kontrolü öğren. Rekorunu dene.",
                    "Pick a game. Learn the controls. Try for a record.",
                  )}
            </p>
          )}
        </div>
        <div className="stand-game-grid">
          {main.map((game) => (
            <article className="stand-game" key={game.id}>
              <div className="stand-game-copy">
                <h2>{game.name}</h2>
                <p>{language === "tr" ? game.tr : game.en}</p>
              </div>
              <GamePreview id={game.id} />
              <div className="stand-game-action">
                <ControlHint
                  control={game.control}
                  expanded={design === "festival"}
                />
                <button
                  onClick={() => onPlay(game.id)}
                  className="play-link"
                  aria-label={`${copy("Oyna", "Play")}: ${game.name}`}
                >
                  <span>{copy("Oyna", "Play")}</span>
                  <ArrowRight size={23} />
                </button>
              </div>
            </article>
          ))}
        </div>
        {design !== "classic" && (
          <section className="other-games">
            <h2>{copy("Diğer oyunlar", "More games")}</h2>
            <div>
              {gameList.slice(3).map((game) => {
                const Icon =
                  extraIcons[game.id as keyof typeof extraIcons] ??
                  CornerDownLeft;
                return (
                  <button key={game.id} onClick={() => onPlay(game.id)}>
                    <Icon size={30} />
                    <span>
                      <strong>{game.name}</strong>
                      {design === "lobby" && (
                        <small>{language === "tr" ? game.tr : game.en}</small>
                      )}
                    </span>
                    <ArrowRight size={22} />
                  </button>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
