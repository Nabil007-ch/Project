import { useRef, useState, type ChangeEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { CheckCircle2, Database, FileSpreadsheet, LockKeyhole, PlugZap } from 'lucide-react'
import { api } from '../../api'
import { useDataSourceStatus } from '../../api/queries'
import { Badge, Button, Card, DataTable, PageHeading, QueryState } from '../../components'
import { ThemeControl } from '../../components/ThemeProvider'
import { previewCsv, type CsvPreview } from '../../lib/csv-preview'
import { downloadCsv } from '../../lib/csv'
import { shortDate } from '../../lib/format'

export function Settings() {
  const query = useDataSourceStatus()
  const test = useMutation({ mutationFn: () => api.testConnection() })
  const [selected, setSelected] = useState<'sample' | 'csv'>('sample')
  const [preview, setPreview] = useState<CsvPreview | null>(null)
  const [fileError, setFileError] = useState('')
  const [reading, setReading] = useState(false)
  const readVersion = useRef(0)
  const fileInput = useRef<HTMLInputElement>(null)
  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    const version = ++readVersion.current
    setPreview(null)
    setFileError('')
    setReading(false)
    if (!file) return
    if (file.size > 1_048_576) {
      setFileError('Choose a CSV smaller than 1 MB.')
      return
    }
    setReading(true)
    try {
      const result = previewCsv(await file.text())
      if (version === readVersion.current) setPreview(result)
    } catch (error) {
      if (version === readVersion.current)
        setFileError(
          error instanceof Error ? error.message : 'The file could not be read. Try another CSV.',
        )
    } finally {
      if (version === readVersion.current) setReading(false)
    }
  }
  return (
    <>
      <PageHeading
        eyebrow="SETTINGS & DATA SOURCE"
        title="Your data. A clear starting point."
        description="Explore sample data safely, check file formats, and set your workspace appearance."
        action={<Badge label="Sample workspace" />}
      />
      <QueryState
        loading={query.isPending}
        error={query.isError}
        empty={!query.data}
        onRetry={() => void query.refetch()}
      >
        {query.data && (
          <>
            <div className="source-banner">
              <span className="icon-tile">
                <Database size={22} />
              </span>
              <div>
                <h2>Sample data is active</h2>
                <p>
                  {query.data.itemCount} beverage items · Snapshot {shortDate(query.data.asOf)},
                  2026 · No live inventory is connected
                </p>
              </div>
              <Badge label="Read-only source" tone="healthy" />
            </div>
            <Card
              title="Choose how to explore"
              description="Source selection below controls the setup preview. All purchasing screens continue to use sample data."
            >
              <fieldset className="source-options">
                <legend className="sr-only">Data-source setup preview</legend>
                <label className={`source-option ${selected === 'sample' ? 'is-selected' : ''}`}>
                  <input
                    type="radio"
                    name="source"
                    value="sample"
                    checked={selected === 'sample'}
                    onChange={() => setSelected('sample')}
                  />
                  <Database size={22} aria-hidden="true" />
                  <strong>Sample data</strong>
                  <span>60 seeded beverage items. No account or connection needed.</span>
                  <Badge label="Active" tone="healthy" />
                </label>
                <label className={`source-option ${selected === 'csv' ? 'is-selected' : ''}`}>
                  <input
                    type="radio"
                    name="source"
                    value="csv"
                    checked={selected === 'csv'}
                    onChange={() => setSelected('csv')}
                  />
                  <FileSpreadsheet size={22} aria-hidden="true" />
                  <strong>CSV upload preview</strong>
                  <span>
                    Check a file in your browser. Preview only; it won’t replace sample data.
                  </span>
                  <Badge label="Local preview" />
                </label>
                <label className="source-option is-disabled">
                  <input
                    type="radio"
                    name="source"
                    value="gp"
                    disabled
                    aria-describedby="gp-note"
                  />
                  <LockKeyhole size={22} aria-hidden="true" />
                  <strong>Microsoft Dynamics GP</strong>
                  <span id="gp-note">
                    Not connected in this prototype. A future backend will provide read-only access;
                    OpsLens will not write orders to GP.
                  </span>
                  <Badge label="Coming later" />
                </label>
              </fieldset>
              {selected === 'sample' ? (
                <div className="connection-test">
                  <div>
                    <h3>Check the sample source</h3>
                    <p>This simulates a connection test. It does not contact Dynamics GP.</p>
                  </div>
                  <Button
                    variant="secondary"
                    busy={test.isPending}
                    icon={<PlugZap size={16} />}
                    onClick={() => test.mutate()}
                  >
                    Test connection
                  </Button>
                </div>
              ) : (
                <div className="csv-panel">
                  <div className="csv-heading">
                    <div>
                      <h3>Check the shape of your CSV</h3>
                      <p>
                        Required columns: <code>sku, name, onHand</code>. Maximum 1 MB and 2,000
                        rows. Files stay in this browser.
                      </p>
                    </div>
                    <Button
                      variant="secondary"
                      onClick={() =>
                        downloadCsv('opslens-sample-template.csv', [
                          ['sku', 'name', 'onHand'],
                          ['DEMO-001', 'Sample Sparkling Water', 24],
                        ])
                      }
                    >
                      Download example
                    </Button>
                  </div>
                  <label className="file-label">
                    Choose CSV for local preview
                    <input
                      ref={fileInput}
                      type="file"
                      accept=".csv,text/csv"
                      onChange={(event) => void handleFile(event)}
                    />
                  </label>
                  {reading && <p role="status">Reading your file…</p>}
                  {fileError && (
                    <div className="inline-error" role="alert">
                      {fileError}
                      <Button variant="ghost" onClick={() => fileInput.current?.click()}>
                        Choose another CSV
                      </Button>
                    </div>
                  )}
                  {preview && (
                    <div>
                      <p className="saved-note" role="status">
                        <CheckCircle2 size={16} /> {preview.rowCount} rows validated. Previewing the
                        first {preview.sample.length}; nothing was imported.
                      </p>
                      <DataTable
                        caption="Local CSV preview — not used for purchasing recommendations"
                        rows={preview.sample}
                        rowKey={(row) => row.sku}
                        rowLabel={(row) => row.name}
                        columns={[
                          { id: 'sku', label: 'SKU', render: (row) => row.sku },
                          { id: 'name', label: 'Item', render: (row) => row.name },
                          {
                            id: 'quantity',
                            label: 'On hand',
                            render: (row) => row.onHand,
                            numeric: true,
                          },
                        ]}
                      />
                    </div>
                  )}
                </div>
              )}
              {selected === 'sample' && test.isSuccess && (
                <p className="saved-note" role="status">
                  <CheckCircle2 size={16} /> {test.data.message}
                </p>
              )}
              {selected === 'sample' && test.isError && (
                <div className="inline-error" role="alert">
                  The simulated request was interrupted.
                  <Button variant="ghost" onClick={() => test.mutate()}>
                    Retry connection test
                  </Button>
                </div>
              )}
            </Card>
            <div className="settings-grid">
              <Card
                title="Workspace appearance"
                description="Follow your device or choose a look that works for you."
              >
                <ThemeControl />
              </Card>
              <Card
                title="Designed for a read-only workflow"
                description="You remain in control of purchasing."
              >
                <p className="input-note">
                  Recommendations are suggestions. CSV exports are review lists. This prototype
                  cannot place orders, edit GP records, or access a live business system.
                </p>
              </Card>
            </div>
          </>
        )}
      </QueryState>
    </>
  )
}
