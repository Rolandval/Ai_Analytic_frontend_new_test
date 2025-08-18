import { useEffect, useState } from 'react';
import { Button } from './Button';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export const Pagination = ({ currentPage, totalPages, onPageChange, className }: PaginationProps) => {
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 0);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Визначення кількості сторінок для відображення на основі ширини екрану
  const getMaxPagesToShow = () => {
    if (windowWidth < 480) return 1; // дуже маленькі екрани показуємо тільки поточну
    if (windowWidth < 640) return 3; // мобільний
    if (windowWidth < 768) return 5; // планшет
    return 7; // десктоп
  };

  const renderPageButtons = () => {
    const pageButtons = [];
    const maxPagesToShow = getMaxPagesToShow();
    const halfMaxPagesToShow = Math.floor(maxPagesToShow / 2);
    
    let startPage = Math.max(1, currentPage - halfMaxPagesToShow);
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    
    // adjust startPage if we are near the end
    if (endPage - startPage < maxPagesToShow - 1) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    // First page button (only on larger screens)
    if (windowWidth >= 640) {
      pageButtons.push(
        <Button
          key="first"
          variant="outline"
          size="icon"
          className="h-8 w-8 sm:h-9 sm:w-9 p-0 hidden sm:flex"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
        >
          <ChevronsLeft className="h-3 w-3 sm:h-4 sm:w-4" />
        </Button>
      );
    }
    
    // Previous button
    pageButtons.push(
      <Button
        key="prev"
        variant="outline"
        size="icon"
        className="h-8 w-8 sm:h-9 sm:w-9 p-0"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
      >
        <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
      </Button>
    );

    // First page number (on larger screens)
    if (startPage > 1 && windowWidth >= 480) {
      pageButtons.push(
        <Button
          key="1"
          variant={currentPage === 1 ? 'default' : 'outline'}
          size="sm"
          className={cn(
            "h-8 w-8 sm:h-9 sm:w-9 p-0 text-xs sm:text-sm", 
            windowWidth < 640 ? "hidden sm:flex" : "",
            currentPage === 1 && "font-bold bg-primary text-primary-foreground hover:bg-primary/90"
          )}
          onClick={() => onPageChange(1)}
        >
          1
        </Button>
      );
      if (startPage > 2 && windowWidth >= 640) { // Показуємо еліпсис тільки на більших екранах
        pageButtons.push(
          <span key="start-ellipsis" className="px-1 flex items-center text-muted-foreground">
            ...
          </span>
        );
      }
    }

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      if ((i === 1 || i === totalPages) && windowWidth >= 480) continue; // Skip first and last page as they are handled separately on larger screens
      pageButtons.push(
        <Button
          key={i}
          variant={currentPage === i ? 'default' : 'outline'}
          size="sm"
          className={cn(
            "h-8 w-8 sm:h-9 sm:w-9 p-0 text-xs sm:text-sm",
            currentPage === i && "font-bold bg-primary text-primary-foreground hover:bg-primary/90"
          )}
          onClick={() => onPageChange(i)}
        >
          {i}
        </Button>
      );
    }

    // Last page
    if (endPage < totalPages && windowWidth >= 480) {
      if (endPage < totalPages - 1 && windowWidth >= 640) { // Показуємо еліпсис тільки на більших екранах
        pageButtons.push(
          <span key="end-ellipsis" className="px-1 flex items-center text-muted-foreground">
            ...
          </span>
        );
      }
      pageButtons.push(
        <Button
          key={totalPages}
          variant={currentPage === totalPages ? 'default' : 'outline'}
          size="sm"
          className={cn(
            "h-8 w-8 sm:h-9 sm:w-9 p-0 text-xs sm:text-sm",
            windowWidth < 640 ? "hidden sm:flex" : "",
            currentPage === totalPages && "font-bold bg-primary text-primary-foreground hover:bg-primary/90"
          )}
          onClick={() => onPageChange(totalPages)}
        >
          {totalPages}
        </Button>
      );
    }

    // Next button
    pageButtons.push(
      <Button
        key="next"
        variant="outline"
        size="icon"
        className="h-8 w-8 sm:h-9 sm:w-9 p-0"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
      >
        <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
      </Button>
    );
    
    // Last page button (only on larger screens)
    if (windowWidth >= 640) {
      pageButtons.push(
        <Button
          key="last"
          variant="outline"
          size="icon"
          className="h-8 w-8 sm:h-9 sm:w-9 p-0 hidden sm:flex"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
        >
          <ChevronsRight className="h-3 w-3 sm:h-4 sm:w-4" />
        </Button>
      );
    }

    // Додавання індикатора сторінки для мобільних пристроїв
    if (windowWidth < 640) {
      pageButtons.push(
        <div key="mobile-indicator" className="text-xs text-muted-foreground ml-2 flex items-center">
          <span className="bg-muted/30 px-2 py-1 rounded-md">
            {currentPage} / {totalPages}
          </span>
        </div>
      );
    }

    return pageButtons;
  };

  // Якщо всього одна сторінка, не показуємо пагінацію
  if (totalPages <= 1) return null;

  return (
    <div className={cn("flex items-center justify-center space-x-1 sm:space-x-2", className)}>
      {renderPageButtons()}
    </div>
  );
};
