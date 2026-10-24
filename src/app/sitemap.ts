import { type MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://holdr.lol";
  const lastModified = new Date();
  return [
    {
      url: `${base}/`,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${base}/login`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];
}
