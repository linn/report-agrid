# Changelog
## [0.1.3] - 2026-11-19
- Optional paging on ReportAGrid and ReportAGrids: pageSize pages the report that many rows at a time, with a page size selector (pageSizeOptions, default 25, 50, 100, 250, 500). Off by default. Search and filters go back to page 1, Export CSV still exports every row, and the totals row (the whole report's) shows on every page.
## [0.1.2] - 2026-11-18
- A title that links somewhere is drawn in the title's own colour, not link blue, with a grey underline. On hover the underline darkens and an icon appears after the title (open-in-new when links open in new tabs, otherwise a link). This differs from ReportDataGrid.
- A progress bar shows while the grid draws its first rows, instead of the title above an empty grid.
- A column's filter icon shows only while you point at its header, or when it has a filter set, so the headers are quieter. Touch screens still show them all.
- Search and Export CSV are smaller and greyer, on the title's line at the right, and the title sits directly above the grid.
## [0.1.1] - 2026-11-17
- Fix the gap above the totals row on a short report: AG Grid kept the rows area at least 150px tall, whatever the rows. It's now at least one row tall, which still has room for "No Rows To Show".
- The Export CSV button is no longer in capitals.
- Add maxRowsWithoutScroll to ReportAGrid and ReportAGrids (default 100): up to this many rows showing, the grid grows to fit them and the page scrolls; with more, it is `height` tall and scrolls itself. It was fixed at under 100. Infinity always grows to fit.
- The grid's height goes by the rows showing after search and filters, not the report's total, so a big report searched down to a few rows shrinks to fit them rather than leaving blank space.
## [0.1.0] - 2026-11-17
- ReportAGrid: ReportDataGrid's props and features, drawn with AG Grid Community 36.3.0, so a report of any length is one scrolling list rather than 100-row pages. The totals row is pinned to the bottom (it isn't moved by sorting), every column has a filter, and showExport gives a search box and CSV export.
- ReportAGrids: ReportDataGrids for ReportAGrid. Without repeatHeaders, every report keeps its columns in step with the first.
