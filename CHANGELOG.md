# Changelog
## [0.1.3] - 2026-11-19
- Optional paging on ReportAGrid and ReportAGrids: pageSize pages the report that many rows at a time, with a page size selector (pageSizeOptions, default 25, 50, 100, 250, 500). Off by default. Search and filters go back to page 1, Export CSV still exports every row, and the totals row (the whole report's) shows on every page.
- The row count (showRowCount) shows the rows the search and filters leave as well as the total, e.g. "Number of rows: 45 of 2,000", with thousands separators. It lines up with the text in the first column rather than being indented.
- showSearch on ReportAGrid and ReportAGrids shows the search on its own. It follows showExport (perReportExport on ReportAGrids) unless given, so reports with showExport keep their search. The search is now an icon that opens into a box when clicked: it closes again when left empty, stays open while it has text, and Escape or × clears and closes it.
- Export CSV is a download icon with an "Export CSV" tooltip, rather than the words.
- Optional Print button: showPrint on ReportAGrid and ReportAGrids. It prints every row (every page, not just the rows in view), without the search box and buttons.
- pinnedColumns on ReportAGrid and ReportAGrids keeps the report's first columns in view when scrolling sideways.
- A column header that is cut off shows its full text in a tooltip. A fixedRowHeight cell's tooltip now shows only when its text is cut off, rather than always.
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
