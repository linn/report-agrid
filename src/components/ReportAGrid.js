import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

import {
    buildColumnDefs,
    buildRow,
    buildTotalsRow,
    cellPadding,
    getRowClass,
    gridStyles,
    gridTheme,
    modules
} from './gridParts.js';
import {
    DownloadIcon,
    LinkIcon,
    OpenInNewIcon,
    PrintIcon,
    Search,
    ToolButton
} from './GridTools.js';

const defaultPageSizeOptions = [25, 50, 100, 250, 500];

function ReportAGrid({
    report,
    renderZeroes = false,
    titleVariant = 'h6',
    showHeader = true,
    showExport = false,
    // a search icon that opens into a box searching every column; shown with Export CSV by default,
    // as ReportDataGrid's toolbar has both
    showSearch = showExport,
    // a Print button, which prints every row (not just those in view, or the page when paging)
    showPrint = false,
    showTotals = false,
    openLinksInNewTabs = true,
    fixedRowHeight = false,
    showRowCount = false,
    // Up to this many rows showing (after search and filters), the grid grows to fit them, with no
    // scrollbar of its own: the page scrolls. More, and it is `height` tall and scrolls itself,
    // drawing only the rows in view, which keeps thousands of rows fast. Infinity: always grow.
    maxRowsWithoutScroll = 100,
    height = '100vh',
    // Off by default: every row in one list. A number pages the report that many rows at a time,
    // with a selector of pageSizeOptions (pageSize is added to them if it isn't one).
    pageSize,
    pageSizeOptions = defaultPageSizeOptions,
    // this many of the report's first columns stay in view when scrolling sideways
    pinnedColumns = 0,
    // rows drawn beyond those in view, above and below, so they're ready before they scroll in
    // (AG Grid's default)
    rowBuffer = 10,
    // a ref given the AgGridReact, for its api (ReportAGrids uses it to align its grids)
    gridRef: outerGridRef,
    // AG Grid's alignedGrids: other grids whose column widths and scroll this one keeps in step with
    alignedGrids
}) {
    const muiTheme = useTheme();
    const innerGridRef = useRef(null);
    const gridRef = outerGridRef ?? innerGridRef;
    const [quickFilterText, setQuickFilterText] = useState('');

    const theme = useMemo(() => gridTheme(muiTheme, fixedRowHeight), [muiTheme, fixedRowHeight]);

    const columnDefs = useMemo(
        () => buildColumnDefs(report, { fixedRowHeight, pinnedColumns }),
        [report, fixedRowHeight, pinnedColumns]
    );

    const rowData = useMemo(
        () => report.results.map(r => buildRow(report, r, renderZeroes)),
        [report, renderZeroes]
    );

    // The totals row is pinned to the bottom, so it stays in view and isn't moved by sorting.
    const pinnedBottomRowData = useMemo(
        () => (showTotals && report.totals ? [buildTotalsRow(report, renderZeroes)] : undefined),
        [report, showTotals, renderZeroes]
    );

    const exportCsv = () =>
        gridRef.current?.api.exportDataAsCsv({
            fileName: `${report.title?.displayString || 'report'}.csv`
        });

    const paging = pageSize > 0;
    const pageSizeSelector = useMemo(
        () =>
            paging ? [...new Set([...pageSizeOptions, pageSize])].sort((a, b) => a - b) : undefined,
        [paging, pageSize, pageSizeOptions]
    );
    // the page size chosen in the grid's selector, which starts at pageSize
    const [currentPageSize, setCurrentPageSize] = useState(pageSize);
    // AG Grid keeps its page when the search or a filter changes, which can leave you on page 3 of 1
    const onFilterChanged = useCallback(e => e.api.paginationGoToFirstPage(), []);
    const onPaginationChanged = useCallback(
        e => setCurrentPageSize(e.api.paginationGetPageSize()),
        []
    );

    // Decided by the rows showing, not the report's total, so a big report searched down to a few
    // rows shrinks to fit them (and grows back when the search is cleared). Paged, it is the rows
    // on a page: a page of 100 grows to fit, a page of 500 scrolls.
    const [rowsShowing, setRowsShowing] = useState(null);
    const rowsInView = paging
        ? Math.min(rowsShowing ?? rowData.length, currentPageSize ?? pageSize)
        : (rowsShowing ?? rowData.length);
    const autoHeight = rowsInView <= maxRowsWithoutScroll;

    // Print draws every row (AG Grid's print layout, unpaged), opens the browser's print dialog,
    // then puts the grid back.
    const [printing, setPrinting] = useState(false);
    useEffect(() => {
        if (!printing) {
            return undefined;
        }
        const timer = setTimeout(() => {
            gridRef.current?.api.flushAllAnimationFrames();
            window.print();
            setPrinting(false);
        }, 100);
        return () => clearTimeout(timer);
    }, [printing, gridRef]);

    // AG Grid takes a moment to draw its first rows (longer with many wrapped rows to measure), so
    // until it has, the grid is hidden behind a progress bar rather than showing empty. A report
    // with no rows never draws one, so it counts as ready once its (empty) model settles.
    const [ready, setReady] = useState(false);
    const onFirstDataRendered = useCallback(() => setReady(true), []);
    const onModelUpdated = useCallback(e => {
        const count = e.api.getDisplayedRowCount();
        setRowsShowing(count);
        if (count === 0) {
            setReady(true);
        }
    }, []);

    const title = (
        <Typography variant={titleVariant} component="span">
            {report.title.displayString}
        </Typography>
    );
    const titleDrillDown = report.title?.drillDowns?.[0]?.href;

    return (
        <Box sx={{ mb: 3 }}>
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    flexWrap: 'wrap',
                    columnGap: 2,
                    mb: 0.5
                }}
            >
                <Box sx={{ flexGrow: 1 }}>
                    {titleDrillDown ? (
                        <Box
                            component="a"
                            target={openLinksInNewTabs ? '_blank' : ''}
                            rel={openLinksInNewTabs ? 'noopener noreferrer' : ''}
                            href={titleDrillDown}
                            // the title's own colour rather than link blue, with a grey underline
                            // so it reads as a link; on hover the underline darkens and a link
                            // icon appears after it
                            sx={{
                                color: 'inherit',
                                textDecoration: 'underline',
                                textDecorationColor: alpha(muiTheme.palette.text.primary, 0.35),
                                textDecorationThickness: '1px',
                                textUnderlineOffset: '3px',
                                '& .titleLinkIcon': {
                                    ml: 0.75,
                                    verticalAlign: 'middle',
                                    color: 'text.secondary',
                                    opacity: 0,
                                    transition: 'opacity .2s'
                                },
                                '&:hover, &:focus-visible': {
                                    textDecorationColor: 'currentColor',
                                    '& .titleLinkIcon': { opacity: 1 }
                                }
                            }}
                        >
                            {title}
                            {openLinksInNewTabs ? (
                                <OpenInNewIcon className="titleLinkIcon" />
                            ) : (
                                <LinkIcon className="titleLinkIcon" />
                            )}
                        </Box>
                    ) : (
                        title
                    )}
                </Box>
                {(showSearch || showExport || showPrint) && (
                    // a title too long to share its line pushes these onto the next, still at the
                    // right; not printed
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            ml: 'auto',
                            '@media print': { display: 'none' }
                        }}
                    >
                        {showSearch && (
                            <Search value={quickFilterText} onChange={setQuickFilterText} />
                        )}
                        {showExport && (
                            <ToolButton
                                label="Export CSV"
                                Icon={DownloadIcon}
                                onClick={exportCsv}
                            />
                        )}
                        {showPrint && (
                            <ToolButton
                                label="Print"
                                Icon={PrintIcon}
                                onClick={() => setPrinting(true)}
                            />
                        )}
                    </Box>
                )}
            </Box>
            <Box
                sx={{
                    position: 'relative',
                    ...(autoHeight || printing ? {} : { height }),
                    '& .ag-root-wrapper': { visibility: ready ? 'visible' : 'hidden' },
                    ...gridStyles,
                    // no header at all, not even its border
                    ...(showHeader ? {} : { '& .ag-header': { display: 'none' } })
                }}
            >
                {!ready && (
                    <LinearProgress
                        aria-label="Loading"
                        sx={{ position: 'absolute', top: 0, left: 0, right: 0 }}
                    />
                )}
                <AgGridReact
                    // suppressColumnVirtualisation is only read when a grid is made, so switching
                    // between fixed and wrapped rows makes a new one
                    key={fixedRowHeight ? 'fixed' : 'wrapped'}
                    ref={gridRef}
                    modules={modules}
                    alignedGrids={alignedGrids}
                    headerHeight={showHeader ? 36 : 0}
                    theme={theme}
                    rowData={rowData}
                    columnDefs={columnDefs}
                    pinnedBottomRowData={pinnedBottomRowData}
                    getRowClass={getRowClass}
                    context={{ openLinksInNewTabs }}
                    quickFilterText={quickFilterText}
                    domLayout={(printing && 'print') || (autoHeight ? 'autoHeight' : 'normal')}
                    onModelUpdated={onModelUpdated}
                    pagination={paging && !printing}
                    paginationPageSize={paging ? pageSize : undefined}
                    paginationPageSizeSelector={pageSizeSelector}
                    onPaginationChanged={paging ? onPaginationChanged : undefined}
                    onFilterChanged={paging ? onFilterChanged : undefined}
                    onFirstDataRendered={onFirstDataRendered}
                    // Wrapped rows are measured from the cells drawn, so every column is drawn;
                    // with fixed rows, columns out of view sideways are drawn as they come in.
                    suppressColumnVirtualisation={!fixedRowHeight}
                    rowBuffer={rowBuffer}
                    enableCellTextSelection
                    // rows in the page in the order shown, so text selected across rows copies in
                    // that order (and screen readers and tests read it so)
                    ensureDomOrder
                    tooltipShowDelay={300}
                    tooltipShowMode="whenTruncated"
                />
            </Box>
            {showRowCount && report?.results && (
                <Typography
                    variant="body2" // the grid's 1px border, then a cell's padding
                    sx={{ mt: 0.5, pl: `${cellPadding + 1}px` }}
                >
                    Number of rows:{' '}
                    {rowsShowing !== null && rowsShowing !== report.results.length
                        ? `${rowsShowing.toLocaleString('en-GB')} of ${report.results.length.toLocaleString('en-GB')}`
                        : report.results.length.toLocaleString('en-GB')}
                </Typography>
            )}
        </Box>
    );
}

export default ReportAGrid;
