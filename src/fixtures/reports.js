// The reports from the library's ReportDataGrid stories, so the two grids can be compared on the same data.

const makeReport = (title, rows, totals = null, totalColumns = []) => ({
    title: { displayString: title },
    headers: {
        columnHeaders: ['Product', 'Qty', 'Unit Price', 'Total'],
        totalColumns,
        dataGridColumnSpecifications: [
            { columnId: 'product', align: 'left', columnWidth: 200, columnType: 'text' },
            {
                columnId: 'qty',
                align: 'right',
                columnWidth: 100,
                columnType: 'number',
                decimalPlaces: 0
            },
            {
                columnId: 'unitPrice',
                align: 'right',
                columnWidth: 130,
                columnType: 'number',
                decimalPlaces: 2
            },
            {
                columnId: 'total',
                align: 'right',
                columnWidth: 130,
                columnType: 'number',
                decimalPlaces: 2
            }
        ]
    },
    results: rows.map((r, i) => ({
        rowTitle: { displayString: `row${i}` },
        rowType: r.rowType || 'Normal',
        values: [
            { displayValue: r.product },
            { displayValue: r.qty },
            { displayValue: r.unitPrice },
            { displayValue: r.total }
        ]
    })),
    totals: totals
        ? {
              values: [
                  { displayValue: '' },
                  { displayValue: totals.qty },
                  { displayValue: '' },
                  { displayValue: totals.total }
              ]
          }
        : null
});

const basicRows = [
    { product: 'Widget A', qty: 10, unitPrice: 4.99, total: 49.9 },
    { product: 'Widget B', qty: 5, unitPrice: 12.0, total: 60.0 },
    { product: 'Gadget Pro', qty: 2, unitPrice: 99.99, total: 199.98 }
];

const rowsWithSubtotal = [
    ...basicRows,
    { product: 'Subtotal', qty: 17, unitPrice: 0, total: 309.88, rowType: 'Subtotal' }
];

const reportWithDrillDowns = {
    title: { displayString: 'Report with drill-downs' },
    headers: {
        columnHeaders: ['Product', 'Qty'],
        dataGridColumnSpecifications: [
            { columnId: 'product', align: 'left', columnWidth: 250, columnType: 'text' },
            {
                columnId: 'qty',
                align: 'right',
                columnWidth: 100,
                columnType: 'number',
                decimalPlaces: 0
            }
        ]
    },
    results: [
        {
            rowTitle: { displayString: 'row0' },
            rowType: 'Normal',
            values: [
                {
                    displayValue: 'Widget A',
                    drillDowns: [{ href: '/products/widget-a', externalLink: false }]
                },
                { displayValue: 10 }
            ]
        },
        {
            rowTitle: { displayString: 'row1' },
            rowType: 'Normal',
            values: [
                {
                    displayValue: 'Widget B',
                    drillDowns: [
                        { href: 'https://example.com/products/widget-b', externalLink: true }
                    ]
                },
                { displayValue: 5 }
            ]
        }
    ],
    totals: null
};

const reportWithColours = {
    title: { displayString: 'Report with colour attributes' },
    headers: {
        columnHeaders: ['Status', 'Count'],
        dataGridColumnSpecifications: [
            { columnId: 'status', align: 'left', columnWidth: 200, columnType: 'text' },
            {
                columnId: 'count',
                align: 'right',
                columnWidth: 120,
                columnType: 'number',
                decimalPlaces: 0
            }
        ]
    },
    results: [
        {
            rowTitle: { displayString: 'row0' },
            rowType: 'Normal',
            values: [
                {
                    displayValue: 'In Stock',
                    attributes: [{ attributeType: 'background-colour', attributeValue: '#c8e6c9' }]
                },
                { displayValue: 150 }
            ]
        },
        {
            rowTitle: { displayString: 'row1' },
            rowType: 'Normal',
            values: [
                {
                    displayValue: 'Low Stock',
                    attributes: [{ attributeType: 'background-colour', attributeValue: '#fff9c4' }]
                },
                { displayValue: 12 }
            ]
        },
        {
            rowTitle: { displayString: 'row2' },
            rowType: 'Normal',
            values: [
                {
                    displayValue: 'Out of Stock',
                    attributes: [
                        { attributeType: 'background-colour', attributeValue: '#ffcdd2' },
                        { attributeType: 'text-colour', attributeValue: '#b71c1c' }
                    ]
                },
                { displayValue: 3 }
            ]
        }
    ],
    totals: null
};

// Dates whose display (alphabetical) order differs from their chronological order, to show that
// sorting the Date column uses the ISO sortValue rather than the display string.
const reportWithDates = {
    title: { displayString: 'Report with a date column' },
    headers: {
        columnHeaders: ['Order', 'Date', 'Total'],
        dataGridColumnSpecifications: [
            { columnId: 'order', align: 'left', columnWidth: 150, columnType: 'text' },
            { columnId: 'date', align: 'left', columnWidth: 160, columnType: 'date' },
            {
                columnId: 'total',
                align: 'right',
                columnWidth: 130,
                columnType: 'number',
                decimalPlaces: 2
            }
        ]
    },
    results: [
        {
            rowTitle: { displayString: 'row0' },
            rowType: 'Normal',
            values: [
                { displayValue: 'ORD-001' },
                { textDisplayValue: '02-Nov-2026', sortValue: '2026-11-02T00:00:00.0000000' },
                { displayValue: 49.9 }
            ]
        },
        {
            rowTitle: { displayString: 'row1' },
            rowType: 'Normal',
            values: [
                { displayValue: 'ORD-002' },
                { textDisplayValue: '10-Jan-2026', sortValue: '2026-01-10T00:00:00.0000000' },
                { displayValue: 60.0 }
            ]
        },
        {
            rowTitle: { displayString: 'row2' },
            rowType: 'Normal',
            values: [
                { displayValue: 'ORD-003' },
                { textDisplayValue: '25-Mar-2025', sortValue: '2025-03-25T00:00:00.0000000' },
                { displayValue: 199.98 }
            ]
        }
    ],
    totals: null
};

const products = ['Widget', 'Gadget', 'Sprocket', 'Flange', 'Grommet', 'Doohickey'];
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const makeLargeReport = rowCount => ({
    title: { displayString: `Large report (${rowCount.toLocaleString('en-GB')} rows)` },
    headers: {
        columnHeaders: ['Product', 'Date', 'Qty', 'Unit Price', 'Total'],
        totalColumns: [4],
        dataGridColumnSpecifications: [
            { columnId: 'product', align: 'left', columnWidth: 200, columnType: 'text' },
            { columnId: 'date', align: 'left', columnWidth: 130, columnType: 'date' },
            {
                columnId: 'qty',
                align: 'right',
                columnWidth: 100,
                columnType: 'number',
                decimalPlaces: 0
            },
            {
                columnId: 'unitPrice',
                align: 'right',
                columnWidth: 130,
                columnType: 'number',
                decimalPlaces: 2
            },
            {
                columnId: 'total',
                align: 'right',
                columnWidth: 130,
                columnType: 'number',
                decimalPlaces: 2
            }
        ]
    },
    results: Array.from({ length: rowCount }, (_, i) => {
        const qty = (i * 7) % 50;
        const unitPrice = ((i * 13) % 200) + 0.99;
        const date = new Date(Date.UTC(2026, 0, 1) + ((i * 37) % 365) * 86400000);
        // dd-MMM-yyyy, the house format (en-GB's short month gives "Sept")
        const month = months[date.getUTCMonth()];
        return {
            rowTitle: { displayString: `row${i}` },
            rowType: 'Normal',
            values: [
                {
                    displayValue: `${products[i % products.length]} ${i + 1}`,
                    drillDowns:
                        i % 10 === 0 ? [{ href: `/products/${i}`, externalLink: false }] : []
                },
                {
                    textDisplayValue: `${String(date.getUTCDate()).padStart(2, '0')}-${month}-${date.getUTCFullYear()}`,
                    sortValue: date.toISOString()
                },
                { displayValue: qty },
                { displayValue: unitPrice },
                {
                    displayValue: qty * unitPrice,
                    attributes:
                        qty * unitPrice > 9000
                            ? [{ attributeType: 'background-colour', attributeValue: '#c8e6c9' }]
                            : []
                }
            ]
        };
    }),
    totals: { values: [{}, {}, { displayValue: 'n/a' }, {}, { displayValue: 0 }] }
});

// Sales by month: a product and a description, then a quantity and value for every month and a
// total, too wide for the screen. Some headers are long, to show their tooltips when cut off.
const makeWideReport = rowCount => {
    const monthColumns = months.flatMap(m => [
        { id: `${m}Qty`, header: `${m} Qty`, decimalPlaces: 0 },
        { id: `${m}Value`, header: `${m} Value (GBP, net of discount)`, decimalPlaces: 2 }
    ]);
    return {
        title: { displayString: `Sales by month (${rowCount} products)` },
        headers: {
            columnHeaders: ['Product', 'Description', ...monthColumns.map(c => c.header), 'Total'],
            totalColumns: [monthColumns.length + 2],
            dataGridColumnSpecifications: [
                { columnId: 'product', align: 'left', columnWidth: 140, columnType: 'text' },
                { columnId: 'description', align: 'left', columnWidth: 220, columnType: 'text' },
                ...monthColumns.map(c => ({
                    columnId: c.id,
                    align: 'right',
                    columnWidth: 110,
                    columnType: 'number',
                    decimalPlaces: c.decimalPlaces
                })),
                {
                    columnId: 'total',
                    align: 'right',
                    columnWidth: 130,
                    columnType: 'number',
                    decimalPlaces: 2
                }
            ]
        },
        results: Array.from({ length: rowCount }, (_, i) => {
            const values = months.flatMap((_m, j) => {
                const qty = (i * 7 + j * 3) % 40;
                return [qty, qty * (((i * 13) % 200) + 0.99)];
            });
            const total = values.filter((_v, k) => k % 2 === 1).reduce((a, b) => a + b, 0);
            return {
                rowTitle: { displayString: `row${i}` },
                rowType: 'Normal',
                values: [
                    { displayValue: `P${String(i + 1).padStart(4, '0')}` },
                    { displayValue: `${products[i % products.length]}, mark ${(i % 5) + 1}` },
                    ...values.map(v => ({ displayValue: v })),
                    { displayValue: total }
                ]
            };
        }),
        totals: { values: [] }
    };
};

export {
    makeWideReport,
    makeLargeReport,
    makeReport,
    basicRows,
    rowsWithSubtotal,
    reportWithDrillDowns,
    reportWithColours,
    reportWithDates
};
