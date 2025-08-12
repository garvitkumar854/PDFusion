import { Combine, Scissors, ListOrdered, Image, FileText, Code, RotateCw, Hash, FileArchive, Pencil } from 'lucide-react';
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
      icon: <Combine className="w-6 h-6 text-purple-500" />,
      bgColor: 'bg-purple-100 dark:bg-purple-900/20',
      title: 'Merge PDF',
      description: 'Combine multiple PDF files into a single, organized document with ease.',
      href: '/merger'
    },
    {
      icon: <Scissors className="w-6 h-6 text-green-500" />,
      bgColor: 'bg-green-100 dark:bg-green-900/20',
      title: 'Split PDF',
      description: 'Extract specific pages or page ranges from a PDF into separate files.',
      href: '/split-pdf'
    },
    {
      icon: <FileArchive className="w-6 h-6 text-yellow-500" />,
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
      title: 'Compress PDF',
      description: 'Reduce file size while optimizing for maximal PDF quality.',
      href: '/compress-pdf'
    },
    {
      icon: <ListOrdered className="w-6 h-6 text-cyan-500" />,
      bgColor: 'bg-cyan-100 dark:bg-cyan-900/20',
      title: 'Organize PDF',
      description: 'Visually reorder, rotate, and delete pages in your PDF document.',
      href: '/organize-pdf'
    },
    {
      icon: <Pencil className="w-6 h-6 text-orange-500" />,
      bgColor: 'bg-orange-100 dark:bg-orange-900/20',
      title: 'Edit PDF',
      description: 'Add text, images, and annotations to your PDF documents.',
      href: '/edit-pdf'
    },
    {
      icon: <Image className="w-6 h-6 text-blue-500" />,
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
      title: 'PDF to JPG',
      description: 'Convert each page of a PDF into a high-quality JPG image.',
      href: '/pdf-to-jpg'
    },
     {
      icon: <FileText className="w-6 h-6 text-red-500" />,
      bgColor: 'bg-red-100 dark:bg-red-900/20',
      title: 'JPG to PDF',
      description: 'Convert JPG images to a PDF file with orientation and margin options.',
      href: '/jpg-to-pdf'
    },
    {
      icon: <Code className="w-6 h-6 text-lime-500" />,
      bgColor: 'bg-lime-100 dark:bg-lime-900/20',
      title: 'PDF to HTML',
      description: 'Convert your PDF into a basic, editable HTML file.',
      href: '/pdf-to-html'
    },
    {
      icon: <FileText className="w-6 h-6 text-teal-500" />,
      bgColor: 'bg-teal-100 dark:bg-teal-900/20',
      title: 'HTML to PDF',
      description: 'Convert any webpage into a PDF document.',
      href: '/html-to-pdf'
    },
    {
      icon: <RotateCw className="w-6 h-6 text-indigo-500" />,
      bgColor: 'bg-indigo-100 dark:bg-indigo-900/20',
      title: 'Rotate PDF',
      description: 'Rotate all pages in a PDF document by 90, 180, or 270 degrees.',
      href: '/rotate-pdf'
    },
    {
      icon: <Hash className="w-6 h-6 text-pink-500" />,
      bgColor: 'bg-pink-100 dark:bg-pink-900/20',
      title: 'Add Page Numbers',
      description: 'Easily insert page numbers into your PDF with custom positions.',
      href: '/add-page-numbers'
    },
];
