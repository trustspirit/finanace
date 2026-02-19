import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useProject } from '../contexts/ProjectContext'
import { useRequests } from '../hooks/queries/useRequests'
import { Committee, Receipt } from '../types'
import Layout from '../components/Layout'
import Spinner from '../components/Spinner'
import PageHeader from '../components/PageHeader'
import EmptyState from '../components/EmptyState'
import JSZip from 'jszip'

interface ReceiptRow {
  receipt: Receipt
  requestDate: string
  payee: string
  committee: Committee
  requestId: string
}

export default function ReceiptsPage() {
  const { t } = useTranslation()
  const { currentProject } = useProject()
  const { data: requests = [], isLoading: loading } = useRequests(currentProject?.id)
  const [committeeFilter, setCommitteeFilter] = useState<Committee | 'all'>('all')
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [downloading, setDownloading] = useState(false)

  const rows: ReceiptRow[] = useMemo(() => {
    const result: ReceiptRow[] = []
    for (const req of requests) {
      for (const receipt of req.receipts) {
        result.push({
          receipt,
          requestDate: req.date,
          payee: req.payee,
          committee: req.committee,
          requestId: req.id,
        })
      }
    }
    return result
  }, [requests])

  const filtered = committeeFilter === 'all'
    ? rows
    : rows.filter((r) => r.committee === committeeFilter)

  const allSelected = filtered.length > 0 && selected.size === filtered.length
  const someSelected = selected.size > 0

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set())
    } else {
      setSelected(new Set(filtered.map((_, i) => i)))
    }
  }

  const toggleOne = (index: number) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  // Reset selection when filter changes
  const handleFilterChange = (f: Committee | 'all') => {
    setCommitteeFilter(f)
    setSelected(new Set())
  }

  const handleDownload = async () => {
    if (selected.size === 0) return
    setDownloading(true)

    try {
      const zip = new JSZip()
      const selectedRows = filtered.filter((_, i) => selected.has(i))

      await Promise.all(
        selectedRows.map(async (row, i) => {
          const url = row.receipt.url || row.receipt.driveUrl
          if (!url) return

          try {
            const response = await fetch(url)
            if (!response.ok) return
            const blob = await response.blob()
            const ext = row.receipt.fileName.split('.').pop() || 'jpg'
            const name = `${row.requestDate}_${row.payee}_${i + 1}.${ext}`
            zip.file(name, blob)
          } catch {
            // Skip failed downloads
          }
        })
      )

      const content = await zip.generateAsync({ type: 'blob' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(content)
      const label = committeeFilter === 'all' ? 'all' : t(`committee.${committeeFilter}Short`)
      link.download = `receipts_${label}_${new Date().toISOString().slice(0, 10)}.zip`
      link.click()
      URL.revokeObjectURL(link.href)
    } catch (err) {
      console.error('Download failed:', err)
      alert(t('receipts.downloadFailed'))
    } finally {
      setDownloading(false)
    }
  }

  return (
    <Layout>
      <PageHeader title={t('receipts.title')} />

      <div className="flex flex-wrap items-center gap-2 mb-4">
        {(['all', 'operations', 'preparation'] as const).map((f) => (
          <button key={f} onClick={() => handleFilterChange(f)}
            className={`px-3 py-1 rounded text-sm ${committeeFilter === f ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
            {f === 'all' ? t('status.all') : t(`committee.${f}Short`)}
          </button>
        ))}

        {someSelected && (
          <button onClick={handleDownload} disabled={downloading}
            className="ml-auto px-4 py-1.5 bg-purple-600 text-white rounded text-sm font-medium hover:bg-purple-700 disabled:bg-gray-400 flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {downloading
              ? t('receipts.downloading')
              : t('receipts.downloadZip', { count: selected.size })}
          </button>
        )}
      </div>

      <p className="text-xs text-gray-400 mb-4">
        {t('receipts.totalCount', { count: filtered.length })}
      </p>

      {loading ? (
        <Spinner />
      ) : filtered.length === 0 ? (
        <EmptyState title={t('receipts.noReceipts')} />
      ) : (
        <>
          {/* Desktop table view */}
          <div className="hidden sm:block">
            <div className="bg-white rounded-lg shadow">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 w-10">
                      <input type="checkbox" checked={allSelected} onChange={toggleAll}
                        className="rounded border-gray-300" />
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">{t('field.receipts')}</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">{t('field.payee')}</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">{t('field.date')}</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">{t('field.committee')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map((row, i) => {
                    const imgUrl = row.receipt.url || row.receipt.driveUrl
                    return (
                      <tr key={`${row.requestId}-${i}`}
                        className={`hover:bg-gray-50 ${selected.has(i) ? 'bg-blue-50' : ''}`}>
                        <td className="px-4 py-3">
                          <input type="checkbox" checked={selected.has(i)} onChange={() => toggleOne(i)}
                            className="rounded border-gray-300" />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {imgUrl && (
                              <a href={imgUrl} target="_blank" rel="noopener noreferrer">
                                <img src={imgUrl} alt={row.receipt.fileName}
                                  className="w-10 h-10 object-cover rounded border border-gray-200 bg-gray-50" />
                              </a>
                            )}
                            <a href={imgUrl} target="_blank" rel="noopener noreferrer"
                              className="text-blue-600 hover:underline text-xs truncate max-w-[200px]">
                              {row.receipt.fileName}
                            </a>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-700">{row.payee}</td>
                        <td className="px-4 py-3 text-gray-500">{row.requestDate}</td>
                        <td className="px-4 py-3 text-gray-500">{t(`committee.${row.committee}Short`)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile card view */}
          <div className="sm:hidden space-y-2">
            {filtered.map((row, i) => {
              const imgUrl = row.receipt.url || row.receipt.driveUrl
              return (
                <div key={`${row.requestId}-${i}`}
                  className={`bg-white rounded-lg shadow p-3 flex items-center gap-3 ${selected.has(i) ? 'ring-2 ring-blue-400' : ''}`}
                  onClick={() => toggleOne(i)}>
                  <input type="checkbox" checked={selected.has(i)} onChange={() => toggleOne(i)}
                    onClick={(e) => e.stopPropagation()}
                    className="rounded border-gray-300 shrink-0" />
                  {imgUrl && (
                    <img src={imgUrl} alt={row.receipt.fileName}
                      className="w-12 h-12 object-cover rounded border border-gray-200 bg-gray-50 shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{row.receipt.fileName}</p>
                    <p className="text-xs text-gray-500">{row.payee} &middot; {row.requestDate}</p>
                    <p className="text-xs text-gray-400">{t(`committee.${row.committee}Short`)}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </Layout>
  )
}
