export default function FaqPage() {
  const faqs = [
    ["How do I place an order?", "Browse the shop, add items to cart and complete checkout as a guest or signed-in customer."],
    ["Which payment methods are supported?", "MTN Mobile Money, Airtel Money, Zamtel Money and bank transfer are supported."],
    ["Do you deliver across Zambia?", "Yes. Delivery fees are configured from store settings."],
  ];

  return (
    <div className="space-y-6 rounded-[2rem] border border-[#eadfce] bg-white p-8 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#8d6e63]">FAQs</p>
      <h1 className="text-3xl font-semibold text-slate-900">Frequently asked questions</h1>
      <div className="grid gap-4">
        {faqs.map(([question, answer]) => (
          <div key={question} className="rounded-[1.5rem] bg-[#fbf7f2] p-5">
            <p className="font-semibold text-slate-900">{question}</p>
            <p className="mt-2 text-sm text-slate-600">{answer}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
