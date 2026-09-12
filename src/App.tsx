import { useCallback, useEffect, useRef, useState } from "react";
import "./App.css";

//firebase
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {
  GoogleAuthProvider,
  getAuth,
  onAuthStateChanged,
  signInWithCredential,
} from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  setDoc,
} from "firebase/firestore";
import type {
  MatchScoutingData,
  MatchScoutingForm,
  MatchScoutingMetadata,
} from "./models/MatchScouting";
import LoginPage from "./pages/LoginPage/LoginPage";
import MatchScoutingPage from "./pages/MatchScoutingPage/MatchScoutingPage";
import { Page, type PageType } from "./pages/Page";
import SettingsPage from "./pages/SettingsPage/SettingsPage";
import { verifyTbaKey } from "./tba/verifyTbaKey";
import { Navbar } from "./ui/Navbar/Navbar";
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
const firestore = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});
const auth = getAuth(app);

function deleteOldLocalStorage() {
  try {
    if (localStorage.getItem("currentEvent")) {
      localStorage.removeItem("currentEvent");
    }
  } catch {
    console.log("Failed to delete old local storage");
  }
}

async function submitMatchScoutingForm(
  matchScoutingMetadata: MatchScoutingMetadata,
  matchScoutingData: MatchScoutingData,
) {
  try {
    Promise.all([
      // ✅ Ensure event exists
      setDoc(
        doc(firestore, "events", matchScoutingMetadata.eventCode),
        { name: matchScoutingMetadata.eventCode },
        { merge: true },
      ),

      // ✅ Ensure team exists
      setDoc(
        doc(
          firestore,
          "events",
          matchScoutingMetadata.eventCode,
          "teams",
          matchScoutingMetadata.team,
        ),
        { name: matchScoutingMetadata.team },
        { merge: true },
      ),

      // ✅ Ensure match exists
      setDoc(
        doc(
          firestore,
          "events",
          matchScoutingMetadata.eventCode,
          "teams",
          matchScoutingMetadata.team,
          "matches",
          matchScoutingMetadata.match,
        ),
        { name: matchScoutingMetadata.match },
        { merge: true },
      ),
    ]);

    // ✅ Now add dataset
    await addDoc(
      collection(
        firestore,
        "events",
        matchScoutingMetadata.eventCode,
        "teams",
        matchScoutingMetadata.team,
        "matches",
        matchScoutingMetadata.match,
        "datasets",
      ),
      {
        ...matchScoutingData,
        email: auth.currentUser?.email,
      },
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  } catch (e) {
    // uncomment this if it's decided to no longer use Firebase's local cache
    // it's also worth noting that this function will not error when there is no internet
    // setOfflineFormQueue((p) => [
    //   {
    //     matchScoutingMetadata: matchScoutingMetadata,
    //     matchScoutingData: matchScoutingData,
    //   } as MatchScoutingForm,
    //   ...p,
    // ]);
    console.error(`Error adding document: ${e}`);
    alert("Error saving match. Form data has been queued.");
  }
}

function App() {
  const isInitialized = useRef(false);
  const [autoLoginDone, setAutoLoginDone] = useState(false);
  const [currentPage, setCurrentPage] = useState<PageType>(Page.Login);
  const [tbaKey, setTbaKey] = useState(() => {
    return localStorage.getItem("tbaKey") || "";
  });
  const [tbaKeyResponse, setTbaKeyResponse] = useState<string | null>("");
  const gatekeepMatchScoutingPageIndex = useRef(0);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("darkMode") !== "light";
  });
  const [offlineFormQueue, setOfflineFormQueue] = useState<MatchScoutingForm[]>(
    () => {
      const data = localStorage.getItem("offlineMatchScoutingFormQueue");
      if (data) {
        return JSON.parse(data);
      }
      return [];
    },
  );

  const openHomePage = useCallback(() => {
    if (tbaKey === "") {
      setCurrentPage(Page.Settings);
    } else {
      setCurrentPage(Page.MatchScouting);
    }
  }, [tbaKey]);

  const gatekeepMatchScoutingPage = useCallback(async (tbaKey: string) => {
    try {
      gatekeepMatchScoutingPageIndex.current += 1;
      const currentIndex = gatekeepMatchScoutingPageIndex.current;
      setTbaKeyResponse("Verifying TBA API key...");
      const [, message] = await verifyTbaKey(tbaKey);
      if (currentIndex === gatekeepMatchScoutingPageIndex.current) {
        setTbaKeyResponse(message);
      }
    } catch (error) {
      console.error("Failed to verify TBA key: ", error);
    }
  }, []);

  function submitOfflineForm(form: MatchScoutingForm) {
    trashOfflineForm(form);
    submitMatchScoutingForm(form.matchScoutingMetadata, form.matchScoutingData);
  }

  function trashOfflineForm(form: MatchScoutingForm) {
    setOfflineFormQueue((p) => p.filter((f) => f !== form));
  }

  //run when app loads
  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;
    deleteOldLocalStorage();
    onAuthStateChanged(auth, (user) => {
      setAutoLoginDone(true);
      if (user != null) {
        openHomePage();
      } else {
        setCurrentPage(Page.Login);
      }
    });
    (async () => gatekeepMatchScoutingPage(tbaKey))();
  }, [gatekeepMatchScoutingPage, openHomePage, tbaKey]);

  useEffect(() => {
    try {
      localStorage.setItem("tbaKey", tbaKey);
    } catch (error) {
      console.error("Error saving TBA key:", error);
    }
  }, [tbaKey]);

  useEffect(() => {
    try {
      localStorage.setItem("darkMode", darkMode ? "dark" : "light");
      applyDarkMode(darkMode);
    } catch (error) {
      console.error("Error saving dark mode", error);
    }
  }, [darkMode]);

  useEffect(() => {
    try {
      localStorage.setItem(
        "offlineMatchScoutingFormQueue",
        JSON.stringify(offlineFormQueue),
      );
    } catch (error) {
      console.log("Error saving offline form queue", error);
    }
  }, [offlineFormQueue]);

  return (
    <main>
      {currentPage === Page.Login && autoLoginDone && (
        <LoginPage
          onSuccess={async (credentialResponse) => {
            const credential = GoogleAuthProvider.credential(
              credentialResponse.credential,
            );
            await signInWithCredential(auth, credential);
            openHomePage();
          }}
        />
      )}

      {currentPage !== Page.Login && (
        <Navbar
          setCurrentPage={setCurrentPage}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
        />
      )}

      <div hidden={currentPage !== Page.Settings}>
        <SettingsPage
          tbaKey={tbaKey}
          tbaKeyResponse={tbaKeyResponse}
          onTbaKeyChange={(tbaKey) => {
            setTbaKey(tbaKey);
            gatekeepMatchScoutingPage(tbaKey);
          }}
          offlineFormQueue={offlineFormQueue}
          onOfflineFormYes={submitOfflineForm}
          onOfflineFormNo={trashOfflineForm}
        />
      </div>

      <div hidden={currentPage !== Page.MatchScouting}>
        <MatchScoutingPage
          tbaKey={tbaKey}
          tbaKeyResponse={tbaKeyResponse}
          onSubmit={submitMatchScoutingForm}
        />
      </div>
    </main>
  );
}

export default App;
