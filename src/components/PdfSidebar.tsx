
"use client";

import React, { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import type { PDFPageProxy } from 'pdfjs-dist';
import { Loader2 } from "lucide-react";

export type PageInfo = {
  pageNumber: number;
  dataUrl?: string;
  pdfjsPage: PDFPageProxy;
};

const PageThumbnail = React.memo(({ pageInfo, isSelected, onClick, onVisible }: { pageInfo: PageInfo; isSelected: boolean; onClick: () => void; onVisible: (pageNumber: number) => void; }) => {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting && !pageInfo.dataUrl) {
                onVisible(pageInfo.pageNumber);
                if (ref.current) observer.unobserve(ref.current);
            }
        }, { threshold: 0.1 });

        if (ref.current) observer.observe(ref.current);

        return () => {
            if (ref.current) observer.unobserve(ref.current);
        };
    }, [pageInfo.pageNumber, pageInfo.dataUrl, onVisible]);

    return (
        <div
            ref={ref}
            onClick={onClick}
            className={cn(
                "relative rounded-lg border-2 bg-background cursor-pointer transition-all duration-200 aspect-[7/10]",
                isSelected ? "border-primary shadow-md" : "border-transparent hover:border-primary/50"
            )}
        >
            {pageInfo.dataUrl ? (
                <img src={pageInfo.dataUrl} alt={`Page ${pageInfo.pageNumber}`} className="w-full h-full object-contain" />
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-xs gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    <span>Page {pageInfo.pageNumber}</span>
                </div>
            )}
            <div className="absolute top-1 right-1 bg-background/80 text-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center border shadow-sm">
                {pageInfo.pageNumber}
            </div>
        </div>
    );
});
PageThumbnail.displayName = 'PageThumbnail';

interface PdfSidebarProps {
    pages: PageInfo[];
    selectedPage: PageInfo | null;
    onPageSelect: (page: PageInfo) => void;
    onThumbnailVisible: (pageNumber: number) => void;
}

export function PdfSidebar({ pages, selectedPage, onPageSelect, onThumbnailVisible }: PdfSidebarProps) {
    return (
        <div className="h-full overflow-y-auto pr-3 space-y-3">
            {pages.map(page => (
                <PageThumbnail 
                    key={page.pageNumber}
                    pageInfo={page}
                    isSelected={selectedPage?.pageNumber === page.pageNumber}
                    onClick={() => onPageSelect(page)}
                    onVisible={onThumbnailVisible}
                />
            ))}
        </div>
    );
}
