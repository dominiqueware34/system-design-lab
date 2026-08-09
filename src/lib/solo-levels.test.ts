import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  SOLO_LEVELS,
  defaultSoloProgress,
  isLevelComplete,
  isProblemCompleted,
  isSoloLevelUnlocked,
  normalizeSoloProgress,
  recomputeCompletedLevels,
  seedSoloFromCampaignProgress,
  starsFromScore,
} from "./solo-levels";

describe("solo-levels", () => {
  it("defines 2 levels with classic then agentic problem sets", () => {
    assert.equal(SOLO_LEVELS.length, 2);
    assert.equal(SOLO_LEVELS[0]!.id, "solo-l1");
    assert.equal(SOLO_LEVELS[1]!.id, "solo-l2");
    assert.ok(SOLO_LEVELS[0]!.problems.length >= 8);
    assert.ok(SOLO_LEVELS[1]!.problems.length >= 5);
    assert.deepEqual(SOLO_LEVELS[1]!.unlocksAfter, ["solo-l1"]);
  });

  it("completing one problem does not complete the level", () => {
    const level = SOLO_LEVELS[0]!;
    const progress = defaultSoloProgress();
    const first = level.problems[0]!.problemId;
    progress.problems[first] = {
      bestScore: 70,
      stars: 2,
      durationMs: 120_000,
    };
    assert.equal(isProblemCompleted(first, progress), true);
    assert.equal(isLevelComplete(level, progress), false);
    assert.deepEqual(recomputeCompletedLevels(progress), []);
  });

  it("L2 locked until L1 fully complete", () => {
    const l1 = SOLO_LEVELS[0]!;
    const l2 = SOLO_LEVELS[1]!;
    const progress = defaultSoloProgress();
    assert.equal(isSoloLevelUnlocked(l1, progress), true);
    assert.equal(isSoloLevelUnlocked(l2, progress), false);

    for (const p of l1.problems) {
      progress.problems[p.problemId] = {
        bestScore: 80,
        stars: 2,
        durationMs: 60_000,
      };
    }
    progress.completedLevelIds = recomputeCompletedLevels(progress);
    assert.ok(progress.completedLevelIds.includes("solo-l1"));
    assert.equal(isSoloLevelUnlocked(l2, progress), true);
  });

  it("starsFromScore thresholds", () => {
    assert.equal(starsFromScore(55, 55), 1);
    assert.equal(starsFromScore(70, 55), 2);
    assert.equal(starsFromScore(80, 55), 3);
  });

  it("seedSoloFromCampaignProgress maps legacy levels", () => {
    const seeded = seedSoloFromCampaignProgress({
      completedLevelIds: ["w1-l1", "w3-l1"],
      stars: { "w1-l1": 3, "w3-l1": 1 },
      wrenchesSurvived: 2,
    });
    assert.ok(seeded.problems["url-shortener"]);
    assert.equal(seeded.problems["url-shortener"]!.stars, 3);
    assert.ok(seeded.problems["rag-support-agent"]);
    assert.equal(seeded.problems["url-shortener"]!.durationMs, 0);
  });

  it("normalizeSoloProgress recomputes completed levels", () => {
    const l1 = SOLO_LEVELS[0]!;
    const problems: Record<string, { bestScore: number; stars: number; durationMs: number }> =
      {};
    for (const p of l1.problems) {
      problems[p.problemId] = { bestScore: 70, stars: 1, durationMs: 1 };
    }
    const n = normalizeSoloProgress({ problems, completedLevelIds: [] });
    assert.ok(n.completedLevelIds.includes("solo-l1"));
  });
});
