import { CampaignLeaderboard } from "@/components/campaign/CampaignLeaderboard";

export const metadata = {
  title: "Campaign leaderboard · System Design Lab",
  description:
    "Public Campaign season leaderboard by season_score. No private times.",
};

export default function CampaignLeaderboardPage() {
  return <CampaignLeaderboard />;
}
