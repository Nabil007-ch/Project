import { afterEach, expect, it, vi } from 'vitest'
import { createHttpClient } from './http'

afterEach(() => vi.unstubAllGlobals())
it('preserves the API prefix, escapes identifiers, and encodes filters', async () => {
  const fetcher = vi
    .fn()
    .mockImplementation(
      async () => new Response('[]', { headers: { 'Content-Type': 'application/json' } }),
    )
  vi.stubGlobal('fetch', fetcher)
  const api = createHttpClient('https://example.test/api/')
  await api.getItems({ search: 'tea & juice', supplierId: 'sup-01' })
  expect(fetcher.mock.calls[0][0]).toBe(
    'https://example.test/api/items?search=tea+%26+juice&supplierId=sup-01',
  )
  await api.getItemDetail('bev/001')
  expect(fetcher.mock.calls[1][0]).toBe('https://example.test/api/items/bev%2F001')
  await api.updateServiceLevel('bev-001', 99)
  expect(fetcher.mock.calls[2][1]).toMatchObject({
    method: 'PATCH',
    body: '{"serviceLevel":99}',
    headers: { 'Content-Type': 'application/json' },
  })
})
it('converts HTTP errors into safe typed failures', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(new Response('private backend diagnostics', { status: 500 })),
  )
  await expect(createHttpClient('/api').getItems()).rejects.toMatchObject({
    status: 500,
    code: 'HTTP_ERROR',
  })
})
it('handles network and invalid JSON responses', async () => {
  const fetcher = vi
    .fn()
    .mockRejectedValueOnce(new TypeError('fetch failed'))
    .mockResolvedValueOnce(new Response('invalid'))
  vi.stubGlobal('fetch', fetcher)
  const api = createHttpClient('/api')
  await expect(api.getItems()).rejects.toMatchObject({ status: 0, code: 'NETWORK_ERROR' })
  await expect(api.getItems()).rejects.toMatchObject({ code: 'INVALID_RESPONSE' })
})
