import React, { createRef, useMemo } from 'react';

import ReportAGrid from './ReportAGrid.js';

// ReportDataGrids, drawn with ReportAGrid: the same props, so an app switches by changing its import.
function ReportAGrids({
    reportData = [],
    renderZeroes = false,
    titlesVariant = 'h6',
    repeatHeaders = true,
    perReportExport = false,
    openLinksInNewTabs = true,
    showTotals = false,
    fixedRowHeight = false,
    showRowCount = false,
    maxRowsWithoutScroll = 100,
    height = '100vh'
}) {
    const gridRefs = useMemo(() => reportData.map(() => createRef()), [reportData]);

    // With headers on the first report only, every report keeps its columns in step with it, so
    // resizing a column or scrolling sideways moves them all and they stay under those headers.
    const alignedGridsFor = i =>
        repeatHeaders ? undefined : () => gridRefs.filter((_, j) => j !== i);

    return (
        <>
            {reportData.map((d, i) => (
                <ReportAGrid
                    key={d.title.displayString}
                    report={d}
                    showExport={perReportExport}
                    showTotals={showTotals}
                    fixedRowHeight={fixedRowHeight}
                    renderZeroes={renderZeroes}
                    titleVariant={titlesVariant}
                    showHeader={repeatHeaders || i === 0}
                    openLinksInNewTabs={openLinksInNewTabs}
                    showRowCount={showRowCount}
                    maxRowsWithoutScroll={maxRowsWithoutScroll}
                    height={height}
                    gridRef={gridRefs[i]}
                    alignedGrids={alignedGridsFor(i)}
                />
            ))}
        </>
    );
}

export default ReportAGrids;
