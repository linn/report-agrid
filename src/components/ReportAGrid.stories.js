import { MemoryRouter } from 'react-router-dom';
import Typography from '@mui/material/Typography';
import { ReportDataGrid } from '@linn-it/linn-form-components-library';
import ReportAGrid from './ReportAGrid';
import {
    basicRows,
    makeLargeReport,
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
        showTotals: false,
        openLinksInNewTabs: true,
        fixedRowHeight: false,
        showRowCount: false,
        maxRowsWithoutScroll: 100,
        height: '100vh'
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
