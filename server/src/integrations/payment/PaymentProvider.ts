export interface CreatePaymentOrderParams {
  orderId: string;
  amount: number; // integer paise
}

export interface CreatePaymentOrderResult {
  providerOrderId: string;
}

export interface VerifySignatureParams {
  providerOrderId: string;
  providerPaymentId: string;
  signature: string;
}

/**
 * Business logic depends on this interface, never on a specific gateway
 * SDK — swapping or adding a provider should never touch a controller or
 * service call site (Rule 20 / design doc §K, §20).
 */
export interface PaymentProvider {
  createOrder(params: CreatePaymentOrderParams): Promise<CreatePaymentOrderResult>;
  verifySignature(params: VerifySignatureParams): boolean;
}
