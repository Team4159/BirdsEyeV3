export type MatchScoutingMetadata = {
  eventCode: string;
  eventName: string;
  match: string;
  team: string;
};

export const matchScoutingDataDefault = {
  autoFuels: 0,
  autoNotes: "",
  autoClimb: "none",
  teleopFuels: 0,
  endgameClimb: "none",
  fouls: 0,
  techFouls: 0,
  defense: false,
  driverRating: 3.0,
  driverNotes: "",
};
Object.freeze(matchScoutingDataDefault);

export type MatchScoutingData = typeof matchScoutingDataDefault;

export type MatchScoutingForm = {
  matchScoutingMetadata: MatchScoutingMetadata;
  matchScoutingData: MatchScoutingData;
};
