import type { MetadataRoute } from "next";

const BASE = "https://spanrail.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date("2026-11-28T00:00:00.000Z");

  return [
    { url: `${BASE}/`, lastModified, changeFrequency: "monthly", priority: 1.0 },
    { url: `${BASE}/docs`, lastModified, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/security`, lastModified, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/privacy`, lastModified, changeFrequency: "yearly", priority: 0.4 },
    { url: `${BASE}/terms`, lastModified, changeFrequency: "yearly", priority: 0.4 },
  ];
}