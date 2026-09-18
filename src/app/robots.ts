import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/"],
    },
    sitemap: "https://netflix-clone.vercel.app/sitemap.xml",
    host: "https://netflix-clone.vercel.app",
  };
}
