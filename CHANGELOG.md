# Changelog
## [0.8.1] - 2026-11-23
- "standard" density has a little more room around its text: 28px rows (was 26px), 30px column headings (was 28px), and 5px above and below a wrapped cell's text (was 4px). Text is still 13px.
- When rows wrap (fixedRowHeight off), numbers and dates now sit centred in the row, in line with the text beside them; they sat about 2px high, on AG Grid's own line height.
## [0.8.0] - 2026-11-20
- The density options are renamed so the default says so: "dense" is now "standard" (still the default) and "compact" is now "comfortable" (14px text, 30px rows, looser than the default). "tight" and "tightest" are unchanged. An unknown density, an old name included, is drawn as standard.
- The density toggle steps through all four densities (comfortable, standard, tight, tightest, and round again), starting from the grid's density, rather than only the grid's density, tight and tightest. Its tooltip names the next one: "Comfortable rows", "Standard rows", "Tight rows" or "Tightest rows".
## [0.7.0] - 2026-11-20
- density defaults to "dense" (13px text, 26px rows, 28px column headings) rather than "compact". Pass density="compact" to keep the 0.6.0 look.
- density="tight" and density="tightest", for an expert who wants as many numbers on screen as can still be read. Tight: 12px text, 22px rows, 24px column headings and 4px cell padding. Tightest: 11px text, 20px rows and 22px column headings, with faintly striped rows to follow one across; a total row's shade is stronger there, to stand out from the stripes.
- showDensityToggle (off by default) on all three grids: a button by the search that steps through the grid's density, "tight" and "tightest", then back (a grid given tight or tightest steps through those and the default). The grid keeps its search, sort, filters and scroll as it steps.
- A right-aligned column's heading sits flush right over its numbers, with its filter button at the left of the header (as AG Grid's own right-aligned columns have it), so the hidden button no longer leaves a gap after the text.
- A change of density no longer makes a new grid: its rows are measured again instead, so a sort or filter set on it stays.
## [0.6.0] - 2026-11-20
- density on all three grids: "compact" (the default, as before) or "dense", with 13px text, 26px rows (fixedRowHeight), 28px column headings and less padding, for more on screen at once.
- Numbers use tabular figures (every digit the same width), so a column of numbers lines up digit by digit.
- Total rows stand apart more from subtotals: both are still bold, and a total row (the pinned totals, or a report's totals in CombinedReportAGrids) is now on a faint shade.
- Tighter: column headings are 32px tall rather than 36px, and wrapped text has a line height of 1.3 rather than 1.5, so each further line of a wrapped row adds 18px rather than 21px. A wrapped row of one line is about as tall as before.
## [0.5.0] - 2026-11-19
- sortable and filterable on CombinedReportAGrids (both on by default): off, the column headings don't sort or filter. Sorting and filtering act on every row, titles included, so a row that doesn't say which report it's from (an opening balance, say) can end up away from its title and unidentifiable; these let a report rule that out. The search still keeps each title with its matching rows.
- Fewer cell tooltips: only text cells with fixedRowHeight have one, to read a long description that's cut off. Since 0.2.0 every number and date cell, and every cell with fixedRowHeight, had one, and they showed on every cell rather than only when the text was cut off (AG Grid only checks that for cells it draws itself). Column header tooltips are unchanged.
## [0.4.0] - 2026-11-19
- CombinedReportAGrids: the same reportData as ReportAGrids, drawn as one grid. Each report's title is a full-width row, then its rows, its totals (with showTotals) and a blank row before the next, so only the rows in view are ever drawn however many reports there are. A bar above the grid names the report at the top of the view. Export CSV and a search are on by default, each covering every report (the search keeps each title and its totals with its matching rows); showExport={false} takes them away. Column headings sort and filter every row, titles included. height defaults to "fill", allowing 155px for the bar. The reports should share their columns; the first report's are used.
- Export CSV and search are on by default everywhere: showExport on ReportAGrid and perReportExport on ReportAGrids now default to true (search follows them unless showSearch is given). This differs from ReportDataGrid; pass showExport={false} or perReportExport={false} for a report without them.
- README: which of the three to use.
## [0.3.0] - 2026-11-19
- lazy on ReportAGrids (off by default): a report's grid is drawn only while it is near the screen (within lazyMargin, default "150%", above or below it), with just its title otherwise, so a page of hundreds of reports opens and scrolls quickly. A report keeps its place on the page while it isn't drawn: its height is estimated from the rows drawn so far until it has been drawn, then is the height it was drawn at. A grid drawn again starts afresh (search, sort and filters cleared), and the browser's own find and page printing only see the reports drawn at the time.
- New stories: 150 reports of one per account, lazy and not, to compare.
## [0.2.0] - 2026-11-19
- Long reports draw and scroll faster, with the same look:
  - A cell is only drawn by React when it has a drill-down link; every other cell is plain text drawn by AG Grid.
  - Each number column's format is made once, not for every cell.
  - Only text wraps: number and date cells stay on one line, so AG Grid no longer measures them to size a row. A number or date cut off by a narrow column now shows its full value in a tooltip.
  - A cell with no colours of its own gets no inline style.
  - With fixedRowHeight, columns out of view sideways are drawn as they scroll in (with wrapped rows every column is still drawn, as AG Grid measures row heights from the cells it has drawn).
- rowBuffer on ReportAGrid and ReportAGrids (default 10, AG Grid's own): how many rows are drawn beyond those in view, above and below.
- height now defaults to "fill" rather than 100vh: a grid with more than maxRowsWithoutScroll rows is as tall as the window less fillOffset (default 203px, room for its title), never under minFillHeight (default 400px), so its title, column headings and last row are all on screen at once. Before, a 100vh grid plus its title was taller than the window. Any CSS height still works as before.
- The loading bar keeps moving while the grid draws its rows. MUI's LinearProgress is animated on the same thread AG Grid draws on, so it crawled just when it showed; the new bar moves by transform, which the browser animates on its own, and sweeps once a second.
- Switching fixedRowHeight on a grid already drawn makes a new grid, as AG Grid only reads whether to draw columns out of view when a grid is made.
## [0.1.4] - 2026-11-19
- Internal: ReportAGrid is split into smaller files, with no change in behaviour or API. How a report becomes a grid (modules, theme, columns, rows, styles) is in gridParts.js, the title tools and icons (search, export, print) in GridTools.js, and the drill-down link cell in DrillDownCell.js, so a grid that draws many reports at once can share them. None of these are exported from the package.
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
