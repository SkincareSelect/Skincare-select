"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { FeaturedCampaignPost } from "@/app/lib/types";

export function FeaturedCampaign({ campaigns }: { campaigns: FeaturedCampaignPost[] }) {
  const activeCampaigns = campaigns.filter((campaign) => campaign.active);
  const [activeIndex, setActiveIndex] = useState(0);
  if (activeCampaigns.length === 0) {
    return null;
  }

  const campaign = activeCampaigns[activeIndex % activeCampaigns.length];
  const move = (direction: number) => {
    setActiveIndex((current) => (current + direction + activeCampaigns.length) % activeCampaigns.length);
  };

  return (
    <div className="rounded-[2rem] border border-[#eadfce] bg-white p-6 shadow-sm" aria-live="polite">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#8d6e63]">{campaign.eyebrow} · {campaign.type}</p>
        {activeCampaigns.length > 1 ? (
          <div className="flex shrink-0 gap-1">
            <button type="button" onClick={() => move(-1)} aria-label="Previous featured post" className="rounded-full border border-[#eadfce] p-2 text-slate-600 hover:bg-[#fbf7f2]">
              <ChevronLeft size={16} />
            </button>
            <button type="button" onClick={() => move(1)} aria-label="Next featured post" className="rounded-full border border-[#eadfce] p-2 text-slate-600 hover:bg-[#fbf7f2]">
              <ChevronRight size={16} />
            </button>
          </div>
        ) : null}
      </div>
      <h2 className="mt-3 text-2xl font-semibold text-slate-900">{campaign.title}</h2>
      <p className="mt-3 text-sm leading-6 text-slate-600">{campaign.description}</p>
      <div className="relative mt-6 flex min-h-48 items-center justify-center overflow-hidden rounded-[1.75rem] bg-[#fbf7f2]">
        {campaign.imageUrl ? (
          <Image src={campaign.imageUrl} alt={campaign.title} fill unoptimized className="object-cover" sizes="(min-width: 1024px) 35vw, 90vw" />
        ) : (
          <span className="text-8xl">{campaign.visual}</span>
        )}
      </div>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
        <span>{campaign.footer}</span>
        <span className="font-semibold text-slate-900">{campaign.offer}</span>
      </div>
      {campaign.link ? (
        campaign.link.startsWith("https://") ? (
          <a href={campaign.link} target="_blank" rel="noreferrer" className="mt-4 inline-flex rounded-full bg-[#2f241f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#5c4034]">
            Learn more
          </a>
        ) : (
          <Link href={campaign.link} className="mt-4 inline-flex rounded-full bg-[#2f241f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#5c4034]">
            Learn more
          </Link>
        )
      ) : null}
      {activeCampaigns.length > 1 ? (
        <div className="mt-5 flex items-center justify-center gap-2" aria-label={`Post ${activeIndex + 1} of ${activeCampaigns.length}`}>
          {activeCampaigns.map((post, index) => (
            <button
              key={post.id}
              type="button"
              aria-label={`Show featured post ${index + 1}`}
              aria-current={index === activeIndex ? "true" : undefined}
              onClick={() => setActiveIndex(index)}
              className={`h-2.5 rounded-full transition-all ${index === activeIndex ? "w-6 bg-[#8d6e63]" : "w-2.5 bg-[#eadfce]"}`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
