'use client';

import { useState } from 'react';
import { Check, HelpCircle, RotateCcw, X } from 'lucide-react';
import { QuizQuestion } from '@birthday/shared';

interface QuizGameProps {
  questions: QuizQuestion[];
  lowMessage: string;
  mediumMessage: string;
  highMessage: string;
}

export default function QuizGame({ questions, lowMessage, mediumMessage, highMessage }: QuizGameProps) {
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);

  if (questions.length === 0) {
    return <section className="quiz-section glass-panel"><p>No quiz questions have been added yet.</p></section>;
  }

  const finished = index >= questions.length;
  const question = questions[index];
  const choose = (optionIndex: number) => {
    if (selected !== null || !question) return;
    setSelected(optionIndex);
    if (optionIndex === question.correctIndex) setScore((current) => current + 1);
  };
  const next = () => {
    setSelected(null);
    setIndex((current) => current + 1);
  };
  const reset = () => {
    setIndex(0);
    setScore(0);
    setSelected(null);
  };

  return (
    <section className="quiz-section glass-panel" aria-labelledby="quiz-title">
      <span className="badge-pill"><HelpCircle size={14} /> Our Little Quiz</span>
      <h2 id="quiz-title" className="section-title serif-heading">How well do you know us?</h2>
      {finished ? (
        <div className="quiz-result">
          <p className="quiz-score">{score} / {questions.length}</p>
          <p>{score / questions.length >= 0.8 ? highMessage : score / questions.length >= 0.5 ? mediumMessage : lowMessage}</p>
          <button className="romantic-btn" type="button" onClick={reset}><RotateCcw size={16} /> Play again</button>
        </div>
      ) : (
        <div className="quiz-question">
          <p className="quiz-progress">Question {index + 1} of {questions.length}</p>
          <h3>{question.question}</h3>
          <div className="quiz-options">
            {question.options.map((option, optionIndex) => {
              const isCorrect = selected !== null && optionIndex === question.correctIndex;
              const isWrong = selected === optionIndex && !isCorrect;
              return (
                <button key={optionIndex} type="button" className={`quiz-option ${isCorrect ? 'correct' : ''} ${isWrong ? 'wrong' : ''}`} onClick={() => choose(optionIndex)} disabled={selected !== null}>
                  {isCorrect ? <Check size={16} /> : isWrong ? <X size={16} /> : null}
                  {option}
                </button>
              );
            })}
          </div>
          {selected !== null && (
            <button className="secondary-btn" type="button" onClick={next}>Next question</button>
          )}
        </div>
      )}
      <style jsx>{`
        .quiz-section { margin: 20px 16px; padding: 24px 18px; text-align: center; }
        .quiz-progress { color: var(--text-muted); margin: 12px 0; }
        .quiz-question h3 { color: var(--text-soft); margin-bottom: 16px; }
        .quiz-options { display: grid; gap: 10px; }
        .quiz-option { min-height: 48px; padding: 12px 14px; border-radius: 12px; border: 1px solid var(--bg-card-border); background: rgba(255,255,255,.06); color: var(--text-soft); font: inherit; text-align: left; display: flex; gap: 8px; align-items: center; cursor: pointer; }
        .quiz-option.correct { background: rgba(57, 180, 100, .25); border-color: #9be8ae; }
        .quiz-option.wrong { background: rgba(220, 50, 80, .25); border-color: #ff9bad; }
        .quiz-result { display: grid; gap: 16px; justify-items: center; }
        .quiz-score { font-size: 2rem; color: var(--rose-soft); }
      `}</style>
    </section>
  );
}
