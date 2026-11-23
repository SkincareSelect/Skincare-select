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
    <div className="border-y border-[#e8e2d8] bg-[#f8f6f1] py-6 sm:py-8" aria-live="polite">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#777168]">{campaign.eyebrow} · {campaign.type}</p>
        {activeCampaigns.length > 1 ? (
          <div className="flex shrink-0 gap-1">
            <button type="button" onClick={() => move(-1)} aria-label="Previous featured post" className="border border-[#d9d3ca] p-2 text-[#424242] transition hover:bg-[#eae3d8]">
              <ChevronLeft size={16} />
            </button>
            <button type="button" onClick={() => move(1)} aria-label="Next featured post" className="border border-[#d9d3ca] p-2 text-[#424242] transition hover:bg-[#eae3d8]">
              <ChevronRight size={16} />
            </button>
          </div>
        ) : null}
      </div>
      <h2 className="mt-3 text-3xl text-[#111111]">{campaign.title}</h2>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-[#68645e]">{campaign.description}</p>
      <div className="relative mt-6 flex min-h-48 items-center justify-center overflow-hidden bg-[#eae3d8]">
        {campaign.imageUrl ? (
          <Image src={campaign.imageUrl} alt={campaign.title} fill unoptimized className="object-cover" sizes="(min-width: 1024px) 35vw, 90vw" />
        ) : (
          <span className="text-8xl">{campaign.visual}</span>
        )}
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm text-[#68645e]">
        <span>{campaign.footer}</span>
        <span className="font-medium text-[#111111]">{campaign.offer}</span>
      </div>
      {campaign.link ? (
        campaign.link.startsWith("https://") ? (
          <a href={campaign.link} target="_blank" rel="noreferrer" className="mt-4 inline-flex min-h-10 items-center border border-[#111111] px-4 py-2 text-[10px] font-medium uppercase tracking-[0.1em] text-[#111111] transition hover:bg-[#111111] hover:text-white">
            Learn more
          </a>
        ) : (
          <Link href={campaign.link} className="mt-4 inline-flex min-h-10 items-center border border-[#111111] px-4 py-2 text-[10px] font-medium uppercase tracking-[0.1em] text-[#111111] transition hover:bg-[#111111] hover:text-white">
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
              className={`h-2 rounded-full transition-all ${index === activeIndex ? "w-6 bg-[#111111]" : "w-2 bg-[#d6c3a5]"}`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
