# Report AGrid

`ReportAGrid` and `ReportAGrids`: Linn reports drawn with [AG Grid Community](https://www.ag-grid.com/) (MIT licence).

They take the same props as `ReportDataGrid` and `ReportDataGrids` in
[@linn-it/linn-form-components-library](https://github.com/linn/react-components-library), so an app
switches by changing its import. The difference is that a report of any length is one scrolling list:
`ReportDataGrid` uses the free MUI DataGrid, which pages at 100 rows.

AG Grid is its own package, rather than part of the component library, because it is large (about
230 KB gzipped in an app's bundle). Only apps that draw reports with it should carry it.

## Usage

```
npm i @linn-it/report-agrid
```

```js
import { ReportAGrid, ReportAGrids } from '@linn-it/report-agrid';

<ReportAGrid report={report} showTotals />
<ReportAGrids reportData={reports} repeatHeaders={false} />
```

Peer dependencies are the same as the component library's: React 19, MUI 9 and react-router 7. A drill-down
link within the app needs the grid to be inside a router, as with `ReportDataGrid`.

### Differences from ReportDataGrid

- No paging by default: every row in one list. Up to `maxRowsWithoutScroll` rows showing (default 100) the grid
  grows to fit them, with no scrollbar of its own, and the page scrolls. With more it is `height` tall
  and scrolls itself, drawing only the rows in view, which keeps thousands of rows
  fast. It goes by the rows showing after search and filters, so a big report searched down to a few
  rows shrinks to fit them. `maxRowsWithoutScroll={Infinity}` always grows to fit (every row is
  drawn, so keep it for reports of hundreds of rows, not thousands).
- `height` defaults to `"fill"`: as tall as the window less `fillOffset` (default 203px, room for the
  report's title above the grid), so the title, the column headings and the last row are all on
  screen at once, but never under `minFillHeight` (default 400px). It follows the window as it's
  resized. Any CSS height (`"600px"`, `"100vh"`) is used as it is.
- Paging is there if you want it: `pageSize={100}` pages the report 100 rows at a time, with a page size
  selector of `pageSizeOptions` (default 25, 50, 100, 250, 500; `pageSize` is added if it isn't one).
  Search and filters cover every row and go back to page 1; Export CSV exports every row, not just the
  page; the totals row shows on every page and is the whole report's. A page that fits within
  `maxRowsWithoutScroll` grows to fit; a bigger one is `height` tall and scrolls.
- The totals row is pinned to the bottom: always in view, and not moved by sorting.
- `showExport` (on by default; `perReportExport` on `ReportAGrids`) gives an Export CSV icon button (no column chooser; AG Grid's Excel export is in its
  paid edition) and, unless `showSearch={false}`, a search. `showSearch` on its own gives the search
  without export. The search is an icon that opens into a box when clicked: it closes again when left
  empty, stays open while it has text, and Escape or × clears it.
- `showPrint` (off by default) gives a Print icon button, which prints every row (all pages, not just
  the rows in view) and leaves the search and buttons off the printout.
- `showRowCount` shows the rows left by the search and filters too: "Number of rows: 45 of 2,000".
- `pinnedColumns={n}` keeps the report's first n columns in view when scrolling sideways.
- A column header that is cut off shows its full text in a tooltip, as does a cut-off cell that
  doesn't wrap: every cell with `fixedRowHeight`, and number and date cells always.
- Only text wraps onto more lines: number and date cells stay on one, so they never make a row taller.
- `rowBuffer` (default 10, AG Grid's own) is how many rows are drawn beyond those in view, above and
  below, so they're ready before they scroll in.
- Every column can be filtered from its header: dates as dates, numbers as numbers.
- `ReportAGrids` with `repeatHeaders={false}` keeps every report's columns in step with the first, so
  resizing a column or scrolling sideways moves them all.
- `ReportAGrids` with `lazy` (off by default) draws a report's grid only while it is near the
  screen, within `lazyMargin` above or below it (default `"150%"`, a screen and a half), and shows
  just its title otherwise. Use it for many reports at once, such as one per account: without it
  every report's grid is drawn when the page opens, and hundreds of them make the page slow to open
  and to scroll. A report keeps its place on the page while it isn't drawn: its height is estimated
  until it has been drawn, from the rows drawn so far, then is the height it was drawn at. Its
  trade-offs:
  - A grid taken away and drawn again starts afresh: its search, sort and filters are cleared.
  - The browser's own find (Ctrl+F) and printing the page only see the reports drawn at the time.
    Each report's own Print button prints all of that report.
  - With `repeatHeaders={false}`, only the grids drawn at the time keep their columns in step.
- The grid takes its font and colours from the MUI theme, but is not identical to the MUI DataGrid.

### CombinedReportAGrids

`CombinedReportAGrids` takes the same `reportData` as `ReportAGrids` (the "s": many reports), but draws
them all as one grid: each report's title is a full-width row, then its rows, its totals (with
`showTotals`) and a blank row before the next. As one grid, only the rows in view are ever drawn, so
it stays quick however many reports or rows there are, and scrolls as one list under one set of
column headings.

```jsx
import { CombinedReportAGrids } from '@linn-it/report-agrid';

<CombinedReportAGrids reportData={reports} />;
```

- The reports should share their columns, as a multi-report endpoint's do: the first report's are
  used.
- A bar above the grid names the report at the top of the view, so you know where you are once its
  title row has scrolled away.
- Export CSV and a search are on by default, as on `ReportAGrid`. Export CSV exports the whole grid as one CSV, each title in the first column and a blank
  line between reports. The search covers every report, and keeps each report's title and totals
  with its matching rows. `showExport={false}` takes both away; `showSearch` (following
  `showExport` unless given) keeps or drops the search on its own.
- Column headings sort and filter every row in the grid, titles and blank rows included, so those
  can move or drop out while a sort or filter is on.
- `height` is `"fill"` by default: the window less `fillOffset` (default 155px, room for the bar),
  at least `minFillHeight`.
- Not here, as they're one report's: per-report search, export and print, paging, the row count and
  pinned totals rows.

Its props: `reportData`, `renderZeroes`, `titlesVariant`, `showTotals`, `openLinksInNewTabs`,
`fixedRowHeight`, `showExport`, `showSearch`, `exportFileName`, `height`, `fillOffset`,
`minFillHeight`, `rowBuffer`, `pinnedColumns`, `titleRowHeight` and `spacerRowHeight`.

### Which to use

- One report: `ReportAGrid`.
- A few reports, or each wanting its own search, export or paging: `ReportAGrids`.
- Many reports, such as one per account: `ReportAGrids` with `lazy` to keep a grid per report, or
  `CombinedReportAGrids` for one list.

Extra props on `ReportAGrid` and `ReportAGrids`: `maxRowsWithoutScroll`, `height`, `fillOffset`,
`minFillHeight`, `pageSize`,
`pageSizeOptions`, `pinnedColumns`, `rowBuffer`, `showSearch` and `showPrint`. On `ReportAGrids`
only: `lazy` and `lazyMargin`. On `ReportAGrid` only: `gridRef` and `alignedGrids` (AG Grid's own, used by
`ReportAGrids`).

## Development

Set up as [react-components-library](https://github.com/linn/react-components-library):

- `npm run storybook`: the stories, including each report beside the library's `ReportDataGrid`
- `npm test`
- `npm run build`

Up the version in package.json before merging to main: CI publishes to npm and deploys the storybook.
