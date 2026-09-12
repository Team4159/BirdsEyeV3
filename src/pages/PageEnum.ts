export const PageEnum = {
  Login: "login",
  Settings: "settings",
  MatchScouting: "match-scouting",
} as const;

export type PageType = (typeof PageEnum)[keyof typeof PageEnum];
