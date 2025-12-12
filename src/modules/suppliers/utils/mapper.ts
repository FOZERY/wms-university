import { SupplierSchemaType } from '../schemas/supplier';
import { SupplierDbType } from '../types';

export function mapDbSupplierToResponse(db: SupplierDbType): SupplierSchemaType {
	return {
		id: db.id,
		name: db.name,
		inn: db.inn,
		contactPerson: db.contactPerson,
		phone: db.phone,
		email: db.email,
		address: db.address,
		createdAt: db.createdAt.getTime(),
		updatedAt: db.updatedAt.getTime(),
	};
}
