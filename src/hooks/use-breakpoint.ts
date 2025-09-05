
"use client";

import { useState, useEffect } from 'react';
import resolveConfig from 'tailwindcss/resolveConfig';
import tailwindConfig from '../../tailwind.config';

const fullConfig = resolveConfig(tailwindConfig);

type Breakpoint = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

const getBreakpointValue = (value: Breakpoint): number => {
    const screens = fullConfig.theme.screens as Record<Breakpoint, string>;
    return parseInt(screens[value].replace('px', ''));
}

export const useBreakpoint = (breakpoint: Breakpoint): boolean => {
    const [isBreakpoint, setIsBreakpoint] = useState(false);

    useEffect(() => {
        const checkBreakpoint = () => {
            setIsBreakpoint(window.innerWidth < getBreakpointValue(breakpoint));
        };

        checkBreakpoint();
        window.addEventListener('resize', checkBreakpoint);
        return () => window.removeEventListener('resize', checkBreakpoint);
    }, [breakpoint]);

    return isBreakpoint;
};
