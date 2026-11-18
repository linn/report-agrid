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

<ReportAGrid report={report} showTotals showExport />
<ReportAGrids reportData={reports} repeatHeaders={false} />
```

Peer dependencies are the same as the component library's: React 19, MUI 9 and react-router 7. A drill-down
link within the app needs the grid to be inside a router, as with `ReportDataGrid`.

### Differences from ReportDataGrid

- No paging: every row in one list. Up to `maxRowsWithoutScroll` rows showing (default 100) the grid
  grows to fit them, with no scrollbar of its own, and the page scrolls. With more it is `height` tall
  (default `100vh`) and scrolls itself, drawing only the rows in view, which keeps thousands of rows
  fast. It goes by the rows showing after search and filters, so a big report searched down to a few
  rows shrinks to fit them. `maxRowsWithoutScroll={Infinity}` always grows to fit (every row is
  drawn, so keep it for reports of hundreds of rows, not thousands).
- The totals row is pinned to the bottom: always in view, and not moved by sorting.
- `showExport` gives a search box and an Export CSV button (no print or column chooser; AG Grid's Excel
  export is in its paid edition).
- Every column can be filtered from its header: dates as dates, numbers as numbers.
- `ReportAGrids` with `repeatHeaders={false}` keeps every report's columns in step with the first, so
  resizing a column or scrolling sideways moves them all.
- The grid takes its font and colours from the MUI theme, but is not identical to the MUI DataGrid.

Extra props on `ReportAGrid`: `maxRowsWithoutScroll`, `height`, and `gridRef` and `alignedGrids` (AG Grid's own, used by
`ReportAGrids`).

## Development

Set up as [react-components-library](https://github.com/linn/react-components-library):

- `npm run storybook`: the stories, including each report beside the library's `ReportDataGrid`
- `npm test`
- `npm run build`

Up the version in package.json before merging to main: CI publishes to npm and deploys the storybook.
