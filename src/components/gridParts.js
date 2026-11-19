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

import DrillDownCell, { attributeValue } from './DrillDownCell.js';

// How a report (the backend's ResultsModel, as JSON) becomes an AG Grid: its modules, theme,
// column definitions, rows and styles.

// Registered per grid (the `modules` prop) rather than globally, so this component doesn't
// change any other AG Grid an app might have.
export const modules = [
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

// a cell's left and right padding in px; the row count lines up with the text in the first column
export const cellPadding = 8;

const isZero = v => v === 0 || v === '0';

// The grid's theme, from the app's MUI theme.
export const gridTheme = (muiTheme, fixedRowHeight) =>
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
    });

// A drill-down needs a React cell renderer (a link); every other cell is left to AG Grid to draw
// as plain text, which is much cheaper on a long report.
const drillDownRendererFor = field => params =>
    params.data?.[`${field}DrillDown`] ? { component: DrillDownCell } : undefined;

// The report's columns as AG Grid column definitions.
export const buildColumnDefs = (report, { fixedRowHeight, pinnedColumns }) =>
    report.headers.dataGridColumnSpecifications.map((spec, i) => {
        const field = spec.columnId;
        const isDate = spec.columnType === 'date';
        const isNumber = spec.columnType === 'number';
        const alignClass = spec.align ? `align-${spec.align}` : '';
        // Only text wraps: a number or date never needs a second line, and each column that can
        // grow a row (autoHeight) is one more cell AG Grid measures on every row it draws.
        const wraps = !fixedRowHeight && !isNumber && !isDate;
        // Made once per column, not for every cell: an Intl.NumberFormat is slow to make.
        const numberFormat =
            isNumber &&
            new Intl.NumberFormat('en-GB', {
                minimumFractionDigits: spec.decimalPlaces ?? 2,
                maximumFractionDigits: spec.decimalPlaces ?? 99
            });

        return {
            field,
            headerName: report.headers.columnHeaders[i],
            // shown only when the header is cut off (tooltipShowMode)
            headerTooltip: report.headers.columnHeaders[i],
            pinned: i < pinnedColumns ? 'left' : undefined,
            width: spec.columnWidth,
            headerClass: alignClass,
            cellClass: [alignClass, report.headers.totalColumns?.includes(i) && 'totalColumn']
                .filter(Boolean)
                .join(' '),
            cellStyle: params => {
                const attributes = params.data?.[`${field}Attributes`];
                if (!attributes) {
                    return undefined;
                }
                return {
                    backgroundColor: attributeValue(attributes, 'background-colour'),
                    color: attributeValue(attributes, 'text-colour')
                };
            },
            wrapText: wraps,
            autoHeight: wraps,
            // a cell that doesn't wrap shows its full text in a tooltip when it's cut off
            tooltipValueGetter: wraps ? undefined : p => p.valueFormatted ?? p.value,
            cellRendererSelector: drillDownRendererFor(field),
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
                valueFormatter: p =>
                    p.value || isZero(p.value) ? numberFormat.format(p.value) : p.value,
                // CSV keeps raw numbers (no thousands separators) so spreadsheets read them
                useValueFormatterForExport: false
            })
        };
    });

// One of the report's rows as a grid row: each column's value under its columnId, plus its sort
// value, drill-down and attributes where it has them.
export const buildRow = (report, r, renderZeroes) =>
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
    );

// The report's totals as a grid row (rowType Total).
export const buildTotalsRow = (report, renderZeroes) =>
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
    );

// Subtotal and total rows are drawn bold (the totalLine class).
export const getRowClass = params =>
    params.data?.rowType === 'Subtotal' || params.data?.rowType === 'Total'
        ? 'totalLine'
        : undefined;

// The grid's own styles: totals in bold, alignment, wrapped text, and quieter filter icons.
export const gridStyles = {
    // Filter icons only on the header you're pointing at, or one with a filter set. (AG Grid's
    // suppressMenuHide doesn't cover Community's filter button.) Devices that can't hover keep
    // them showing.
    '@media (hover: hover)': {
        '& .ag-header-cell-filter-button': { transition: 'opacity .2s' },
        '& .ag-header-cell:not(.ag-header-cell-filtered):not(:hover):not(:focus-within) .ag-header-cell-filter-button':
            { opacity: 0 }
    },
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
};
