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

// How tightly a grid is drawn (the density prop): its text size, and in px its fixed row height
// (fixedRowHeight), column headings' row, AG Grid's spacing unit and a wrapped cell's top and
// bottom padding. "compact" (the default) uses the app theme's body2 text. A wrapped row of one
// line is about as tall as a fixed row.
export const densities = {
    compact: { fontSize: null, rowHeight: 30, headerHeight: 32, spacing: 4, wrapPadding: 5 },
    dense: { fontSize: '13px', rowHeight: 26, headerHeight: 28, spacing: 3, wrapPadding: 4 }
};
export const densityOf = density => densities[density] ?? densities.compact;

const isZero = v => v === 0 || v === '0';

// height="fill": as tall as the window less fillOffset, the room left for what sits above the grid
// (its title, or a bar), so that, the column headings and the last row are all on screen at once;
// but never under minFillHeight. Any other height is used as it is, as CSS.
export const defaultMinFillHeight = 400;
// a ReportAGrid's title sits above its grid
export const defaultReportFillOffset = 203;
export const resolveHeight = (height, fillOffset, minFillHeight) =>
    height === 'fill' ? `max(${minFillHeight}px, calc(100vh - ${fillOffset}px))` : height;

// The grid's theme, from the app's MUI theme.
export const gridTheme = (muiTheme, fixedRowHeight, density) => {
    const d = densityOf(density);
    return themeQuartz.withParams({
        fontFamily: muiTheme.typography.fontFamily,
        fontSize: d.fontSize ?? muiTheme.typography.body2.fontSize,
        headerFontWeight: muiTheme.typography.fontWeightMedium,
        foregroundColor: muiTheme.palette.text.primary,
        backgroundColor: muiTheme.palette.background.paper,
        accentColor: muiTheme.palette.primary.main,
        borderColor: muiTheme.palette.divider,
        wrapperBorderRadius: muiTheme.shape.borderRadius,
        // compact is tighter than ReportDataGrid's density="compact"
        spacing: d.spacing,
        cellHorizontalPadding: cellPadding,
        rowHeight: fixedRowHeight ? d.rowHeight : undefined,
        // AG Grid keeps a short grid's rows area at least 150px tall, which left a gap above
        // the pinned totals row; one row's height still has room for "No Rows To Show".
        autoHeightMinBodyHeight: d.rowHeight
    });
};

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
            cellClass: [
                alignClass,
                isNumber && 'numberCell',
                report.headers.totalColumns?.includes(i) && 'totalColumn'
            ]
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
            // Only text kept to one line (fixedRowHeight) has a tooltip, to read a long description
            // that's cut off. Numbers and dates rarely are, and wrapped text never is. AG Grid only
            // checks whether a cell's text is cut off for cells it draws itself, so a tooltip on
            // every cell showed on every cell.
            tooltipValueGetter:
                fixedRowHeight && !isNumber && !isDate
                    ? p => p.valueFormatted ?? p.value
                    : undefined,
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

// Subtotal and total rows are drawn bold (the totalLine class), a total also on a faint shade.
export const getRowClass = params => {
    switch (params.data?.rowType) {
        case 'Subtotal':
            return 'totalLine subtotalLine';
        case 'Total':
            return 'totalLine grandTotalLine';
        default:
            return undefined;
    }
};

// The grid's own styles: totals in bold, alignment, numbers, wrapped text, and quieter filter icons.
export const gridStyles = density => ({
    // Filter icons only on the header you're pointing at, or one with a filter set. (AG Grid's
    // suppressMenuHide doesn't cover Community's filter button.) Devices that can't hover keep
    // them showing.
    '@media (hover: hover)': {
        '& .ag-header-cell-filter-button': { transition: 'opacity .2s' },
        '& .ag-header-cell:not(.ag-header-cell-filtered):not(:hover):not(:focus-within) .ag-header-cell-filter-button':
            { opacity: 0 }
    },
    '& .totalLine': { fontWeight: 'bolder' },
    // a total on a faint shade; a subtotal is just bold
    '& .grandTotalLine': { bgcolor: 'action.hover' },
    // every digit the same width, so a column of numbers lines up digit by digit
    '& .numberCell': { fontVariantNumeric: 'tabular-nums' },
    '& .totalColumn': { fontWeight: 'bold' },
    '& .align-right': { textAlign: 'right' },
    '& .align-center': { textAlign: 'center' },
    '& .ag-header-cell.align-right .ag-header-cell-label': {
        flexDirection: 'row-reverse'
    },
    '& .ag-header-cell.align-center .ag-header-cell-label': {
        justifyContent: 'center'
    },
    // each further line of a wrapped row adds 1.3 lines' height (18px at 14px text)
    '& .ag-cell-wrap-text': {
        lineHeight: 1.3,
        py: `${densityOf(density).wrapPadding}px`,
        wordBreak: 'break-word'
    }
});
