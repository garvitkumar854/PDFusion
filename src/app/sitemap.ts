
import { MetadataRoute } from 'next';

const baseUrl = 'https://pdf-fusion.vercel.app';

const staticPages = [
  { url: '/', priority: 1.0 },
  { url: '/about', priority: 0.8 },
  { url: '/contact', priority: 0.8 },
  { url: '/privacy-policy', priority: 0.5 },
  { url: '/more-tools', priority: 0.7 },
];

const toolPages = [
  '/merger',
  '/split-pdf',
  '/organize-pdf',
  '/pdf-to-jpg',
  '/jpg-to-pdf',
  '/docx-to-pdf',
  '/pdf-to-html',
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
];

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = staticPages.map(page => ({
    url: `${baseUrl}${page.url}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: page.priority,
  }));

  const toolRoutes = toolPages.map(route => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.9,
  }));

  return [...staticRoutes, ...toolRoutes];
}
