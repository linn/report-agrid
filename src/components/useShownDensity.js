import { useEffect, useRef, useState } from 'react';

import { defaultDensity } from './gridParts.js';

// The densities the density toggle steps through, in order, from the one a grid was given: that
// one, then "tight" and "tightest", then back. A grid given tight or tightest starts there in the
// same cycle, with the default in place of its own density.
const cycleFrom = density => {
    const tighter = ['tight', 'tightest'];
    const cycle = tighter.includes(density) ? [defaultDensity, ...tighter] : [density, ...tighter];
    const start = cycle.indexOf(density);
    return [...cycle.slice(start), ...cycle.slice(0, start)];
};

// The density a grid shows, and the next one the toggle goes to. When it changes, the grid keeps
// its sort, filters and scroll; its rows are measured again for their new height.
export default function useShownDensity(density, gridRef) {
    const [step, setStep] = useState(0);
    const cycle = cycleFrom(density);
    const shown = cycle[step % cycle.length];
    const next = cycle[(step + 1) % cycle.length];

    const previous = useRef(shown);
    useEffect(() => {
        if (previous.current === shown) {
            return undefined;
        }
        previous.current = shown;
        // after AG Grid has taken the new theme
        const frame = requestAnimationFrame(() => gridRef.current?.api?.resetRowHeights());
        return () => cancelAnimationFrame(frame);
    }, [shown, gridRef]);

    return { shown, next, toNext: () => setStep(s => (s + 1) % cycle.length) };
}
