import { useState, useEffect, useCallback } from "react";
import { Sun, Moon, Settings, Save, Search, LogOut } from "lucide-react";
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
} from "./util/MatchUtil";
import Select from "react-select";
import { selectStyles } from "./ui/SelectStyles";
import { getAuth } from "firebase/auth";
import { GoogleLogin } from "@react-oauth/google";
import { logInWithGoogle, logOut } from "./firebase/Auth";
import { verifyTbaKey } from "./tba/verifyTbaKey";
import { applyDarkMode } from "./ui/Theme";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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

function App() {
  const [currentPage, setCurrentPage] = useState("login");
  const [tbaKey, setTbaKey] = useState("");
  const [darkMode, setDarkMode] = useState(true);
  const [events, setEvents] = useState<Map<string, string>>(new Map());
  const [currentEvent, setCurrentEvent] = useState("");
  const [matches, setMatches] = useState([]);
  const [currentMatch, setCurrentMatch] = useState("");
  /** stores two arrays of teams (for red and blue) alliances. use .redAlliance and .bluealliance*/
  const [teams, setTeams] = useState({ redAlliance: [], blueAlliance: [] });
  const [currentTeam, setCurrentTeam] = useState("");
  /** match scouting data for the team being scouted */
  const [matchScoutingData, setMatchScoutingData] = useState({
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
  });
  const [matchScoutingErrorMessage, setMatchScoutingErrorMessage] = useState<
    string | null
  >(null);

  //set body to dark mode initially
  document.body.classList.toggle("darkBG", darkMode);

  const loadTbaKey = async () => {
    try {
      const key = localStorage.getItem("tbaKey");
      if (key) {
        queueMicrotask(() => {
          setTbaKey(key);
        });
      }
    } catch {
      console.log("No TBA key found");
    }
  };

  const saveTbaKey = async (key: string) => {
    try {
      localStorage.setItem("tbaKey", key);
      setTbaKey(key);
    } catch (error) {
      console.error("Error saving TBA key:", error);
      return;
    }
  };

  const loadDarkMode = async () => {
    try {
      const darkMode = localStorage.getItem("darkMode") !== "light";
      applyDarkMode(darkMode);
      queueMicrotask(() => {
        setDarkMode(darkMode);
      });
    } catch {
      console.log("No dark mode preference found");
    }
  };

  const saveDarkMode = (darkMode: boolean) => {
    localStorage.setItem("darkMode", darkMode ? "dark" : "light");
    applyDarkMode(darkMode);
    setDarkMode(darkMode);
  };

  const loadCurrentEvent = async () => {
    try {
      const result = localStorage.getItem("currentEvent");
      if (result) {
        queueMicrotask(() => {
          setCurrentEvent(result);
        });
      }
    } catch {
      console.log("No event found");
    }
  };

  const saveCurrentEvent = async (currentEvent: string) => {
    try {
      localStorage.setItem("currentEvent", currentEvent);
      setCurrentEvent(currentEvent);
    } catch (error) {
      console.error("Error saving event:", error);
      return;
    }
  };

  const loadCurrentMatch = async () => {
    try {
      const result = localStorage.getItem("currentMatch");
      if (result) {
        queueMicrotask(() => {
          setCurrentMatch(result);
        });
      }
    } catch {
      console.log("No match found");
    }
  };

  const saveCurrentMatch = async (currentMatch: string) => {
    try {
      localStorage.setItem("currentMatch", currentMatch);
      setCurrentMatch(currentMatch);
    } catch (error) {
      console.error("Error saving match:", error);
      return;
    }
  };

  const loadCurrentTeam = async () => {
    try {
      const result = localStorage.getItem("currentTeam");
      if (result) {
        queueMicrotask(() => {
          setCurrentTeam(result);
        });
      }
    } catch {
      console.log("No team found");
    }
  };

  const saveCurrentTeam = async (currentTeam: string) => {
    try {
      localStorage.setItem("currentTeam", currentTeam);
      setCurrentTeam(currentTeam);
    } catch (error) {
      console.error("Error saving team:", error);
      return;
    }
  };

  const loadMatchScoutingData = async () => {
    try {
      const result = localStorage.getItem("currentMatchScoutingData");
      if (result) {
        queueMicrotask(() => {
          setMatchScoutingData(JSON.parse(result));
        });
      }
    } catch {
      console.log("No match found");
    }
  };

  const saveMatchScoutingData = async (
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

  const gatekeepMatchScoutingPage = useCallback(async () => {
    try {
      queueMicrotask(async () => {
        setMatchScoutingErrorMessage("Verifying TBP API key...");
        const [, message] = await verifyTbaKey(tbaKey);
        setMatchScoutingErrorMessage(message);
      });
    } catch (error) {
      console.error("Failed to verify TBA key: ", error);
    }
  }, [tbaKey]);

  const populateEvents = useCallback(async () => {
    try {
      queueMicrotask(async () => {
        const eventsArray: { key: string; name: string }[] = await fetchTbaData(
          tbaKey,
          "/events/2026",
          false,
        );
        if (eventsArray === null) {
          return;
        }
        const eventsMap: Map<string, string> = new Map(
          eventsArray.map((event) => [event.key, event.name]),
        );
        setEvents(eventsMap);
      });
    } catch (error) {
      console.error("Failed to set matches: ", error);
    }
  }, [tbaKey]);

  const populateMatches = useCallback(async () => {
    try {
      let matches = await fetchTbaData(
        tbaKey,
        `/event/${currentEvent}/matches/keys`,
        false,
      );
      if (matches === null) {
        return;
      }
      matches = matches.sort((a: string, b: string) => {
        return compareMatchKeys(a, b);
      });
      queueMicrotask(() => {
        setMatches(matches);
      });
    } catch (error) {
      console.error("Failed to set matches: ", error);
    }
  }, [currentEvent, tbaKey]);

  const populateTeams = useCallback(async () => {
    try {
      //raw match data from tba
      const matchData = await fetchTbaData(
        tbaKey,
        `/match/${currentMatch}/simple`,
      );
      //fetch alliance data
      const teamsData = { redAlliance: [], blueAlliance: [] };

      //get general alliance objects
      if (matchData !== null) {
        const redAlliance = matchData.alliances.red.team_keys;
        const blueAlliance = matchData.alliances.blue.team_keys;

        teamsData.redAlliance = redAlliance;
        teamsData.blueAlliance = blueAlliance;
      }

      queueMicrotask(() => {
        setTeams(teamsData);
      });
    } catch (error) {
      console.error("Failed to set matches: ", error);
    }
  }, [currentMatch, tbaKey]);

  async function sendData() {
    if (currentEvent === "" || currentMatch === "" || currentTeam === "") {
      return;
    }

    try {
      // ✅ Ensure event exists
      await setDoc(
        doc(firestore, "events", currentEvent),
        { name: currentEvent },
        { merge: true },
      );

      // ✅ Ensure team exists
      await setDoc(
        doc(firestore, "events", currentEvent, "teams", currentTeam),
        { name: currentTeam },
        { merge: true },
      );

      // ✅ Ensure match exists
      await setDoc(
        doc(
          firestore,
          "events",
          currentEvent,
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
          currentEvent,
          "teams",
          currentTeam,
          "matches",
          currentMatch,
          "datasets",
        ),
        {
          ...matchScoutingData,
          email: getAuth().currentUser?.email,
        },
      );

      resetMatchScoutingData();

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (e) {
      console.error("Error adding document: " + e);
    }
  }

  //run when app loads
  useEffect(() => {
    loadTbaKey();
    loadDarkMode();
    loadCurrentEvent();
    loadCurrentMatch();
    loadMatchScoutingData();
    loadCurrentTeam();
  }, []);

  // match scouting page effect
  useEffect(() => {
    gatekeepMatchScoutingPage();
  }, [gatekeepMatchScoutingPage, tbaKey]);

  //tbaKey effects
  useEffect(() => {
    if (currentPage === "matchScouting" && matchScoutingErrorMessage === null) {
      populateEvents();
    }
  }, [currentPage, matchScoutingErrorMessage, populateEvents]);

  //currentEvent effects
  useEffect(() => {
    if (
      currentPage === "matchScouting" &&
      matchScoutingErrorMessage === null &&
      currentEvent
    ) {
      populateMatches();
    }
  }, [currentPage, currentEvent, populateMatches, matchScoutingErrorMessage]);

  //currentMatch effects
  useEffect(() => {
    if (
      currentPage === "matchScouting" &&
      matchScoutingErrorMessage === null &&
      currentMatch
    ) {
      populateTeams();
    }
  }, [currentPage, currentMatch, populateTeams, matchScoutingErrorMessage]);

  function resetMatchScoutingData() {
    saveCurrentMatch(getNextMatch(currentMatch, matches));
    saveCurrentTeam("");
    saveMatchScoutingData({
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
    });
  }

  const cardClass = "card";

  return (
    <>
      {currentPage === "login" && (
        <div className="login-button-container">
          <GoogleLogin
            onSuccess={async (credentialResponse) => {
              logInWithGoogle(credentialResponse);
              if (tbaKey === "") {
                setCurrentPage("tbaKeyInput");
              } else {
                setCurrentPage("matchScouting");
              }
            }}
            onError={() => {
              console.log("Login Failed");
            }}
          />
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
              saveTbaKey(e.target.value);
            }}
            placeholder="Enter your TBA API key"
          />
        </div>
      )}

      {currentPage === "matchScouting" && (
        <div className={cardClass}>
          <h1>Match Scouting</h1>
          {matchScoutingErrorMessage === null ? (
            <div>
              <div>
                <h3>Event</h3>

                <Select
                  styles={selectStyles}
                  value={
                    currentEvent
                      ? {
                          value: currentEvent,
                          label: `${events.get(currentEvent)} (${currentEvent})`,
                        }
                      : null
                  }

                  options={[...events.keys()].map((code) => ({
                    value: code,
                    label: `${events.get(code)} (${code})`,
                  }))}

                  onChange={(selected) => {
                    const eventValue = selected?.value || "";

                    saveCurrentEvent(eventValue);
                    saveCurrentMatch("");
                    saveCurrentTeam("");
                  }}
                />
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
              </div>
              {currentMatch ? (
                <div>
                  <div>
                    <h3>Team</h3>

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
                    <p>{"Driver rating: " + matchScoutingData.driverRating}</p>
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

                  <button onClick={sendData} className="saveButton">
                    <Save size={22} />
                    Save Match
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <div>
              <p>{matchScoutingErrorMessage}</p>
            </div>
          )}
        </div>
      )}

      {currentPage === "dataView" && (
        <div>
          <h1>Data View</h1>
        </div>
      )}
    </>
  );
}

export default App;
