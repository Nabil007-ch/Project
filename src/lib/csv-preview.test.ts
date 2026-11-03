import { expect, it } from 'vitest'
import { previewCsv } from './csv-preview'
it('reads quoted commas, newlines, escaped quotes and a UTF-8 BOM', () => {
  expect(
    previewCsv('\uFEFFsku,name,onHand\r\nA,"Water, sparkling",24\r\nB,"Tea ""peach""\niced",0'),
  ).toEqual({
    rowCount: 2,
    sample: [
      { sku: 'A', name: 'Water, sparkling', onHand: 24 },
      { sku: 'B', name: 'Tea "peach"\niced', onHand: 0 },
    ],
  })
})
it('rejects missing columns, duplicate SKUs, unclosed quotes and invalid quantities', () => {
  for (const text of [
    'sku,name\na,tea',
    'sku,name,onHand\na,tea,-1',
    'sku,name,onHand\na,tea,1\nA,water,2',
    'sku,name,onHand\na,"tea,1',
    'sku,name,onHand\na,tea,1.2',
  ])
    expect(() => previewCsv(text)).toThrow()
})
