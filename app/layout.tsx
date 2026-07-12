import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Skincare Select | Beauty for Everyone",
  description: "Skincare, haircare and grooming products delivered across Zambia."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
