import { WarehouseSchemaType } from '../schemas/warehouse';
import { WarehouseDbType } from '../types';

export function mapDbWarehouseToResponse(db: WarehouseDbType & any): WarehouseSchemaType {
	const base: WarehouseSchemaType = {
		id: db.id,
		name: db.name,
		address: db.address ?? null,
		capacity: db.capacity ?? null,
		createdAt: db.createdAt instanceof Date ? db.createdAt.getTime() : db.createdAt,
		updatedAt: db.updatedAt instanceof Date ? db.updatedAt.getTime() : db.updatedAt,
	} as any;

	if (db.stats) {
		base.stats = {
			totalItems: db.stats.totalItems,
			occupancy: db.stats.occupancy ?? undefined,
		} as any;
	}

	return base;
}
