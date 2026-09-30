export type MatchScoutingMetadata = {
  year: number;
  eventCode: string;
  eventName: string;
  match: string;
  team: string;
};

export const matchScoutingDataDefault = Object.freeze({
  autoFuels: 0 as number,
  autoMissed: 0 as number,
  autoNotes: "" as string,
  autoClimb: "none" as string,
  teleopFuels: 0 as number,
  teleopMissed: 0 as number,
  endgameClimb: "none" as string,
  fouls: 0 as number,
  techFouls: 0 as number,
  brokeDown: false as boolean,
  defense: false as boolean,
  driverRating: 3.0 as number,
  driverNotes: "" as string,
  scouterConfidence: 50 as number,
} as const);

export type MatchScoutingData = typeof matchScoutingDataDefault;

export type MatchScoutingForm = {
  matchScoutingMetadata: MatchScoutingMetadata;
  matchScoutingData: MatchScoutingData;
};

export enum ClimbLabel {
  none = "No Climb",
  l1auto = "Level 1 (15 points)",
  l1 = "Level 1 (10 points)",
  l2 = "Level 2 (20 points)",
  l3 = "Level 3 (30 points)",
};
