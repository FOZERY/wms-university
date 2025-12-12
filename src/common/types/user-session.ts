import { UserRoles } from '../enums/roles';

export type UserSession = {
	id: string;
	login: string;
	firstname: string;
	lastname: string;
	middlename?: string;
	role: UserRoles;
};
