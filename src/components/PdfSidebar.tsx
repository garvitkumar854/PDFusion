
"use client";

import React, { useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import type { PDFPageProxy } from 'pdfjs-dist';
import { Loader2 } from "lucide-react";
import { Skeleton } from "./ui/skeleton";

export type PageInfo = {
  pageNumber: number;
  dataUrl?: string;
  pdfjsPage?: PDFPageProxy;
};

const PageThumbnail = React.memo(({ pageInfo, isSelected, onClick, onVisible }: { pageInfo: PageInfo; isSelected: boolean; onClick: () => void; onVisible: (pageNumber: number) => void; }) => {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                onVisible(pageInfo.pageNumber);
            }
        }, { threshold: 0.1 });

        const currentRef = ref.current;
        if (currentRef) observer.observe(currentRef);

        return () => {
            if (currentRef) observer.unobserve(currentRef);
        };
    }, [pageInfo.pageNumber, onVisible]);

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
    onPageSelect: (pageNumber: number) => void;
    onVisiblePagesChange: (visiblePages: Set<number>) => void;
    isLoading: boolean;
}

export function PdfSidebar({ pages, selectedPage, onPageSelect, onVisiblePagesChange, isLoading }: PdfSidebarProps) {
    const rootRef = useRef<HTMLDivElement>(null);
    
    const handleScroll = useCallback(() => {
        const visible = new Set<number>();
        if(rootRef.current) {
            const children = rootRef.current.children;
            for(let i = 0; i < children.length; i++) {
                const child = children[i] as HTMLDivElement;
                const rect = child.getBoundingClientRect();
                const rootRect = rootRef.current.getBoundingClientRect();
                if(rect.top < rootRect.bottom && rect.bottom > rootRect.top) {
                    const pageNum = parseInt(child.dataset.pageNumber || '0', 10);
                    if(pageNum) visible.add(pageNum);
                }
            }
        }
        onVisiblePagesChange(visible);
    }, [onVisiblePagesChange]);

    useEffect(() => {
        const currentRoot = rootRef.current;
        if(currentRoot) {
            handleScroll(); // Initial check
            currentRoot.addEventListener('scroll', handleScroll);
            return () => currentRoot.removeEventListener('scroll', handleScroll);
        }
    }, [handleScroll]);


    if(isLoading) {
      return (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="w-full aspect-[7/10] rounded-lg" />
          ))}
        </div>
      )
    }

    return (
        <div ref={rootRef} className="h-full overflow-y-auto pr-1 space-y-3">
            {pages.map(page => (
                 <div key={page.pageNumber} data-page-number={page.pageNumber}>
                    <PageThumbnail
                        pageInfo={page}
                        isSelected={selectedPage?.pageNumber === page.pageNumber}
                        onClick={() => onPageSelect(page.pageNumber)}
                        onVisible={handleScroll}
                    />
                </div>
            ))}
        </div>
    );
}
