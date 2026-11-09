export interface PracticeAttemptState {
  answer: number | null;
  feedback: boolean | null;
  attempt: number;
}

/** Synchronous gate protects resolved practice from queued clicks and key repeats. */
export function createPracticeAttempt(
  options: number,
  completedAnswer?: number,
) {
  let state: PracticeAttemptState = {
    answer: completedAnswer ?? null,
    feedback: completedAnswer === undefined ? null : true,
    attempt: 0,
  };
  let submitting = false;
  return {
    get state() {
      return state;
    },
    choose(answer: number) {
      if (
        submitting ||
        state.feedback === true ||
        !Number.isInteger(answer) ||
        answer < 0 ||
        answer >= options ||
        answer === state.answer
      )
        return state;
      state = { ...state, answer, feedback: null };
      return state;
    },
    submit(check: (answer: number) => boolean) {
      if (submitting || state.answer === null || state.feedback !== null)
        return state;
      submitting = true;
      try {
        const correct = check(state.answer);
        state = { ...state, feedback: correct, attempt: state.attempt + 1 };
      } finally {
        submitting = false;
      }
      return state;
    },
  };
}
