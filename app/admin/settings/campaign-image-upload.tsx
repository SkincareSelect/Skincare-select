"use client";

import { useState } from "react";
import { uploadCampaignImage } from "@/app/lib/supabase/client";

export function CampaignImageUpload({ defaultValue = "" }: { defaultValue?: string }) {
  const [url, setUrl] = useState(defaultValue);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setUploading(true);
    setMessage("");
    const publicUrl = await uploadCampaignImage(file);
    setUploading(false);

    if (!publicUrl) {
      setMessage("Upload failed. Check Supabase storage configuration.");
      return;
    }

    setUrl(publicUrl);
    setMessage("Picture uploaded. Click Save settings to publish it.");
  }

  return (
    <div>
      <label>
        Campaign picture
        <input type="file" accept="image/*" onChange={handleUpload} />
      </label>
      <input type="hidden" name="campaign_image_url" value={url} />
      {uploading ? <small>Uploading campaign picture...</small> : null}
      {message ? <small>{message}</small> : null}
      {url ? <small className="break-all">Picture ready: {url}</small> : null}
    </div>
  );
}
