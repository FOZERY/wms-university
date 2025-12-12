import { UserSession } from 'src/common/types/user-session';

declare global {
	namespace Express {
		interface Request {
			userSession?: UserSession;
			cookies: {
				sessionId?: string;
				[key: string]: unknown;
			};
		}
	}
}
