export interface GradableQuestion {
  correctAnswer: string;
}

/** Counts correct answers; `answers` is keyed by question position. */
export const scoreAnswers = (
  questions: GradableQuestion[],
  answers: Record<number, string>,
): number =>
  questions.reduce(
    (total, question, index) => total + (answers[index] === question.correctAnswer ? 1 : 0),
    0,
  );
