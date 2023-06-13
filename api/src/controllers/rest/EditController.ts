import { Controller, Inject } from "@tsed/di";
import { Logger } from "@tsed/logger";
import { ClaimController } from "./edit/ClaimController";
import { WikibaseEditService } from "../../services/WikibaseEditService";

@Controller({ path: "/edit", children: [ClaimController] })
export class EditController {
	@Inject()
	wikibaseEditService: WikibaseEditService;

	@Inject()
	logger: Logger;
}
