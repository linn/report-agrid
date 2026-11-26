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
import { alpha } from '@mui/material/styles';

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

// a cell's left and right padding in px at the default density; the row count lines up with the
// text in the first column
export const cellPadding = 8;

// How tightly a grid is drawn (the density prop): its text size, and in px its fixed row height
// (fixedRowHeight), column headings' row, AG Grid's spacing unit, a wrapped cell's top and bottom
// padding and a cell's left and right padding. "comfortable" uses the app theme's body2 text. A wrapped
// row of one line is about as tall as a fixed row. "tight" and "tightest" are for an expert who
// wants as many numbers on screen as can still be read; tightest's rows are striped, to follow one
// across.
export const densities = {
    comfortable: {
        fontSize: null,
        rowHeight: 30,
        headerHeight: 32,
        spacing: 4,
        wrapPadding: 5,
        cellPadding
    },
    standard: {
        fontSize: '13px',
        rowHeight: 28,
        headerHeight: 30,
        spacing: 3,
        wrapPadding: 5,
        cellPadding
    },
    tight: {
        fontSize: '12px',
        rowHeight: 22,
        headerHeight: 24,
        spacing: 2,
        wrapPadding: 2,
        cellPadding: 4
    },
    tightest: {
        fontSize: '11px',
        rowHeight: 20,
        headerHeight: 22,
        spacing: 2,
        wrapPadding: 2,
        cellPadding: 4,
        striped: true
    }
};
export const defaultDensity = 'standard';
export const densityOf = density => densities[density] ?? densities[defaultDensity];

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
        // even comfortable is tighter than ReportDataGrid's density="compact"
        spacing: d.spacing,
        cellHorizontalPadding: d.cellPadding,
        rowHeight: fixedRowHeight ? d.rowHeight : undefined,
        // a faint stripe on every other row, to follow a tight row across
        oddRowBackgroundColor: d.striped ? alpha(muiTheme.palette.text.primary, 0.025) : undefined,
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

// A drill-down link's colour: 'text' (the default) is the cell's own text colour, 'primary' the
// theme's primary (link blue), and anything else a theme palette path ('secondary.dark') or a CSS
// colour, as MUI's sx takes them.
export const linkColorOf = linkColor =>
    ({ text: 'inherit', primary: 'primary.main' })[linkColor] ?? linkColor ?? 'inherit';

// The grid's own styles: totals in bold, alignment, numbers, wrapped text, drill-down links and
// quieter filter icons.
export const gridStyles = (density, fixedRowHeight, linkColor = 'text') => ({
    // Filter icons only on the header you're pointing at, or one with a filter set. (AG Grid's
    // suppressMenuHide doesn't cover Community's filter button.) Devices that can't hover keep
    // them showing.
    '@media (hover: hover)': {
        '& .ag-header-cell-filter-button': { transition: 'opacity .2s' },
        '& .ag-header-cell:not(.ag-header-cell-filtered):not(:hover):not(:focus-within) .ag-header-cell-filter-button':
            { opacity: 0 }
    },
    // AG Grid draws its pinned (totals) rows' container content-box and its cells border-box, but
    // the cells' border-box is a zero-specificity :where() rule. An app's
    // `* { box-sizing: inherit }` (MUI's CssBaseline) beats it, so the cells take content-box from
    // the container and grow by their padding and border, leaving each total to the right of its
    // column. Put them back to border-box.
    '& .ag-grid-pinned-bottom-rows *, & .ag-grid-pinned-top-rows *': {
        boxSizing: 'border-box'
    },
    // Drill-down links read as the report's numbers, not as a page of blue: in the text colour (or
    // linkColor), with a thin, faint underline set a little below the text, so a column of links
    // still lines up and reads easily. Pointing at one darkens its underline and turns it the
    // theme's primary colour, so it's clear what will open. A cell attribute's text colour still
    // wins (DrillDownCell sets it on the link).
    '& .ag-cell a': {
        color: linkColorOf(linkColor),
        textDecorationLine: 'underline',
        textDecorationThickness: '1px',
        textUnderlineOffset: '0.2em',
        textDecorationColor: 'color-mix(in srgb, currentColor 40%, transparent)',
        transition: 'color .15s, text-decoration-color .15s'
    },
    '& .ag-cell a:hover': {
        color: 'primary.main',
        textDecorationColor: 'currentColor'
    },
    '& .ag-cell a:focus-visible': {
        outline: '2px solid',
        outlineColor: 'primary.main',
        outlineOffset: '1px',
        borderRadius: '2px'
    },
    '& .totalLine': { fontWeight: 'bolder' },
    // a total on a faint shade (a stronger one on striped rows); a subtotal is just bold
    '& .grandTotalLine': {
        bgcolor: densityOf(density).striped ? 'action.selected' : 'action.hover'
    },
    // every digit the same width, so a column of numbers lines up digit by digit
    '& .numberCell': { fontVariantNumeric: 'tabular-nums' },
    '& .totalColumn': { fontWeight: 'bold' },
    '& .align-right': { textAlign: 'right' },
    '& .align-center': { textAlign: 'center' },
    // A right-aligned heading sits flush right, over its numbers, with its filter button at the
    // left of the header rather than after the text (as AG Grid's own right-aligned columns have
    // it), so the hidden button leaves no gap at the right.
    '& .ag-header-cell.align-right .ag-cell-label-container': { flexDirection: 'row' },
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
    },
    // When rows wrap, a number or date (which doesn't) is set out like a wrapped cell's first line:
    // AG Grid's own line height is for its default row, not ours, and left the number high in the
    // row and out of line with the text beside it.
    ...(fixedRowHeight
        ? {}
        : {
              '& .ag-cell:not(.ag-cell-wrap-text)': {
                  lineHeight: 1.3,
                  py: `${densityOf(density).wrapPadding}px`
              }
          })
});
