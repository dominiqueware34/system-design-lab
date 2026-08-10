import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  effectiveSeasonStatus,
  isSeasonOpenForPlay,
  mayRevealReferenceDesign,
} from "./campaign-season-status";

const NOW = Date.parse("2026-08-10T12:00:00.000Z");

describe("effectiveSeasonStatus", () => {
  it("keeps draft as draft regardless of window", () => {
    assert.equal(
      effectiveSeasonStatus(
        {
          status: "draft",
          starts_at: "2026-08-01T00:00:00.000Z",
          ends_at: "2026-08-05T00:00:00.000Z",
        },
        NOW
      ),
      "draft"
    );
  });

  it("keeps ended as ended", () => {
    assert.equal(
      effectiveSeasonStatus(
        {
          status: "ended",
          starts_at: "2026-08-01T00:00:00.000Z",
          ends_at: "2026-08-20T00:00:00.000Z",
        },
        NOW
      ),
      "ended"
    );
  });

  it("marks live past ends_at as ended", () => {
    assert.equal(
      effectiveSeasonStatus(
        {
          status: "live",
          starts_at: "2026-08-01T00:00:00.000Z",
          ends_at: "2026-08-09T23:59:59.000Z",
        },
        NOW
      ),
      "ended"
    );
  });

  it("marks live before starts_at as draft (not open)", () => {
    assert.equal(
      effectiveSeasonStatus(
        {
          status: "live",
          starts_at: "2026-08-11T00:00:00.000Z",
          ends_at: "2026-08-14T00:00:00.000Z",
        },
        NOW
      ),
      "draft"
    );
  });

  it("keeps live in window as live", () => {
    assert.equal(
      effectiveSeasonStatus(
        {
          status: "live",
          starts_at: "2026-08-09T00:00:00.000Z",
          ends_at: "2026-08-12T00:00:00.000Z",
        },
        NOW
      ),
      "live"
    );
  });

  it("live with null ends_at stays live", () => {
    assert.equal(
      effectiveSeasonStatus(
        {
          status: "live",
          starts_at: "2026-08-01T00:00:00.000Z",
          ends_at: null,
        },
        NOW
      ),
      "live"
    );
  });
});

describe("isSeasonOpenForPlay / mayRevealReferenceDesign", () => {
  const expired = {
    status: "live",
    starts_at: "2026-08-01T00:00:00.000Z",
    ends_at: "2026-08-09T00:00:00.000Z",
  };
  const open = {
    status: "live",
    starts_at: "2026-08-09T00:00:00.000Z",
    ends_at: "2026-08-12T00:00:00.000Z",
  };

  it("freezes play when ended by timestamp", () => {
    assert.equal(isSeasonOpenForPlay(expired, NOW), false);
    assert.equal(mayRevealReferenceDesign(expired, NOW), true);
  });

  it("allows play and hides ref while live", () => {
    assert.equal(isSeasonOpenForPlay(open, NOW), true);
    assert.equal(mayRevealReferenceDesign(open, NOW), false);
  });
});
