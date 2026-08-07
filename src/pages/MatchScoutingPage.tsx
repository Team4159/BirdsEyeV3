import { Loader2, Save } from "lucide-react";
import { Counter } from "../ui/Counter";
import { selectStyles } from "../ui/selectStyles";
import {
  compareMatchKeys,
  formatMatchLabel,
  getNextMatch,
} from "../util/matchUtil";
import { useCallback, useEffect, useRef, useState } from "react";
import { fetchTbaData } from "../tba/fetchTbaData";
import Select from "react-select";
import {
  matchScoutingDataDefault,
  type MatchScoutingData,
  type MatchScoutingMetadata,
} from "../models/MatchScouting";
import { YEAR } from "../util/year";

type MatchScoutingPageProps = {
  tbaKey: string;
  tbaKeyResponse: string | null;
  onSubmit: (
    matchScoutingMetadata: MatchScoutingMetadata,
    matchScoutingData: MatchScoutingData,
  ) => Promise<void>;
};

export function MatchScoutingPage({
  tbaKey,
  tbaKeyResponse,
  onSubmit,
}: MatchScoutingPageProps) {
  const [events, setEvents] = useState<Map<string, string>>(new Map());
  const [eventsLoaded, setEventsLoaded] = useState(true);
  const [matches, setMatches] = useState<string[]>([]);
  const [matchesLoaded, setMatchesLoaded] = useState(true);
  const [matchDataLoaded, setMatchDataLoaded] = useState(true);
  const [teams, setTeams] = useState({ redAlliance: [], blueAlliance: [] });
  const [matchScoutingFormSending, setMatchScoutingFormSending] =
    useState(false);
  const [matchScoutingMetadata, setMatchScoutingMetadata] =
    useState<MatchScoutingMetadata>(() => ({
      year: YEAR,
      eventCode: localStorage.getItem("currentEventCode") || "",
      eventName: localStorage.getItem("currentEventName") || "",
      match: localStorage.getItem("currentMatch") || "",
      team: localStorage.getItem("currentTeam") || "",
    }));
  const [matchScoutingData, setMatchScoutingData] = useState<MatchScoutingData>(
    () => {
      const data = localStorage.getItem("currentMatchScoutingData");
      if (data) {
        return JSON.parse(data);
      }
      return structuredClone(matchScoutingDataDefault);
    },
  );

  const saveCurrentEvent = (eventCode: string, eventName: string) => {
    try {
      localStorage.setItem("currentEventCode", eventCode);
      localStorage.setItem("currentEventName", eventName);
      setMatchScoutingMetadata((p) => ({
        ...p,
        eventCode: eventCode,
        eventName: eventName,
      }));
    } catch (error) {
      console.error("Error saving event:", error);
    }
  };

  const saveCurrentMatch = (currentMatch: string) => {
    try {
      localStorage.setItem("currentMatch", currentMatch);
      setMatchScoutingMetadata((p) => ({
        ...p,
        match: currentMatch,
      }));
    } catch (error) {
      console.error("Error saving match:", error);
    }
  };

  const saveCurrentTeam = (currentTeam: string) => {
    try {
      localStorage.setItem("currentTeam", currentTeam);
      setMatchScoutingMetadata((p) => ({
        ...p,
        team: currentTeam,
      }));
    } catch (error) {
      console.error("Error saving team:", error);
    }
  };

  const saveMatchScoutingData = (matchScoutingData: MatchScoutingData) => {
    try {
      localStorage.setItem(
        "currentMatchScoutingData",
        JSON.stringify(matchScoutingData),
      );
      setMatchScoutingData(matchScoutingData);
    } catch (error) {
      console.error("Error saving team:", error);
    }
  };

  const populateEvents = useCallback(async () => {
    try {
      setEventsLoaded(false);
      const eventsArray: { key: string; name: string }[] = await fetchTbaData(
        tbaKey,
        `/events/${YEAR}`,
        false,
      );
      setEventsLoaded(true);
      if (eventsArray === null) {
        return;
      }
      const eventsMap: Map<string, string> = new Map(
        eventsArray.map((event) => [event.key, event.name]),
      );
      setEvents(eventsMap);
    } catch (error) {
      console.error("Failed to set matches: ", error);
    }
  }, [tbaKey]);

  const populateMatches = useCallback(async () => {
    try {
      setMatchesLoaded(false);
      let matches = await fetchTbaData(
        tbaKey,
        `/event/${matchScoutingMetadata.eventCode}/matches/keys`,
        false,
      );
      setMatchesLoaded(true);
      if (matches === null) {
        return;
      }
      matches = matches.sort((a: string, b: string) => {
        return compareMatchKeys(a, b);
      });
      setMatches(matches);
    } catch (error) {
      console.error("Failed to set matches: ", error);
    }
  }, [matchScoutingMetadata.eventCode, tbaKey]);

  const populateTeams = useCallback(async () => {
    try {
      const teamsData = { redAlliance: [], blueAlliance: [] };
      setTeams(teamsData);
      setMatchDataLoaded(false);
      //raw match data from tba
      const matchData = await fetchTbaData(
        tbaKey,
        `/match/${matchScoutingMetadata.match}/simple`,
      );
      setMatchDataLoaded(true);

      //fetch alliance data
      if (matchData !== null) {
        const redAlliance = matchData.alliances.red.team_keys;
        const blueAlliance = matchData.alliances.blue.team_keys;

        teamsData.redAlliance = redAlliance;
        teamsData.blueAlliance = blueAlliance;
      }
      setTeams(teamsData);
    } catch (error) {
      console.error("Failed to set matches: ", error);
    }
  }, [matchScoutingMetadata.match, tbaKey]);

  function canSendData() {
    return (
      !matchScoutingFormSending &&
      matchScoutingMetadata.eventCode &&
      matchScoutingMetadata.match &&
      matchScoutingMetadata.team
    );
  }

  function resetMatchScoutingData() {
    saveCurrentMatch(getNextMatch(matchScoutingMetadata.match, matches));
    saveCurrentTeam("");
    saveMatchScoutingData(structuredClone(matchScoutingDataDefault));
  }

  //tbaKey effects
  {
    const populated = useRef<boolean>(false);
    useEffect(() => {
      if (tbaKeyResponse !== null || populated.current) {
        return;
      }
      populateEvents();
      populated.current = true;
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [events.size, tbaKeyResponse]);
  }

  //currentEvent effects
  {
    const previousEventCode = useRef<string | null>(null);
    useEffect(() => {
      if (tbaKeyResponse !== null || !matchScoutingMetadata.eventCode) {
        return;
      }
      if (
        previousEventCode.current === null ||
        previousEventCode.current !== matchScoutingMetadata.eventCode
      ) {
        populateMatches();
      }
      previousEventCode.current = matchScoutingMetadata.eventCode;
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [matchScoutingMetadata.eventCode, tbaKeyResponse]);
  }

  //currentMatch effects
  {
    const previousMatch = useRef<string | null>(null);
    useEffect(() => {
      if (tbaKeyResponse !== null || !matchScoutingMetadata.match) {
        return;
      }
      if (
        previousMatch.current === null ||
        previousMatch.current !== matchScoutingMetadata.match
      ) {
        populateTeams();
      }
      previousMatch.current = matchScoutingMetadata.match;
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [matchScoutingMetadata.match, tbaKeyResponse]);
  }

  return (
    <div className="card">
      <h1>Match Scouting</h1>
      {tbaKeyResponse === null ? (
        <div>
          <div>
            <h3>Event</h3>

            <Select
              id="event-form"
              styles={selectStyles}

              options={[...events.keys()].map((eventCode) => ({
                value: eventCode,
                label: `${events.get(eventCode)} (${eventCode})`,
              }))}

              value={
                matchScoutingMetadata.eventCode
                  ? {
                      value: matchScoutingMetadata.eventCode,
                      label: `${matchScoutingMetadata.eventName} (${matchScoutingMetadata.eventCode})`,
                    }
                  : null
              }

              onChange={(selected) => {
                const eventCode = selected?.value || "";
                const eventName = events.get(eventCode) || "";

                saveCurrentEvent(eventCode, eventName);
                saveCurrentMatch("");
                saveCurrentTeam("");
              }}
            />

            <span>
              {eventsLoaded
                ? matchesLoaded
                  ? null
                  : "Matches loading..."
                : "Events loading..."}
            </span>
          </div>

          <div>
            <h3>Match</h3>

            <Select
              id="match-form"
              styles={selectStyles}

              options={matches.map((match) => ({
                value: match,
                label: formatMatchLabel(match),
              }))}

              value={
                matchScoutingMetadata.match
                  ? {
                      value: matchScoutingMetadata.match,
                      label: formatMatchLabel(matchScoutingMetadata.match),
                    }
                  : null
              }

              onChange={(selected) => {
                const matchValue = selected?.value || "";

                saveCurrentMatch(matchValue);
                saveCurrentTeam("");
              }}
            />

            <span>{matchDataLoaded ? null : "Match data loading..."}</span>
          </div>
          {matchScoutingMetadata.eventCode && matchScoutingMetadata.match ? (
            <div>
              <div>
                {teams.redAlliance.length > 0 ||
                teams.blueAlliance.length > 0 ? (
                  <h3>Team</h3>
                ) : null}

                {/* Red Alliance Row */}
                <div className="teamGrid">
                  {teams.redAlliance.map((team: string, index: number) => (
                    <button
                      key={team}
                      className={`teamButton red ${matchScoutingMetadata.team === team ? "selected" : ""}`}
                      onClick={() => saveCurrentTeam(team)}
                      style={{ whiteSpace: "pre-line" }}
                    >
                      {`Red ${index + 1}
                      ${team.substring(3)}`}
                    </button>
                  ))}
                </div>

                {/* Blue Alliance Row */}
                <div className="teamGrid">
                  {teams.blueAlliance.map((team: string, index: number) => (
                    <button
                      key={team}
                      className={`teamButton blue ${matchScoutingMetadata.team === team ? "selected" : ""}`}
                      onClick={() => saveCurrentTeam(team)}
                      style={{ whiteSpace: "pre-line" }}
                    >
                      {`Blue ${index + 1}
                      ${team.substring(3)}`}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h1>Autonomous</h1>
                <Counter
                  label="Auto Fuels"
                  value={matchScoutingData.autoFuels}
                  increments={[1, 5]}
                  onChange={(v) =>
                    saveMatchScoutingData({
                      ...matchScoutingData,
                      autoFuels: v,
                    })
                  }
                />
                <p className="block text-sm font-medium mb-2">Climb Status</p>
                <select
                  id="auto-climb-form"
                  value={matchScoutingData.autoClimb}
                  onChange={(e) =>
                    saveMatchScoutingData({
                      ...matchScoutingData,
                      autoClimb: e.target.value,
                    })
                  }
                >
                  <option value="none">No Climb</option>
                  <option value="l1auto">Level 1 (15 pts)</option>
                </select>
                <p>Auto Notes</p>
                <textarea
                  id="auto-notes-form"
                  value={matchScoutingData.autoNotes}
                  onChange={(e) =>
                    saveMatchScoutingData({
                      ...matchScoutingData,
                      autoNotes: e.target.value,
                    })
                  }
                  placeholder="Auto notes..."
                />
              </div>

              <div>
                <h1>Teleop</h1>
                <Counter
                  label="Teleop Fuels"
                  value={matchScoutingData.teleopFuels}
                  increments={[1, 5]}
                  onChange={(v) =>
                    saveMatchScoutingData({
                      ...matchScoutingData,
                      teleopFuels: v,
                    })
                  }
                />
              </div>

              <div>
                <h1>Endgame</h1>
                <p className="block text-sm font-medium mb-2">Climb Status</p>
                <select
                  id="endgame-climb-form"
                  value={matchScoutingData.endgameClimb}
                  onChange={(e) =>
                    saveMatchScoutingData({
                      ...matchScoutingData,
                      endgameClimb: e.target.value,
                    })
                  }
                >
                  <option value="none">No Climb</option>
                  <option value="l1">Level 1 (10 pts)</option>
                  <option value="l2">Level 2 (20 pts)</option>
                  <option value="l3">Level 3 (30 pts)</option>
                </select>
              </div>

              <div>
                <h1>Fouls</h1>
                <Counter
                  label="Fouls"
                  value={matchScoutingData.fouls}
                  increments={[1]}
                  onChange={(v) =>
                    saveMatchScoutingData({
                      ...matchScoutingData,
                      fouls: v,
                    })
                  }
                />
                <Counter
                  label="Tech Fouls"
                  value={matchScoutingData.techFouls}
                  increments={[1]}
                  onChange={(v) =>
                    saveMatchScoutingData({
                      ...matchScoutingData,
                      techFouls: v,
                    })
                  }
                />
              </div>

              <div>
                <h1>Driver Info</h1>
                <button
                  onClick={() =>
                    saveMatchScoutingData({
                      ...matchScoutingData,
                      defense: !matchScoutingData.defense,
                    })
                  }
                >
                  {"Defense: " + matchScoutingData.defense}
                </button>
                <p>{"Driver Rating: " + matchScoutingData.driverRating}</p>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={matchScoutingData.driverRating}
                  className="slider"
                  id="driver-rating-slider"
                  onChange={(e) =>
                    saveMatchScoutingData({
                      ...matchScoutingData,
                      driverRating: parseInt(e.target.value),
                    })
                  }
                ></input>

                <textarea
                  id="driver-notes-form"
                  value={matchScoutingData.driverNotes}
                  onChange={(e) =>
                    saveMatchScoutingData({
                      ...matchScoutingData,
                      driverNotes: e.target.value,
                    })
                  }
                  placeholder="Driver notes..."
                />
              </div>

              <button
                disabled={!canSendData()}
                onClick={async () => {
                  setMatchScoutingFormSending(true);
                  await onSubmit(matchScoutingMetadata, matchScoutingData);
                  resetMatchScoutingData();
                  setMatchScoutingFormSending(false);
                }}
                className="saveButton"
              >
                {matchScoutingFormSending ? (
                  <Loader2 className="animate-spin" size="22" />
                ) : (
                  <Save size="22" />
                )}
                Save Match
              </button>
              <span>
                {matchScoutingMetadata.team ? null : "Select a team first"}
              </span>
            </div>
          ) : null}
        </div>
      ) : (
        <div>
          <p>{tbaKeyResponse}</p>
        </div>
      )}
    </div>
  );
}
