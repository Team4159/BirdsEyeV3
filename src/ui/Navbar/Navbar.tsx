import { LogOut, Moon, Search, Settings, Sun } from "lucide-react";
import { logOut } from "../../firebase/auth";
import { Page, type PageType } from "../../pages/Page";
import type React from "react";
import styles from "./Navbar.module.css";

type NavbarProps = {
  setCurrentPage: (page: PageType) => void;
  darkMode: boolean;
  setDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
};

export function Navbar({ setCurrentPage, darkMode, setDarkMode }: NavbarProps) {
  return (
    <nav className={styles["navbar"]}>
      <button
        onClick={() => {
          setDarkMode((p) => !p);
        }}
      >
        {darkMode ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      <button
        onClick={() => {
          setCurrentPage(Page.Settings);
        }}
      >
        <Settings size={20} />
      </button>

      <button
        onClick={() => {
          setCurrentPage(Page.MatchScouting);
        }}
      >
        <Search size={20} />
      </button>

      <button
        onClick={() => {
          logOut();
          setCurrentPage(Page.Login);
        }}
      >
        <LogOut size={20} />
      </button>
    </nav>
  );
}
