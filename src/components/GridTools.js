import React, { useState } from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import InputBase from '@mui/material/InputBase';
import Tooltip from '@mui/material/Tooltip';
import { keyframes } from '@mui/material/styles';

// The small tools a report shows by its title (search, export, print) and their icons.

// Material's icons, inline: @mui/icons-material isn't a dependency
const icon = d =>
    function Icon({ className }) {
        return (
            <svg
                className={className}
                width="1em"
                height="1em"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden
            >
                <path d={d} />
            </svg>
        );
    };
export const OpenInNewIcon = icon(
    'M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3z'
);
export const LinkIcon = icon(
    'M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1M8 13h8v-2H8zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5'
);
export const DownloadIcon = icon('M19 9h-4V3H9v6H5l7 7zM5 18v2h14v-2z');
const SearchIcon = icon(
    'M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14'
);
const CloseIcon = icon(
    'M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z'
);
export const PrintIcon = icon(
    'M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3m-3 11H8v-5h8zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1m-1-9H6v4h12z'
);

// Material's density_small and density_medium
const DensitySmallIcon = icon('M3 2h18v2H3zm0 18h18v2H3zm0-6h18v2H3zm0-6h18v2H3z');
const DensityMediumIcon = icon('M3 3h18v2H3zm0 16h18v2H3zm0-8h18v2H3z');

// quiet, so they don't compete with the report: no box, small, in the secondary text colour
const toolStyle = theme => ({ fontSize: theme.typography.body2.fontSize, color: 'text.secondary' });

export function ToolButton({ label, Icon, onClick }) {
    return (
        <Tooltip title={label}>
            <IconButton size="small" aria-label={label} onClick={onClick} sx={toolStyle}>
                <Icon />
            </IconButton>
        </Tooltip>
    );
}

const searchWidth = 180;
const openSearch = keyframes`from { width: 32px; } to { width: ${searchWidth}px; }`;

// A search icon that opens into a box. The box closes again when you leave it empty, stays open
// while it has text (so a search can't hide rows out of sight), and Escape or × clears and closes it.
export function Search({ value, onChange }) {
    const [open, setOpen] = useState(false);

    if (!open && !value) {
        return <ToolButton label="Search" Icon={SearchIcon} onClick={() => setOpen(true)} />;
    }

    const clearAndClose = () => {
        onChange('');
        setOpen(false);
    };

    return (
        <InputBase
            autoFocus
            placeholder="Search…"
            value={value}
            onChange={e => onChange(e.target.value)}
            onBlur={() => !value && setOpen(false)}
            onKeyDown={e => e.key === 'Escape' && clearAndClose()}
            inputProps={{ 'aria-label': 'Search' }}
            startAdornment={
                <Box component="span" sx={{ display: 'flex', mr: 0.5 }}>
                    <SearchIcon />
                </Box>
            }
            endAdornment={
                value && (
                    <IconButton
                        size="small"
                        aria-label="Clear search"
                        onClick={clearAndClose}
                        sx={{ p: 0.25, color: 'inherit' }}
                    >
                        <CloseIcon />
                    </IconButton>
                )
            }
            sx={theme => ({
                ...toolStyle(theme),
                width: searchWidth,
                animation: `${openSearch} .15s ease-out`,
                borderBottom: 1,
                borderColor: 'divider',
                '&.Mui-focused': { borderColor: 'primary.main' }
            })}
        />
    );
}

// Steps a grid through the densities, for each user to find the one that suits the report. Its
// label names the next one; its icon shows whether that is tighter or looser.
const densityLabels = {
    comfortable: 'Comfortable rows',
    standard: 'Standard rows',
    tight: 'Tight rows',
    tightest: 'Tightest rows'
};
export function DensityToggle({ shown, next, onClick }) {
    const order = Object.keys(densityLabels);
    const tighter = order.indexOf(next) > order.indexOf(shown);
    return (
        <ToolButton
            label={densityLabels[next]}
            Icon={tighter ? DensitySmallIcon : DensityMediumIcon}
            onClick={onClick}
        />
    );
}
