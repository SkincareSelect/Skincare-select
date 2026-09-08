export default function AboutPage() {
  return (
    <div className="space-y-8 rounded-[2rem] border border-[#eadfce] bg-white p-8 shadow-sm">
      <div className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#8d6e63]">About us</p>
        <h1 className="font-serif text-3xl font-semibold text-slate-900">Everything for your everyday care, style and confidence</h1>
        <p className="max-w-3xl text-slate-600">
          Zhurie &amp; Co is a Zambian online store bringing beauty, personal care, grooming, family essentials and lifestyle
          products together in one convenient place. We serve women, men, families and babies with carefully selected products,
          clear information, fair offers and friendly customer support.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-3xl bg-[#faf6f0] p-6">
          <h2 className="font-serif text-2xl font-semibold text-slate-900">What you can find here</h2>
          <p className="mt-3 text-slate-600">
            Explore Face Care, Body Care, Hair Care, Men&apos;s Grooming, Fragrances, Accessories, Baby Care, and our
            Apparel and footwear collection. Accessories include Lip, Eye and Base products alongside beauty tools and
            organizers.
          </p>
        </section>
        <section className="rounded-3xl bg-[#faf6f0] p-6">
          <h2 className="font-serif text-2xl font-semibold text-slate-900">A complete shopping experience</h2>
          <p className="mt-3 text-slate-600">
            Shop new arrivals, best sellers and deals, save products to your wishlist, read customer reviews, and choose
            convenient Zambian payment and delivery options at checkout.
          </p>
        </section>
      </div>

      <section className="space-y-3">
        <h2 className="font-serif text-2xl font-semibold text-slate-900">Our promise</h2>
        <p className="max-w-3xl text-slate-600">
          We aim to make online shopping simple, trustworthy and welcoming. If you need help choosing a product or placing
          an order, our customer-care team is available through WhatsApp and the contact channels on this site.
        </p>
      </section>
    </div>
  );
}
