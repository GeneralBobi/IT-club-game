import { useState } from "react";
import { ArrowRight, RefreshCw, Trophy } from "lucide-react";
import { gameList, type StandGameId } from "./StandHome";
import { useLiveData, type Rankings } from "./arena-data";
import { currentStandRules } from "../games/stand-rules";
import { useLanguage } from "./i18n";

export default function StandScores({ onPlay }: { onPlay: (game: StandGameId) => void }) {
  const { copy, language } = useLanguage();
  const [game, setGame] = useState<StandGameId>("zero-point");
  const [version, setVersion] = useState("current");
  const { data, error, refreshing, refresh } = useLiveData<Rankings>(
    `/api/leaderboard/${game}?rules=${version === "current" ? currentStandRules(game) : version}`,
  );
  const selected = gameList.find((entry) => entry.id === game)!;
  return <main className="stand-scores score-arena">
    <div className="scores-intro">
      <div><h1>{copy("SKORLAR.", "SCORES.")}</h1><p>{copy("Bir tur oyna. Listede yerini al.", "Play a round. Make the board.")}</p></div>
      <Trophy size={64} strokeWidth={1.4} aria-hidden="true" />
    </div>
    <div className="score-game-picker" role="group" aria-label={copy("Oyun", "Game")}>
      {gameList.map((entry) => <button key={entry.id} aria-pressed={game === entry.id} onClick={() => { setGame(entry.id); setVersion("current"); }}>{entry.name}</button>)}
    </div>
    <section className="score-board" aria-label={copy(`${selected.name} skorları`, `${selected.name} scores`)}>
      <div className="score-board-heading">
        <h2>{selected.name}</h2>
        <button className="score-refresh" disabled={refreshing} onClick={() => void refresh()} aria-label={copy("Skorları yenile", "Refresh scores")} title={copy("Skorları yenile", "Refresh scores")}><RefreshCw size={18} className={refreshing ? "is-refreshing" : ""} /></button>
      </div>
      {error && <div className="score-recovery" role="alert"><p>{copy("Skorlar güncellenemedi. Bağlantı geldiğinde tekrar dene.", "Could not update scores. Try again when connected.")}</p><button className="quiet-button" disabled={refreshing} onClick={() => void refresh()}>{copy("Tekrar dene", "Retry")}</button></div>}
      {!data && !error ? <div className="score-loading" role="status" aria-label={copy("Skorlar yükleniyor", "Loading scores")}><span className="score-loading-label">{copy("Skorlar geliyor…", "Getting the scores…")}</span>{[0, 1, 2].map((row) => <div key={row} className="score-skeleton" aria-hidden="true"><i /><i /><i /></div>)}</div>
      : data?.entries.length ? <ol className="stand-score-list score-rankings">
        {data.entries.map((entry) => <li key={entry.id} className={entry.rank === 1 ? "score-leader" : ""}>
          <span className="score-place" aria-label={copy(`${entry.rank}. sıra`, `Rank ${entry.rank}`)}>{entry.rank === 1 ? <Trophy size={23} aria-hidden="true" /> : String(entry.rank).padStart(2, "0")}</span>
          <strong>{entry.challenger === "Anonymous Challenger" ? copy("İsimsiz oyuncu", "Anonymous player") : entry.challenger}</strong>
          <b>{entry.score.toLocaleString(language === "tr" ? "tr-TR" : "en-GB")}<small>{copy("puan", "points")}</small></b>
        </li>)}
      </ol> : data && <div className="score-empty"><Trophy size={42} strokeWidth={1.5} aria-hidden="true" /><h3>{copy("İlk skor senin olsun.", "Set the first score.")}</h3><p>{copy("Bu oyun için henüz bir kayıt yok. Bir tur deneyip başlangıcı sen yap.", "No records for this game yet. Play a round and get it started.")}</p><button className="play-link" onClick={() => onPlay(game)}>{copy("Oyuna geç", "Play this game")}<ArrowRight size={20} /></button></div>}
      <div className="score-board-bottom"><span>{version === "current" ? copy("Güncel oyun", "Current game") : copy("Önceki rekorlar", "Earlier records")}</span><button className="quiet-button" onClick={() => onPlay(game)}>{copy("Rekorunu dene", "Take your shot")}<ArrowRight size={17} /></button></div>
    </section>
    <details className="score-history"><summary>{copy("Önceki oyun sürümlerinin rekorları", "Records from earlier game versions")}</summary><p>{copy("Kurallar değiştiğinde eski rekorları kendi listesinde koruyoruz.", "When rules change, earlier records stay on their own board.")}</p><label>{copy("Liste", "Board")}<select value={version} onChange={(event) => setVersion(event.target.value)}><option value="current">{copy("Güncel oyun", "Current game")}</option>{currentStandRules(game) === 4 && <option value="3">{copy("Önceki oyun", "Previous game")}</option>}{game !== "color-cascade" && <><option value="2">{copy("Önceki stant turları", "Earlier stand rounds")}</option><option value="1">{copy("İlk sürüm", "Original version")}</option></>}</select></label></details>
  </main>;
}
