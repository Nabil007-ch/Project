/** Quote CSV cells and neutralize spreadsheet formulas in human-readable fields. */
export function toCsv(rows: (string | number)[][]): string {
  return (
    '\uFEFF' +
    rows
      .map((row) =>
        row
          .map((value) => {
            const text =
              typeof value === 'string' && /^[\s]*[=+@-]/.test(value) ? `'${value}` : String(value)
            return `"${text.replaceAll('"', '""')}"`
          })
          .join(','),
      )
      .join('\r\n')
  )
}
export function downloadCsv(filename: string, rows: (string | number)[][]) {
  const url = URL.createObjectURL(new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.append(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
