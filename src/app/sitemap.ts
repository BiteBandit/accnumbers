import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://accnumbers.com'; // Replace with your actual live domain

  // 1. Static Public Pages
  const staticPages = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/signin`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/signup`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
  ];

  // 2. (Optional) Dynamic Pages from Database / API 
  // If you want search engines to crawl public blog posts, service listings, etc., fetch them here:
  /*
  const services = ['whatsapp', 'telegram', 'facebook', 'twitter'];
  const dynamicServicePages = services.map((service) => ({
    url: `${baseUrl}/dashboard/numbers?service=${service}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));
  */

  return [...staticPages];
}

