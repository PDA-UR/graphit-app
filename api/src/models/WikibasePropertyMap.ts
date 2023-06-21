import { Property } from "@tsed/schema";

export class WikibasePropertyMap {
	@Property()
	readonly dependsOn = "P1";
	@Property()
	readonly class = "P2";
	@Property()
	readonly image = "P9";
	@Property()
	readonly completed = "P12";
	@Property()
	readonly interested = "P23";
}
