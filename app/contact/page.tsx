import { getSettings } from "@/app/lib/store-data";

export default function ContactPage() {
  const settings = getSettings();

  return (
    <div className="space-y-6 rounded-[2rem] border border-[#eadfce] bg-white p-8 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#8d6e63]">Contact</p>
      <h1 className="text-3xl font-semibold text-slate-900">Get in touch</h1>
      <div className="grid gap-3 text-slate-600">
        <p>Phone: {settings.phoneNumber}</p>
        <p>WhatsApp: {settings.whatsappNumber}</p>
        <p>Email: {settings.storeEmail}</p>
        <p>Business hours: {settings.businessHours}</p>
      </div>
    </div>
  );
}
