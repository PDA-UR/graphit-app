import { Req } from "@tsed/common";
import { Middleware } from "@tsed/platform-middlewares";
/**
 * Create a session object on the request object.
 */
@Middleware()
export class CreateRequestSessionMiddleware {
	use(@Req() request: any) {
		if (request.session) {
			request.session.user = request.session.user || {
				username: "",
				password: "",
			};
			request.session.rights = request.session.rights || {
				isAdmin: false,
				userQID: "",
				cachedItems: [],
			}
		}
	}
}
