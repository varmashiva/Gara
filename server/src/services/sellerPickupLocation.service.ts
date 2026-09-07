import { SellerPickupLocation } from '../models/SellerPickupLocation';
import { AppError } from '../utils/errors';
import { getSellerByUserId } from './seller.service';
import { PickupLocationInput, PickupLocationUpdateInput } from '../schemas/seller.schema';

export async function listPickupLocations(userId: string) {
  const seller = await getSellerByUserId(userId);
  return SellerPickupLocation.find({ sellerId: seller._id }).sort({ createdAt: -1 });
}

export async function createPickupLocation(userId: string, input: PickupLocationInput) {
  const seller = await getSellerByUserId(userId);

  if (input.isDefault) {
    await SellerPickupLocation.updateMany({ sellerId: seller._id }, { isDefault: false });
  }

  const isFirst = (await SellerPickupLocation.countDocuments({ sellerId: seller._id })) === 0;

  return SellerPickupLocation.create({
    ...input,
    sellerId: seller._id,
    isDefault: input.isDefault || isFirst,
    status: 'PENDING', // flips to ACTIVE once Phase 9's ShippingProvider confirms registration
  });
}

async function findOwnedLocation(userId: string, locationId: string) {
  const seller = await getSellerByUserId(userId);
  const location = await SellerPickupLocation.findOne({ _id: locationId, sellerId: seller._id });
  if (!location) {
    throw AppError.notFound('Pickup location not found', 'PICKUP_LOCATION_NOT_FOUND');
  }
  return location;
}

export async function updatePickupLocation(userId: string, locationId: string, input: PickupLocationUpdateInput) {
  const location = await findOwnedLocation(userId, locationId);

  if (input.isDefault) {
    await SellerPickupLocation.updateMany({ sellerId: location.sellerId }, { isDefault: false });
  }

  Object.assign(location, input);
  await location.save();
  return location;
}

export async function deletePickupLocation(userId: string, locationId: string) {
  const location = await findOwnedLocation(userId, locationId);
  await location.deleteOne();
}
