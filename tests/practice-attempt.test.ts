import { describe, expect, it, vi } from "vitest";
import { createPracticeAttempt } from "../src/game/practiceAttempt";

describe("guided practice answer locking", () => {
  it("locks correct selection against later clicks, keyboard activation and double submissions", () => {
    const practice = createPracticeAttempt(4);
    const check = vi.fn(() => true);
    practice.choose(2);
    const resolved = practice.submit(check);
    expect(resolved).toEqual({ answer: 2, feedback: true, attempt: 1 });
    expect(practice.choose(0)).toBe(resolved);
    expect(practice.submit(check)).toBe(resolved);
    expect(check).toHaveBeenCalledTimes(1);
    expect(check).toHaveBeenCalledWith(2);
  });
  it("requires a deliberate new selection after wrong feedback before allowing retry", () => {
    const practice = createPracticeAttempt(3);
    const check = vi.fn((answer: number) => answer === 1);
    practice.choose(0);
    const wrong = practice.submit(check);
    expect(wrong.feedback).toBe(false);
    expect(practice.submit(check)).toBe(wrong);
    expect(practice.choose(0)).toBe(wrong);
    expect(practice.submit(check)).toBe(wrong);
    expect(check).toHaveBeenCalledTimes(1);
    practice.choose(1);
    expect(practice.state.feedback).toBeNull();
    expect(practice.submit(check)).toEqual({
      answer: 1,
      feedback: true,
      attempt: 2,
    });
    expect(check).toHaveBeenCalledTimes(2);
  });
  it("keeps previously completed practice locked when revisiting the lesson", () => {
    const practice = createPracticeAttempt(4, 3);
    const check = vi.fn();
    practice.choose(0);
    practice.submit(check);
    expect(practice.state).toEqual({ answer: 3, feedback: true, attempt: 0 });
    expect(check).not.toHaveBeenCalled();
  });
  it("rejects missing or invalid selections and blocks reentrant submission", () => {
    const practice = createPracticeAttempt(3);
    const check = vi.fn(() => true);
    practice.submit(check);
    for (const answer of [-1, 3, 1.5, Number.NaN]) practice.choose(answer);
    practice.submit(check);
    expect(check).not.toHaveBeenCalled();
    practice.choose(1);
    practice.submit(() => {
      practice.choose(2);
      practice.submit(check);
      return true;
    });
    expect(practice.state.answer).toBe(1);
    expect(check).not.toHaveBeenCalled();
  });
});
