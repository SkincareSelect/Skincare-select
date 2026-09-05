import { XMLBuilder, XMLParser } from "fast-xml-parser";

// DPO Pay by Network (formerly 3G Direct Pay) API v6 client.
// Docs: https://docs.dpopay.com/dpo-pay-by-network/reference/quick-start-guide
// Hosted-checkout flow: createToken -> redirect customer -> verifyToken.
// No card/mobile-money credentials ever touch our server.

const DPO_API_URL = "https://secure.3gdirectpay.com/API/v6/";
const DPO_HOSTED_PAGE_URL = "https://secure.3gdirectpay.com/pay.asp";

const builder = new XMLBuilder({ format: false, ignoreAttributes: true });
const parser = new XMLParser({ ignoreAttributes: true });

export type DpoConfig = {
  companyToken: string;
  serviceType: string;
};

export function getDpoConfig(): DpoConfig | null {
  const companyToken = process.env.DPO_COMPANY_TOKEN;
  const serviceType = process.env.DPO_SERVICE_TYPE;
  if (!companyToken || !serviceType) return null;
  return { companyToken, serviceType };
}

async function callDpo(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  const xml = builder.build({ API3G: payload });
  const response = await fetch(DPO_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/xml; charset=utf-8", Accept: "application/xml" },
    body: xml,
  });
  const text = await response.text();
  const parsed = parser.parse(text) as { API3G?: Record<string, unknown> };
  return parsed.API3G ?? {};
}

export type CreateTokenInput = {
  amount: number;
  currency: string; // e.g. "ZMW"
  companyRef: string; // our order number
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  redirectUrl: string;
  backUrl: string;
  description: string;
};

export type CreateTokenResult =
  | { ok: true; transactionToken: string; paymentUrl: string }
  | { ok: false; result: string; explanation: string };

export async function dpoCreateToken(config: DpoConfig, input: CreateTokenInput): Promise<CreateTokenResult> {
  const [firstName, ...rest] = input.customerName.trim().split(" ");
  const response = await callDpo({
    CompanyToken: config.companyToken,
    Request: "createToken",
    Transaction: {
      PaymentAmount: input.amount.toFixed(2),
      PaymentCurrency: input.currency,
      CompanyRef: input.companyRef,
      CompanyRefUnique: 0,
      RedirectURL: input.redirectUrl,
      BackURL: input.backUrl,
      customerFirstName: firstName || input.customerName,
      customerLastName: rest.join(" ") || "Customer",
      customerEmail: input.customerEmail || undefined,
      customerPhone: input.customerPhone || undefined,
      PTL: 24,
    },
    Services: {
      Service: {
        ServiceType: config.serviceType,
        ServiceDescription: input.description,
        ServiceDate: new Date().toISOString().slice(0, 19).replace("T", " "),
      },
    },
  });
  const result = String(response.Result ?? "");
  const explanation = String(response.ResultExplanation ?? "Unknown error");
  if (result !== "000") return { ok: false, result, explanation };
  const transactionToken = String(response.TransToken ?? "");
  if (!transactionToken) return { ok: false, result: result || "999", explanation: "No transaction token returned." };
  return { ok: true, transactionToken, paymentUrl: `${DPO_HOSTED_PAGE_URL}?ID=${transactionToken}` };
}

export type VerifyTokenResult = {
  result: string;
  explanation: string;
  paid: boolean;
  amount?: number;
  currency?: string;
  companyRef?: string;
};

// Result codes: 000 paid, 001 authorized, 900 not yet paid, 901 declined, 903 expired, 904 cancelled.
export async function dpoVerifyToken(config: DpoConfig, transactionToken: string): Promise<VerifyTokenResult> {
  const response = await callDpo({
    CompanyToken: config.companyToken,
    Request: "verifyToken",
    TransactionToken: transactionToken,
  });
  const result = String(response.Result ?? "999");
  const explanation = String(response.ResultExplanation ?? "Unknown error");
  return {
    result,
    explanation,
    paid: result === "000",
    amount: response.TransactionAmount !== undefined ? Number(response.TransactionAmount) : undefined,
    currency: response.TransactionCurrency !== undefined ? String(response.TransactionCurrency) : undefined,
    companyRef: response.CompanyRef !== undefined ? String(response.CompanyRef) : undefined,
  };
}

export type PushPaymentNotification = {
  result: string;
  transactionToken: string;
  transactionRef: string;
  amount?: number;
  currency?: string;
};

export function parsePushPaymentXml(xml: string): PushPaymentNotification {
  const parsed = parser.parse(xml) as { API3G?: Record<string, unknown> };
  const body = parsed.API3G ?? {};
  return {
    result: String(body.Result ?? ""),
    transactionToken: String(body.TransactionToken ?? ""),
    transactionRef: String(body.TransactionRef ?? body.CompanyRef ?? ""),
    amount: body.TransactionAmount !== undefined ? Number(body.TransactionAmount) : undefined,
    currency: body.TransactionCurrency !== undefined ? String(body.TransactionCurrency) : undefined,
  };
}

export const DPO_PUSH_PAYMENT_ACK_XML = `<?xml version="1.0" encoding="utf-8"?>\n<API3G>\n  <Response>OK</Response>\n</API3G>`;
