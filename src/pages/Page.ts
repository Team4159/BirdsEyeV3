export const Page = Object.freeze({
  Login: "login",
  Settings: "settings",
  MatchScouting: "match-scouting",
} as const);

export type PageType = (typeof Page)[keyof typeof Page];
