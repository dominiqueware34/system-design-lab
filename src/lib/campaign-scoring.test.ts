import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  SCORE_FORMULA_ID,
  SEASON_PROMPT_COUNT,
  DIFF_MULT,
  aiScoreFromEvaluationScore,
  starsFromAiScore,
  diffMult,
  promptPoints,
  coverageMult,
  seasonScore,
  aggregateSeasonScore,
  isBetterAttempt,
  maxAttemptsFromRules,
  scoreFormulaFromRules,
} from "./campaign-scoring";

describe("campaign-scoring v1_correct_diff_cover", () => {
  it("exports formula id and season size", () => {
    assert.equal(SCORE_FORMULA_ID, "v1_correct_diff_cover");
    assert.equal(SEASON_PROMPT_COUNT, 20);
  });

  it("diff_mult: easy 1.0 / medium 1.35 / hard 1.75", () => {
    assert.equal(DIFF_MULT.easy, 1.0);
    assert.equal(DIFF_MULT.medium, 1.35);
    assert.equal(DIFF_MULT.hard, 1.75);
    assert.equal(diffMult("easy"), 1.0);
    assert.equal(diffMult("medium"), 1.35);
    assert.equal(diffMult("hard"), 1.75);
    assert.equal(diffMult("unknown"), 1.35);
  });

  it("maps evaluation 0–100 to ai_score bands 1–5", () => {
    assert.equal(aiScoreFromEvaluationScore(0), 1);
    assert.equal(aiScoreFromEvaluationScore(19), 1);
    assert.equal(aiScoreFromEvaluationScore(20), 2);
    assert.equal(aiScoreFromEvaluationScore(39), 2);
    assert.equal(aiScoreFromEvaluationScore(40), 3);
    assert.equal(aiScoreFromEvaluationScore(59), 3);
    assert.equal(aiScoreFromEvaluationScore(60), 4);
    assert.equal(aiScoreFromEvaluationScore(79), 4);
    assert.equal(aiScoreFromEvaluationScore(80), 5);
    assert.equal(aiScoreFromEvaluationScore(100), 5);
    assert.equal(aiScoreFromEvaluationScore(-5), 1);
    assert.equal(aiScoreFromEvaluationScore(150), 5);
  });

  it("starsFromAiScore clamps 1–5", () => {
    assert.equal(starsFromAiScore(3), 3);
    assert.equal(starsFromAiScore(0), 1);
    assert.equal(starsFromAiScore(9), 5);
  });

  it("prompt_points = round(ai_score * diff_mult)", () => {
    // easy: 4 * 1.0 = 4
    assert.equal(promptPoints(4, "easy"), 4);
    // medium: 4 * 1.35 = 5.4 → 5
    assert.equal(promptPoints(4, "medium"), 5);
    // hard: 3 * 1.75 = 5.25 → 5
    assert.equal(promptPoints(3, "hard"), 5);
    // hard: 5 * 1.75 = 8.75 → 9
    assert.equal(promptPoints(5, "hard"), 9);
    // medium: 5 * 1.35 = 6.75 → 7
    assert.equal(promptPoints(5, "medium"), 7);
  });

  it("coverage_mult = 0.55 + 0.45 * (N/20)", () => {
    assert.equal(coverageMult(0), 0.55);
    assert.equal(coverageMult(10), 0.55 + 0.45 * 0.5);
    assert.equal(coverageMult(20), 0.55 + 0.45);
    assert.equal(coverageMult(10, 20), 0.775);
  });

  it("season_score = round(sum * coverage_mult)", () => {
    // 10 prompts medium@4 → prompt_points each 5 → sum 50; mult 0.775 → 38.75 → 39
    const sum = 10 * promptPoints(4, "medium");
    assert.equal(sum, 50);
    assert.equal(seasonScore(sum, 10), Math.round(50 * 0.775));
    assert.equal(seasonScore(sum, 10), 39);
  });

  it("aggregateSeasonScore matches worked shape (with round)", () => {
    const bests = [
      ...Array.from({ length: 5 }, (_, i) => ({
        promptId: `m${i}`,
        difficulty: "medium" as const,
        aiScore: 4,
        stars: 4,
        promptPoints: promptPoints(4, "medium"),
        attemptNumber: 1,
      })),
      ...Array.from({ length: 5 }, (_, i) => ({
        promptId: `h${i}`,
        difficulty: "hard" as const,
        aiScore: 3,
        stars: 3,
        promptPoints: promptPoints(3, "hard"),
        attemptNumber: 1,
      })),
    ];
    const agg = aggregateSeasonScore(bests);
    assert.equal(agg.promptsScored, 10);
    assert.equal(agg.sumPromptPoints, 5 * 5 + 5 * 5); // 50
    assert.equal(agg.totalStars, 5 * 4 + 5 * 3); // 35
    assert.equal(agg.seasonScore, 39);
    assert.equal(agg.formulaId, "v1_correct_diff_cover");
    // TIME not involved — no duration fields on aggregate
    assert.equal("durationMs" in agg, false);
  });

  it("isBetterAttempt prefers higher score then lower attempt number", () => {
    assert.equal(isBetterAttempt({ aiScore: 3, attemptNumber: 2 }, null), true);
    assert.equal(
      isBetterAttempt({ aiScore: 4, attemptNumber: 2 }, { aiScore: 3, attemptNumber: 1 }),
      true
    );
    assert.equal(
      isBetterAttempt({ aiScore: 3, attemptNumber: 2 }, { aiScore: 4, attemptNumber: 1 }),
      false
    );
    assert.equal(
      isBetterAttempt({ aiScore: 4, attemptNumber: 1 }, { aiScore: 4, attemptNumber: 2 }),
      true
    );
  });

  it("reads max_attempts and score_formula from rules", () => {
    assert.equal(maxAttemptsFromRules({ max_attempts: 3 }), 3);
    assert.equal(maxAttemptsFromRules({}), 3);
    assert.equal(maxAttemptsFromRules(null), 3);
    assert.equal(scoreFormulaFromRules({ score_formula: "v1_correct_diff_cover" }), SCORE_FORMULA_ID);
    assert.equal(scoreFormulaFromRules({}), SCORE_FORMULA_ID);
  });
});
