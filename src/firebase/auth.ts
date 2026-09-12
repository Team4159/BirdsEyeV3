import { getAuth, signOut } from "firebase/auth";

export function logOut() {
	const auth = getAuth();
	signOut(auth)
		.then(() => {
			// Sign-out successful.
			console.log("User signed out");
		})
		.catch((error) => {
			// An error happened.
			console.error("Sign out error", error);
		});
}
