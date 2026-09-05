export default function PrivacyPage() {
  return (
    <div className="space-y-6 rounded-[2rem] border border-[#eadfce] bg-white p-8 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#8d6e63]">Privacy</p>
      <h1 className="text-3xl font-semibold text-slate-900">Privacy policy</h1>
      <p className="max-w-3xl text-slate-600">
        Customer information is used only for order processing, account management and support. Sensitive payment data should
        always remain server-side or with the relevant payment provider.
      </p>
    </div>
  );
}
