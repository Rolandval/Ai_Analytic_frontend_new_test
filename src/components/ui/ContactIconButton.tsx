import React, { useState } from 'react';
import { Button } from './Button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from './Dialog';

interface ContactIconButtonProps {
  contactInfo: string | null;
  className?: string;
}

export const ContactIconButton = ({ contactInfo, className }: ContactIconButtonProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Якщо є контактна інформація і схоже на URL, відкриваємо посилання
    if (contactInfo) {
      // Обробляємо різні типи посилань
      if (contactInfo.startsWith('http') || contactInfo.startsWith('www')) {
        // Звичайні веб-посилання
        const url = contactInfo.startsWith('www') ? `https://${contactInfo}` : contactInfo;
        window.open(url, '_blank', 'noopener,noreferrer');
      } else if (contactInfo.startsWith('viber://') || 
                contactInfo.startsWith('tel:') || 
                contactInfo.startsWith('telegram:') || 
                contactInfo.includes('t.me/')) {
        // Посилання на месенджери або телефонні номери
        window.location.href = contactInfo;
      } else {
        // Показуємо діалогове вікно для інших типів контактної інформації
        setIsDialogOpen(true);
      }
    } else {
      // Якщо контактна інформація відсутня, показуємо діалогове вікно
      setIsDialogOpen(true);
    }
  };

  return (
    <>
      <Button 
        variant="ghost" 
        size="icon"
        onClick={handleClick}
        className={className}
        title="Контактна інформація"
      >
        {/* SVG іконка контактів */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
        </svg>
      </Button>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Контактна інформація</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {contactInfo ? (
              <p>{contactInfo}</p>
            ) : (
              <p>Контактна інформація для цього постачальника відсутня</p>
            )}
          </div>
          <DialogClose asChild>
            <Button variant="outline" className="w-full">Закрити</Button>
          </DialogClose>
        </DialogContent>
      </Dialog>
    </>
  );
};
