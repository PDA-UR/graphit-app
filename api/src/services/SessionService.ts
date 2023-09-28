import { Inject, Service } from "@tsed/di";
import { ServerInfoService } from "./ServerInfoService";
import { Credentials } from "../models/CredentialsModel";
import { Logger } from "@tsed/logger";

/**
 * Service to manage sessions and user data.
 */
@Service()
export abstract class SessionService<T> {
	@Inject()
	info: ServerInfoService;

	@Inject()
	logger: Logger;

	private sessionData: Map<string, T> = new Map();

	getSessionData(credentials: Credentials): T {
		const key = this.getSessionDataKey(credentials);
		if (this.sessionData.has(key)) {
			return this.sessionData.get(key)!;
		} else {
			const session = this.createSessionData(credentials);
			this.sessionData.set(key, session);
			return session;
		}
	}

	removeSessionData(credentials: Credentials): boolean {
		return this.sessionData.delete(credentials.username);
	}

	protected getSessionDataKey(credentials: Credentials): string {
		const key = credentials.username + credentials.password;
		return key;
	}

	protected abstract createSessionData(credentials: Credentials): T;
}
