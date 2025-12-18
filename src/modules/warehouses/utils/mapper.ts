import { WarehouseSchemaType } from '../schemas/warehouse';
import { WarehouseDbType } from '../types';

export function mapDbWarehouseToResponse(db: WarehouseDbType): WarehouseSchemaType {
	return {
		id: db.id,
		name: db.name,
		address: db.address ?? null,
		capacity: db.capacity ?? null,
		createdAt: db.createdAt.getTime(),
		updatedAt: db.updatedAt.getTime(),
	};
}
