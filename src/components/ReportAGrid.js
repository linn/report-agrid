import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import {
    AlignedGridsModule,
    CellStyleModule,
    ClientSideRowModelModule,
    CsvExportModule,
    DateFilterModule,
    NumberFilterModule,
    PaginationModule,
    PinnedRowModule,
    QuickFilterModule,
    RenderApiModule,
    RowApiModule,
    RowAutoHeightModule,
    RowStyleModule,
    TextFilterModule,
    TooltipModule,
    themeQuartz
} from 'ag-grid-community';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import InputBase from '@mui/material/InputBase';
import LinearProgress from '@mui/material/LinearProgress';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';
import { Link } from 'react-router-dom';

// Registered per grid (the `modules` prop) rather than globally, so this component doesn't
// change any other AG Grid an app might have.
const modules = [
    ClientSideRowModelModule,
    AlignedGridsModule,
    CellStyleModule,
    CsvExportModule,
    DateFilterModule,
    NumberFilterModule,
    PaginationModule,
    PinnedRowModule,
    QuickFilterModule,
    RenderApiModule,
    RowApiModule,
    RowAutoHeightModule,
    RowStyleModule,
    TextFilterModule,
    TooltipModule
];

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
const OpenInNewIcon = icon(
    'M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3z'
);
const LinkIcon = icon(
    'M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1M8 13h8v-2H8zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5'
);
const DownloadIcon = icon('M19 9h-4V3H9v6H5l7 7zM5 18v2h14v-2z');
const PrintIcon = icon(
    'M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3m-3 11H8v-5h8zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1m-1-9H6v4h12z'
);

// a cell's left and right padding in px; the row count lines up with the text in the first column
const cellPadding = 8;

const defaultPageSizeOptions = [25, 50, 100, 250, 500];

const isZero = v => v === 0 || v === '0';

const attributeValue = (attributes, type) =>
    attributes?.find(a => a.attributeType === type)?.attributeValue;

function DrillDownCell({ value, valueFormatted, data, colDef, context }) {
    const text = valueFormatted ?? value;
    const drillDown = data?.[`${colDef.field}DrillDown`];
    if (!drillDown?.url) {
        return text;
    }

    const { openLinksInNewTabs } = context;
    const linkProps = {
        target: openLinksInNewTabs ? '_blank' : '',
        rel: openLinksInNewTabs ? 'noopener noreferrer' : '',
        // a drill-down link takes its cell's colour, not the browser's link colour
        style: { color: attributeValue(data[`${colDef.field}Attributes`], 'text-colour') }
    };

    return drillDown.external ? (
        <a href={drillDown.url} {...linkProps}>
            {text}
        </a>
    ) : (
        <Link to={drillDown.url} {...linkProps}>
            {text}
        </Link>
    );
}

function ReportAGrid({
    report,
    renderZeroes = false,
    titleVariant = 'h6',
    showHeader = true,
    showExport = false,
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
    // a ref given the AgGridReact, for its api (ReportAGrids uses it to align its grids)
    gridRef: outerGridRef,
    // AG Grid's alignedGrids: other grids whose column widths and scroll this one keeps in step with
    alignedGrids
}) {
    const muiTheme = useTheme();
    const innerGridRef = useRef(null);
    const gridRef = outerGridRef ?? innerGridRef;
    const [quickFilterText, setQuickFilterText] = useState('');

    const theme = useMemo(
        () =>
            themeQuartz.withParams({
                fontFamily: muiTheme.typography.fontFamily,
                fontSize: muiTheme.typography.body2.fontSize,
                headerFontWeight: muiTheme.typography.fontWeightMedium,
                foregroundColor: muiTheme.palette.text.primary,
                backgroundColor: muiTheme.palette.background.paper,
                accentColor: muiTheme.palette.primary.main,
                borderColor: muiTheme.palette.divider,
                wrapperBorderRadius: muiTheme.shape.borderRadius,
                // compact, like ReportDataGrid's density="compact"
                spacing: 4,
                cellHorizontalPadding: cellPadding,
                rowHeight: fixedRowHeight ? 30 : undefined,
                // AG Grid keeps a short grid's rows area at least 150px tall, which left a gap above
                // the pinned totals row; one row's height still has room for "No Rows To Show".
                autoHeightMinBodyHeight: 30
            }),
        [muiTheme, fixedRowHeight]
    );

    const columnDefs = useMemo(
        () =>
            report.headers.dataGridColumnSpecifications.map((spec, i) => {
                const field = spec.columnId;
                const isDate = spec.columnType === 'date';
                const isNumber = spec.columnType === 'number';
                const alignClass = spec.align ? `align-${spec.align}` : '';

                return {
                    field,
                    headerName: report.headers.columnHeaders[i],
                    // shown only when the header is cut off (tooltipShowMode)
                    headerTooltip: report.headers.columnHeaders[i],
                    pinned: i < pinnedColumns ? 'left' : undefined,
                    width: spec.columnWidth,
                    headerClass: alignClass,
                    cellClass: [
                        alignClass,
                        report.headers.totalColumns?.includes(i) && 'totalColumn'
                    ]
                        .filter(Boolean)
                        .join(' '),
                    cellStyle: params => {
                        const attributes = params.data?.[`${field}Attributes`];
                        return {
                            backgroundColor: attributeValue(attributes, 'background-colour'),
                            color: attributeValue(attributes, 'text-colour')
                        };
                    },
                    wrapText: !fixedRowHeight,
                    autoHeight: !fixedRowHeight,
                    tooltipValueGetter: fixedRowHeight
                        ? p => p.valueFormatted ?? p.value
                        : undefined,
                    cellRenderer: DrillDownCell,
                    filter:
                        (isDate && 'agDateColumnFilter') ||
                        (isNumber && 'agNumberColumnFilter') ||
                        'agTextColumnFilter',
                    // Date columns sort and filter on the backend's ISO sort value while showing its
                    // formatted string.
                    ...(isDate && {
                        valueGetter: p => {
                            const sortValue = p.data?.[`${field}SortValue`];
                            return sortValue ? new Date(sortValue) : null;
                        },
                        valueFormatter: p => p.data?.[field],
                        getQuickFilterText: p => p.data?.[field],
                        // CSV gets what's on screen, not the Date
                        useValueFormatterForExport: true
                    }),
                    ...(isNumber && {
                        valueFormatter: p => {
                            if (p.value || isZero(p.value)) {
                                const { decimalPlaces } = spec;
                                return Intl.NumberFormat('en-GB', {
                                    minimumFractionDigits: decimalPlaces ?? 2,
                                    maximumFractionDigits: decimalPlaces ?? 99
                                }).format(p.value);
                            }
                            return p.value;
                        },
                        // CSV keeps raw numbers (no thousands separators) so spreadsheets read them
                        useValueFormatterForExport: false
                    })
                };
            }),
        [report, fixedRowHeight, pinnedColumns]
    );

    const rowData = useMemo(
        () =>
            report.results.map(r =>
                report.headers.dataGridColumnSpecifications.reduce(
                    (acc, spec, i) => {
                        const field = spec.columnId;
                        const value = r.values[i];
                        let val = value?.textDisplayValue ?? value?.displayValue;
                        if (isZero(val) && !renderZeroes) {
                            val = '';
                        }
                        acc[field] = val;

                        if (value?.sortValue) {
                            acc[`${field}SortValue`] = value.sortValue;
                        }

                        if (value?.drillDowns?.length) {
                            acc[`${field}DrillDown`] = {
                                url: value.drillDowns[0].href,
                                external: value.drillDowns[0].externalLink
                            };
                        }

                        if (value?.attributes?.length) {
                            acc[`${field}Attributes`] = value.attributes;
                        }

                        return acc;
                    },
                    { rowType: r.rowType }
                )
            ),
        [report, renderZeroes]
    );

    // The totals row is pinned to the bottom, so it stays in view and isn't moved by sorting.
    const pinnedBottomRowData = useMemo(() => {
        if (!showTotals || !report.totals) {
            return undefined;
        }

        return [
            report.headers.dataGridColumnSpecifications.reduce(
                (acc, spec, i) => {
                    let totalVal = report.totals.values[i]?.displayValue;
                    if (isZero(totalVal) && !renderZeroes) {
                        totalVal = '';
                    }
                    acc[spec.columnId] = totalVal;
                    return acc;
                },
                { rowType: 'Total' }
            )
        ];
    }, [report, showTotals, renderZeroes]);

    const getRowClass = useCallback(
        params =>
            params.data?.rowType === 'Subtotal' || params.data?.rowType === 'Total'
                ? 'totalLine'
                : undefined,
        []
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

    // quiet, so they don't compete with the report: no box, small, in the secondary text colour
    const toolStyle = { fontSize: muiTheme.typography.body2.fontSize, color: 'text.secondary' };
    const toolButton = (label, Icon, onClick) => (
        <Tooltip title={label}>
            <IconButton size="small" aria-label={label} onClick={onClick} sx={toolStyle}>
                <Icon />
            </IconButton>
        </Tooltip>
    );

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
                {(showExport || showPrint) && (
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
                        {showExport && (
                            <InputBase
                                placeholder="Search…"
                                value={quickFilterText}
                                onChange={e => setQuickFilterText(e.target.value)}
                                inputProps={{ 'aria-label': 'Search' }}
                                sx={{
                                    ...toolStyle,
                                    width: 160,
                                    borderBottom: 1,
                                    borderColor: 'divider',
                                    '&.Mui-focused': { borderColor: 'primary.main' }
                                }}
                            />
                        )}
                        {showExport && toolButton('Export CSV', DownloadIcon, exportCsv)}
                        {showPrint && toolButton('Print', PrintIcon, () => setPrinting(true))}
                    </Box>
                )}
            </Box>
            <Box
                sx={{
                    position: 'relative',
                    ...(autoHeight || printing ? {} : { height }),
                    '& .ag-root-wrapper': { visibility: ready ? 'visible' : 'hidden' },
                    // Filter icons only on the header you're pointing at, or one with a filter
                    // set. (AG Grid's suppressMenuHide doesn't cover Community's filter button.)
                    // Devices that can't hover keep them showing.
                    '@media (hover: hover)': {
                        '& .ag-header-cell-filter-button': { transition: 'opacity .2s' },
                        '& .ag-header-cell:not(.ag-header-cell-filtered):not(:hover):not(:focus-within) .ag-header-cell-filter-button':
                            { opacity: 0 }
                    },
                    // no header at all, not even its border
                    ...(showHeader ? {} : { '& .ag-header': { display: 'none' } }),
                    '& .totalLine': { fontWeight: 'bolder' },
                    '& .totalColumn': { fontWeight: 'bold' },
                    '& .align-right': { textAlign: 'right' },
                    '& .align-center': { textAlign: 'center' },
                    '& .ag-header-cell.align-right .ag-header-cell-label': {
                        flexDirection: 'row-reverse'
                    },
                    '& .ag-header-cell.align-center .ag-header-cell-label': {
                        justifyContent: 'center'
                    },
                    // wrapped rows read better with a little more line height
                    '& .ag-cell-wrap-text': { lineHeight: 1.5, py: '4px', wordBreak: 'break-word' }
                }}
            >
                {!ready && (
                    <LinearProgress
                        aria-label="Loading"
                        sx={{ position: 'absolute', top: 0, left: 0, right: 0 }}
                    />
                )}
                <AgGridReact
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
                    suppressColumnVirtualisation
                    enableCellTextSelection
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
