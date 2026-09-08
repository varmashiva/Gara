import { ShippingProvider } from './ShippingProvider';
import { MockShippingProvider } from './providers/MockShippingProvider';
import { ShiprocketProvider } from './providers/ShiprocketProvider';
import { env } from '../../config/env';

export const shippingProvider: ShippingProvider =
  env.SHIPPING_PROVIDER_MODE === 'real' ? new ShiprocketProvider() : new MockShippingProvider();
