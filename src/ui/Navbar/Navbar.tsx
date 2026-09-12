import "./Navbar.css";
import { LogOut, Moon, Search, Settings, Sun } from "lucide-react";
import type React from "react";
import { logOut } from "../../firebase/auth";
import { Page, type PageType } from "../../pages/Page";

type NavbarProps = {
	setCurrentPage: (page: PageType) => void;
	darkMode: boolean;
	setDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
};

export function Navbar({ setCurrentPage, darkMode, setDarkMode }: NavbarProps) {
	return (
		<nav className="navbar">
			<button
				type="button"
				onClick={() => {
					setDarkMode((p) => !p);
				}}
			>
				{darkMode ? <Sun size={20} /> : <Moon size={20} />}
			</button>

			<button
				type="button"
				onClick={() => {
					setCurrentPage(Page.Settings);
				}}
			>
				<Settings size={20} />
			</button>

			<button
				type="button"
				onClick={() => {
					setCurrentPage(Page.MatchScouting);
				}}
			>
				<Search size={20} />
			</button>

			<button
				type="button"
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
