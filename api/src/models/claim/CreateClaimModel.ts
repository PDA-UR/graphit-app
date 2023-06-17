import { Enum, Optional, Pattern, Property, Required } from "@tsed/schema";

// wbEdit.claim.create({
//     id: 'Q4115189',
//     property: 'P2002',
//     value: 'bulgroz',
//     rank: 'preferred',
//     qualifiers: {
//       P370: 'foo'
//     },
//     references: [
//       { P143: 'Q8447', P813: '2020-07' },
//       { P143: 'https://some.source/url', P813: '2020-07-19' }
//     ]
//   })

export type Qualifiers = Record<string, string>;

export const entityPattern = /[PQ]\d{1,5}/;

export class CreateClaim {
	@Required()
	@Pattern(entityPattern)
	property: string;

	@Required()
	@Property()
	value: string;

	@Optional()
	@Enum("preferred", "normal", "deprecated")
	rank: string;

	@Optional()
	@Property()
	qualifiers: Qualifiers;

	// References are not supported yet
}
