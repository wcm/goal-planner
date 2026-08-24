"use client";

import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  normalizeQuestionOptions,
  OTHER_CONTEXT_OPTION,
} from "@/lib/ai/questions";
import type { GeneratedQuestion } from "@/lib/planner/types";

type ContextAnswer = { question: string; answer: string };
type QuestionResponse = { selected: string[]; other: string };

const NO_ANSWER = "No preference provided.";
const SELECTED_PREFIX = "Selected: ";
const OTHER_PREFIX = "Other: ";
const ADDITIONAL_CONTEXT_QUESTION = "Anything else that feels critical?";

function initialResponse(
  question: GeneratedQuestion,
  initialAnswers?: ContextAnswer[],
): QuestionResponse {
  const previous = initialAnswers?.find((entry) => entry.question === question.question)?.answer;
  if (!previous || previous === NO_ANSWER) return { selected: [], other: "" };

  const options = normalizeQuestionOptions(question.options);
  const selectedLine = previous.split("\n").find((line) => line.startsWith(SELECTED_PREFIX));
  const otherLine = previous.split("\n").find((line) => line.startsWith(OTHER_PREFIX));
  if (selectedLine || otherLine) {
    const selected = selectedLine
      ? selectedLine
        .slice(SELECTED_PREFIX.length)
        .split(";")
        .map((option) => option.trim())
        .filter((option) => options.includes(option))
      : [];
    const other = otherLine?.slice(OTHER_PREFIX.length).trim() ?? "";
    if (other && !selected.includes(OTHER_CONTEXT_OPTION)) selected.push(OTHER_CONTEXT_OPTION);
    return { selected, other };
  }

  return { selected: [OTHER_CONTEXT_OPTION], other: previous };
}

function responseText(response: QuestionResponse) {
  if (response.selected.length === 0) return NO_ANSWER;

  const other = response.other.trim();
  const selected = response.selected.filter(
    (option) => option !== OTHER_CONTEXT_OPTION || !other,
  );
  const lines: string[] = [];
  if (selected.length > 0) lines.push(`${SELECTED_PREFIX}${selected.join("; ")}`);
  if (response.selected.includes(OTHER_CONTEXT_OPTION) && other) {
    lines.push(`${OTHER_PREFIX}${other}`);
  }
  return lines.join("\n") || NO_ANSWER;
}

export function ContextQuestionForm({
  questions,
  busy,
  submitLabel,
  initialAnswers,
  onCancel,
  onSubmit,
}: {
  questions: GeneratedQuestion[];
  busy: boolean;
  submitLabel: string;
  initialAnswers?: ContextAnswer[];
  onCancel?: () => void;
  onSubmit: (answers: ContextAnswer[]) => void;
}) {
  const [responses, setResponses] = useState<QuestionResponse[]>(
    () => questions.map((question) => initialResponse(question, initialAnswers)),
  );
  const [additionalContext, setAdditionalContext] = useState(
    () => initialAnswers?.find((entry) => entry.question === ADDITIONAL_CONTEXT_QUESTION)?.answer ?? "",
  );

  function toggleOption(questionIndex: number, option: string) {
    setResponses((current) => current.map((response, index) => index === questionIndex
      ? {
        ...response,
        selected: response.selected.includes(option)
          ? response.selected.filter((selected) => selected !== option)
          : [...response.selected, option],
      }
      : response));
  }

  function updateOther(questionIndex: number, other: string) {
    setResponses((current) => current.map((response, index) => index === questionIndex
      ? { ...response, other }
      : response));
  }

  function submit() {
    const generatedAnswers = questions.map((question, index) => ({
      question: question.question,
      answer: responseText(responses[index] ?? { selected: [], other: "" }),
    }));
    const extra = additionalContext.trim();
    onSubmit(extra
      ? generatedAnswers.concat({ question: ADDITIONAL_CONTEXT_QUESTION, answer: extra })
      : generatedAnswers);
  }

  return (
    <>
      <div className="question-list">
        {questions.map((question, questionIndex) => {
          const options = normalizeQuestionOptions(question.options);
          const response = responses[questionIndex] ?? { selected: [], other: "" };
          const otherSelected = response.selected.includes(OTHER_CONTEXT_OPTION);
          const questionId = `context-question-${questionIndex}`;
          return (
            <div className="context-question-section" key={`${question.question}-${questionIndex}`}>
              {questionIndex > 0 && <div className="context-question-divider" aria-hidden="true" />}
              <div
                className="context-question"
                role="group"
                aria-labelledby={questionId}
              >
                <div className="context-question-title" id={questionId}>
                  <strong>{questionIndex + 1}</strong>
                  <span>{question.question}</span>
                </div>
                <div className="context-option-list">
                  {options.map((option, optionIndex) => {
                    const selected = response.selected.includes(option);
                    return (
                      <button
                        type="button"
                        className={`context-option-chip ${selected ? "selected" : ""}`}
                        onClick={() => toggleOption(questionIndex, option)}
                        aria-pressed={selected}
                        autoFocus={questionIndex === 0 && optionIndex === 0}
                        key={option}
                      >
                        {selected && <Check size={14} strokeWidth={2.5} />}
                        {option}
                      </button>
                    );
                  })}
                </div>
                {otherSelected && (
                  <label className="context-other-field">
                    <textarea
                      value={response.other}
                      onChange={(event) => updateOther(questionIndex, event.target.value)}
                      placeholder="Add your own answer…"
                      aria-label={`Other answer for ${question.question}`}
                      maxLength={1400}
                      rows={3}
                      autoFocus
                    />
                  </label>
                )}
              </div>
            </div>
          );
        })}
        <label className="additional-context">
          <span><strong aria-hidden="true">+</strong> {ADDITIONAL_CONTEXT_QUESTION}</span>
          <textarea
            value={additionalContext}
            onChange={(event) => setAdditionalContext(event.target.value)}
            placeholder="Add any constraint, preference, or detail…"
            maxLength={2000}
            rows={3}
          />
        </label>
      </div>
      <div className="dialog-actions">
        {onCancel && <Button variant="ghost" onClick={onCancel} disabled={busy}>Cancel</Button>}
        <Button onClick={submit} disabled={busy}>{submitLabel} <ArrowRight size={17} /></Button>
      </div>
    </>
  );
}
