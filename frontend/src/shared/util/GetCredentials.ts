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
	const username = prompt("Enter your username");
	if (!username) {
		return getCredentials();
	}
	const password = prompt("Enter your password");
	if (!password) {
		return getCredentials();
	}

	return {
		username,
		password,
	};
};
