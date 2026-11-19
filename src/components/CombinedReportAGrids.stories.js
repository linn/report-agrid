import { MemoryRouter } from 'react-router-dom';
import CombinedReportAGrids from './CombinedReportAGrids';
import { makeManyReports, makeReport } from '../fixtures/reports';

const reportData = [
    makeReport(
        'Widgets Report',
        [
            { product: 'Widget A', qty: 10, unitPrice: 4.99, total: 49.9 },
            { product: 'Widget B', qty: 5, unitPrice: 12.0, total: 60.0 }
        ],
        { qty: 15, total: 109.9 }
    ),
    makeReport(
        'Gadgets Report',
        [
            { product: 'Gadget Pro', qty: 2, unitPrice: 99.99, total: 199.98 },
            { product: 'Gadget Lite', qty: 8, unitPrice: 9.99, total: 79.92 }
        ],
        { qty: 10, total: 279.9 }
    )
];

export default {
    title: 'Components/CombinedReportAGrids',
    component: CombinedReportAGrids,
    tags: ['autodocs'],
    decorators: [
        Story => (
            <MemoryRouter>
                <Story />
            </MemoryRouter>
        )
    ],
    args: {
        reportData,
        renderZeroes: false,
        titlesVariant: 'h6',
        showTotals: false,
        openLinksInNewTabs: true,
        fixedRowHeight: false,
        height: 'fill'
    }
};

export const Default = {};

export const WithTotals = { name: 'With totals', args: { showTotals: true } };

// One report per account, as a ledger history gives: the same 150 reports as the ReportAGrids
// "Many reports" stories, to compare scrolling them in one grid.
export const ManyReports = {
    name: 'Many reports (150 accounts)',
    args: { reportData: makeManyReports(150), exportFileName: 'many-reports' }
};

export const ManyReportsFixedRows = {
    name: 'Many reports, fixed row height',
    args: { reportData: makeManyReports(150), fixedRowHeight: true }
};
