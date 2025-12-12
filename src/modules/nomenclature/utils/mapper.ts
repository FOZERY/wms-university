import { ItemSchemaType } from '../schemas/item';
import { ItemDbType } from '../types';

export function mapDbItemToResponse(db: ItemDbType): ItemSchemaType {
	return {
		id: db.id,
		code: db.code,
		name: db.name,
		type: db.type,
		unit: db.unit,
		purchasePrice: db.purchasePrice,
		sellPrice: db.sellPrice,
		minQuantity: db.minQuantity,
		description: db.description,
		createdAt: db.createdAt.getTime(),
		updatedAt: db.updatedAt.getTime(),
	};
}
