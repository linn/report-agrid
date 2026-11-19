import React from 'react';
import Box from '@mui/material/Box';
import { alpha, keyframes } from '@mui/material/styles';

// A loading bar that keeps moving while the page is busy. MUI's LinearProgress animates left and
// right, which the browser runs on the same thread AG Grid draws its rows on, so it crawls just
// when it's showing; this one moves by transform, which the browser animates on its own.
const sweep = keyframes`from { transform: translateX(-100%); } to { transform: translateX(400%); }`;

function BusyBar({ sx }) {
    return (
        <Box
            role="progressbar"
            aria-label="Loading"
            sx={theme => ({
                height: 4,
                overflow: 'hidden',
                backgroundColor: alpha(theme.palette.primary.main, 0.2),
                zIndex: 1,
                ...sx
            })}
        >
            <Box
                sx={{
                    width: '25%',
                    height: '100%',
                    backgroundColor: 'primary.main',
                    willChange: 'transform',
                    animation: `${sweep} 1s ease-in-out infinite`
                }}
            />
        </Box>
    );
}

export default BusyBar;
