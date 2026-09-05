import { dpoCreateToken, getDpoConfig } from "./dpo";

export type MobileMoneyProvider = "Airtel Money" | "MTN Mobile Money" | "Zamtel Money";

export type PaymentInitiationResult = {
  status: "processing" | "pending" | "paid" | "failed";
  providerTransactionId?: string;
  message: string;
  paymentUrl?: string;
};

export interface MobileMoneyProviderAdapter {
  initiate(input: {
    amount: number;
    phone: string;
    reference: string;
    customerName?: string;
    customerEmail?: string;
  }): Promise<PaymentInitiationResult>;
}

class NotConfiguredProvider implements MobileMoneyProviderAdapter {
  async initiate() {
    return {
      status: "pending" as const,
      message: "Payment provider integration is not configured. Complete the payment authorization on your phone, then wait for confirmation.",
    };
  }
}

// Uses DPO Pay by Network's hosted checkout (createToken -> redirect -> verifyToken).
// DPO handles the actual mobile money / card charge, so no wallet credentials ever
// touch our server. See lib/payments/dpo.ts for the raw API client.
class DpoProvider implements MobileMoneyProviderAdapter {
  async initiate(input: {
    amount: number;
    phone: string;
    reference: string;
    customerName?: string;
    customerEmail?: string;
  }) {
    const config = getDpoConfig();
    if (!config) {
      return {
        status: "pending" as const,
        message: "Payment provider integration is not configured. Complete the payment authorization on your phone, then wait for confirmation.",
      };
    }
    const siteUrl = (process.env.SITE_URL || "http://localhost:3000").replace(/\/$/, "");
    const result = await dpoCreateToken(config, {
      amount: input.amount,
      currency: "ZMW",
      companyRef: input.reference,
      customerName: input.customerName || "Customer",
      customerEmail: input.customerEmail,
      customerPhone: input.phone,
      redirectUrl: `${siteUrl}/api/payments/dpo/return`,
      backUrl: `${siteUrl}/api/payments/dpo/return`,
      description: `Zhurie & Co order ${input.reference}`,
    });
    if (!result.ok) {
      return { status: "failed" as const, message: `Payment could not be started: ${result.explanation}` };
    }
    return {
      status: "processing" as const,
      providerTransactionId: result.transactionToken,
      paymentUrl: result.paymentUrl,
      message: "Redirecting you to complete payment securely via DPO.",
    };
  }
}

export function getMobileMoneyProvider(): MobileMoneyProviderAdapter {
  return getDpoConfig() ? new DpoProvider() : new NotConfiguredProvider();
}
