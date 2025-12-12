import { UserRole } from './roles';

export type UserSession = {
	id: string;
	login: string;
	firstname: string;
	lastname: string;
	middlename?: string;
	role: UserRole;
};
