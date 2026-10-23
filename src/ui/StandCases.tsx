import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  FileSearch,
  RotateCcw,
  ShieldQuestion,
  Trophy,
  X,
} from "lucide-react";
import { useLanguage } from "./i18n";
import { useChallengerIdentity } from "./arena-data";
import "./cases.css";
import "./game-experience.css";
type View = {
  id: string;
  game: string;
  deadline: number;
  serverNow: number;
  completed: boolean;
  score: number;
  cursor?: number;
  count?: number;
  statement?: string;
  reveal?: {
    correct: boolean;
    fact: boolean;
    explanation: string;
  };
  title?: string;
  brief?: string;
  clues?: {
    time: string;
    text: string;
  }[];
  questions?: {
    text: string;
    options: string[];
    correctOption?: number;
    explanation?: string;
    correct?: boolean;
  }[];
};
class CaseRequestError extends Error {
  constructor(public status: number) { super(String(status)); }
}
async function request(path: string, body?: unknown, signal?: AbortSignal) {
  const response = await fetch(`/api/stand${path}`, {
    method: body ? "POST" : "GET",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(12000)]) : AbortSignal.timeout(12000),
  });
  if (!response.ok) throw new CaseRequestError(response.status);
  const result = await response.json();
  return result as View;
}
export default function StandCases({
  game,
}: {
  game: "myth-fact" | "digital-detective";
}) {
  const { language, copy } = useLanguage(),
    identity = useChallengerIdentity();
  const [view, setView] = useState<View | null>(null),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [reveal, setReveal] = useState(false),
    [answers, setAnswers] = useState<(number | null)[]>([null, null, null]),
    [remaining, setRemaining] = useState(0);
  const [recovering, setRecovering] = useState(false);
  const base = useRef({ server: 0, local: 0 }),
    lock = useRef(false), nextExpiryCheck = useRef(0);
  const apply = (result: View) => {
    base.current = { server: result.serverNow, local: performance.now() };
    setView(result);
    setRecovering(false);
    setError("");
    if(result.game==="digital-detective"&&!result.completed){
      try{const saved=JSON.parse(sessionStorage.getItem(`stand-draft-${result.id}`)??"null");if(Array.isArray(saved)&&saved.length===3&&saved.every(value=>value===null||[0,1,2].includes(value)))setAnswers(saved);}catch{/* Invalid local drafts are ignored. */}
    }
    setRemaining(
      Math.max(0, Math.ceil((result.deadline - result.serverNow) / 1000)),
    );
  };
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const id = sessionStorage.getItem(`stand-${game}`);
    if (!id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    request(`/${id}?language=${language}`, undefined, controller.signal)
      .then((result) => {
        if (active) {
          apply(result);
        }
      })
      .catch((failure: unknown) => {
        if (active) {
          if(failure instanceof CaseRequestError && [403,404].includes(failure.status)) {
            sessionStorage.removeItem(`stand-${game}`);setView(null);setRecovering(false);
          } else {
            setRecovering(true);
            setError(copy("Devam eden oyununa bağlanılamadı. Turun korunuyor; bağlantıyı kontrol edip tekrar dene.", "Could not reconnect to your game. Your run is kept; check your connection and retry."));
          }
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [game, language]);
  useEffect(()=>{if(view?.game==="digital-detective"&&!view.completed)sessionStorage.setItem(`stand-draft-${view.id}`,JSON.stringify(answers));},[view?.id,view?.completed,answers]);
  useEffect(() => {
    if (!view || view.completed) return;
    const interval = setInterval(() => {
      const now = base.current.server + performance.now() - base.current.local,
        left = Math.max(0, Math.ceil((view.deadline - now) / 1000));
      setRemaining(left);
      if (left === 0 && !lock.current && performance.now() >= nextExpiryCheck.current) {
        nextExpiryCheck.current = performance.now() + 5000;
        lock.current = true;
        void request(`/${view.id}?language=${language}`)
          .then(apply)
          .catch(() =>
            setError(
              copy(
                "Sonuç alınamadı. Tekrar dene.",
                "Could not fetch the result. Retry.",
              ),
            ),
          )
          .finally(() => {
            lock.current = false;
          });
      }
    }, 200);
    return () => clearInterval(interval);
  }, [view?.id, view?.completed, view?.deadline, language]);
  const act = async (action: () => Promise<View>) => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      const result = await action();
      apply(result);
      return result;
    } catch (failure: unknown) {
      if(failure instanceof CaseRequestError && [403,404].includes(failure.status)) {
        sessionStorage.removeItem(`stand-${game}`);
        setView(null);setRecovering(false);setReveal(false);
      }
      setError(
        copy(
          "Yanıt kaydedilemedi. Bağlantıyı kontrol edip tekrar dene.",
          "Your response could not be saved. Check the connection and retry.",
        ),
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  const start = async () => {
    const result = await act(() =>
      request("/start", {
        game,
        participantId: identity.participantId,
        nickname: identity.challenger,
        language,
      }),
    );
    if (result) {
      sessionStorage.setItem(`stand-${game}`, result.id);
      setAnswers([null, null, null]);
      setReveal(false);
    }
  };
  const answer = async (value: boolean) => {
    if (!view || view.completed || reveal) return;
    const result = await act(() =>
      request(`/${view.id}/answer`, {
        cursor: view.cursor,
        answer: value,
        language,
      }),
    );
    if (result && !result.completed) setReveal(true);
  };
  useEffect(() => {
    if (game !== "myth-fact" || !view || view.completed || busy) return;
    const key = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const target = e.target;
      if (
        target instanceof HTMLElement &&
        (["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(target.tagName) ||
          target.isContentEditable)
      )
        return;
      if (reveal && e.code === "Enter") {
        e.preventDefault();
        setReveal(false);
      } else if (!reveal && (e.key === "1" || e.key === "2")) {
        e.preventDefault();
        void answer(e.key === "2");
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [game, view, busy, reveal, language]);
  const restart = () => {
    sessionStorage.removeItem(`stand-${game}`);
    setView(null);
    setReveal(false);
    setAnswers([null, null, null]);
    setError("");
    setRecovering(false);
  };
  return (
    <main className="stand-game-page stand-case-page">
      <div className="stand-game-heading">
        <h1>{game === "myth-fact" ? "Myth or Fact" : "Digital Detective"}</h1>
        <p>
          {game === "myth-fact"
            ? copy(
                "İddiayı oku. Efsane mi, gerçek mi?",
                "Read the claim. Myth or fact?",
              )
            : copy(
                "Üç ipucu. Üç karar. Dijital gizemi çöz.",
                "Three clues. Three decisions. Solve the case.",
              )}
        </p>
      </div>
      {error && (
        <div className="case-error" role="alert">
          {error}
          <button
            className="quiet-button"
            disabled={busy}
            onClick={() => {
              const id = view?.id ?? sessionStorage.getItem(`stand-${game}`);
              if (id)
                void act(() => request(`/${id}?language=${language}`));
              else void start();
            }}
          >
            {copy("Tekrar dene", "Retry")}
          </button>
        </div>
      )}
      {loading ? (
        <p role="status">{copy("Oyun hazırlanıyor…", "Preparing the game…")}</p>
      ) : !view && recovering ? (
        <div className="case-reconnect"><FileSearch size={46} aria-hidden="true"/><h2>{copy("Turuna devam et.", "Continue your run.")}</h2><p>{copy("Yukarıdaki Tekrar dene düğmesi son kaydedilen oyunu açar.", "Retry above to open your last saved game.")}</p></div>
      ) : !view ? (
        <div className="game-setup">
          <div className="case-intro-art">
            {game === "myth-fact" ? (
              <ShieldQuestion size={70} />
            ) : (
              <FileSearch size={70} />
            )}
            <h2>
              {game === "myth-fact"
                ? copy("İki seçenek. Bir doğru.", "Two choices. One truth.")
                : copy("Kanıtı takip et.", "Follow the evidence.")}
            </h2>
            <p>
              {game === "myth-fact"
                ? copy(
                    "5 iddiaya cevap ver. Her doğru 100 puan; yanlışta puan kaybetmezsin. Toplam süren 90 saniye.",
                    "Answer five claims. Each correct answer earns 100 points; wrong answers do not subtract points. You have 90 seconds.",
                  )
                : copy(
                    "Kurgu vakadaki üç kaydı oku, sonra üç soruyu cevapla. Her doğru 100 puan. Üç dakikan var; süre başlayınca işlemeye devam eder.",
                    "Read three records from a fictional case, then answer three questions. Each correct answer earns 100 points. You have three minutes; the clock keeps running after you start.",
                  )}
            </p>
          </div>
          <div className="player-setup">
            <label>
              {copy("Takma ad", "Nickname")}
              <input
                maxLength={24}
                value={identity.challenger}
                onChange={(e) => identity.setChallenger(e.target.value)}
                placeholder={copy("İsimsiz oyna", "Play anonymously")}
              />
            </label>
            <small>
              {copy(
                "İsteğe bağlıdır; skor listesinde görünür.",
                "Optional; visible on the scoreboard.",
              )}
            </small>
            <button
              className="play-link"
              disabled={busy}
              onClick={() => void start()}
            >
              {busy
                ? copy("Hazırlanıyor…", "Preparing…")
                : copy("Başla", "Start")}
              <ArrowRight size={20} />
            </button>
          </div>
        </div>
      ) : view.completed ? (
        <section className="stand-result">
          <Trophy size={36} />
          <h2>{copy("TUR TAMAMLANDI.", "ROUND COMPLETE.")}</h2>
          <div className="stand-result-score">{view.score}</div>
          <p>{copy("puan · sonuç kaydedildi", "points · result saved")}</p>
          {view.reveal && <p>{view.reveal.explanation}</p>}
          {view.questions && (
            <div className="detective-debrief">
              {view.questions.map((q, i) => (
                <article key={i}>
                  <strong>
                    {q.correct ? <Check size={20} /> : <X size={20} />} {q.text}
                  </strong>
                  <p>{q.explanation}</p>
                </article>
              ))}
            </div>
          )}
          <div className="result-actions">
            <button className="play-link" onClick={restart}>
              <RotateCcw size={18} />
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
      ) : game === "myth-fact" ? (
        <section className="game-stage myth-stage" data-state={reveal ? "reveal" : "question"}>
          <div className="stage-meta">
            <span>
              {copy("İddia", "Claim")}{" "}
              {Math.min(5, (view.cursor ?? 0) + (reveal ? 0 : 1))}/5
            </span>
            <strong role="timer">{remaining} s</strong>
            <span>
              {view.score} {copy("puan", "points")}
            </span>
          </div>
          <div className="question-progress" aria-hidden="true">{Array.from({length:5},(_,i)=><i key={i} data-complete={i<(view.cursor??0)} data-current={i===(view.cursor??0)}/>)}</div>
          {reveal && view.reveal ? (
            <div className="stand-result myth-reveal" data-correct={view.reveal.correct} aria-live="polite">
              {view.reveal.correct ? <Check size={40} aria-hidden="true"/> : <X size={40} aria-hidden="true"/>}
              <h2>
                {view.reveal.correct
                  ? copy("DOĞRU!", "CORRECT!")
                  : copy("BİR SONRAKİNE.", "NEXT ONE.")}
              </h2>
              <p>
                <strong>
                  {view.reveal.fact
                    ? copy("Bu bir gerçek.", "This is a fact.")
                    : copy("Bu bir efsane.", "This is a myth.")}
                </strong>
              </p>
              <p>{view.reveal.explanation}</p>
              <button className="play-link" onClick={() => setReveal(false)}>
                {copy("Sonraki iddia", "Next claim")}
                <ArrowRight size={20} />
              </button>
            </div>
          ) : (
            <>
              <h2 key={view.cursor} className="claim-statement">{view.statement}</h2>
              <div className="claim-choices">
                <button
                  disabled={busy}
                  className="claim-myth"
                  onClick={() => void answer(false)}
                >
                  <X size={26} />
                  {copy("Efsane", "Myth")}
                  <kbd>1</kbd>
                </button>
                <button
                  disabled={busy}
                  className="claim-fact"
                  onClick={() => void answer(true)}
                >
                  <Check size={26} />
                  {copy("Gerçek", "Fact")}
                  <kbd>2</kbd>
                </button>
              </div>
              <p className="case-key-hint">
                {copy(
                  "Tıkla veya 1 / 2 tuşlarını kullan.",
                  "Click or press 1 / 2.",
                )}
              </p>
            </>
          )}
        </section>
      ) : (
        <section className="game-stage detective-stage">
          <div className="stage-meta">
            <strong>{view.title}</strong>
            <span role="timer">
              {Math.floor(remaining / 60)}:
              {String(remaining % 60).padStart(2, "0")}
            </span>
          </div>
          <p className="case-brief">{view.brief}</p>
          <div className="clue-list">
            {view.clues?.map((clue, i) => (
              <article key={i}>
                <span>{clue.time}</span>
                <p>{clue.text}</p>
              </article>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void act(() =>
                request(`/${view.id}/report`, { answers, language }),
              );
            }}
          >
            <div className="detective-questions">
              {view.questions?.map((q, i) => (
                <fieldset key={i}>
                  <legend>
                    {i + 1}. {q.text}
                  </legend>
                  {q.options.map((option, j) => (
                    <label key={j}>
                      <input
                        type="radio"
                        name={`question-${i}`}
                        value={j}
                        checked={answers[i] === j}
                        onChange={() =>
                          setAnswers((previous) =>
                            previous.map((value, k) => (k === i ? j : value)),
                          )
                        }
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </fieldset>
              ))}
            </div>
            <p className="detective-answer-count" aria-live="polite">{answers.filter(a=>a!==null).length}/3 {copy("karar hazır", "conclusions ready")}</p>
            <button
              className="play-link"
              disabled={busy || answers.some((a) => a === null)}
            >
              {copy("Kararları gönder", "Submit conclusions")}
              <ArrowRight size={20} />
            </button>
          </form>
        </section>
      )}
    </main>
  );
}
