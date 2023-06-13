import { Inject, Service } from "@tsed/di";
import wbEdit from "wikibase-edit";
import { ServerInfoService } from "./ServerInfoService";
import { Credentials } from "../models/CredentialsModel";

type WikibaseEditMap = Map<string, any>;

@Service()
export class WikibaseEditService {
	@Inject()
	info: ServerInfoService;

	private wikibaseEditMap: WikibaseEditMap = new Map();

	private wikibaseEditConfig = (credentials: Credentials) => ({
		instance: this.info.instance,
		wgScriptPath: "/w",
		// One authorization mean is required (unless in anonymous mode, see below)
		credentials: {
			username: credentials.username,
			password: credentials.password,
		},
		anonymous: false,
		summary: "edit from property editor",
		// See https://www.mediawiki.org/wiki/Manual:Tags
		// Default: on Wikidata [ 'WikibaseJS-edit' ], empty for other Wikibase instances
		// tags: ["Some general tag"],

		// Default: `wikidata-edit/${pkg.version} (https://github.com/maxlath/wikidata-edit)`
		userAgent: `wikibase-api/${this.info.version}`,
		// See https://www.mediawiki.org/wiki/Manual:Maxlag_parameter
		// Default: 5
		maxlag: 2,
	});

	getSession(credentials: Credentials): any {
		const key = credentials.username;
		if (this.wikibaseEditMap.has(key)) {
			return this.wikibaseEditMap.get(key);
		} else {
			const session = this.createSession(credentials);
			this.wikibaseEditMap.set(key, session);
			return session;
		}
	}

	private createSession(credentials: Credentials): any {
		const config = this.wikibaseEditConfig(credentials),
			session = wbEdit(config);
		return session;
	}

	removeSession(credentials: Credentials): void {
		this.wikibaseEditMap.delete(credentials.username);
	}
}
