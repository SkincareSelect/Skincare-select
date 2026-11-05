import { initialSettings } from "@/app/lib/store-data";
import type { PaymentMethod, StoreSettings } from "@/app/lib/types";

type SettingsRow = Record<string, unknown>;

function getString(value: unknown, fallback: string) {
  return typeof value === "string" ? value : fallback;
}

function getRecord(value: unknown): SettingsRow {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as SettingsRow
    : {};
}

const paymentMethods: PaymentMethod[] = [
  "MTN Mobile Money",
  "Airtel Money",
  "Zamtel Money",
  "Bank Transfer",
  "Cash on Delivery",
];

const campaignTypes: StoreSettings["campaignType"][] = [
  "New product",
  "Promotion",
  "Awareness day",
  "Seasonal theme",
  "Announcement",
];

export function mapSupabaseSettings(row: SettingsRow): StoreSettings {
  const paymentNumbersRow = getRecord(row.payment_numbers);
  const bankDetailsRow = getRecord(row.bank_details);
  const socialLinksRow = getRecord(row.social_links);
  const paymentNumbers = Object.fromEntries(
    paymentMethods.map((method) => [method, getString(paymentNumbersRow[method], initialSettings.paymentNumbers[method])]),
  ) as Record<PaymentMethod, string>;
  const bankDetails = {
    accountName: getString(bankDetailsRow.accountName, initialSettings.bankDetails.accountName),
    accountNumber: getString(bankDetailsRow.accountNumber, initialSettings.bankDetails.accountNumber),
    bankName: getString(bankDetailsRow.bankName ?? row.bank_name, initialSettings.bankDetails.bankName),
    branch: getString(bankDetailsRow.branch ?? row.bank_branch, initialSettings.bankDetails.branch),
    swiftCode: getString(bankDetailsRow.swiftCode, initialSettings.bankDetails.swiftCode),
  };
  const mtnNumber = getString(row.mtn_number, paymentNumbers["MTN Mobile Money"]);
  const airtelNumber = getString(row.airtel_number, paymentNumbers["Airtel Money"]);
  const zamtelNumber = getString(row.zamtel_number, paymentNumbers["Zamtel Money"]);
  const whatsappNumber = getString(row.whatsapp_number ?? row.whatsapp, initialSettings.whatsappNumber);
  const campaignType = campaignTypes.includes(row.campaign_type as StoreSettings["campaignType"])
    ? row.campaign_type as StoreSettings["campaignType"]
    : initialSettings.campaignType;

  paymentNumbers["MTN Mobile Money"] = mtnNumber;
  paymentNumbers["Airtel Money"] = airtelNumber;
  paymentNumbers["Zamtel Money"] = zamtelNumber;

  return {
    ...initialSettings,
    id: typeof row.id === "string" ? row.id : undefined,
    storeName: getString(row.store_name, initialSettings.storeName),
    storeLogo: getString(row.store_logo, initialSettings.storeLogo),
    storeEmail: getString(row.store_email, initialSettings.storeEmail),
    phoneNumber: getString(row.support_phone ?? row.phone, initialSettings.phoneNumber),
    whatsappNumber,
    mtnNumber,
    airtelNumber,
    zamtelNumber,
    bankName: bankDetails.bankName,
    bankAccountName: bankDetails.accountName,
    bankAccountNumber: bankDetails.accountNumber,
    bankBranch: bankDetails.branch,
    supportEmail: getString(row.support_email, initialSettings.supportEmail ?? initialSettings.storeEmail),
    supportPhone: getString(row.support_phone, initialSettings.supportPhone ?? initialSettings.phoneNumber),
    paymentNumbers,
    bankDetails,
    deliveryFee: Number.isFinite(Number(row.delivery_fee)) ? Number(row.delivery_fee) : initialSettings.deliveryFee,
    businessHours: getString(row.business_hours, initialSettings.businessHours),
    campaignEyebrow: getString(row.campaign_eyebrow, initialSettings.campaignEyebrow),
    campaignType,
    campaignActive: typeof row.campaign_active === "boolean" ? row.campaign_active : initialSettings.campaignActive,
    campaignTitle: getString(row.campaign_title, initialSettings.campaignTitle),
    campaignDescription: getString(row.campaign_description, initialSettings.campaignDescription),
    campaignVisual: getString(row.campaign_visual, initialSettings.campaignVisual),
    campaignImageUrl: getString(row.campaign_image_url, initialSettings.campaignImageUrl ?? ""),
    campaignFooter: getString(row.campaign_footer, initialSettings.campaignFooter),
    campaignOffer: getString(row.campaign_offer, initialSettings.campaignOffer),
    socialLinks: {
      instagram: getString(socialLinksRow.instagram, initialSettings.socialLinks.instagram),
      facebook: getString(socialLinksRow.facebook, initialSettings.socialLinks.facebook),
      tiktok: getString(socialLinksRow.tiktok, initialSettings.socialLinks.tiktok),
    },
  };
}
