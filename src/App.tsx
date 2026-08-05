import { useState, useEffect, useCallback, useRef } from "react";
import {
  Sun,
  Moon,
  Settings,
  Save,
  Search,
  LogOut,
  Loader2,
} from "lucide-react";
import "./App.css";

//firebase
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  setDoc,
  doc,
} from "firebase/firestore";
import { Counter } from "./ui/Counter";
import { fetchTbaData } from "./tba/fetchTbaData";
import {
  compareMatchKeys,
  formatMatchLabel,
  getNextMatch,
} from "./util/matchUtil";
import Select from "react-select";
import { selectStyles } from "./ui/selectStyles";
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithCredential,
} from "firebase/auth";
import { GoogleLogin } from "@react-oauth/google";
import { logOut } from "./firebase/auth";
import { verifyTbaKey } from "./tba/verifyTbaKey";
import { applyDarkMode } from "./ui/theme";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCk4X0qVprdIYWoMdtTnSs0qVAqR_zcQBY",
  authDomain: "scoutingapp-bd57b.firebaseapp.com",
  projectId: "scoutingapp-bd57b",
  storageBucket: "scoutingapp-bd57b.firebasestorage.app",
  messagingSenderId: "345042135934",
  appId: "1:345042135934:web:3499e51bc4ebde3d5e212f",
  measurementId: "G-Q5EL55034N",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);
const auth = getAuth(app);

const matchScoutingDataDefault = {
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

function App() {
  const [autoLoginDone, setAutoLoginDone] = useState(false);
  const [currentPage, setCurrentPage] = useState("login");
  const [tbaKey, setTbaKey] = useState(() => {
    return localStorage.getItem("tbaKey") || "";
  });
  const [tbaKeyMessage, setMatchScoutingErrorMessage] = useState<string | null>(
    null,
  );
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("darkMode") !== "light";
  });
  const [events, setEvents] = useState<Map<string, string>>(new Map());
  const [eventsLoaded, setEventsLoaded] = useState(true);
  const [currentEventCode, setCurrentEventCode] = useState(() => {
    return localStorage.getItem("currentEventCode") || "";
  });
  const [currentEventName, setCurrentEventName] = useState(() => {
    return localStorage.getItem("currentEventName") || "";
  });
  const [matches, setMatches] = useState([]);
  const [matchesLoaded, setMatchesLoaded] = useState(true);
  const [currentMatch, setCurrentMatch] = useState(() => {
    return localStorage.getItem("currentMatch") || "";
  });
  const [matchDataLoaded, setMatchDataLoaded] = useState(true);
  /** stores two arrays of teams (for red and blue) alliances. use .redAlliance and .bluealliance*/
  const [teams, setTeams] = useState({ redAlliance: [], blueAlliance: [] });
  const [currentTeam, setCurrentTeam] = useState(() => {
    return localStorage.getItem("currentTeam") || "";
  });
  /** match scouting data for the team being scouted */
  const [matchScoutingData, setMatchScoutingData] = useState<
    typeof matchScoutingDataDefault
  >(() => {
    const data = localStorage.getItem("currentMatchScoutingData");
    if (data) {
      return JSON.parse(data);
    }
    return structuredClone(matchScoutingDataDefault);
  });
  const [matchScoutingDataSending, setMatchScoutingDataSending] =
    useState(false);

  //set body to dark mode initially
  document.body.classList.toggle("darkBG", darkMode);

  function deleteOldLocalStorage() {
    try {
      if (localStorage.getItem("currentEvent")) {
        localStorage.removeItem("currentEvent");
      }
    } catch {
      console.log("Failed to delete old local storage");
    }
  }

  const saveTbaKey = (key: string) => {
    try {
      setTbaKey(key);
      localStorage.setItem("tbaKey", key);
    } catch (error) {
      console.error("Error saving TBA key:", error);
      return;
    }
  };

  const saveDarkMode = (darkMode: boolean) => {
    localStorage.setItem("darkMode", darkMode ? "dark" : "light");
    applyDarkMode(darkMode);
    setDarkMode(darkMode);
  };

  const saveCurrentEvent = (eventCode: string, eventName: string) => {
    try {
      localStorage.setItem("currentEventCode", eventCode);
      localStorage.setItem("currentEventName", eventName);
      setCurrentEventCode(eventCode);
      setCurrentEventName(eventName);
    } catch (error) {
      console.error("Error saving event:", error);
      return;
    }
  };

  const saveCurrentMatch = (currentMatch: string) => {
    try {
      localStorage.setItem("currentMatch", currentMatch);
      setCurrentMatch(currentMatch);
    } catch (error) {
      console.error("Error saving match:", error);
      return;
    }
  };

  const saveCurrentTeam = (currentTeam: string) => {
    try {
      localStorage.setItem("currentTeam", currentTeam);
      setCurrentTeam(currentTeam);
    } catch (error) {
      console.error("Error saving team:", error);
      return;
    }
  };

  const saveMatchScoutingData = (
    matchScoutingData: Parameters<typeof setMatchScoutingData>[0],
  ) => {
    try {
      localStorage.setItem(
        "currentMatchScoutingData",
        JSON.stringify(matchScoutingData),
      );
      setMatchScoutingData(matchScoutingData);
    } catch (error) {
      console.error("Error saving team:", error);
      return;
    }
  };

  const gatekeepMatchScoutingPage = async (tbaKey: string) => {
    try {
      setMatchScoutingErrorMessage("Verifying TBA API key...");
      const [, message] = await verifyTbaKey(tbaKey);
      setMatchScoutingErrorMessage(message);
    } catch (error) {
      console.error("Failed to verify TBA key: ", error);
    }
  };

  const populateEvents = useCallback(async () => {
    try {
      setEventsLoaded(false);
      const eventsArray: { key: string; name: string }[] = await fetchTbaData(
        tbaKey,
        "/events/2026",
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
        `/event/${currentEventCode}/matches/keys`,
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
  }, [currentEventCode, tbaKey]);

  const populateTeams = useCallback(async () => {
    try {
      const teamsData = { redAlliance: [], blueAlliance: [] };
      setTeams(teamsData);
      setMatchDataLoaded(false);
      //raw match data from tba
      const matchData = await fetchTbaData(
        tbaKey,
        `/match/${currentMatch}/simple`,
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
  }, [currentMatch, tbaKey]);

  function canSendData() {
    return (
      !matchScoutingDataSending &&
      currentEventCode &&
      currentMatch &&
      currentTeam
    );
  }

  async function sendData() {
    if (!canSendData()) {
      return;
    }

    try {
      setMatchScoutingDataSending(true);
      // ✅ Ensure event exists
      await setDoc(
        doc(firestore, "events", currentEventCode),
        { name: currentEventCode },
        { merge: true },
      );

      // ✅ Ensure team exists
      await setDoc(
        doc(firestore, "events", currentEventCode, "teams", currentTeam),
        { name: currentTeam },
        { merge: true },
      );

      // ✅ Ensure match exists
      await setDoc(
        doc(
          firestore,
          "events",
          currentEventCode,
          "teams",
          currentTeam,
          "matches",
          currentMatch,
        ),
        { name: currentMatch },
        { merge: true },
      );

      // ✅ Now add dataset
      await addDoc(
        collection(
          firestore,
          "events",
          currentEventCode,
          "teams",
          currentTeam,
          "matches",
          currentMatch,
          "datasets",
        ),
        {
          ...matchScoutingData,
          email: auth.currentUser?.email,
        },
      );

      resetMatchScoutingData();

      setMatchScoutingDataSending(false);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (e) {
      console.error("Error adding document: " + e);
      alert("Error saving match");
    }
  }

  function openHomePage(tbaKeyOverride?: string) {
    if ((tbaKeyOverride || tbaKey) === "") {
      setCurrentPage("tbaKeyInput");
    } else {
      setCurrentPage("matchScouting");
    }
  }

  //run when app loads
  useEffect(() => {
    deleteOldLocalStorage();
    applyDarkMode(darkMode);
    onAuthStateChanged(auth, (user) => {
      setAutoLoginDone(true);
      if (user != null) {
        openHomePage(tbaKey);
      } else {
        setCurrentPage("login");
      }
    });
    (async () => gatekeepMatchScoutingPage(tbaKey))();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  //tbaKey effects
  {
    const eventsSize = useRef<number>(0);
    useEffect(() => {
      eventsSize.current = events.size;
      if (!(
        currentPage === "matchScouting" &&
        tbaKeyMessage === null &&
        eventsSize.current === 0
      )) {
        return;
      }
      populateEvents();
    }, [currentPage, events.size, tbaKeyMessage, populateEvents]);
  }

  //currentEvent effects
  {
    const previousEventCode = useRef<string | null>(null);
    useEffect(() => {
      if (!(
        currentPage === "matchScouting" &&
        tbaKeyMessage === null &&
        currentEventCode
      )) {
        return;
      }
      if (
        previousEventCode.current === null ||
        previousEventCode.current !== currentEventCode
      ) {
        populateMatches();
      }
      previousEventCode.current = currentEventCode;
    }, [currentPage, currentEventCode, populateMatches, tbaKeyMessage]);
  }

  //currentMatch effects
  {
    const previousMatch = useRef<string | null>(null);
    useEffect(() => {
      if (!(
        currentPage === "matchScouting" &&
        tbaKeyMessage === null &&
        currentMatch
      )) {
        return;
      }
      if (
        previousMatch.current === null ||
        previousMatch.current !== currentMatch
      ) {
        populateTeams();
      }
      previousMatch.current = currentMatch;
    }, [currentPage, currentMatch, populateTeams, tbaKeyMessage]);
  }

  function resetMatchScoutingData() {
    saveCurrentMatch(getNextMatch(currentMatch, matches));
    saveCurrentTeam("");
    saveMatchScoutingData(structuredClone(matchScoutingDataDefault));
  }

  const cardClass = "card";

  return (
    <>
      {currentPage === "login" && (
        <div className="login-button-container">
          {autoLoginDone ? (
            <GoogleLogin
              onSuccess={async (credentialResponse) => {
                const credential = GoogleAuthProvider.credential(
                  credentialResponse.credential,
                );
                await signInWithCredential(auth, credential);
                openHomePage();
              }}
              onError={() => {
                console.log("Login Failed");
              }}
            />
          ) : null}
        </div>
      )}

      {currentPage !== "login" && (
        <nav className="navBar">
          <button
            onClick={() => {
              saveDarkMode(!darkMode);
            }}
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <button
            onClick={() => {
              setCurrentPage("tbaKeyInput");
            }}
          >
            <Settings size={20} />
          </button>

          <button
            onClick={() => {
              setCurrentPage("matchScouting");
            }}
          >
            <Search size={20} />
          </button>

          <button
            onClick={() => {
              logOut();
              setCurrentPage("login");
            }}
          >
            <LogOut size={20} />
          </button>
        </nav>
      )}

      {currentPage === "tbaKeyInput" && (
        <div className={cardClass}>
          <h1>TBA API Key</h1>
          <input
            type="text"
            value={tbaKey}
            onChange={(e) => {
              const tbaKey = e.target.value;
              saveTbaKey(tbaKey);
              gatekeepMatchScoutingPage(tbaKey);
            }}
            placeholder="Enter your TBA API key"
          />
          <label>
            {tbaKey === ""
              ? null
              : tbaKeyMessage === null
                ? "Verified!"
                : tbaKeyMessage}
          </label>
        </div>
      )}

      {currentPage === "matchScouting" && (
        <div className={cardClass}>
          <h1>Match Scouting</h1>
          {tbaKeyMessage === null ? (
            <div>
              <div>
                <h3>Event</h3>

                <Select
                  styles={selectStyles}
                  value={
                    currentEventCode
                      ? {
                          value: currentEventCode,
                          label: `${currentEventName} (${currentEventCode})`,
                        }
                      : null
                  }

                  options={[...events.keys()].map((eventCode) => ({
                    value: eventCode,
                    label: `${events.get(eventCode)} (${eventCode})`,
                  }))}

                  onChange={(selected) => {
                    const eventCode = selected?.value || "";
                    const eventName = events.get(eventCode) || "";

                    saveCurrentEvent(eventCode, eventName);
                    saveCurrentMatch("");
                    saveCurrentTeam("");
                  }}
                />

                <label>
                  {eventsLoaded
                    ? matchesLoaded
                      ? null
                      : "Matches loading..."
                    : "Events loading..."}
                </label>
              </div>

              <div>
                <h3>Match</h3>

                <Select
                  styles={selectStyles}

                  options={matches.map((match) => ({
                    value: match,
                    label: formatMatchLabel(match),
                  }))}

                  value={
                    currentMatch
                      ? {
                          value: currentMatch,
                          label: formatMatchLabel(currentMatch),
                        }
                      : null
                  }

                  onChange={(selected) => {
                    const matchValue = selected?.value || "";

                    saveCurrentMatch(matchValue);
                    saveCurrentTeam("");
                  }}
                />

                <label>
                  {matchDataLoaded ? null : "Match data loading..."}
                </label>
              </div>
              {currentMatch ? (
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
                          className={`teamButton red ${currentTeam === team ? "selected" : ""}`}
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
                          className={`teamButton blue ${currentTeam === team ? "selected" : ""}`}
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
                    <p className="block text-sm font-medium mb-2">
                      Climb Status
                    </p>
                    <select
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
                    <p className="block text-sm font-medium mb-2">
                      Climb Status
                    </p>
                    <select
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
                      id="myRange"
                      onChange={(e) =>
                        saveMatchScoutingData({
                          ...matchScoutingData,
                          driverRating: parseInt(e.target.value),
                        })
                      }
                    ></input>

                    <textarea
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
                    onClick={sendData}
                    className="saveButton"
                  >
                    {matchScoutingDataSending ? (
                      <Loader2 className="animate-spin" size="22" />
                    ) : (
                      <Save size="22" />
                    )}
                    Save Match
                  </button>
                  <label>{currentTeam ? null : "Select a team first"}</label>
                </div>
              ) : null}
            </div>
          ) : (
            <div>
              <p>{tbaKeyMessage}</p>
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default App;
