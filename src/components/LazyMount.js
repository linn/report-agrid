import React, { useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';

// Draws its children only while they are near the screen (within `margin` above or below it), and
// a placeholder of the same height otherwise, so a page of many heavy things only ever has the few
// near the screen alive. The placeholder is `estimatedHeight` tall until the children have been
// drawn, then the height they were drawn at, so the page keeps its length as they come and go.
// `onDrawn(element)` is called with the drawn element whenever its size changes.
function LazyMount({ estimatedHeight, margin = '150%', placeholder = null, onDrawn, children }) {
    const ref = useRef(null);
    const [near, setNear] = useState(false);
    const [drawnHeight, setDrawnHeight] = useState(null);

    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => setNear(entry.isIntersecting), {
            rootMargin: `${margin} 0px`
        });
        observer.observe(ref.current);
        return () => observer.disconnect();
    }, [margin]);

    useEffect(() => {
        if (!near) {
            return undefined;
        }
        const observer = new ResizeObserver(([entry]) => {
            if (entry.contentRect.height > 0) {
                setDrawnHeight(entry.contentRect.height);
                onDrawn?.(ref.current);
            }
        });
        observer.observe(ref.current);
        return () => observer.disconnect();
    }, [near, onDrawn]);

    return (
        <Box ref={ref} sx={near ? undefined : { height: drawnHeight ?? estimatedHeight }}>
            {near ? children : placeholder}
        </Box>
    );
}

export default LazyMount;
