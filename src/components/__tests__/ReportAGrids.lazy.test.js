import '@testing-library/jest-dom';
import { act, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ReportAGrids, { estimateReportHeight } from '../ReportAGrids';

// jsdom has neither observer, so these stand-ins let each test say which reports are near the
// screen and what size a drawn report is
let intersectionObservers;
let resizeObservers;

beforeEach(() => {
    intersectionObservers = [];
    resizeObservers = [];
    global.IntersectionObserver = class {
        constructor(callback, options) {
            this.callback = callback;
            this.options = options;
            intersectionObservers.push(this);
        }

        observe(element) {
            this.element = element;
        }

        disconnect() {}
    };
    global.ResizeObserver = class {
        constructor(callback) {
            this.callback = callback;
            resizeObservers.push(this);
        }

        observe(element) {
            this.element = element;
        }

        disconnect() {}
    };
});

// the reports' observers in page order
const setNear = (index, near) =>
    act(() => intersectionObservers[index].callback([{ isIntersecting: near }]));

const report = (title, rowCount) => ({
    title: { displayString: title },
    headers: {
        columnHeaders: ['Product', 'Amount'],
        dataGridColumnSpecifications: [
            { columnId: 'product', columnWidth: 200, columnType: 'text' },
            { columnId: 'amount', columnWidth: 130, columnType: 'number', decimalPlaces: 2 }
        ]
    },
    results: Array.from({ length: rowCount }, (_, i) => ({
        rowTitle: { displayString: `r${i}` },
        rowType: 'Normal',
        values: [{ displayValue: `${title} item ${i}` }, { displayValue: i }]
    }))
});

const reports = [report('First made up', 2), report('Second made up', 3)];

const renderLazy = props =>
    render(
        <MemoryRouter>
            <ReportAGrids reportData={reports} lazy {...props} />
        </MemoryRouter>
    );

const gridCount = () => document.querySelectorAll('.ag-root-wrapper').length;

describe('ReportAGrids lazy', () => {
    test('shows each report as its title only, until it is near the screen', () => {
        renderLazy();

        expect(screen.getByText('First made up')).toBeInTheDocument();
        expect(screen.getByText('Second made up')).toBeInTheDocument();
        expect(gridCount()).toBe(0);
    });

    test('draws a report once it is near the screen, and only that one', async () => {
        renderLazy();
        setNear(1, true);

        expect(await screen.findByText('Second made up item 2')).toBeInTheDocument();
        expect(gridCount()).toBe(1);
        expect(screen.queryByText('First made up item 0')).not.toBeInTheDocument();
    });

    test('takes a report away again once it is far from the screen', async () => {
        renderLazy();
        setNear(0, true);
        await screen.findByText('First made up item 1');

        setNear(0, false);
        await waitFor(() => expect(gridCount()).toBe(0));
        expect(screen.getByText('First made up')).toBeInTheDocument();
    });

    test('keeps a report the height it was drawn at once it is taken away', async () => {
        const { container } = renderLazy();
        setNear(0, true);
        await screen.findByText('First made up item 1');
        // AG Grid has observers of its own: this is the one watching the first report as a whole
        const reportObserver = resizeObservers.find(
            o => o.element?.parentElement === container && o.element === container.firstChild
        );
        act(() => reportObserver.callback([{ contentRect: { height: 321 } }]));

        setNear(0, false);
        await waitFor(() => expect(gridCount()).toBe(0));
        expect(screen.getByText('First made up').parentElement).toHaveStyle({ height: '321px' });
    });

    test('looks for reports within lazyMargin above and below the screen', () => {
        renderLazy({ lazyMargin: '50%' });

        expect(intersectionObservers[0].options.rootMargin).toBe('50% 0px');
    });

    test('is off by default: every report is drawn straight away', async () => {
        render(
            <MemoryRouter>
                <ReportAGrids reportData={reports} />
            </MemoryRouter>
        );

        expect(await screen.findByText('Second made up item 2')).toBeInTheDocument();
        expect(gridCount()).toBe(2);
        expect(intersectionObservers).toHaveLength(0);
    });
});

describe('estimateReportHeight', () => {
    const options = {
        fixedRowHeight: true,
        density: 'compact',
        showHeader: true,
        showTotals: false,
        maxRowsWithoutScroll: 100,
        height: 'fill'
    };

    beforeEach(() => {
        window.innerHeight = 1000;
    });

    test('a report that grows to fit: title, header, rows, scrollbar and the gap below', () => {
        // 40 + 32 + 10 rows of 30 + 16 + 24
        expect(estimateReportHeight(report('Made up', 10), options)).toBe(412);
    });

    test('uses the rows drawn so far when it has them', () => {
        expect(estimateReportHeight(report('Made up', 10), { ...options, rowHeight: 50 })).toBe(
            612
        );
    });

    test('dense, the default: shorter rows and column headings', () => {
        // 40 + 28 + 10 rows of 26 + 16 + 24
        expect(
            estimateReportHeight(report('Made up', 10), { ...options, density: undefined })
        ).toBe(368);
    });

    test('tightest: shortest', () => {
        // 40 + 22 + 10 rows of 20 + 16 + 24
        expect(
            estimateReportHeight(report('Made up', 10), { ...options, density: 'tightest' })
        ).toBe(302);
    });

    test('tight: shorter still', () => {
        // 40 + 24 + 10 rows of 22 + 16 + 24
        expect(estimateReportHeight(report('Made up', 10), { ...options, density: 'tight' })).toBe(
            324
        );
    });

    test('a report that scrolls is its fill height, the window less fillOffset', () => {
        // 40 + (1000 - 203) + 24
        expect(estimateReportHeight(report('Made up', 150), options)).toBe(861);
    });

    test('a report that scrolls is a set height in px or vh as given', () => {
        expect(estimateReportHeight(report('Made up', 150), { ...options, height: '500px' })).toBe(
            564
        );
        expect(estimateReportHeight(report('Made up', 150), { ...options, height: '50vh' })).toBe(
            564
        );
    });

    test('paged, a report is at most a page of rows, with the pager', () => {
        // 40 + 32 + 20 rows of 30 + 16 + 48 + 24
        expect(estimateReportHeight(report('Made up', 150), { ...options, pageSize: 20 })).toBe(
            760
        );
    });
});
