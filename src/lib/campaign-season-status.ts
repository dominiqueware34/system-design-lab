/**
 * Effective Campaign season status (Artifact 7 reduced / #10).
 * Pure helpers — honors ends_at / starts_at even if DB status lags.
 */

export type CampaignSeasonStatus = "draft" | "live" | "ended";

export type SeasonTimeFields = {
  status: string;
  starts_at?: string | null;
  ends_at?: string | null;
};

/**
 * Resolve competitive lifecycle status from DB row + clock.
 * - draft stays draft (operator-controlled go-live)
 * - ended stays ended
 * - live + ends_at in the past → ended (freeze)
 * - live + starts_at in the future → draft (not open yet)
 * - otherwise live
 */
export function effectiveSeasonStatus(
  season: SeasonTimeFields,
  nowMs: number = Date.now()
): CampaignSeasonStatus {
  const raw = (season.status ?? "").toLowerCase();
  if (raw === "draft") return "draft";
  if (raw === "ended") return "ended";

  // Treat unknown/non-live as draft for safety.
  if (raw !== "live") {
    if (raw === "scheduled" || raw === "upcoming") return "draft";
    return raw === "closed" || raw === "complete" ? "ended" : "draft";
  }

  const startsAt = season.starts_at ? Date.parse(season.starts_at) : NaN;
  const endsAt = season.ends_at ? Date.parse(season.ends_at) : NaN;

  if (Number.isFinite(endsAt) && nowMs > endsAt) {
    return "ended";
  }
  if (Number.isFinite(startsAt) && nowMs < startsAt) {
    return "draft";
  }
  return "live";
}

/** Competitive play (start/submit) allowed only when effectively live. */
export function isSeasonOpenForPlay(
  season: SeasonTimeFields,
  nowMs: number = Date.now()
): boolean {
  return effectiveSeasonStatus(season, nowMs) === "live";
}

/** Reference designs may be returned only after the season has effectively ended. */
export function mayRevealReferenceDesign(
  season: SeasonTimeFields,
  nowMs: number = Date.now()
): boolean {
  return effectiveSeasonStatus(season, nowMs) === "ended";
}
