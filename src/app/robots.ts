import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/"],
    },
    sitemap: "https://pwr-stream.vercel.app/sitemap.xml",
    host: "https://pwr-stream.vercel.app",
  };
}
