import { describe, expect, it } from "vitest";
import { GeneratedQuestionsSchema } from "@/lib/ai/schemas";
import {
  normalizeQuestionOptions,
  OTHER_CONTEXT_OPTION,
} from "@/lib/ai/questions";

describe("normalizeQuestionOptions", () => {
  it("always returns 3 to 6 options with Other once at the end", () => {
    const options = normalizeQuestionOptions([
      " Limited time ",
      "Limited budget",
      "Limited time",
      "Other",
    ]);

    expect(options).toEqual(["Limited time", "Limited budget", OTHER_CONTEXT_OPTION]);
    expect(options).toHaveLength(3);
  });

  it("adds neutral fallbacks when generated options are incomplete", () => {
    expect(normalizeQuestionOptions(["Other"])).toEqual([
      "No preference",
      "Not sure yet",
      OTHER_CONTEXT_OPTION,
    ]);
  });
});

describe("GeneratedQuestionsSchema", () => {
  const validQuestion = {
    question: "How much time can you give this each week?",
    reason: "Available time changes the pace.",
    options: ["Under 2 hours", "2–5 hours"],
  };

  it("accepts two short questions with 2 to 5 generated options", () => {
    expect(GeneratedQuestionsSchema.safeParse({
      questions: [validQuestion, validQuestion],
    }).success).toBe(true);
  });

  it("rejects questions over 100 characters", () => {
    expect(GeneratedQuestionsSchema.safeParse({
      questions: [
        { ...validQuestion, question: "Q".repeat(101) },
        validQuestion,
      ],
    }).success).toBe(false);
  });
});
