import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { ContextQuestionForm } from "@/components/context-question-form";
import type { GeneratedQuestion } from "@/lib/planner/types";

const question: GeneratedQuestion = {
  question: "Which constraints are most likely to affect progress?",
  reason: "The plan can address likely blockers early.",
  options: ["Limited time", "Limited budget", "Missing skills", "Other"],
};

const secondQuestion: GeneratedQuestion = {
  question: "What kind of support would make this plan easier to follow?",
  reason: "The plan can account for useful support.",
  options: ["Accountability", "Clear milestones", "Templates", "Other"],
};

afterEach(cleanup);

describe("ContextQuestionForm", () => {
  it("uses plain grouped containers with an explicit divider between questions", () => {
    const { container } = render(
      <ContextQuestionForm
        questions={[question, secondQuestion]}
        busy={false}
        submitLabel="Build my plan"
        onSubmit={vi.fn()}
      />,
    );

    expect(container.querySelector("fieldset")).not.toBeInTheDocument();
    expect(container.querySelectorAll(".context-question-divider")).toHaveLength(1);
    expect(screen.getAllByRole("group")).toHaveLength(2);
  });

  it("supports multiple chips and reveals custom option entry only for Other", () => {
    const onSubmit = vi.fn();
    render(
      <ContextQuestionForm
        questions={[question]}
        busy={false}
        submitLabel="Build my plan"
        onSubmit={onSubmit}
      />,
    );

    expect(screen.queryByRole("textbox", { name: `Other answer for ${question.question}` })).not.toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Anything else that feels critical?" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Limited time" }));
    fireEvent.click(screen.getByRole("button", { name: "Limited budget" }));
    expect(screen.getByRole("button", { name: "Limited time" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Limited budget" })).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(screen.getByRole("button", { name: "Other" }));
    const otherInput = screen.getByRole("textbox", { name: `Other answer for ${question.question}` });
    fireEvent.change(otherInput, { target: { value: "I also need weekends free." } });
    fireEvent.click(screen.getByRole("button", { name: "Build my plan" }));

    expect(onSubmit).toHaveBeenCalledWith([{
      question: question.question,
      answer: "Selected: Limited time; Limited budget\nOther: I also need weekends free.",
    }]);
  });

  it("submits a readable no-preference answer when nothing is selected", () => {
    const onSubmit = vi.fn();
    render(
      <ContextQuestionForm
        questions={[question]}
        busy={false}
        submitLabel="Build my plan"
        onSubmit={onSubmit}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Build my plan" }));

    expect(onSubmit).toHaveBeenCalledWith([{
      question: question.question,
      answer: "No preference provided.",
    }]);
  });

  it("adds the final free-typing answer to the submitted context", () => {
    const onSubmit = vi.fn();
    render(
      <ContextQuestionForm
        questions={[question]}
        busy={false}
        submitLabel="Build my plan"
        onSubmit={onSubmit}
      />,
    );

    fireEvent.change(screen.getByRole("textbox", { name: "Anything else that feels critical?" }), {
      target: { value: "Keep weekends free." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Build my plan" }));

    expect(onSubmit).toHaveBeenCalledWith([
      { question: question.question, answer: "No preference provided." },
      { question: "Anything else that feels critical?", answer: "Keep weekends free." },
    ]);
  });
});
