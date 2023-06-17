import { Controller, Inject } from "@tsed/di";
import { Logger } from "@tsed/logger";
import { Claim } from "./edit/ClaimController";
import { WikibaseEditService } from "../../services/WikibaseEditService";

@Controller({ path: "/edit", children: [Claim] })
export class Edit {
	@Inject()
	wikibaseEditService: WikibaseEditService;

	@Inject()
	logger: Logger;
}
