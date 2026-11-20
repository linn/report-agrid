import React, { createRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Typography from '@mui/material/Typography';

import LazyMount from './LazyMount.js';
import ReportAGrid from './ReportAGrid.js';
import { defaultMinFillHeight, defaultReportFillOffset, densityOf } from './gridParts.js';

// Rough heights in px of a ReportAGrid's parts, for a lazy report's placeholder before its grid
// has been drawn. Once some grids have been drawn, their rows' average height replaces the guess.
const titleHeight = 40;
const scrollbarHeight = 16;
const gapBelow = 24;
const pagerHeight = 48;

// A grid's `height` in px, when it scrolls rather than growing to fit its rows.
const scrollingHeight = ({ height, fillOffset, minFillHeight }) => {
    if (height === 'fill') {
        return Math.max(
            minFillHeight ?? defaultMinFillHeight,
            window.innerHeight - (fillOffset ?? defaultReportFillOffset)
        );
    }
    const size = parseFloat(height);
    if (String(height).endsWith('px')) {
        return size;
    }
    if (String(height).endsWith('vh')) {
        return (window.innerHeight * size) / 100;
    }
    return window.innerHeight;
};

// How tall a report will be once drawn, for its placeholder until then.
export const estimateReportHeight = (report, options) => {
    const { density, showHeader, showTotals, maxRowsWithoutScroll, pageSize, rowHeight } = options;
    // a wrapped row of one line is about as tall as a fixed row
    const d = densityOf(density);
    const rows = Math.min(report.results.length, pageSize > 0 ? pageSize : Infinity);
    const body =
        rows > maxRowsWithoutScroll
            ? scrollingHeight(options)
            : (rows + (showTotals && report.totals ? 1 : 0)) * (rowHeight ?? d.rowHeight) +
              (showHeader ? d.headerHeight : 0) +
              scrollbarHeight;
    return titleHeight + body + (pageSize > 0 ? pagerHeight : 0) + gapBelow;
};

// ReportDataGrids, drawn with ReportAGrid: the same props, so an app switches by changing its import.
function ReportAGrids({
    reportData = [],
    renderZeroes = false,
    titlesVariant = 'h6',
    repeatHeaders = true,
    // each report's Export CSV (and search), on by default
    perReportExport = true,
    showSearch = perReportExport,
    showPrint = false,
    openLinksInNewTabs = true,
    showTotals = false,
    fixedRowHeight = false,
    // "compact" (the default) or "dense": smaller text and shorter rows, for more on screen
    density = 'compact',
    showRowCount = false,
    maxRowsWithoutScroll = 100,
    height = 'fill',
    // left unset, ReportAGrid's own defaults
    fillOffset,
    minFillHeight,
    pageSize,
    pageSizeOptions,
    pinnedColumns = 0,
    rowBuffer = 10,
    // Off by default. On, a report's grid is drawn only while it is near the screen (within
    // lazyMargin above or below it) and a placeholder showing its title otherwise, so a page of
    // hundreds of reports only has the few near the screen drawn. A grid that is taken away and
    // drawn again starts afresh: its search, sort and filters are cleared.
    lazy = false,
    lazyMargin = '150%'
}) {
    const gridRefs = useMemo(() => reportData.map(() => createRef()), [reportData]);

    // The average height of the rows drawn so far, for the placeholders of reports not yet drawn.
    // It only changes when it moves by more than a tenth, so the placeholders settle quickly.
    const rowSample = useRef({ total: 0, count: 0 });
    const [rowHeight, setRowHeight] = useState(null);
    useEffect(() => {
        rowSample.current = { total: 0, count: 0 };
        setRowHeight(null);
    }, [reportData, fixedRowHeight, density]);
    const onDrawn = useCallback(element => {
        const rows = element.querySelectorAll('.ag-center-cols-container .ag-row');
        if (!rows.length) {
            return;
        }
        rowSample.current.total += [...rows].reduce((sum, row) => sum + row.offsetHeight, 0);
        rowSample.current.count += rows.length;
        const average = rowSample.current.total / rowSample.current.count;
        setRowHeight(previous =>
            previous && Math.abs(average - previous) / previous <= 0.1 ? previous : average
        );
    }, []);

    // With headers on the first report only, every report keeps its columns in step with it, so
    // resizing a column or scrolling sideways moves them all and they stay under those headers.
    // Lazy, only the grids drawn at the time are kept in step.
    const alignedGridsFor = i =>
        repeatHeaders
            ? undefined
            : () => gridRefs.filter((r, j) => j !== i && (!lazy || r.current));

    return (
        <>
            {reportData.map((d, i) => {
                const showHeader = repeatHeaders || i === 0;
                const grid = (
                    <ReportAGrid
                        report={d}
                        showExport={perReportExport}
                        showSearch={showSearch}
                        showPrint={showPrint}
                        showTotals={showTotals}
                        fixedRowHeight={fixedRowHeight}
                        density={density}
                        renderZeroes={renderZeroes}
                        titleVariant={titlesVariant}
                        showHeader={showHeader}
                        openLinksInNewTabs={openLinksInNewTabs}
                        showRowCount={showRowCount}
                        maxRowsWithoutScroll={maxRowsWithoutScroll}
                        height={height}
                        fillOffset={fillOffset}
                        minFillHeight={minFillHeight}
                        pageSize={pageSize}
                        pageSizeOptions={pageSizeOptions}
                        pinnedColumns={pinnedColumns}
                        rowBuffer={rowBuffer}
                        gridRef={gridRefs[i]}
                        alignedGrids={alignedGridsFor(i)}
                    />
                );

                if (!lazy) {
                    return <React.Fragment key={d.title.displayString}>{grid}</React.Fragment>;
                }

                return (
                    <LazyMount
                        key={d.title.displayString}
                        margin={lazyMargin}
                        onDrawn={onDrawn}
                        estimatedHeight={estimateReportHeight(d, {
                            density,
                            showHeader,
                            showTotals,
                            maxRowsWithoutScroll,
                            pageSize,
                            rowHeight,
                            height,
                            fillOffset,
                            minFillHeight
                        })}
                        // the title still shows while scrolling past, so you can see where you are
                        placeholder={
                            <Typography
                                variant={titlesVariant}
                                component="div"
                                color="text.secondary"
                            >
                                {d.title.displayString}
                            </Typography>
                        }
                    >
                        {grid}
                    </LazyMount>
                );
            })}
        </>
    );
}

export default ReportAGrids;
