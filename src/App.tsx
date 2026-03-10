import { useState, useEffect} from 'react'
import { Sun, Moon, Settings, Save } from 'lucide-react'
import './App.css'

//firebase
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import { Counter } from './ui/counter'
import { fetchTBAData } from './tba/fetchTBAData'
import { compareMatchKeys, formatMatchLabel, getNextMatch } from './util/MatchUtil';
import Select from 'react-select';
import { selectStyles } from './ui/SelectStyles';
import { getAuth } from 'firebase/auth';
import { Login } from './ui/Login';
import { logOut } from './firebase/auth';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
apiKey: "AIzaSyCk4X0qVprdIYWoMdtTnSs0qVAqR_zcQBY",
authDomain: "scoutingapp-bd57b.firebaseapp.com",
projectId: "scoutingapp-bd57b",
storageBucket: "scoutingapp-bd57b.firebasestorage.app",
messagingSenderId: "345042135934",
appId: "1:345042135934:web:3499e51bc4ebde3d5e212f",
measurementId: "G-Q5EL55034N"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);

function App() {
  const [currentPage, setCurrentPage] = useState("login");
  const [tbaKey, setTBAKey] = useState("");
  const [darkMode, setDarkMode] = useState(true);
  const [events, setEvents] = useState<string[]>([]);
  const [currentEvent, setCurrentEvent] = useState("");
  const [matches, setMatches] = useState([]);
  const [currentMatch, setCurrentMatch] = useState("");
  /** stores two arrays of teams (for red and blue) alliances. use .redAlliance and .bluealliance*/
  const [teams, setTeams] = useState({redAlliance: [], blueAlliance: []});
  const [currentTeam, setCurrentTeam] = useState("");
  /** match scouting data for the team being scouted */
  const [matchScoutingData, setMatchScoutingData] = useState({
    autoFuels: 0,
    autoNotes: "",
    autoClimb: 'none',
    teleopFuels: 0,
    endgameClimb: 'none',
    fouls: 0,
    techFouls: 0,
    defense: false,
    driverRating: 3.0,
    driverNotes: ""
  })

  //set body to dark mode initially
  document.body.classList.toggle("darkBG", darkMode);

  //run when app loads
  useEffect(() => {
    loadTBAKey();
    loadDarkMode();
    loadCurrentEvent();
    loadCurrentMatch();
    loadCurrentTeam();
    loadMatchScoutingData();
  }, []);

  //tbaKey effects
  useEffect(() => {
    if (!(tbaKey === "")) {
      populateEvents();
    }
  }, [tbaKey]);

  //currentEvent effects
  useEffect(() => {
    if (currentEvent) {
      populateMatches()
    }
  }, [currentEvent]);

  //currentMatch effects
  useEffect(() => {
    if (currentMatch) {
      populateTeams()
    }
  }, [currentMatch]);

  const loadTBAKey = async () => {
    try {
      const result = localStorage.getItem('tbaKey');
      if (result) {
        setTBAKey(result);
      }
    } catch (error) {
      console.log('No TBA key found');
    }
  };

  const saveTBAKey = async (key: string) => {
    try {
      localStorage.setItem("tbaKey", key)
      setTBAKey(key);
    } catch (error) {
      console.error('Error saving TBA key:', error);
      return;
    }
  };

  const loadDarkMode = async () => {
    try {
      const result = localStorage.getItem('darkMode');
      if (result === "light") {
        setDarkMode(false);
      }
      else{
        setDarkMode(true);
      }
    } catch (error) {
      console.log('No dark mode preference found');
    }
  }

  const saveDarkMode = (darkMode:boolean)=>{
    localStorage.setItem("darkMode", darkMode ? "dark":"light")
    setDarkMode(darkMode)

    if(darkMode){
      document.body.classList.remove("light")
    }else{
      document.body.classList.add("light")
    }
  }

  const loadCurrentEvent = async () => {
    try {
      const result = localStorage.getItem('currentEvent');
      if (result) {
        setCurrentEvent(result);
      }
    } catch (error) {
      console.log('No event found');
    }
  };

  const saveCurrentEvent = async (currentEvent: string) => {
    try {
      localStorage.setItem("currentEvent", currentEvent);
      setCurrentEvent(currentEvent);
    } catch (error) {
      console.error('Error saving event:', error);
      return;
    }
  };

  const loadCurrentMatch = async () => {
    try {
      const result = localStorage.getItem('currentMatch');
      if (result) {
        setCurrentMatch(result);
      }
    } catch (error) {
      console.log('No match found');
    }
  };

  const saveCurrentMatch = async (currentMatch: string) => {
    try {
      localStorage.setItem("currentMatch", currentMatch);
      setCurrentMatch(currentMatch);
    } catch (error) {
      console.error('Error saving match:', error);
      return;
    }
  };

  const loadCurrentTeam = async () => {
    try {
      const result = localStorage.getItem('currentTeam');
      if (result) {
        setCurrentTeam(result);
      }
    } catch (error) {
      console.log('No team found');
    }
  };

  const saveCurrentTeam = async (currentTeam: string) => {
    try {
      localStorage.setItem("currentTeam", currentTeam);
      setCurrentTeam(currentTeam);
    } catch (error) {
      console.error('Error saving team:', error);
      return;
    }
  };

  const loadMatchScoutingData = async () => {
    try {
      const result = localStorage.getItem('currentMatchScoutingData');
      if (result) {
        setMatchScoutingData(JSON.parse(result));
      }
    } catch (error) {
      console.log('No match found');
    }
  };

  const saveMatchScoutingData = async (matchScoutingData: any) => {
    try {
      localStorage.setItem("currentMatchScoutingData", JSON.stringify(matchScoutingData));
      setMatchScoutingData(matchScoutingData);
    } catch (error) {
      console.error('Error saving team:', error);
      return;
    }
  };

  async function populateEvents(){
    try{
      setEvents(await fetchTBAData(tbaKey, "/events/2026/keys"));
    } catch(error){
      console.error('Failed to set matches: ', error);
    }
  }

  async function populateMatches(){
    try{
      var fetchedMatches = await fetchTBAData(tbaKey, `/event/${currentEvent}/matches/keys`);
      fetchedMatches = fetchedMatches.sort((a: string, b: string) => {
        return compareMatchKeys(a, b);
      });
      setMatches(fetchedMatches);
    } catch(error){
      console.error('Failed to set matches: ', error);
    }
  }

  async function populateTeams(){
    try{
      //raw match data from tba
      const matchData = await fetchTBAData(tbaKey, `/match/${currentMatch}`);
      //fetch alliance data
      var teamsData = {redAlliance: [], blueAlliance: []}

      //get general alliance objects
      const redAlliacne = matchData.alliances.red.team_keys;
      const blueAlliance = matchData.alliances.blue.team_keys;

      teamsData.redAlliance = redAlliacne;
      teamsData.blueAlliance = blueAlliance;

      setTeams(teamsData);
    } catch(error){
      console.error('Failed to set matches: ', error);
    }
  }

  async function sendData(){
    if(currentEvent === "" || currentMatch === "" || currentTeam === "") return;
    try{
        await addDoc(collection(firestore, "matches"), 
          {
            ...matchScoutingData,
            team: currentTeam,
            matchKey: currentMatch,
            email: getAuth().currentUser?.email
          });
        resetMatchScoutingData();
        window.scrollTo({
          top: 0,
          behavior: 'smooth' // for a smooth scrolling effect
        });
    }
    catch(e){
        console.error("Error adding document: " + e);
    }
  }

  function resetMatchScoutingData(){
    console.log(currentMatch);
    saveCurrentMatch(getNextMatch(currentMatch, matches));
    saveCurrentTeam("");
    saveMatchScoutingData({
      autoFuels: 0,
      autoNotes: "",
      autoClimb: 'none',
      teleopFuels: 0,
      endgameClimb: 'none',
      fouls: 0,
      techFouls: 0,
      defense: false,
      driverRating: 3.0,
      driverNotes: ""});
  }

  const cardClass = "card";

  return (
    <>
      {currentPage === "login" && (
        <Login onChange={() => setCurrentPage("matchScouting")}></Login>
      )}

      {currentPage !== "login" && (
        <nav className = "navBar">
          <button 
            onClick={() => {saveDarkMode(!darkMode)}}>
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <button 
            onClick={() => {setCurrentPage("tbaKeyInput")}}>
            {<Settings size={20}/>}
          </button>

          <button 
            onClick={() => {setCurrentPage("matchScouting")}}>
            match scouting
          </button>

          <button 
            onClick={() => {
              logOut();
              setCurrentPage("login");
            }}>
            Log Out
          </button>
        </nav>
      )}

      {currentPage === "tbaKeyInput" && (
        <div className = {cardClass}>
          <h1>Input TBA Key</h1>
          <input
            type="text"
            value={tbaKey}
            onChange={(e) => {
              saveTBAKey(e.target.value);
            }}
            placeholder="Enter your TBA API key"
          />
        </div>
      )}

      {currentPage === "matchScouting" && (
        <div className = {cardClass}>
          <h1>Match Scouting</h1>
          <div>
            <h3>Event</h3>

            <Select
              styles={selectStyles}
              value={
                currentEvent
                  ? { value: currentEvent, label: currentEvent }
                  : null
              }

              options={events.map(event => ({
                value: event,
                label: event
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

              options={matches.map(match => ({
                value: match,
                label: formatMatchLabel(match)
              }))}

              value={
                currentMatch
                  ? {
                      value: currentMatch,
                      label: formatMatchLabel(currentMatch)
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

          <div>
            <h3>Team</h3>
            
            {/* Red Alliance Row */}
            <div className="teamGrid">
              {teams.redAlliance.map((team, index) => (
                <button
                  key={team}
                  className={`teamButton red ${currentTeam === team ? "selected" : ""}`}
                  onClick={() => saveCurrentTeam(team)}
                >
                  {"Red" + (index + 1) + ": " + team}
                </button>
              ))}
            </div>

            {/* Blue Alliance Row */}
            <div className="teamGrid">
              {teams.blueAlliance.map((team, index) => (
                <button
                  key={team}
                  className={`teamButton blue ${currentTeam === team ? "selected" : ""}`}
                  onClick={() => saveCurrentTeam(team)}
                >
                  {"Blue" + (index + 1) + ": " + team}
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
              onChange={(v) => saveMatchScoutingData({...matchScoutingData, autoFuels: v})}
            />
            <label className="block text-sm font-medium mb-2">Climb Status</label>
            <select
              value={matchScoutingData.autoClimb}
              onChange={(e) => saveMatchScoutingData({...matchScoutingData, autoClimb: e.target.value})}
            >
              <option value="none">No Climb</option>
              <option value="l1auto">L1 (15 pts)</option>
            </select>
            <p>Auto Notes</p>
            <textarea
              value={matchScoutingData.autoNotes}
              onChange={(e) => saveMatchScoutingData({...matchScoutingData, autoNotes: e.target.value})}
              placeholder="Auto notes..."
            />
          </div>
          
          <div>
            <h1>Teleop</h1>
            <Counter
              label="Teleop Fuels"
              value={matchScoutingData.teleopFuels}
              increments={[1, 5]}
              onChange={(v) => saveMatchScoutingData({...matchScoutingData, teleopFuels: v})}
            />
          </div>

          <div>
            <h1>Endgame</h1>
            <label className="block text-sm font-medium mb-2">Climb Status</label>
            <select
              value={matchScoutingData.endgameClimb}
              onChange={(e) => saveMatchScoutingData({...matchScoutingData, endgameClimb: e.target.value})}
            >
              <option value="none">No Climb</option>
              <option value="l1">L1 (10 pts)</option>
              <option value="l2">L2 (20 pts)</option>
              <option value="l3">L3 (30 pts)</option>
            </select>
          </div>

          <div>
            <h1>Fouls</h1>
            <Counter
              label="Fouls"
              value={matchScoutingData.fouls}
              increments={[1]}
              onChange={(v) => saveMatchScoutingData({...matchScoutingData, fouls: v})}
            />
            <Counter
              label="Tech Fouls"
              value={matchScoutingData.techFouls}
              increments={[1]}
              onChange={(v) => saveMatchScoutingData({...matchScoutingData, techFouls: v})}
            />
          </div>

          <div>
            <h1>Driver Info</h1>
            <button
              onClick={() => (saveMatchScoutingData({...matchScoutingData, defense: !matchScoutingData.defense}))}
              >
              {"Defense: " + matchScoutingData.defense}
            </button>
            <p>{"driver rating: " + matchScoutingData.driverRating}</p>

            <input type="range" min="1" max="5" value={matchScoutingData.driverRating} className="slider" id="myRange"
            onChange={(e) => saveMatchScoutingData({...matchScoutingData, driverRating: parseInt(e.target.value)})}></input>

            <textarea
              value={matchScoutingData.driverNotes}
              onChange={(e) => saveMatchScoutingData({...matchScoutingData, driverNotes: e.target.value})}
              placeholder="driver notes..."
            />
          </div>

          <button onClick={sendData} className="saveButton">
            <Save size={22}/>
            Save Match
          </button>
        </div>
      )}

      {currentPage === "dataView" && (
        <div>
          <h1>Data View</h1>
        </div>
      )}
    </>
  )
}

export default App
