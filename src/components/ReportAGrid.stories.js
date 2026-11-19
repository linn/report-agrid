import { MemoryRouter } from 'react-router-dom';
import Typography from '@mui/material/Typography';
import { ReportDataGrid } from '@linn-it/linn-form-components-library';
import ReportAGrid from './ReportAGrid';
import {
    basicRows,
    makeLargeReport,
    makeWideReport,
    makeReport,
    reportWithColours,
    reportWithDates,
    reportWithDrillDowns,
    rowsWithSubtotal
} from '../fixtures/reports';

// The same stories, on the same reports, as the library's ReportDataGrid, so the two can be compared.

export default {
    title: 'Components/ReportAGrid',
    component: ReportAGrid,
    tags: ['autodocs'],
    decorators: [
        Story => (
            <MemoryRouter>
                <Story />
            </MemoryRouter>
        )
    ],
    args: {
        report: makeReport('Products Report', basicRows),
        renderZeroes: false,
        showHeader: true,
        showExport: false,
        showPrint: false,
        showTotals: false,
        openLinksInNewTabs: true,
        fixedRowHeight: false,
        showRowCount: false,
        maxRowsWithoutScroll: 100,
        height: '100vh',
        pageSize: undefined,
        pinnedColumns: 0
    }
};

export const Default = {};

export const WithTotalColumn = {
    name: 'With total column',
    args: { report: makeReport('Products Report', basicRows, null, [3]) }
};

export const WithTotals = {
    name: 'With totals row',
    args: {
        report: makeReport('Products Report (with totals)', basicRows, { qty: 17, total: 309.88 }),
        showTotals: true
    }
};

export const WithSubtotalRows = {
    name: 'With subtotal row types',
    args: { report: makeReport('Products Summary', rowsWithSubtotal) }
};

export const WithRowCount = { name: 'With row count', args: { showRowCount: true } };

export const WithSearchAndExport = {
    name: 'With search and export',
    args: { showExport: true }
};

export const LongTitleWithSearchAndExport = {
    name: 'Long title with search and export (they move below it, at the right)',
    args: {
        report: makeReport(
            'Products sold by every sales outlet in every territory, by month, for the whole of the last financial year, excluding returns',
            basicRows
        ),
        showExport: true
    }
};

export const WithLinkedTitle = {
    name: 'With a linked title (black, not link blue)',
    args: {
        report: {
            ...makeReport('Products Report (title links somewhere)', basicRows),
            title: {
                displayString: 'Products Report (title links somewhere)',
                drillDowns: [{ href: 'https://www.linn.co.uk' }]
            }
        },
        showExport: true
    }
};

export const WithDrillDowns = {
    name: 'With drill-down links',
    args: { report: reportWithDrillDowns }
};

export const WithColourAttributes = {
    name: 'With colour attributes',
    args: { report: reportWithColours }
};

export const WithDateColumn = {
    name: 'With date column (chronological sort)',
    args: { report: reportWithDates, showExport: true }
};

export const NoHeader = { name: 'No column header', args: { showHeader: false } };

export const FixedRowHeight = { name: 'Fixed row height', args: { fixedRowHeight: true } };

export const RenderZeroes = { name: 'Render zeroes', args: { renderZeroes: true } };

export const LargeReport = {
    name: 'Large report (5,000 rows, one scrolling list; search it down to fewer than 100 and it shrinks)',
    args: {
        report: makeLargeReport(5000),
        showExport: true,
        showRowCount: true,
        fixedRowHeight: true,
        height: '70vh'
    }
};

export const GrowsToFit200Rows = {
    name: '200 rows, no scrollbar of its own (maxRowsWithoutScroll 250)',
    args: {
        report: makeLargeReport(200),
        maxRowsWithoutScroll: 250,
        fixedRowHeight: true,
        showRowCount: true
    }
};

export const Paged = {
    name: 'Paged (2,000 rows, 100 to a page, with a page size selector)',
    args: {
        report: makeLargeReport(2000),
        pageSize: 100,
        showExport: true,
        fixedRowHeight: true
    }
};

export const Print = {
    name: 'Export CSV and Print (Print prints every row, not just the page)',
    args: {
        report: makeLargeReport(300),
        showExport: true,
        showPrint: true,
        pageSize: 100,
        fixedRowHeight: true
    }
};

export const PinnedColumns = {
    name: 'Pinned columns (product and description stay in view; long headers have tooltips)',
    args: {
        report: makeWideReport(40),
        pinnedColumns: 2,
        fixedRowHeight: true,
        showExport: true
    }
};

export const SideBySide = {
    name: 'Side by side with ReportDataGrid',
    render: args => (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
            <div>
                <Typography variant="overline">ReportDataGrid (MUI DataGrid)</Typography>
                <ReportDataGrid {...args} />
            </div>
            <div>
                <Typography variant="overline">ReportAGrid (AG Grid Community)</Typography>
                <ReportAGrid {...args} />
            </div>
        </div>
    ),
    args: {
        report: makeReport('Products Report (with totals)', basicRows, { qty: 17, total: 309.88 }),
        showTotals: true,
        showExport: true,
        showRowCount: true
    }
};
