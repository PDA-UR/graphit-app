export class State {
	username: string = "";

	init = () => {
		this.username = this.getUsername();
	};

	private getUsername(): string {
		const u = localStorage.getItem("username");
		if (!u) {
			const username = prompt("Please enter your Wikibase username", "Q157");
			if (username) {
				// regex to check if username is valid and starts with Q
				if (username.match(/Q\d+/)) {
					localStorage.setItem("username", username);
					return username;
				} else {
					alert("Username must be a valid Wikibase entity ID (e.g. Q123)");
					return this.getUsername();
				}
			} else {
				alert("You must enter a username to use this tool");
				return this.getUsername();
			}
		}
		return u;
	}
}

export const state = new State();
