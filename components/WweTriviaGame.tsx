"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, ChevronRight, Clock3, Flame, RotateCcw, Trophy, X } from "lucide-react";
import { QUESTIONS } from "@/lib/questions";
import type { ScoreEntry, TriviaQuestion } from "@/lib/types";

const LEVELS = [
  { id: 1, name: "Rookie", label: "Remembering", copy: "Flagship events, iconic lines and household names.", color: "#2979ff" },
  { id: 2, name: "Contender", label: "Understanding", copy: "Link the venues, title changes and defining eras.", color: "#12b76a" },
  { id: 3, name: "Veteran", label: "Applying", copy: "Sequence moments and track multi-year storylines.", color: "#9b51e0" },
  { id: 4, name: "Legend", label: "Analyzing", copy: "Decode crowd revolts, streaks and custom details.", color: "#ff7a1a" },
  { id: 5, name: "Hall of Famer", label: "Evaluating", copy: "Deep cuts, production quirks and edge data.", color: "#d7b55b" },
] as const;

type Screen = "select" | "quiz" | "result" | "leaders";
type SessionQuestion = TriviaQuestion & { inputMode: "mcq" | "text" };
const shuffle = <T,>(items: T[]) => [...items].sort(() => Math.random() - 0.5);
const formatTime = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

function fiveChoices(question: TriviaQuestion) {
  const related = QUESTIONS
    .filter((candidate) => candidate.id !== question.id && candidate.answer !== question.answer)
    .sort((a, b) => {
      const score = (candidate: TriviaQuestion) =>
        (candidate.level === question.level ? 2 : 0) + (candidate.domain === question.domain ? 4 : 0);
      return score(b) - score(a);
    })
    .map((candidate) => candidate.answer);
  const distractors = Array.from(new Set([...question.distractors, ...related])).slice(0, 4);
  return shuffle([question.answer, ...distractors]);
}

export default function WweTriviaGame() {
  const [screen, setScreen] = useState<Screen>("select");
  const [level, setLevel] = useState(1);
  const [session, setSession] = useState<SessionQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [textAnswer, setTextAnswer] = useState("");
  const [grading, setGrading] = useState(false);
  const [correct, setCorrect] = useState<boolean | null>(null);
  const [startedAt, setStartedAt] = useState(0);
  const [duration, setDuration] = useState(0);
  const [leaders, setLeaders] = useState<ScoreEntry[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("wwe-trivia-leaders");
    if (saved) setLeaders(JSON.parse(saved));
  }, []);

  const activeLevel = LEVELS[level - 1];
  const current = session[index];
  const answers = useMemo(() => current ? fiveChoices(current) : [], [current]);

  function startQuiz(chosenLevel = level) {
    const pool = shuffle(QUESTIONS.filter((question) => question.level === chosenLevel));
    const selectedQuestions = pool.slice(0, Math.min(10, pool.length));
    const textCount = Math.max(1, Math.round(selectedQuestions.length * 0.2));
    const textSlots = new Set(Array.from({ length: textCount }, (_, slot) =>
      Math.min(selectedQuestions.length - 1, Math.floor(((slot + 1) * selectedQuestions.length) / (textCount + 1)))
    ));
    setLevel(chosenLevel);
    setSession(selectedQuestions.map((question, questionIndex) => ({
      ...question,
      inputMode: textSlots.has(questionIndex) ? "text" : "mcq",
    })));
    setIndex(0); setScore(0); setStreak(0); setSelected(null); setCorrect(null); setTextAnswer("");
    setStartedAt(Date.now()); setScreen("quiz");
  }

  function markAnswer(answer: string) {
    if (correct !== null) return;
    const isCorrect = answer === current.answer;
    setSelected(answer); setCorrect(isCorrect);
    if (isCorrect) { setScore((value) => value + 1); setStreak((value) => value + 1); } else setStreak(0);
  }

  async function gradeText() {
    if (!textAnswer.trim() || grading || correct !== null) return;
    setGrading(true);
    const response = await fetch("/api/grade", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userAnswer: textAnswer, canonicalAnswer: current.answer }) });
    const result = await response.json();
    setSelected(textAnswer); setCorrect(Boolean(result.correct));
    if (result.correct) { setScore((value) => value + 1); setStreak((value) => value + 1); } else setStreak(0);
    setGrading(false);
  }

  function nextQuestion() {
    if (index + 1 < session.length) {
      setIndex((value) => value + 1); setSelected(null); setCorrect(null); setTextAnswer("");
      return;
    }
    const elapsed = Math.max(1, Math.round((Date.now() - startedAt) / 1000));
    setDuration(elapsed);
    const entry: ScoreEntry = { name: "You", level, score, total: session.length, durationSec: elapsed, at: Date.now() };
    const next = [...leaders, entry].sort((a, b) => b.score - a.score || a.durationSec - b.durationSec).slice(0, 20);
    setLeaders(next); localStorage.setItem("wwe-trivia-leaders", JSON.stringify(next)); setScreen("result");
  }

  return (
    <main className="app-shell" style={{ "--level": activeLevel.color } as React.CSSProperties}>
      <div className="grain" />
      <header className="topbar">
        <button className="brand" onClick={() => setScreen("select")} aria-label="WWE Era Trivia home">
          <img src="/wwe-logo.svg" alt="WWE" />
          <span><strong>ERA TRIVIA</strong><small>2009—2018</small></span>
        </button>
        <button className="leader-link" onClick={() => setScreen("leaders")}><Trophy size={18} /> Leaderboard</button>
      </header>

      {screen === "select" && <section className="select-screen">
        <div className="intro"><span className="eyebrow">10 YEARS · 5 LEVELS · ONE ERA</span><h1>HOW WELL DO YOU<br /><em>KNOW THE ERA?</em></h1><p>Start with the obvious. End in the deep cuts. Pick your level and step into the ring.</p></div>
        <div className="game-mix"><strong>80% five-choice · 20% flexible typing</strong><span>Fast rounds, forgiving answers, no mode setup.</span></div>
        <div className="level-grid">{LEVELS.map((item) => <button key={item.id} className="level-card" style={{ "--card": item.color } as React.CSSProperties} onClick={() => startQuiz(item.id)}><span className="level-number">0{item.id}</span><span className="level-label">{item.label}</span><strong>{item.name}</strong><p>{item.copy}</p><small className="pool-count">{QUESTIONS.filter((question) => question.level === item.id).length} verified demo questions</small><span className="card-action">Enter level <ChevronRight size={18} /></span></button>)}</div>
        <p className="disclaimer">Independent fan project. WWE and its marks are property of their respective owners.</p>
      </section>}

      {screen === "quiz" && current && <section className="quiz-screen">
        <div className="quiz-meta"><button className="back" onClick={() => setScreen("select")}><ArrowLeft size={18} /> Exit</button><span className="rank-chip">Level {level} · {activeLevel.name}</span><span className="counter">{String(index + 1).padStart(2, "0")} / {String(session.length).padStart(2, "0")}</span></div>
        <div className="progress"><span style={{ width: `${((index + 1) / session.length) * 100}%` }} /></div>
        <div className="score-strip"><span><strong>{score}</strong> score</span><span><Flame size={17} /> <strong>{streak}</strong> streak</span></div>
        <article className="question-panel"><div className="question-tags"><span className="domain">{current.domain.replaceAll("_", " ")}</span><span className="format-chip">{current.inputMode === "mcq" ? "5 OPTIONS" : "FLEXIBLE MATCH"}</span></div><h2>{current.question}</h2>
          {current.inputMode === "mcq" ? <div className="answers">{answers.map((answer, answerIndex) => { const state = correct !== null ? (answer === current.answer ? "correct" : answer === selected ? "wrong" : "dim") : ""; return <button key={answer} className={state} onClick={() => markAnswer(answer)}><span>{String.fromCharCode(65 + answerIndex)}</span>{answer}{state === "correct" && <Check size={20} />}{state === "wrong" && <X size={20} />}</button>; })}</div> : <div className="text-mode"><label htmlFor="answer">Type what you remember — spelling does not have to be perfect</label><div><input id="answer" value={textAnswer} disabled={correct !== null} onChange={(event) => setTextAnswer(event.target.value)} onKeyDown={(event) => event.key === "Enter" && gradeText()} placeholder="A name, place or moment is enough…" /><button onClick={gradeText} disabled={!textAnswer.trim() || grading}>{grading ? "Checking…" : "Lock in"}</button></div></div>}
          {correct !== null && <div className={`verdict ${correct ? "is-correct" : "is-wrong"}`}><span>{correct ? <Check /> : <X />}</span><div><strong>{correct ? "Correct." : "Not quite."}</strong>{!correct && <p>The answer is {current.answer}.</p>}</div><button onClick={nextQuestion}>{index + 1 === session.length ? "See result" : "Next question"}<ChevronRight size={18} /></button></div>}
        </article>
      </section>}

      {screen === "result" && <section className="result-screen"><span className="result-kicker">FINAL BELL</span><div className="score-ring"><strong>{score}</strong><span>/ {session.length}</span></div><h1>{score === session.length ? "Perfect show." : score / session.length >= .7 ? "Main-event material." : "Back to the Performance Center."}</h1><p>{activeLevel.name} · Arcade mix</p><div className="result-stats"><span><Trophy /> {Math.round((score / session.length) * 100)}% accuracy</span><span><Clock3 /> {formatTime(duration)}</span></div><div className="result-actions"><button className="primary" onClick={() => startQuiz()}><RotateCcw size={18} /> Run it back</button><button onClick={() => setScreen("select")}>Choose another level</button></div></section>}

      {screen === "leaders" && <section className="leaders-screen"><button className="back" onClick={() => setScreen("select")}><ArrowLeft size={18} /> Back</button><span className="eyebrow">LOCAL RANKINGS</span><h1>LEADERBOARD</h1><p className="leader-note">Scores are saved on this device. Connect the optional Firebase free tier for shared rankings.</p><div className="leader-table"><div className="leader-head"><span>Rank</span><span>Player</span><span>Level</span><span>Score</span><span>Time</span></div>{leaders.length ? leaders.map((entry, i) => <div className="leader-row" key={`${entry.at}-${i}`}><span>{String(i + 1).padStart(2, "0")}</span><strong>{entry.name}</strong><span>{LEVELS[entry.level - 1].name}</span><strong>{entry.score}/{entry.total}</strong><span>{formatTime(entry.durationSec)}</span></div>) : <div className="empty">No scores yet. Your first run sets the pace.</div>}</div></section>}
    </main>
  );
}
