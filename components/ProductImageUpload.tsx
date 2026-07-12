"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ProductImageUpload({defaultValue=""}:{defaultValue?:string}){
 const [url,setUrl]=useState(defaultValue);const [loading,setLoading]=useState(false);
 async function upload(e:React.ChangeEvent<HTMLInputElement>){
  const file=e.target.files?.[0];if(!file)return;setLoading(true);
  const ext=file.name.split(".").pop();const path=`${crypto.randomUUID()}.${ext}`;const s=createClient();
  const {error}=await s.storage.from("product-images").upload(path,file,{upsert:false});
  if(error){alert(error.message);setLoading(false);return}
  const {data}=s.storage.from("product-images").getPublicUrl(path);setUrl(data.publicUrl);setLoading(false)
 }
 return <label>Product photograph<input type="file" accept="image/*" onChange={upload}/>{loading&&<small>Uploading...</small>}{url&&<img src={url} alt="Preview" style={{width:150,height:150,objectFit:"cover"}}/>}<input type="hidden" name="image_url" value={url}/></label>
}
