export interface CsvPreview {
  rowCount: number
  sample: { sku: string; name: string; onHand: number }[]
}
/** Small RFC-style CSV reader for local preview only, including quoted newlines. */
export function previewCsv(text: string): CsvPreview {
  const rows: string[][] = []
  let row: string[] = [],
    field = '',
    quoted = false,
    closedQuote = false
  const input = text.replace(/^\uFEFF/, '')
  for (let i = 0; i < input.length; i++) {
    const char = input[i]
    if (quoted) {
      if (char === '"' && input[i + 1] === '"') {
        field += '"'
        i++
      } else if (char === '"') {
        quoted = false
        closedQuote = true
      } else field += char
    } else if (char === '"') {
      if (field || closedQuote)
        throw new Error('A quote appears inside an unquoted field. Check the CSV format.')
      quoted = true
    } else if (char === ',' || char === '\n' || char === '\r') {
      row.push(field)
      field = ''
      closedQuote = false
      if (char !== ',') {
        if (row.some((cell) => cell.trim())) rows.push(row)
        row = []
        if (char === '\r' && input[i + 1] === '\n') i++
      }
    } else {
      if (closedQuote)
        throw new Error('Unexpected text after a closing quote. Check the CSV format.')
      field += char
    }
    if (rows.length > 2001) throw new Error('Preview supports up to 2,000 data rows.')
  }
  if (quoted) throw new Error('A quoted field is not closed. Check the CSV format.')
  row.push(field)
  if (row.some((cell) => cell.trim())) rows.push(row)
  if (rows.length < 2) throw new Error('Add a header and at least one item row.')
  if (rows.length > 2001) throw new Error('Preview supports up to 2,000 data rows.')
  const headers = rows.shift()!.map((cell) => cell.trim().toLowerCase())
  const columns = ['sku', 'name', 'onhand'].map((name) => headers.indexOf(name))
  if (columns.some((index) => index < 0)) throw new Error('Required columns: sku, name, onHand.')
  if (new Set(headers).size !== headers.length) throw new Error('Column names must be unique.')
  const ids = new Set<string>()
  const items = rows.map((cells, index) => {
    const sku = cells[columns[0]]?.trim(),
      name = cells[columns[1]]?.trim(),
      rawQuantity = cells[columns[2]]?.trim()
    const onHand = Number(rawQuantity)
    if (
      cells.length !== headers.length ||
      !sku ||
      !name ||
      !rawQuantity ||
      !Number.isSafeInteger(onHand) ||
      onHand < 0
    )
      throw new Error(
        `Row ${index + 2}: provide a SKU, name, and non-negative whole number for onHand.`,
      )
    if (ids.has(sku.toLowerCase())) throw new Error(`Row ${index + 2}: duplicate SKU ${sku}.`)
    ids.add(sku.toLowerCase())
    return { sku, name, onHand }
  })
  return { rowCount: items.length, sample: items.slice(0, 5) }
}
