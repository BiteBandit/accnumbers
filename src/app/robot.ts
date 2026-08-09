import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/admin/'], // Hide internal backend routes
    },
    sitemap: 'https://accnumbers.com/sitemap.xml',
  };
}

