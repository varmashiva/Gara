import { Address } from '../models/Address';
import { AppError } from '../utils/errors';
import { AddressInput, AddressUpdateInput } from '../schemas/address.schema';

export async function listAddresses(userId: string) {
  return Address.find({ userId }).sort({ isDefault: -1, createdAt: -1 });
}

export async function createAddress(userId: string, input: AddressInput) {
  if (input.isDefault) {
    await Address.updateMany({ userId }, { isDefault: false });
  }
  const isFirst = (await Address.countDocuments({ userId })) === 0;
  return Address.create({ ...input, userId, isDefault: input.isDefault || isFirst });
}

async function findOwnedAddress(userId: string, addressId: string) {
  const address = await Address.findOne({ _id: addressId, userId });
  if (!address) {
    throw AppError.notFound('Address not found', 'ADDRESS_NOT_FOUND');
  }
  return address;
}

export async function updateAddress(userId: string, addressId: string, input: AddressUpdateInput) {
  const address = await findOwnedAddress(userId, addressId);
  if (input.isDefault) {
    await Address.updateMany({ userId }, { isDefault: false });
  }
  Object.assign(address, input);
  await address.save();
  return address;
}

export async function deleteAddress(userId: string, addressId: string) {
  const address = await findOwnedAddress(userId, addressId);
  await address.deleteOne();
}

export async function setDefaultAddress(userId: string, addressId: string) {
  await findOwnedAddress(userId, addressId);
  await Address.updateMany({ userId }, { isDefault: false });
  const address = await Address.findByIdAndUpdate(addressId, { isDefault: true }, { new: true });
  return address;
}

export async function getOwnedAddress(userId: string, addressId: string) {
  return findOwnedAddress(userId, addressId);
}
