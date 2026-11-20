import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import CombinedReportAGrids from '../CombinedReportAGrids';

const report = (title, rows, { href, totals } = {}) => ({
    title: { displayString: title, drillDowns: href ? [{ href }] : [] },
    headers: {
        columnHeaders: ['Journal', 'Debit'],
        dataGridColumnSpecifications: [
            { columnId: 'journal', columnType: 'text', columnWidth: 120 },
            { columnId: 'debit', columnType: 'number', columnWidth: 120, decimalPlaces: 2 }
        ]
    },
    results: rows.map(([journal, debit]) => ({
        rowTitle: { displayString: journal },
        rowType: 'Normal',
        values: [{ displayValue: journal }, { displayValue: debit }]
    })),
    totals: totals ? { values: [{ displayValue: '' }, { displayValue: totals }] } : null
});

const reports = [
    report(
        '9001 - MADE UP ACCOUNT',
        [
            ['J-ONE', 12.5],
            ['J-TWO', 3]
        ],
        { href: '/accounts/9001', totals: 15.5 }
    ),
    report('9002 - ANOTHER MADE UP', [['J-THREE', 1000]], { totals: 1000 })
];

const renderCombined = props =>
    render(
        <MemoryRouter>
            <CombinedReportAGrids reportData={reports} {...props} />
        </MemoryRouter>
    );

const searchFor = async text => {
    await userEvent.click(screen.getByRole('button', { name: 'Search' }));
    await userEvent.type(screen.getByRole('textbox', { name: 'Search' }), text);
};

describe('CombinedReportAGrids', () => {
    test('draws every report in one grid, each title a row above its rows', async () => {
        renderCombined();

        expect(await screen.findByText('J-THREE')).toBeInTheDocument();
        expect(screen.getByText('J-ONE')).toBeInTheDocument();
        expect(screen.getAllByText('9002 - ANOTHER MADE UP').length).toBeGreaterThan(0);
        expect(document.querySelectorAll('.ag-root-wrapper')).toHaveLength(1);
        expect(document.querySelectorAll('.titleLine')).toHaveLength(2);
    });

    test('puts a blank row between reports, but not after the last', async () => {
        renderCombined();
        await screen.findByText('J-THREE');

        expect(document.querySelectorAll('.spacerLine')).toHaveLength(1);
    });

    test('links a title that has a drill-down', async () => {
        renderCombined();
        await screen.findByText('J-THREE');

        const link = screen
            .getAllByRole('link')
            .find(a => a.textContent === '9001 - MADE UP ACCOUNT');
        expect(link).toHaveAttribute('href', '/accounts/9001');
        expect(link).toHaveAttribute('target', '_blank');
    });

    test('formats numbers by the column', async () => {
        renderCombined();

        expect(await screen.findByText('1,000.00')).toBeInTheDocument();
    });

    test('shows each report its totals, in bold, with showTotals', async () => {
        renderCombined({ showTotals: true });
        await screen.findByText('J-THREE');

        expect(document.querySelectorAll('.totalLine')).toHaveLength(2);
        expect(screen.getByText('15.50').closest('[role="row"]')).toHaveClass('totalLine');
    });

    test('has no totals rows without showTotals', async () => {
        renderCombined();
        await screen.findByText('J-THREE');

        expect(document.querySelectorAll('.totalLine')).toHaveLength(0);
    });

    test('names the report at the top of the view above the grid', async () => {
        renderCombined();
        await screen.findByText('J-THREE');

        await waitFor(() =>
            expect(screen.getByTestId('current-report')).toHaveTextContent('9001 - MADE UP ACCOUNT')
        );
    });

    test('search keeps a matching report, with its title, and drops the others', async () => {
        renderCombined();
        await screen.findByText('J-THREE');

        await searchFor('j-three');

        await waitFor(() => expect(screen.queryByText('J-ONE')).not.toBeInTheDocument());
        expect(screen.getByText('J-THREE')).toBeInTheDocument();
        expect(screen.getAllByText('9002 - ANOTHER MADE UP').length).toBeGreaterThan(0);
        expect(screen.queryByText('9001 - MADE UP ACCOUNT')).not.toBeInTheDocument();
    });

    test('has search and export by default', async () => {
        renderCombined();
        await screen.findByText('J-THREE');

        expect(screen.getByRole('button', { name: 'Search' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Export CSV' })).toBeInTheDocument();
    });

    test('showExport off takes both away, unless showSearch keeps the search', async () => {
        const { unmount } = renderCombined({ showExport: false });
        await screen.findByText('J-THREE');
        expect(screen.queryByRole('button', { name: 'Search' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Export CSV' })).not.toBeInTheDocument();
        unmount();

        renderCombined({ showExport: false, showSearch: true });
        await screen.findByText('J-THREE');
        expect(screen.getByRole('button', { name: 'Search' })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Export CSV' })).not.toBeInTheDocument();
    });

    test('has a density toggle only when asked', async () => {
        const { unmount } = renderCombined();
        await screen.findByText('J-THREE');
        expect(screen.queryByRole('button', { name: 'Tight rows' })).not.toBeInTheDocument();
        unmount();

        renderCombined({ showDensityToggle: true });
        await userEvent.click(await screen.findByRole('button', { name: 'Tight rows' }));
        await userEvent.click(screen.getByRole('button', { name: 'Tightest rows' }));
        expect(screen.getByRole('button', { name: 'Normal rows' })).toBeInTheDocument();
    });

    test('headings can be filtered and sorted', async () => {
        renderCombined();
        await screen.findByText('J-THREE');

        expect(document.querySelectorAll('.ag-header-cell-filter-button').length).toBe(2);
        expect(document.querySelectorAll('.ag-header-cell-sortable').length).toBe(2);
    });

    test('headings can neither sort nor filter, with sortable and filterable off', async () => {
        renderCombined({ sortable: false, filterable: false });
        await screen.findByText('J-THREE');

        expect(document.querySelectorAll('.ag-header-cell-filter-button')).toHaveLength(0);
        expect(document.querySelectorAll('.ag-header-cell-sortable')).toHaveLength(0);
    });

    test('sorting and filtering can be turned off separately', async () => {
        const { unmount } = renderCombined({ sortable: false });
        await screen.findByText('J-THREE');
        expect(document.querySelectorAll('.ag-header-cell-sortable')).toHaveLength(0);
        expect(document.querySelectorAll('.ag-header-cell-filter-button')).toHaveLength(2);
        unmount();

        renderCombined({ filterable: false });
        await screen.findByText('J-THREE');
        expect(document.querySelectorAll('.ag-header-cell-sortable')).toHaveLength(2);
        expect(document.querySelectorAll('.ag-header-cell-filter-button')).toHaveLength(0);
    });

    test('the search still keeps titles with their matches with sorting and filtering off', async () => {
        renderCombined({ sortable: false, filterable: false });
        await screen.findByText('J-THREE');

        await searchFor('j-three');

        await waitFor(() => expect(screen.queryByText('J-ONE')).not.toBeInTheDocument());
        expect(screen.getAllByText('9002 - ANOTHER MADE UP').length).toBeGreaterThan(0);
    });

    test('shows a moving loading bar until the rows are drawn', async () => {
        renderCombined();

        expect(screen.getByRole('progressbar')).toBeInTheDocument();
        await waitFor(() => expect(screen.queryByRole('progressbar')).not.toBeInTheDocument());
    });

    test('with no reports, draws an empty grid and stops loading', async () => {
        renderCombined({ reportData: [] });

        await waitFor(() => expect(screen.queryByRole('progressbar')).not.toBeInTheDocument());
    });
});
