"use client";

import { getSettings } from "@/app/lib/store-data";
import Image from "next/image";

type CampaignContent = {
  campaignEyebrow: string;
  campaignType: string;
  campaignActive: boolean;
  campaignTitle: string;
  campaignDescription: string;
  campaignVisual: string;
  campaignImageUrl?: string;
  campaignFooter: string;
  campaignOffer: string;
};

export function FeaturedCampaign({ initialCampaign }: { initialCampaign?: Partial<CampaignContent> | null }) {
  const campaign = { ...getSettings(), ...initialCampaign };

  if (!campaign.campaignActive) {
    return null;
  }

  return (
    <div className="rounded-[2rem] border border-[#eadfce] bg-white p-6 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#8d6e63]">{campaign.campaignEyebrow} · {campaign.campaignType}</p>
      <h2 className="mt-3 text-2xl font-semibold text-slate-900">{campaign.campaignTitle}</h2>
      <p className="mt-3 text-sm leading-6 text-slate-600">{campaign.campaignDescription}</p>
      <div className="relative mt-6 flex min-h-48 items-center justify-center overflow-hidden rounded-[1.75rem] bg-[#fbf7f2]">
        {campaign.campaignImageUrl ? (
          <Image src={campaign.campaignImageUrl} alt={campaign.campaignTitle} fill unoptimized className="object-cover" sizes="(min-width: 1024px) 35vw, 90vw" />
        ) : (
          <span className="text-8xl">{campaign.campaignVisual}</span>
        )}
      </div>
      <div className="mt-6 flex items-center justify-between text-sm text-slate-600">
        <span>{campaign.campaignFooter}</span>
        <span className="font-semibold text-slate-900">{campaign.campaignOffer}</span>
      </div>
    </div>
  );
}
