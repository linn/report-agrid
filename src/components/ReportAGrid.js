import React, { useCallback, useMemo, useRef, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import {
    AlignedGridsModule,
    CellStyleModule,
    ClientSideRowModelModule,
    CsvExportModule,
    DateFilterModule,
    NumberFilterModule,
    PinnedRowModule,
    QuickFilterModule,
    RowAutoHeightModule,
    RowStyleModule,
    TextFilterModule,
    TooltipModule,
    themeQuartz
} from 'ag-grid-community';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
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
    PinnedRowModule,
    QuickFilterModule,
    RowAutoHeightModule,
    RowStyleModule,
    TextFilterModule,
    TooltipModule
];

// Below this many rows the grid grows to fit them all (no scrollbar of its own, as
// ReportDataGrid). From here on it gets a fixed height and scrolls, drawing only the rows in view.
const autoHeightRowLimit = 100;

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
    showTotals = false,
    openLinksInNewTabs = true,
    fixedRowHeight = false,
    showRowCount = false,
    height = '100vh',
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
        [report, fixedRowHeight]
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

    const autoHeight = rowData.length < autoHeightRowLimit;

    const title = <Typography variant={titleVariant}>{report.title.displayString}</Typography>;
    const titleDrillDown = report.title?.drillDowns?.[0]?.href;

    return (
        <Grid container spacing={3}>
            <Grid size={12} sx={{ marginBottom: '-10px' }}>
                {titleDrillDown ? (
                    <a
                        target={openLinksInNewTabs ? '_blank' : ''}
                        rel={openLinksInNewTabs ? 'noopener noreferrer' : ''}
                        href={titleDrillDown}
                    >
                        {title}
                    </a>
                ) : (
                    title
                )}
            </Grid>
            {showExport && (
                <Grid size={12} sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <TextField
                        size="small"
                        variant="standard"
                        placeholder="Search…"
                        value={quickFilterText}
                        onChange={e => setQuickFilterText(e.target.value)}
                        slotProps={{ htmlInput: { 'aria-label': 'Search' } }}
                    />
                    <Button size="small" sx={{ textTransform: 'none' }} onClick={exportCsv}>
                        Export CSV
                    </Button>
                </Grid>
            )}
            <Grid
                size={12}
                sx={{
                    ...(autoHeight ? {} : { height }),
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
                    domLayout={autoHeight ? 'autoHeight' : 'normal'}
                    suppressColumnVirtualisation
                    enableCellTextSelection
                    ensureDomOrder
                    tooltipShowDelay={300}
                />
            </Grid>
            {showRowCount && report?.results && (
                <Grid size={12} sx={{ mt: -1.25 }}>
                    <Typography variant="body2" sx={{ float: 'left', pl: 2 }}>
                        Number of rows: {report.results.length}
                    </Typography>
                </Grid>
            )}
        </Grid>
    );
}

export default ReportAGrid;
