import { SellerPickupLocation, SellerPickupLocationDocument } from '../models/SellerPickupLocation';
import { User } from '../models/User';
import { shippingProvider } from '../integrations/shipping/shippingProviderFactory';
import { AppError } from '../utils/errors';
import { getSellerByUserId } from './seller.service';
import { PickupLocationInput, PickupLocationUpdateInput } from '../schemas/seller.schema';

const ADDRESS_FIELDS = [
  'contactPerson',
  'phone',
  'addressLine1',
  'addressLine2',
  'city',
  'state',
  'postalCode',
  'country',
] as const;

/**
 * Registers the address with the shipping provider so orders can reference
 * it. Throws (with Shiprocket's own validation message) if the provider
 * rejects the address, so the admin sees why right away.
 */
async function registerWithProvider(userId: string, location: PickupLocationInput | SellerPickupLocationDocument) {
  const user = await User.findById(userId).select('email');
  const { externalPickupLocationId } = await shippingProvider.registerPickupLocation({
    label: location.label,
    contactPerson: location.contactPerson,
    phone: location.phone,
    addressLine1: location.addressLine1,
    addressLine2: location.addressLine2,
    city: location.city,
    state: location.state,
    postalCode: location.postalCode,
    country: location.country,
    email: user?.email ?? '',
  });
  return externalPickupLocationId;
}

/** Used when shipping from a location created before registration existed. */
export async function ensurePickupLocationRegistered(location: SellerPickupLocationDocument, userId: string) {
  if (location.shiprocketPickupLocationId && location.status === 'ACTIVE') return location;
  location.shiprocketPickupLocationId = await registerWithProvider(userId, location);
  location.status = 'ACTIVE';
  await location.save();
  return location;
}

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
  const shiprocketPickupLocationId = await registerWithProvider(userId, input);

  return SellerPickupLocation.create({
    ...input,
    sellerId: seller._id,
    isDefault: input.isDefault || isFirst,
    shiprocketPickupLocationId,
    status: 'ACTIVE',
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

  const addressChanged = ADDRESS_FIELDS.some((field) => field in input && input[field] !== location[field]);
  Object.assign(location, input);

  // Shiprocket has no API to edit a registered pickup address, so a changed
  // address is registered afresh under a new nickname; shipments already
  // created keep using the old one.
  if (addressChanged) {
    location.shiprocketPickupLocationId = await registerWithProvider(userId, location);
    location.status = 'ACTIVE';
  }
  await location.save();
  return location;
}

export async function deletePickupLocation(userId: string, locationId: string) {
  const location = await findOwnedLocation(userId, locationId);
  await location.deleteOne();
}
