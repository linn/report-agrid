import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ExternalFilterModule, ScrollApiModule } from 'ag-grid-community';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';

import BusyBar from './BusyBar.js';
import { DownloadIcon, Search, ToolButton } from './GridTools.js';
import {
    buildColumnDefs,
    buildRow,
    buildTotalsRow,
    defaultMinFillHeight,
    getRowClass as totalRowClass,
    gridStyles,
    densityOf,
    gridTheme,
    modules,
    resolveHeight
} from './gridParts.js';

// Many reports drawn as one grid: each report's title is a full-width row, then its rows, its
// totals (with showTotals) and a blank row before the next. As one grid, only the rows in view are
// ever drawn, however many reports or rows there are. The reports are expected to share their
// columns, as a multi-report endpoint's do: the first report's columns are used.

// the search filters rows itself (keeping each title with its matches) and the bar above reads the
// scroll position: each needs its module
const combinedModules = [...modules, ExternalFilterModule, ScrollApiModule];

const isTitle = data => data?.rowType === 'Title';
const isSpacer = data => data?.rowType === 'Spacer';
const isTotal = data => data?.rowType === 'Total' || data?.rowType === 'Subtotal';

// room for the bar above the grid, so it, the column headings and the last row fit on screen
const defaultCombinedFillOffset = 155;

// A report's title, across the grid; a blank row draws nothing.
function TitleRow({ data, context }) {
    if (isSpacer(data)) {
        return null;
    }
    const { openLinksInNewTabs, titlesVariant } = context;
    const title = (
        <Typography variant={titlesVariant} component="span">
            {data.title}
        </Typography>
    );
    return (
        <Box sx={{ display: 'flex', alignItems: 'flex-end', height: '100%', px: 1, pb: 0.5 }}>
            {data.titleHref ? (
                <a
                    href={data.titleHref}
                    target={openLinksInNewTabs ? '_blank' : ''}
                    rel={openLinksInNewTabs ? 'noopener noreferrer' : ''}
                    style={{ color: 'inherit' }}
                >
                    {title}
                </a>
            ) : (
                title
            )}
        </Box>
    );
}

function CombinedReportAGrids({
    reportData = [],
    renderZeroes = false,
    titlesVariant = 'h6',
    showTotals = false,
    openLinksInNewTabs = true,
    fixedRowHeight = false,
    // "compact" (the default) or "dense": smaller text and shorter rows, for more on screen
    density = 'compact',
    // Export CSV exports the whole grid, every report, with each title in the first column and a
    // blank line between reports. On by default, as on ReportAGrid.
    showExport = true,
    // one search across every report; a report's title and totals stay with its matching rows
    showSearch = showExport,
    exportFileName = 'report',
    // 'fill': as tall as the window less fillOffset (room for the bar above), at least
    // minFillHeight; or any CSS height
    height = 'fill',
    fillOffset = defaultCombinedFillOffset,
    minFillHeight = defaultMinFillHeight,
    rowBuffer = 10,
    pinnedColumns = 0,
    titleRowHeight = 44,
    spacerRowHeight = 24,
    // Column headings sort and filter every row in the grid, titles and blank rows included, so a
    // report's rows can end up away from its title. Where a row doesn't say which report it's from
    // (a balance row, say), that leaves it unidentifiable: turn either off for such reports. The
    // search above the grid always keeps each title with its matching rows.
    sortable = true,
    filterable = true
}) {
    const muiTheme = useTheme();
    const gridRef = useRef(null);
    const [searchText, setSearchText] = useState('');

    const theme = useMemo(
        () => gridTheme(muiTheme, fixedRowHeight, density),
        [muiTheme, fixedRowHeight, density]
    );

    const columnDefs = useMemo(
        () =>
            reportData.length
                ? buildColumnDefs(reportData[0], { fixedRowHeight, pinnedColumns }).map(column => ({
                      ...column,
                      sortable,
                      filter: filterable ? column.filter : false
                  }))
                : [],
        [reportData, fixedRowHeight, pinnedColumns, sortable, filterable]
    );

    const rowData = useMemo(() => {
        const rows = [];
        reportData.forEach((report, group) => {
            const fields = report.headers.dataGridColumnSpecifications.map(s => s.columnId);
            const title = report.title?.displayString ?? '';
            // the title also goes in the first column, so it's in the CSV export
            rows.push({
                rowType: 'Title',
                group,
                title,
                titleHref: report.title?.drillDowns?.[0]?.href,
                [fields[0]]: title
            });
            report.results.forEach(r => {
                const row = buildRow(report, r, renderZeroes);
                row.group = group;
                // what the search looks in: every column's text
                row.searchText = fields
                    .map(f => row[f] ?? '')
                    .join(' ')
                    .toLowerCase();
                rows.push(row);
            });
            if (showTotals && report.totals) {
                rows.push({ ...buildTotalsRow(report, renderZeroes), group });
            }
            // a blank row before the next report (and a blank line in the CSV)
            if (group < reportData.length - 1) {
                rows.push({ rowType: 'Spacer', group });
            }
        });
        return rows;
    }, [reportData, renderZeroes, showTotals]);

    // The search keeps a report's title, totals and blank row with whichever of its rows match,
    // and drops reports with none, so it never leaves a title with nothing under it.
    const term = searchText.trim().toLowerCase();
    const matchingGroups = useMemo(
        () =>
            term
                ? new Set(rowData.filter(r => r.searchText?.includes(term)).map(r => r.group))
                : null,
        [rowData, term]
    );

    // AG Grid calls the filter itself, so it reads the latest search from a ref
    const filterRef = useRef({ term, matchingGroups });
    filterRef.current = { term, matchingGroups };
    const isExternalFilterPresent = useCallback(() => !!filterRef.current.term, []);
    const doesExternalFilterPass = useCallback(node => {
        const { term: t, matchingGroups: groups } = filterRef.current;
        const { data } = node;
        if (isTitle(data) || isTotal(data) || isSpacer(data)) {
            return groups.has(data.group);
        }
        return data.searchText?.includes(t);
    }, []);
    useEffect(() => {
        gridRef.current?.api?.onFilterChanged();
    }, [term, matchingGroups]);

    const isFullWidthRow = useCallback(
        params => isTitle(params.rowNode.data) || isSpacer(params.rowNode.data),
        []
    );
    const getRowHeight = useCallback(
        params => {
            if (isSpacer(params.data)) {
                return spacerRowHeight;
            }
            return isTitle(params.data) ? titleRowHeight : undefined;
        },
        [titleRowHeight, spacerRowHeight]
    );
    const getRowClass = useCallback(params => {
        if (isSpacer(params.data)) {
            return 'spacerLine';
        }
        return isTitle(params.data) ? 'titleLine' : totalRowClass(params);
    }, []);

    const exportCsv = () =>
        gridRef.current?.api.exportDataAsCsv({ fileName: `${exportFileName}.csv` });

    // The report at the top of the view, named in the bar above the grid, so you know where you
    // are once its title row has scrolled away. Worked out at most once a frame while scrolling.
    const [currentTitle, setCurrentTitle] = useState('');
    const frame = useRef(null);
    const updateCurrentTitle = useCallback(() => {
        if (frame.current) {
            return;
        }
        frame.current = requestAnimationFrame(() => {
            frame.current = null;
            const api = gridRef.current?.api;
            if (!api) {
                return;
            }
            const { top } = api.getVerticalPixelRange();
            const atTop = api
                .getRenderedNodes()
                .find(n => n.rowTop <= top && top < n.rowTop + n.rowHeight);
            const group = atTop?.data?.group;
            const title =
                group === undefined ? '' : (reportData[group]?.title?.displayString ?? '');
            setCurrentTitle(previous => (previous === title ? previous : title));
        });
    }, [reportData]);
    useEffect(() => () => frame.current && cancelAnimationFrame(frame.current), []);

    // a moving bar until AG Grid has drawn its first rows (or settled with none)
    const [ready, setReady] = useState(false);
    const onFirstDataRendered = useCallback(() => {
        setReady(true);
        updateCurrentTitle();
    }, [updateCurrentTitle]);
    const onModelUpdated = useCallback(
        e => {
            if (e.api.getDisplayedRowCount() === 0) {
                setReady(true);
            }
            updateCurrentTitle();
        },
        [updateCurrentTitle]
    );

    return (
        <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5, minHeight: 32 }}>
                <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    noWrap
                    sx={{ flexGrow: 1 }}
                    data-testid="current-report"
                >
                    {currentTitle}
                </Typography>
                {showSearch && <Search value={searchText} onChange={setSearchText} />}
                {showExport && (
                    <ToolButton label="Export CSV" Icon={DownloadIcon} onClick={exportCsv} />
                )}
            </Box>
            <Box
                sx={{
                    position: 'relative',
                    height: resolveHeight(height, fillOffset, minFillHeight),
                    ...gridStyles(density),
                    // a blank row is just a gap: no row line, and nothing to hover or click
                    '& .spacerLine': { borderBottomColor: 'transparent', pointerEvents: 'none' }
                }}
            >
                {!ready && <BusyBar sx={{ position: 'absolute', top: 0, left: 0, right: 0 }} />}
                <AgGridReact
                    // suppressColumnVirtualisation is only read when a grid is made, so switching
                    // between fixed and wrapped rows makes a new one; so does a new density, so
                    // every row is measured afresh
                    key={`${fixedRowHeight ? 'fixed' : 'wrapped'}-${density}`}
                    ref={gridRef}
                    modules={combinedModules}
                    theme={theme}
                    rowData={rowData}
                    columnDefs={columnDefs}
                    headerHeight={densityOf(density).headerHeight}
                    context={{ openLinksInNewTabs, titlesVariant }}
                    isFullWidthRow={isFullWidthRow}
                    fullWidthCellRenderer={TitleRow}
                    getRowHeight={getRowHeight}
                    getRowClass={getRowClass}
                    isExternalFilterPresent={isExternalFilterPresent}
                    doesExternalFilterPass={doesExternalFilterPass}
                    onBodyScroll={updateCurrentTitle}
                    onFirstDataRendered={onFirstDataRendered}
                    onModelUpdated={onModelUpdated}
                    // Wrapped rows are measured from the cells drawn, so every column is drawn;
                    // with fixed rows, columns out of view sideways are drawn as they come in.
                    suppressColumnVirtualisation={!fixedRowHeight}
                    rowBuffer={rowBuffer}
                    enableCellTextSelection
                    // rows in the page in the order shown, so text copied across rows keeps it
                    ensureDomOrder
                    tooltipShowDelay={300}
                    tooltipShowMode="whenTruncated"
                />
            </Box>
        </Box>
    );
}

export default CombinedReportAGrids;
