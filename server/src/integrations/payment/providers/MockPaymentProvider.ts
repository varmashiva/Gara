import {
  PaymentProvider,
  CreatePaymentOrderParams,
  CreatePaymentOrderResult,
  VerifySignatureParams,
} from '../PaymentProvider';

/**
 * Local-dev/test provider — no real gateway call, no real money. Lets the
 * full checkout -> pay -> webhook flow be exercised without credentials.
 * A signature of exactly 'mock-signature' is treated as valid so tests can
 * also exercise the invalid-signature rejection path deliberately.
 */
export class MockPaymentProvider implements PaymentProvider {
  async createOrder(params: CreatePaymentOrderParams): Promise<CreatePaymentOrderResult> {
    return { providerOrderId: `mock_order_${params.orderId}` };
  }

  verifySignature(params: VerifySignatureParams): boolean {
    return params.signature === 'mock-signature';
  }
}
