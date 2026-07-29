/**
 * The one table used by all six list pages.
 *
 * columns: [{ key, header, render?, align?, width? }]
 *   render(row) lets a column show a badge or a formatted amount instead of
 *   the raw value.
 * actions(row) returns the buttons for the last column.
 *
 * Keeping this in one component is why every list page looks identical.
 */
export default function DataTable({
  columns,
  rows,
  actions,
  loading,
  emptyTitle = 'Nothing here yet',
  emptyText = 'Records you add will appear in this table.',
  rowKey = (row, i) => row.id ?? i,
}) {
  if (loading) {
    return (
      <div className="state">
        <div className="spinner" />
        <div style={{ marginTop: 10 }}>Loading…</div>
      </div>
    )
  }

  if (!rows || rows.length === 0) {
    return (
      <div className="state">
        <div className="state-icon">◻</div>
        <div className="state-title">{emptyTitle}</div>
        <div>{emptyText}</div>
      </div>
    )
  }

  return (
    <div className="table-scroll">
      <table className="data">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} className={c.align === 'right' ? 'num' : undefined} style={c.width ? { width: c.width } : undefined}>
                {c.header}
              </th>
            ))}
            {actions && <th style={{ textAlign: 'right' }}>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={rowKey(row, i)}>
              {columns.map((c) => (
                <td key={c.key} className={c.align === 'right' ? 'num' : undefined}>
                  {c.render ? c.render(row) : (row[c.key] ?? <span className="cell-sub">—</span>)}
                </td>
              ))}
              {actions && <td className="actions">{actions(row)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
