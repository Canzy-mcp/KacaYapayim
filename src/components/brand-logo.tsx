import Image from "next/image";

/** One identity shared by marketing, authentication, workspace and quotes. */
export function BrandLogo({ size = 36, wordmark = true }: { size?: number; wordmark?: boolean }) {
  return <span className="brand-logo"><Image src="/brand/logo.webp" width={size} height={size} alt={wordmark ? "" : "KaçaYapayım"} className="brand-logo-image"/>{wordmark && <span className="brand-wordmark">KaçaYapayım</span>}</span>;
}

