
import { FaThList } from 'react-icons/fa';
import { Combine, Scissors, ListOrdered, Image, FileText, Code, RotateCw, Hash, FileArchive, Pencil, LayoutGrid, Droplets } from 'lucide-react';
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
      icon: <Combine className="text-purple-500" />,
      bgColor: 'bg-purple-100 dark:bg-purple-900/20',
      title: 'Merge PDF',
      description: 'Combine multiple PDF files into a single, organized document with ease.',
      href: '/merger'
    },
    {
      icon: <Scissors className="text-green-500" />,
      bgColor: 'bg-green-100 dark:bg-green-900/20',
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
      icon: <Image className="text-blue-500" />,
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
      title: 'PDF to JPG',
      description: 'Convert each page of a PDF into a high-quality JPG image.',
      href: '/pdf-to-jpg'
    },
     {
      icon: <FileText className="text-red-500" />,
      bgColor: 'bg-red-100 dark:bg-red-900/20',
      title: 'JPG to PDF',
      description: 'Convert JPG images to a PDF file with orientation and margin options.',
      href: '/jpg-to-pdf'
    },
     {
      icon: <Droplets className="text-gray-500" />,
      bgColor: 'bg-gray-100 dark:bg-gray-900/20',
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
      icon: <FileText className="text-rose-500" />,
      bgColor: 'bg-rose-100 dark:bg-rose-900/20',
      title: 'HTML to PDF',
      description: 'Convert any webpage into a PDF document.',
      href: '/html-to-pdf'
    },
    {
      icon: <RotateCw className="text-indigo-500" />,
      bgColor: 'bg-indigo-100 dark:bg-indigo-900/20',
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
      icon: <LayoutGrid className="text-orange-500" />,
      bgColor: 'bg-orange-100 dark:bg-orange-900/20',
      title: 'More Tools',
      description: 'Explore a variety of other useful utilities to boost your productivity.',
      href: '/more-tools'
    },  
];
