export default function Table({ columns, rows }) {
  const colSpan = columns.length;

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td className="empty-row" colSpan={colSpan}>
                No records found.
              </td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <tr key={`${row[0]}-${index}`}>
                {row.map((cell, cellIndex) => (
                  <td key={`${index}-${cellIndex}`}>{cell}</td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}