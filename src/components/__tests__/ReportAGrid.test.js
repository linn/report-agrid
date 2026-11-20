import '@testing-library/jest-dom';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ReportAGrid from '../ReportAGrid';
import ReportAGrids from '../ReportAGrids';
import { resolveHeight } from '../gridParts';

const cellOf = el => el.closest('[role="gridcell"]');
const rowOf = el => el.closest('[role="row"]');

const makeReport = (totalColumns, results) => ({
    title: { displayString: 'Report' },
    headers: {
        columnHeaders: ['Product', 'Amount'],
        dataGridColumnSpecifications: [
            { columnId: 'product', columnWidth: 200, columnType: 'text' },
            { columnId: 'amount', columnWidth: 130, columnType: 'number', decimalPlaces: 2 }
        ],
        totalColumns
    },
    results: results ?? [
        {
            rowTitle: { displayString: 'row0' },
            rowType: 'Normal',
            values: [
                { displayValue: 'Widget' },
                {
                    displayValue: 12.5,
                    attributes: [
                        { attributeType: 'text-colour', attributeValue: '#b71c1c' },
                        { attributeType: 'background-colour', attributeValue: '#ffcdd2' }
                    ]
                }
            ]
        }
    ],
    totals: { values: [{ displayValue: '' }, { displayValue: 12.5 }] }
});

// the search is an icon until clicked
const searchFor = async text => {
    await userEvent.click(screen.getByRole('button', { name: 'Search' }));
    await userEvent.type(screen.getByRole('textbox', { name: 'Search' }), text);
};

const row = (id, rowType, product, amount) => ({
    rowTitle: { displayString: id },
    rowType,
    values: [{ displayValue: product }, { displayValue: amount }]
});

describe('ReportAGrid cells', () => {
    test('formats numbers and bolds total columns, keeping cell colours', async () => {
        render(<ReportAGrid report={makeReport([1])} />);

        const totalCell = cellOf(await screen.findByText('12.50'));
        expect(totalCell).toHaveClass('totalColumn');
        expect(totalCell).toHaveStyle({ color: '#b71c1c', backgroundColor: '#ffcdd2' });
        expect(cellOf(screen.getByText('Widget'))).not.toHaveClass('totalColumn');
    });

    test('blanks zeroes unless renderZeroes', async () => {
        const results = [row('r', 'Normal', 'Nil', 0)];
        const { unmount } = render(<ReportAGrid report={makeReport([], results)} />);
        await screen.findByText('Nil');
        expect(screen.queryByText('0.00')).not.toBeInTheDocument();
        unmount();

        render(<ReportAGrid report={makeReport([], results)} renderZeroes />);
        expect(await screen.findByText('0.00')).toBeInTheDocument();
    });

    test('bolds Subtotal and Total row types', async () => {
        const results = [row('a', 'Normal', 'A', 1), row('s', 'Subtotal', 'Sub', 1)];
        render(<ReportAGrid report={makeReport([], results)} />);

        expect(rowOf(await screen.findByText('Sub'))).toHaveClass('totalLine', 'subtotalLine');
        expect(rowOf(screen.getByText('Sub'))).not.toHaveClass('grandTotalLine');
        expect(rowOf(screen.getByText('A'))).not.toHaveClass('totalLine');
    });

    test('number cells, and only those, have tabular figures', async () => {
        render(<ReportAGrid report={makeReport([1])} />);

        expect(cellOf(await screen.findByText('12.50'))).toHaveClass('numberCell');
        expect(cellOf(screen.getByText('Widget'))).not.toHaveClass('numberCell');
    });
});

describe('ReportAGrid totals', () => {
    test('pins the totals row to the bottom, bold', async () => {
        render(<ReportAGrid report={makeReport([1])} showTotals />);

        await waitFor(() => expect(screen.getAllByText('12.50')).toHaveLength(2));
        const totalsRow = rowOf(screen.getAllByText('12.50')[1]);
        expect(totalsRow).toHaveClass('totalLine', 'grandTotalLine');
        expect(totalsRow.closest('.ag-grid-pinned-bottom-rows-container')).not.toBeNull();
    });

    test('no totals row without showTotals', async () => {
        render(<ReportAGrid report={makeReport([1])} />);

        expect(await screen.findAllByText('12.50')).toHaveLength(1);
    });
});

const makeDateReport = () => ({
    title: { displayString: 'Report' },
    headers: {
        columnHeaders: ['Date'],
        dataGridColumnSpecifications: [{ columnId: 'date', columnWidth: 200, columnType: 'date' }]
    },
    results: [
        ['a', '02-Nov-2026', '2026-11-02T00:00:00.0000000'],
        ['b', '10-Jan-2026', '2026-01-10T00:00:00.0000000'],
        ['c', '25-Mar-2025', '2025-03-25T00:00:00.0000000']
    ].map(([id, text, sortValue]) => ({
        rowTitle: { displayString: id },
        rowType: 'Normal',
        values: [{ textDisplayValue: text, sortValue }]
    })),
    totals: { values: [{ displayValue: '' }] }
});

const dateColumnOrder = () =>
    Array.from(document.querySelectorAll('.ag-grid-scrolling-container [col-id="date"]')).map(
        c => c.textContent
    );

describe('ReportAGrid date columns', () => {
    test('shows the backend formatted string and sorts chronologically', async () => {
        render(<ReportAGrid report={makeDateReport()} />);
        await screen.findByText('02-Nov-2026');

        const header = screen.getByText('Date');
        await userEvent.click(header);
        await waitFor(() =>
            expect(dateColumnOrder()).toEqual(['25-Mar-2025', '10-Jan-2026', '02-Nov-2026'])
        );

        await userEvent.click(header);
        await waitFor(() =>
            expect(dateColumnOrder()).toEqual(['02-Nov-2026', '10-Jan-2026', '25-Mar-2025'])
        );
    });
});

const linkReport = (href, externalLink) => ({
    title: { displayString: 'Report' },
    headers: {
        columnHeaders: ['Product'],
        dataGridColumnSpecifications: [
            { columnId: 'product', columnWidth: 200, columnType: 'text' }
        ]
    },
    results: [
        {
            rowTitle: { displayString: 'row0' },
            rowType: 'Normal',
            values: [
                {
                    textDisplayValue: 'Widget',
                    drillDowns: [{ href, externalLink }],
                    attributes: [{ attributeType: 'text-colour', attributeValue: '#1565c0' }]
                }
            ]
        }
    ]
});

describe('ReportAGrid drill-downs', () => {
    test('a link within the app uses the router and the cell text colour', async () => {
        render(
            <MemoryRouter>
                <ReportAGrid report={linkReport('/products/widget', false)} />
            </MemoryRouter>
        );

        const link = await screen.findByRole('link', { name: 'Widget' });
        expect(link).toHaveAttribute('href', '/products/widget');
        expect(link).toHaveAttribute('target', '_blank');
        expect(link).toHaveStyle({ color: '#1565c0' });
    });

    test('a link to another app, in the same tab when asked', async () => {
        render(
            <ReportAGrid
                report={linkReport('https://app.linn.co.uk/widget', true)}
                openLinksInNewTabs={false}
            />
        );

        const link = await screen.findByRole('link', { name: 'Widget' });
        expect(link).toHaveAttribute('href', 'https://app.linn.co.uk/widget');
        expect(link).not.toHaveAttribute('target', '_blank');
    });

    test('a cell with no drill-down is plain text, not a link', async () => {
        render(<ReportAGrid report={makeReport([])} />);

        await screen.findByText('Widget');
        expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });
});

describe('ReportAGrid cell tooltips', () => {
    // whether a column's cells have a tooltip, from the grid's own column definitions
    const hasTooltip = async (props, columnId) => {
        const gridRef = { current: null };
        render(<ReportAGrid report={makeReport([])} gridRef={gridRef} {...props} />);
        await screen.findByText('Widget');
        return !!gridRef.current.api.getColumnDef(columnId).tooltipValueGetter;
    };

    test('text kept to one line has a tooltip, to read it when cut off', async () => {
        expect(await hasTooltip({ fixedRowHeight: true }, 'product')).toBe(true);
    });

    test('wrapped text has no tooltip', async () => {
        expect(await hasTooltip({}, 'product')).toBe(false);
    });

    test('numbers have no tooltip, wrapped or not', async () => {
        expect(await hasTooltip({}, 'amount')).toBe(false);
    });

    test('numbers on one line have no tooltip either', async () => {
        expect(await hasTooltip({ fixedRowHeight: true }, 'amount')).toBe(false);
    });

    test('column headers still have their tooltips', async () => {
        const gridRef = { current: null };
        render(<ReportAGrid report={makeReport([])} gridRef={gridRef} />);
        await screen.findByText('Widget');

        expect(gridRef.current.api.getColumnDef('amount').headerTooltip).toBe('Amount');
    });
});

describe('ReportAGrid drawing cells cheaply', () => {
    test('only text wraps: number cells never grow a row', async () => {
        render(<ReportAGrid report={makeReport([])} />);

        expect(cellOf(await screen.findByText('Widget'))).toHaveClass('ag-cell-wrap-text');
        expect(cellOf(screen.getByText('12.50'))).not.toHaveClass('ag-cell-wrap-text');
    });

    test('a cell with no colours of its own gets no inline colours', async () => {
        render(<ReportAGrid report={makeReport([])} />);

        const cell = cellOf(await screen.findByText('Widget'));
        expect(cell.style.color).toBe('');
        expect(cell.style.backgroundColor).toBe('');
    });

    test('switching to fixed rows stops text wrapping', async () => {
        const { rerender } = render(<ReportAGrid report={makeReport([])} />);
        expect(cellOf(await screen.findByText('Widget'))).toHaveClass('ag-cell-wrap-text');

        rerender(<ReportAGrid report={makeReport([])} fixedRowHeight />);
        await waitFor(() =>
            expect(cellOf(screen.getByText('Widget'))).not.toHaveClass('ag-cell-wrap-text')
        );
    });

    test('rowBuffer sets how many rows are drawn beyond those in view', async () => {
        const gridRef = { current: null };
        render(<ReportAGrid report={makeReport([])} rowBuffer={40} gridRef={gridRef} />);

        await screen.findByText('Widget');
        expect(gridRef.current.api.getGridOption('rowBuffer')).toBe(40);
    });
});

describe('ReportAGrid with many rows', () => {
    const manyRows = n =>
        Array.from({ length: n }, (_, i) => row(`r${i}`, 'Normal', `Product ${i}`, i));

    test('is one list, with no paging, and gives the row count', async () => {
        render(<ReportAGrid report={makeReport([], manyRows(250))} showRowCount height="400px" />);

        await screen.findByText('Product 0');
        expect(screen.getByText('Number of rows: 250')).toBeInTheDocument();
        expect(document.querySelector('.ag-paging-panel')).toHaveClass('ag-hidden');
    });

    test('the row count shows how many rows the search and filters leave', async () => {
        render(<ReportAGrid report={makeReport([], manyRows(2000))} showRowCount showExport />);
        await screen.findByText('Product 0');
        expect(screen.getByText('Number of rows: 2,000')).toBeInTheDocument();

        // Product 199, 1199 and 1990 to 1999
        await searchFor('Product 199');
        expect(await screen.findByText('Number of rows: 12 of 2,000')).toBeInTheDocument();

        await userEvent.clear(screen.getByRole('textbox', { name: 'Search' }));
        expect(await screen.findByText('Number of rows: 2,000')).toBeInTheDocument();
    });

    test('paged, the row count is every row the search leaves, not the page', async () => {
        render(
            <ReportAGrid
                report={makeReport([], manyRows(250))}
                showRowCount
                showExport
                pageSize={5}
            />
        );
        await screen.findByText('Product 0');
        expect(screen.getByText('Number of rows: 250')).toBeInTheDocument();

        // Product 24, 124, 224 and 240 to 249: 13 rows, more than the page of 5
        await searchFor('Product 24');
        expect(await screen.findByText('Number of rows: 13 of 250')).toBeInTheDocument();
    });

    test('the search box filters rows', async () => {
        // jsdom has no layout, so the grid only draws its first ten or so rows
        render(<ReportAGrid report={makeReport([], manyRows(8))} showExport />);
        await screen.findByText('Product 3');

        await searchFor('Product 3');

        await waitFor(() => expect(screen.queryByText('Product 2')).not.toBeInTheDocument());
        expect(screen.getByText('Product 3')).toBeInTheDocument();
    });
});

describe('ReportAGrid height', () => {
    const manyRows = n =>
        Array.from({ length: n }, (_, i) => row(`r${i}`, 'Normal', `Product ${i}`, i));
    const layout = () =>
        document.querySelector('.ag-root-wrapper').classList.contains('ag-layout-auto-height')
            ? 'grows to fit'
            : 'scrolls';

    test.each([
        [100, undefined, 'grows to fit'],
        [101, undefined, 'scrolls'],
        [200, 250, 'grows to fit'],
        [200, Infinity, 'grows to fit'],
        [5, 2, 'scrolls']
    ])('%p rows with maxRowsWithoutScroll %p: %s', async (rowCount, max, expected) => {
        render(
            <ReportAGrid report={makeReport([], manyRows(rowCount))} maxRowsWithoutScroll={max} />
        );
        await screen.findByText('Product 0');

        await waitFor(() => expect(layout()).toBe(expected));
    });

    test('goes by the rows showing: a big report searched down to a few grows to fit them', async () => {
        render(<ReportAGrid report={makeReport([], manyRows(500))} showExport />);
        await screen.findByText('Product 0');
        await waitFor(() => expect(layout()).toBe('scrolls'));

        // Product 49 and Product 490 to 499
        await searchFor('Product 49');
        await waitFor(() => expect(layout()).toBe('grows to fit'));

        await userEvent.clear(screen.getByRole('textbox', { name: 'Search' }));
        await waitFor(() => expect(layout()).toBe('scrolls'));
    });

    // jsdom lays nothing out, so these check the CSS height a scrolling grid is given
    test('fill is the window less fillOffset, but at least minFillHeight', () => {
        expect(resolveHeight('fill', 203, 400)).toBe('max(400px, calc(100vh - 203px))');
    });

    test('any other height is used as it is', () => {
        expect(resolveHeight('500px', 203, 400)).toBe('500px');
        expect(resolveHeight('100vh', 203, 400)).toBe('100vh');
    });
});

describe('ReportAGrid paging', () => {
    // jsdom has no layout, so the grid only draws its first ten or so rows: small pages
    const manyRows = n =>
        Array.from({ length: n }, (_, i) => row(`r${i}`, 'Normal', `Product ${i}`, i));
    const pagingPanel = () => document.querySelector('.ag-paging-panel');
    const summary = () =>
        pagingPanel()
            .querySelector('.ag-paging-row-summary-content')
            .textContent.replace(/\s+/g, ' ')
            .trim();

    test('does not page by default', async () => {
        render(<ReportAGrid report={makeReport([], manyRows(25))} />);
        await screen.findByText('Product 0');
        expect(pagingPanel()).toHaveClass('ag-hidden');
    });

    test('pages by pageSize, with next and previous', async () => {
        render(
            <ReportAGrid report={makeReport([], manyRows(25))} pageSize={5} pageSizeOptions={[]} />
        );
        await screen.findByText('Product 4');
        expect(screen.queryByText('Product 5')).not.toBeInTheDocument();
        expect(pagingPanel()).not.toHaveClass('ag-hidden');
        expect(summary()).toBe('1 to 5 of 25');

        await userEvent.click(within(pagingPanel()).getByRole('button', { name: 'Next Page' }));
        expect(await screen.findByText('Product 5')).toBeInTheDocument();
        expect(screen.queryByText('Product 4')).not.toBeInTheDocument();
        expect(summary()).toBe('6 to 10 of 25');

        await userEvent.click(within(pagingPanel()).getByRole('button', { name: 'Previous Page' }));
        expect(await screen.findByText('Product 4')).toBeInTheDocument();
    });

    test('a page of up to maxRowsWithoutScroll grows to fit, a bigger one scrolls', async () => {
        const layout = () =>
            document.querySelector('.ag-root-wrapper').classList.contains('ag-layout-auto-height')
                ? 'grows to fit'
                : 'scrolls';
        const { unmount } = render(
            <ReportAGrid report={makeReport([], manyRows(500))} pageSize={50} />
        );
        await screen.findByText('Product 0');
        await waitFor(() => expect(layout()).toBe('grows to fit'));
        unmount();

        render(<ReportAGrid report={makeReport([], manyRows(500))} pageSize={250} />);
        await screen.findByText('Product 0');
        await waitFor(() => expect(layout()).toBe('scrolls'));
    });

    test('the page size selector starts at pageSize', async () => {
        render(<ReportAGrid report={makeReport([], manyRows(250))} pageSize={75} />);
        await screen.findByText('Product 0');
        expect(
            within(pagingPanel()).getByRole('combobox', { name: 'Page Size' })
        ).toHaveTextContent('75');
        expect(summary()).toBe('1 to 75 of 250');
    });

    test('search goes back to the first page', async () => {
        render(<ReportAGrid report={makeReport([], manyRows(25))} pageSize={5} showExport />);
        await screen.findByText('Product 0');
        await userEvent.click(within(pagingPanel()).getByRole('button', { name: 'Next Page' }));
        await screen.findByText('Product 5');

        // Product 1, 10 to 19 and 21: 12 rows
        await searchFor('Product 1');
        await waitFor(() => expect(summary()).toBe('1 to 5 of 12'));
        expect(screen.getByText('Product 1')).toBeInTheDocument();
    });
});

describe('ReportAGrid toolbar', () => {
    test('Export CSV is an icon button that exports', async () => {
        const gridRef = { current: null };
        render(<ReportAGrid report={makeReport([])} showExport gridRef={gridRef} />);
        await screen.findByText('Widget');
        const spy = jest.spyOn(gridRef.current.api, 'exportDataAsCsv').mockImplementation(() => {});

        await userEvent.click(screen.getByRole('button', { name: 'Export CSV' }));
        expect(spy).toHaveBeenCalledWith({ fileName: 'Report.csv' });
        expect(screen.queryByRole('button', { name: 'Print' })).not.toBeInTheDocument();
    });

    test('Print prints every row, unpaged, then puts the grid back', async () => {
        const rows = Array.from({ length: 25 }, (_, i) =>
            row(`r${i}`, 'Normal', `Product ${i}`, i)
        );
        let layoutWhenPrinted;
        const print = jest.spyOn(window, 'print').mockImplementation(() => {
            const wrapper = document.querySelector('.ag-root-wrapper');
            layoutWhenPrinted = {
                print: wrapper.classList.contains('ag-layout-print'),
                paged: !document.querySelector('.ag-paging-panel').classList.contains('ag-hidden')
            };
        });
        render(<ReportAGrid report={makeReport([], rows)} showPrint pageSize={5} />);
        await screen.findByText('Product 0');
        expect(screen.queryByRole('textbox', { name: 'Search' })).not.toBeInTheDocument();

        await userEvent.click(screen.getByRole('button', { name: 'Print' }));
        await waitFor(() => expect(print).toHaveBeenCalledTimes(1));
        expect(layoutWhenPrinted).toEqual({ print: true, paged: false });
        await waitFor(() =>
            expect(document.querySelector('.ag-root-wrapper')).not.toHaveClass('ag-layout-print')
        );
        expect(document.querySelector('.ag-paging-panel')).not.toHaveClass('ag-hidden');
        print.mockRestore();
    });

    test('pinnedColumns pins the first columns to the left', async () => {
        render(<ReportAGrid report={makeReport([])} pinnedColumns={1} />);
        await screen.findByText('Widget');
        expect(
            cellOf(screen.getByText('Widget')).closest('.ag-grid-pinned-left-cells')
        ).not.toBeNull();
        expect(cellOf(screen.getByText('12.50')).closest('.ag-grid-pinned-left-cells')).toBeNull();
    });
});

describe('ReportAGrid search', () => {
    const search = () => screen.queryByRole('textbox', { name: 'Search' });
    const rows = () =>
        Array.from({ length: 8 }, (_, i) => row(`r${i}`, 'Normal', `Product ${i}`, i));

    test('comes with Export CSV, as a search icon until clicked', async () => {
        render(<ReportAGrid report={makeReport([], rows())} showExport />);
        await screen.findByText('Product 0');
        expect(search()).not.toBeInTheDocument();

        await userEvent.click(screen.getByRole('button', { name: 'Search' }));
        expect(search()).toHaveFocus();
    });

    test('comes with Export CSV by default', async () => {
        render(<ReportAGrid report={makeReport([], rows())} />);
        await screen.findByText('Product 0');
        expect(screen.getByRole('button', { name: 'Search' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Export CSV' })).toBeInTheDocument();
    });

    test('showExport off takes both away', async () => {
        render(<ReportAGrid report={makeReport([], rows())} showExport={false} />);
        await screen.findByText('Product 0');
        expect(screen.queryByRole('button', { name: 'Search' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Export CSV' })).not.toBeInTheDocument();
    });

    test('can be shown without Export CSV, or hidden with it', async () => {
        const { unmount } = render(
            <ReportAGrid report={makeReport([], rows())} showExport={false} showSearch />
        );
        await screen.findByText('Product 0');
        expect(screen.getByRole('button', { name: 'Search' })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Export CSV' })).not.toBeInTheDocument();
        unmount();

        render(<ReportAGrid report={makeReport([], rows())} showExport showSearch={false} />);
        await screen.findByText('Product 0');
        expect(screen.queryByRole('button', { name: 'Search' })).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Export CSV' })).toBeInTheDocument();
    });

    test('closes when left empty, stays open while it has text', async () => {
        render(<ReportAGrid report={makeReport([], rows())} showSearch />);
        await screen.findByText('Product 0');

        await userEvent.click(screen.getByRole('button', { name: 'Search' }));
        await userEvent.tab();
        expect(search()).not.toBeInTheDocument();

        await searchFor('Product 3');
        await userEvent.click(document.body);
        expect(search()).toHaveValue('Product 3');
        await waitFor(() => expect(screen.queryByText('Product 2')).not.toBeInTheDocument());
    });

    test('Escape or × clears it and closes it', async () => {
        render(<ReportAGrid report={makeReport([], rows())} showSearch />);
        await screen.findByText('Product 0');

        await searchFor('Product 3');
        await waitFor(() => expect(screen.queryByText('Product 2')).not.toBeInTheDocument());
        await userEvent.keyboard('{Escape}');
        expect(search()).not.toBeInTheDocument();
        expect(await screen.findByText('Product 2')).toBeInTheDocument();

        await searchFor('Product 3');
        await waitFor(() => expect(screen.queryByText('Product 2')).not.toBeInTheDocument());
        await userEvent.click(screen.getByRole('button', { name: 'Clear search' }));
        expect(search()).not.toBeInTheDocument();
        expect(await screen.findByText('Product 2')).toBeInTheDocument();
    });
});

describe('ReportAGrids', () => {
    const second = () => ({ ...makeReport([]), title: { displayString: 'Second' } });

    test('draws a grid for each report, each with headers', async () => {
        const { container } = render(<ReportAGrids reportData={[makeReport([]), second()]} />);

        await waitFor(() => expect(screen.getAllByText('Widget')).toHaveLength(2));
        expect(container.querySelectorAll('.ag-root-wrapper')).toHaveLength(2);
        expect(within(container).getByText('Second')).toBeInTheDocument();
        container
            .querySelectorAll('.ag-header')
            .forEach(header => expect(header).not.toHaveStyle({ height: '0px' }));
    });

    test('gives each report Export CSV and search by default, or neither with perReportExport off', async () => {
        const { unmount } = render(<ReportAGrids reportData={[makeReport([]), second()]} />);
        await waitFor(() => expect(screen.getAllByText('Widget')).toHaveLength(2));
        expect(screen.getAllByRole('button', { name: 'Export CSV' })).toHaveLength(2);
        expect(screen.getAllByRole('button', { name: 'Search' })).toHaveLength(2);
        unmount();

        render(<ReportAGrids reportData={[makeReport([]), second()]} perReportExport={false} />);
        await waitFor(() => expect(screen.getAllByText('Widget')).toHaveLength(2));
        expect(screen.queryByRole('button', { name: 'Export CSV' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Search' })).not.toBeInTheDocument();
    });

    test('without repeatHeaders, only the first report has headers', async () => {
        const { container } = render(
            <ReportAGrids reportData={[makeReport([]), second()]} repeatHeaders={false} />
        );

        await waitFor(() => expect(screen.getAllByText('Widget')).toHaveLength(2));
        const headers = container.querySelectorAll('.ag-header');
        expect(headers[0]).not.toHaveStyle({ height: '0px' });
        expect(headers[0]).toBeVisible();
        expect(headers[1]).not.toBeVisible();
    });
});

describe('ReportAGrid title and loading', () => {
    test('a linked title keeps the text colour rather than link blue, underlined', async () => {
        const report = {
            ...makeReport([]),
            title: { displayString: 'Linked', drillDowns: [{ href: '/somewhere' }] }
        };
        render(<ReportAGrid report={report} />);

        const link = screen.getByRole('link', { name: 'Linked' });
        expect(link).toHaveAttribute('href', '/somewhere');
        expect(link).toHaveStyle({ color: 'inherit' });
        expect(getComputedStyle(link).textDecoration).toContain('underline');
        await screen.findByText('Widget');
    });

    test('shows a progress bar until the rows are drawn', async () => {
        render(<ReportAGrid report={makeReport([])} />);

        expect(screen.getByRole('progressbar')).toBeInTheDocument();
        await screen.findByText('Widget');
        await waitFor(() => expect(screen.queryByRole('progressbar')).not.toBeInTheDocument());
    });

    test('a report with no rows stops loading too', async () => {
        render(<ReportAGrid report={makeReport([], [])} />);

        await waitFor(() => expect(screen.queryByRole('progressbar')).not.toBeInTheDocument());
    });
});
