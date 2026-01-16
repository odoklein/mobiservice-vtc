'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface MobileNavContextType {
    isOpen: boolean;
    open: () => void;
    close: () => void;
    toggle: () => void;
}

const MobileNavContext = createContext<MobileNavContextType | undefined>(undefined);

export function MobileNavProvider({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);

    const open = () => setIsOpen(true);
    const close = () => setIsOpen(false);
    const toggle = () => setIsOpen(prev => !prev);

    // Close on ESC key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                close();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen]);

    // Prevent body scroll when drawer is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    return (
        <MobileNavContext.Provider value={{ isOpen, open, close, toggle }}>
            {children}
        </MobileNavContext.Provider>
    );
}

export function useMobileNav() {
    const context = useContext(MobileNavContext);
    if (context === undefined) {
        throw new Error('useMobileNav must be used within a MobileNavProvider');
    }
    return context;
}
