import { MemoryRouter } from 'react-router-dom';
import ReportAGrids from './ReportAGrids';
import { makeLargeReport, makeManyReports, makeReport } from '../fixtures/reports';

const reportData = [
    makeReport('Widgets Report', [
        { product: 'Widget A', qty: 10, unitPrice: 4.99, total: 49.9 },
        { product: 'Widget B', qty: 5, unitPrice: 12.0, total: 60.0 }
    ]),
    makeReport('Gadgets Report', [
        { product: 'Gadget Pro', qty: 2, unitPrice: 99.99, total: 199.98 },
        { product: 'Gadget Lite', qty: 8, unitPrice: 9.99, total: 79.92 }
    ])
];

export default {
    title: 'Components/ReportAGrids',
    component: ReportAGrids,
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
        repeatHeaders: true,
        perReportExport: false,
        openLinksInNewTabs: true,
        showTotals: false,
        fixedRowHeight: false,
        showRowCount: false,
        maxRowsWithoutScroll: 100,
        height: 'fill'
    }
};

export const Default = {};

export const SingleReport = { name: 'Single report', args: { reportData: [reportData[0]] } };

export const WithRowCount = { name: 'With row count', args: { showRowCount: true } };

export const NoRepeatHeaders = {
    name: 'No repeat headers (columns stay in step: resize one)',
    args: { repeatHeaders: false }
};

export const WithExportPerReport = { name: 'Per-report export', args: { perReportExport: true } };

export const LargeReports = {
    name: 'Two large reports (2,000 rows each)',
    args: {
        reportData: [
            makeLargeReport(2000),
            { ...makeLargeReport(2000), title: { displayString: 'Second large report' } }
        ],
        fixedRowHeight: true,
        showRowCount: true,
        height: '50vh'
    }
};

// One report per account, as a ledger history gives: 150 reports of 1 to 220 rows, with wrapped
// descriptions. Compare scrolling these two.
const manyReports = makeManyReports(150);

export const ManyReportsLazy = {
    name: 'Many reports, lazy (150 accounts)',
    args: { reportData: manyReports, lazy: true, perReportExport: true }
};

export const ManyReports = {
    name: 'Many reports, not lazy (150 accounts)',
    args: { reportData: manyReports, perReportExport: true }
};
