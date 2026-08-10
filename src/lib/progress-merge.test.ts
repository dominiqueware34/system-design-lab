import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isSoloEmpty, mergeSoloProgress } from "./progress-merge";
import type { SoloProgress } from "./types";

describe("mergeSoloProgress", () => {
  it("merges max score/stars and keeps first duration", () => {
    const local: SoloProgress = {
      problems: {
        "url-shortener": {
          bestScore: 70,
          stars: 2,
          durationMs: 120_000,
          completedAt: "2026-01-01T00:00:00.000Z",
        },
      },
      completedLevelIds: [],
    };
    const remote: SoloProgress = {
      problems: {
        "url-shortener": {
          bestScore: 90,
          stars: 3,
          durationMs: 90_000,
          completedAt: "2026-01-02T00:00:00.000Z",
        },
        "distributed-kv": {
          bestScore: 60,
          stars: 1,
          durationMs: 50_000,
        },
      },
      completedLevelIds: [],
    };
    const m = mergeSoloProgress(local, remote);
    assert.equal(m.problems["url-shortener"]!.bestScore, 90);
    assert.equal(m.problems["url-shortener"]!.stars, 3);
    assert.equal(m.problems["url-shortener"]!.durationMs, 90_000);
    assert.ok(m.problems["distributed-kv"]);
  });

  it("isSoloEmpty", () => {
    assert.equal(isSoloEmpty(null), true);
    assert.equal(isSoloEmpty({ problems: {}, completedLevelIds: [] }), true);
    assert.equal(
      isSoloEmpty({
        problems: {
          x: { bestScore: 1, stars: 1, durationMs: 1 },
        },
        completedLevelIds: [],
      }),
      false
    );
  });
});
