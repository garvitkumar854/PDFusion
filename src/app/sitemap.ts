import { MetadataRoute } from 'next'
 
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://pdf-fusion.vercel.app';

  const staticRoutes = [
    { url: `${baseUrl}/`, priority: 1.0 },
    { url: `${baseUrl}/about`, priority: 0.8 },
    { url: `${baseUrl}/contact`, priority: 0.8 },
    { url: `${baseUrl}/privacy-policy`, priority: 0.5 },
    { url: `${baseUrl}/more-tools`, priority: 0.7 },
  ];

  const toolRoutes = [
    '/merger',
    '/split-pdf',
    '/organize-pdf',
    '/pdf-to-jpg',
    '/jpg-to-pdf',
    '/pdf-to-html',
    '/html-to-pdf',
    '/rotate-pdf',
    '/add-page-numbers',
    '/add-watermark',
    '/qr-code-generator',
    '/password-generator',
    '/unit-converter',
    '/calculator',
    '/currency-converter',
    '/markdown-to-html',
    '/text-summarizer',
    '/assignment-tracker',
  ].map(route => ({
    url: `${baseUrl}${route}`,
    priority: 0.9,
  }));

  const allRoutes = [...staticRoutes, ...toolRoutes];
 
  return allRoutes.map(route => ({
    url: route.url,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: route.priority,
  }));
}
