import type { MetadataRoute } from "next";

export const dynamic = "force-static";

const base = process.env.NEXT_PUBLIC_BASE_PATH || "";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Whitehall Education System",
    short_name: "Whitehall",
    description: "School register for Whitehall Education System, Karak.",
    start_url: `${base}/`,
    scope: `${base}/`,
    display: "standalone",
    background_color: "#0c1f6b",
    theme_color: "#0c1f6b",
    icons: [
      {
        src: `${base}/icon-192.png`,
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: `${base}/icon-512.png`,
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: `${base}/icon-512.png`,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
