import { Credentials } from "../WikibaseEditConfig";

const getCredentialsFromLocalStorage = (): Credentials | null => {
	const username = localStorage.getItem("username");
	const password = localStorage.getItem("password");
	if (!username || !password) {
		return null;
	}
	return {
		username,
		password,
	};
};
export const getCredentials = (): Credentials => {
	const existignCredentials = getCredentialsFromLocalStorage();
	if (existignCredentials) return existignCredentials;
	const username = prompt("Enter your username");
	if (!username) {
		return getCredentials();
	}
	const password = prompt("Enter your password");
	if (!password) {
		return getCredentials();
	}

	// store credentials in localStorage
	localStorage.setItem("username", username);
	localStorage.setItem("password", password);

	return {
		username,
		password,
	};
};
