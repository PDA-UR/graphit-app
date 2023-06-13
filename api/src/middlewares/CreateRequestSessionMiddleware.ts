import { Req } from "@tsed/common";
import { Middleware } from "@tsed/platform-middlewares";
@Middleware()
export class CreateRequestSessionMiddleware {
	use(@Req() request: any) {
		if (request.session) {
			request.session.user = request.session.user || {
				username: "",
				password: "",
			};
		}
	}
}
