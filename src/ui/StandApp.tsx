import { lazy, Suspense, useEffect, useState } from "react";
import { flushSync } from "react-dom";
import {
  ArrowLeft,
  ArrowRight,
  Trophy,
  UserRoundPlus,
  Volume2,
  VolumeX,
} from "lucide-react";
import StandHome, {
  gameList,
  type Design,
  type StandGameId,
} from "./StandHome";
import { LanguageProvider, useLanguage } from "./i18n";
import { useLiveData, type Rankings } from "./arena-data";
import { setSoundMuted, soundIsMuted } from "./sound";
import StandGames from "./StandGames";
import StandCases from "./StandCases";
import "./stand.css";
import "./festival.css";
const StaffApp = lazy(() => import("./App"));
type Screen = StandGameId | "home" | "scores";
const validScreens = new Set<string>([...gameList.map((g) => g.id), "scores"]);
function locationState() {
  const parts = location.pathname.split("/").filter(Boolean);
  const variant = (
    ["lobby", "festival", "classic"].includes(parts[0])
      ? parts[0]
      : new URLSearchParams(location.search).get("design")
  ) as Design;
  return {
    design: (["lobby", "festival", "classic"].includes(variant)
      ? variant
      : "festival") as Design,
    screen: (validScreens.has(parts.at(-1) ?? "")
      ? parts.at(-1)
      : "home") as Screen,
  };
}
function Stand() {
  const { language, setLanguage, copy } = useLanguage();
  const [route, setRoute] = useState(locationState),
    [epoch, setEpoch] = useState(0),
    [resetOpen, setResetOpen] = useState(false),
    [resetBusy, setResetBusy] = useState(false),
    [resetError, setResetError] = useState("");
  const [muted, setMuted] = useState(soundIsMuted);
  useEffect(() => {
    if (!resetOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !resetBusy) {
        event.preventDefault();
        setResetOpen(false);
      }
      if (event.key !== "Tab") return;
      const controls = Array.from(
        document.querySelectorAll<HTMLButtonElement>(
          ".stand-dialog button:not(:disabled)",
        ),
      );
      const first = controls[0],
        last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("keydown", key);
      previous?.isConnected && previous.focus();
    };
  }, [resetOpen, resetBusy]);
  useEffect(() => {
    const pop = () => setRoute(locationState());
    window.addEventListener("popstate", pop);
    return () => window.removeEventListener("popstate", pop);
  }, []);
  const go = (screen: Screen, resetPlayer = false) => {
    const url = `/${route.design}${screen === "home" ? "" : `/${screen}`}`;
    history.pushState(null, "", url);
    const update = () => {
      flushSync(() => {
        if (resetPlayer) setEpoch((value) => value + 1);
        setRoute({ ...route, screen });
      });
      window.scrollTo({ top: 0, behavior: "instant" });
    };
    if (
      document.startViewTransition &&
      !matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      document.startViewTransition(update);
    } else update();
  };
  const nextPlayer = async () => {
    setResetBusy(true);
    setResetError("");
    try {
      const response = await fetch("/api/player/reset", { method: "POST" });
      if (!response.ok) throw new Error();
      localStorage.removeItem("arena-challenger");
      localStorage.setItem("arena-participant", crypto.randomUUID());
      for (const key of Object.keys(localStorage))
        if (key.startsWith("dd-") || key.startsWith("detective-"))
          localStorage.removeItem(key);
      for (const key of Object.keys(sessionStorage))
        if (key.startsWith("stand-")) sessionStorage.removeItem(key);
      setResetOpen(false);
      go("home", true);
    } catch {
      setResetError(
        copy(
          "Yeni oyuncu hazırlanamadı. Bağlantıyı kontrol edip tekrar dene.",
          "Could not prepare the next player. Check the connection and retry.",
        ),
      );
    } finally {
      setResetBusy(false);
    }
  };
  return (
    <div className={`stand-root design-${route.design}`}>
      <header className="stand-header">
        <a
          className="stand-identity"
          href={`/${route.design}`}
          onClick={(e) => {
            e.preventDefault();
            go("home");
          }}
          aria-label={copy("Oyun menüsü", "Game menu")}
        >
          <img
            src="/brand/itclub-original.png"
            alt="Information Technology Club — EMU"
          />
          <span>
            Information Technology Club<small>EMU</small>
          </span>
        </a>
        <div className="university-identity">
          <img
            src="/brand/dau-signature.png"
            alt="Doğu Akdeniz Üniversitesi / Eastern Mediterranean University"
          />
        </div>
        <div className="language-switch" aria-label={copy("Dil", "Language")}>
          <button
            lang="tr"
            aria-pressed={language === "tr"}
            onClick={() => setLanguage("tr")}
          >
            Türkçe
          </button>
          <button
            lang="en"
            aria-pressed={language === "en"}
            onClick={() => setLanguage("en")}
          >
            English
          </button>
        </div>
      </header>
      {route.screen !== "home" && (
        <nav className="play-nav">
          <button onClick={() => go("home")}>
            <ArrowLeft size={18} />
            {copy("Oyunlar", "Games")}
          </button>
          <button onClick={() => setResetOpen(true)}>
            <UserRoundPlus size={18} />
            {copy("Yeni oyuncu", "Next player")}
          </button>
        </nav>
      )}
      <div key={epoch}>
        {route.screen === "home" ? (
          <StandHome design={route.design} onPlay={go} />
        ) : route.screen === "scores" ? (
          <StandScores />
        ) : route.screen === "myth-fact" ||
          route.screen === "digital-detective" ? (
          <StandCases key={route.screen} game={route.screen} />
        ) : (
          <StandGames key={route.screen} game={route.screen} />
        )}
      </div>
      <footer className="stand-footer">
        <span>
          {copy(
            "EMUCON 2026 · 24 Ekim · DAÜ Stadyumu",
            "EMUCON 2026 · 24 October · EMU Stadium",
          )}
        </span>
        <div>
          <button onClick={() => go("scores")}>
            <Trophy size={17} />
            {copy("Skorlar", "Scores")}
          </button>
          {route.screen === "home" && (
            <button onClick={() => setResetOpen(true)}>
              <UserRoundPlus size={17} />
              {copy("Yeni oyuncu", "Next player")}
            </button>
          )}
          <button
            aria-label={
              muted
                ? copy("Sesi aç", "Enable sound")
                : copy("Sesi kapat", "Mute sound")
            }
            aria-pressed={!muted}
            onClick={() => {
              setSoundMuted(!muted);
              setMuted(!muted);
            }}
          >
            {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
        </div>
        {route.design === "lobby" && (
          <img
            src="/event/planet-rocket.png"
            alt=""
            className="footer-planet"
          />
        )}
      </footer>
      <div className="event-signatures">
        <img
          src={`/brand/footer-${language}-light.png`}
          alt={copy(
            "EMURPG · Doğu Akdeniz Üniversitesi · Öğrenci Gelişim, Etkinlikler ve Spor İşleri Müdürlüğü",
            "EMURPG · Eastern Mediterranean University · Student Development, Events and Sports Affairs Directorate",
          )}
          loading="lazy"
        />
      </div>
      {resetOpen && (
        <div className="stand-dialog-backdrop">
          <section
            className="stand-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reset-heading"
          >
            <h2 id="reset-heading">
              {copy("Yeni oyuncuya geçilsin mi?", "Ready for the next player?")}
            </h2>
            <p>
              {copy(
                "Devam eden tur kapanır ve takma ad temizlenir. Kaydedilmiş skorlar kalır.",
                "This ends the current run and clears the nickname. Saved scores stay.",
              )}
            </p>
            {resetError && <p role="alert">{resetError}</p>}
            <div>
              <button
                className="play-link"
                disabled={resetBusy}
                onClick={() => void nextPlayer()}
                autoFocus
              >
                {resetBusy
                  ? copy("Hazırlanıyor…", "Preparing…")
                  : copy("Yeni oyuncuyu hazırla", "Prepare next player")}
                <ArrowRight size={19} />
              </button>
              <button
                className="quiet-button"
                disabled={resetBusy}
                onClick={() => setResetOpen(false)}
              >
                {copy("Vazgeç", "Cancel")}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
function StandScores() {
  const { copy } = useLanguage();
  const [game, setGame] = useState<string>("zero-point"),
    [version, setVersion] = useState("2");
  const { data, error } = useLiveData<Rankings>(
    `/api/leaderboard/${game}?rules=${version}`,
  );
  return (
    <main className="stand-scores">
      <h1>{copy("SKORLAR.", "SCORES.")}</h1>
      <p>
        {copy(
          "Kısa turlar kendi aralarında sıralanır. Önceki sürümün rekorları ayrı tutulur.",
          "Short rounds compete with short rounds. Earlier records have their own board.",
        )}
      </p>
      <div className="score-filters">
        <label>
          {copy("Oyun", "Game")}
          <select value={game} onChange={(e) => setGame(e.target.value)}>
            {gameList.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          {copy("Sürüm", "Rules")}
          <select value={version} onChange={(e) => setVersion(e.target.value)}>
            <option value="2">{copy("Stant turları", "Stand rounds")}</option>
            <option value="1">{copy("Önceki sürüm", "Earlier version")}</option>
          </select>
        </label>
      </div>
      {error ? (
        <p role="alert">
          {copy(
            "Skorlar yüklenemedi. Bağlantıyı kontrol et.",
            "Scores could not load. Check the connection.",
          )}
        </p>
      ) : !data ? (
        <p role="status">{copy("Yükleniyor…", "Loading…")}</p>
      ) : data.entries.length ? (
        <ol className="stand-score-list">
          {data.entries.map((entry) => (
            <li key={entry.id}>
              <span>{entry.rank}</span>
              <strong>
                {entry.challenger === "Anonymous Challenger"
                  ? copy("İsimsiz oyuncu", "Anonymous player")
                  : entry.challenger}
              </strong>
              <b>{entry.score.toLocaleString()}</b>
            </li>
          ))}
        </ol>
      ) : (
        <p>
          {copy(
            "Henüz bir skor yok. İlk tur senin olsun.",
            "No scores yet. Make the first run yours.",
          )}
        </p>
      )}
    </main>
  );
}
export default function StandApp() {
  return location.pathname.startsWith("/staff") ? (
    <Suspense fallback={<p>Yükleniyor / Loading…</p>}>
      <StaffApp />
    </Suspense>
  ) : (
    <LanguageProvider>
      <Stand />
    </LanguageProvider>
  );
}
