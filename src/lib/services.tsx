
import { Combine, Scissors, ListOrdered, Image, FileText, Code, RotateCw, Hash, Pencil, LayoutGrid, Droplets, BookCheck } from 'lucide-react';
import React from 'react';

export interface Service {
    icon: React.ReactElement;
    bgColor: string;
    title: string;
    description: string;
    href: string;
}

export const services: Service[] = [
    {
      icon: <Combine className="text-fuchsia-500" />,
      bgColor: 'bg-fuchsia-100 dark:bg-fuchsia-900/20',
      title: 'Merge PDF',
      description: 'Combine multiple PDF files into a single, organized document with ease.',
      href: '/merger'
    },
    {
      icon: <Scissors className="text-cyan-500" />,
      bgColor: 'bg-cyan-100 dark:bg-cyan-900/20',
      title: 'Split PDF',
      description: 'Extract specific pages or page ranges from a PDF into separate files.',
      href: '/split-pdf'
    },
    {
      icon: <ListOrdered className="text-teal-500" />,
      bgColor: 'bg-teal-100 dark:bg-teal-900/20',
      title: 'Organize PDF',
      description: 'Visually reorder, rotate, and delete pages in your PDF document.',
      href: '/organize-pdf'
    },
    {
      icon: <Image className="text-indigo-500" />,
      bgColor: 'bg-indigo-100 dark:bg-indigo-900/20',
      title: 'PDF to JPG',
      description: 'Convert each page of a PDF into a high-quality JPG image.',
      href: '/pdf-to-jpg'
    },
     {
      icon: <FileText className="text-orange-500" />,
      bgColor: 'bg-orange-100 dark:bg-orange-900/20',
      title: 'JPG to PDF',
      description: 'Convert JPG images to a PDF file with orientation and margin options.',
      href: '/jpg-to-pdf'
    },
     {
      icon: <Droplets className="text-blue-500" />,
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
      title: 'Add Watermark',
      description: 'Stamp a text or image watermark over your PDF pages with custom styling.',
      href: '/add-watermark'
    },
    {
      icon: <Code className="text-yellow-500" />,
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
      title: 'PDF to HTML',
      description: 'Convert your PDF into a basic, editable HTML file.',
      href: '/pdf-to-html'
    },
    {
      icon: <RotateCw className="text-purple-500" />,
      bgColor: 'bg-purple-100 dark:bg-purple-900/20',
      title: 'Rotate PDF',
      description: 'Rotate all pages in a PDF document by 90, 180, or 270 degrees.',
      href: '/rotate-pdf'
    },
    {
      icon: <Hash className="text-pink-500" />,
      bgColor: 'bg-pink-100 dark:bg-pink-900/20',
      title: 'Add Page Numbers',
      description: 'Easily insert page numbers into your PDF with custom positions.',
      href: '/add-page-numbers'
    },
    {
      icon: <BookCheck className="text-sky-500" />,
      bgColor: 'bg-sky-100 dark:bg-sky-900/20',
      title: 'Course Pilot',
      description: 'An intelligent assignment tracker to manage your coursework.',
      href: '/assignment-tracker'
    },
     {
      icon: <LayoutGrid className="text-gray-500" />,
      bgColor: 'bg-gray-100 dark:bg-gray-900/20',
      title: 'More Tools',
      description: 'Explore a variety of other useful utilities to boost your productivity.',
      href: '/more-tools'
    },  
];
