import { Inject, Service } from "@tsed/di";
import WBK, { EntityId, Wbk } from "wikibase-sdk";
import { SessionService } from "./SessionService";
import { Credentials } from "../models/CredentialsModel";
import { SparqlQueryTemplateService } from "./sparql/SparqlQueriesService";
import { SparqlResult } from "../models/SparqlResultModel";

@Service()
export class WikibaseSdkService extends SessionService<Wbk> {
	@Inject(SparqlQueryTemplateService)
	templateService: SparqlQueryTemplateService;

	protected createSessionData(): Wbk {
		const wbk = WBK({
			sparqlEndpoint: this.info.sparqlEndpoint,
			instance: this.info.instance,
		});
		return wbk;
	}

	async query(credentials: Credentials, query: string): Promise<SparqlResult> {
		const wbk = this.getSessionData(credentials);
		const url = wbk.sparqlQuery(query);
		const headers = {};
		this.logger.info("url", url);

		const response = await fetch(url, { headers });
		this.logger.info("response", response);
		const data = await response.json();
		return { data };
	}

	async getEntities(
		credentials: Credentials,
		ids: EntityId[]
	): Promise<SparqlResult> {
		const wbk = this.getSessionData(credentials);
		const url = wbk.getEntities({ ids });
		const headers = {};

		const response = await fetch(url, { headers });
		const data = await response.json();
		return { data };
	}

	async getWikibasePageContent(
		credentials: Credentials,
		title: string
	): Promise<string> {
		const urlParams = new URLSearchParams({
			action: "parse",
			page: title,
			prop: "wikitext",
			formatversion: "2",
			format: "json",
		});

		const url = `${this.info.instance}/api.php?${urlParams.toString()}`;

		try {
			const response = await fetch(url);
			const json = await response.json();
			return json.parse.wikitext;
		} catch (error) {
			this, this.logger.error("error", error);
			return Promise.reject(error);
		}
	}

	private async parseUserItemId(userPageContent: string): Promise<string> {
		const regex = /\[\[Item:Q\d+(\|.*)?\]\]/g;

		const matches = userPageContent.match(regex);
		if (matches) {
			const userId = matches[0]
				.replace("[[Item:", "")
				.replace("]]", "")
				// remove alias if present
				.split("|")[0];
			return userId;
		}

		return "";
	}

	async getUserItemId(credentials: Credentials): Promise<string> {
		const htmlUserPage = await this.getWikibasePageContent(
			credentials,
			"User:" + credentials.username
		);
		const userItemId = await this.parseUserItemId(htmlUserPage);
		return userItemId;
	}

	// ~~~~~~~~~~ Pre built queries: ~~~~~~~~~ //

	async getUserGraph(
		credentials: Credentials,
		userId: string
	): Promise<SparqlResult> {
		const query = this.templateService.getUserGraph(userId);
		return this.query(credentials, query);
	}

	async getCategories(credentials: Credentials): Promise<SparqlResult> {
		const query = this.templateService.getCategoriesQuery();
		return this.query(credentials, query);
	}
}
