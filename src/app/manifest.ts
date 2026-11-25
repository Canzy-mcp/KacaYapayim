import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "KaçaYapayım",
    short_name: "KaçaYapayım",
    description: "Ev hizmetleri için usta bul, ustalar için maliyete dayalı teklif hazırla.",
    lang: "tr-TR",
    start_url: "/",
    scope: "/",
    display: "standalone",
    theme_color: "#1554f0",
    background_color: "#f5f2ec",
    icons: [
      { src: "/icon.png", sizes: "64x64", type: "image/png" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
      { src: "/brand/logo.png", sizes: "256x256", type: "image/png" },
    ],
  };
}
