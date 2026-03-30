import { useEffect, useState } from 'react'
import { fetchRefunds } from './api'
import { toHuman, toRaw, truncateAddr, copyToClipboard } from './utils'
import type { RefundRequest, SortCol, SortDir } from './types'

const App = () => {
  const [data, setData] = useState<RefundRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [minAmount, setMinAmount] = useState('')
  const [maxAmount, setMaxAmount] = useState('')
  const [sortCol, setSortCol] = useState<SortCol>('refund_amount')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [copiedAddr, setCopiedAddr] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      setData(await fetchRefunds())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleCopy = (addr: string) => {
    copyToClipboard(addr)
    setCopiedAddr(addr)
    setTimeout(() => setCopiedAddr(''), 800)
  }

  const handleSort = (col: SortCol) => {
    if (sortCol === col) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortCol(col)
      setSortDir(col === 'owner_acct' || col === 'funding_record_addr' ? 'asc' : 'desc')
    }
  }

  const filtered = data
    .filter(r => {
      if (search) {
        const s = search.toLowerCase()
        if (!r.owner_acct.toLowerCase().includes(s) && !r.funding_record_addr.toLowerCase().includes(s)) return false
      }
      if (minAmount && r.refund_amount < toRaw(parseFloat(minAmount))) return false
      if (maxAmount && r.refund_amount > toRaw(parseFloat(maxAmount))) return false
      return true
    })
    .sort((a, b) => {
      const av = a[sortCol]
      const bv = b[sortCol]
      if (typeof av === 'string' && typeof bv === 'string') {
        return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
      }
      return sortDir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number)
    })

  const totalRefund = filtered.reduce((s, r) => s + r.refund_amount, 0)
  const totalCommitted = filtered.reduce((s, r) => s + r.committed_amount, 0)
  const uniqueOwners = new Set(filtered.map(r => r.owner_acct)).size

  const sortIcon = (col: SortCol) =>
    sortCol === col ? (sortDir === 'asc' ? ' \u25B2' : ' \u25BC') : ''

  const AddrCell = ({ addr }: { addr: string }) => (
    <td
      className="px-3.5 py-2.5 font-mono text-xs border-t border-[#222] cursor-pointer hover:text-emerald-400 transition-colors"
      title={addr}
      onClick={() => handleCopy(addr)}
    >
      {copiedAddr === addr ? (
        <span className="text-emerald-400">Copied!</span>
      ) : (
        <span className="sm:hidden">{truncateAddr(addr)}</span>
      )}
      {copiedAddr !== addr && (
        <span className="hidden sm:inline">{addr}</span>
      )}
    </td>
  )

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-200 p-4 md:p-6">
      <h1 className="text-xl font-semibold mb-5">Refund Tracker</h1>

      <div className="flex flex-wrap gap-3 mb-5">
        {[
          { label: 'Total Refund', value: `${toHuman(totalRefund)} USDC`, highlight: true },
          { label: 'Total Committed', value: `${toHuman(totalCommitted)} USDC` },
          { label: 'Requests', value: filtered.length },
          { label: 'Unique Owners', value: uniqueOwners },
        ].map(s => (
          <div key={s.label} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-5 py-4 min-w-[160px]">
            <div className="text-[11px] uppercase tracking-wider text-gray-500 mb-1">{s.label}</div>
            <div className={`text-2xl font-semibold tabular-nums ${s.highlight ? 'text-emerald-400' : ''}`}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="text"
          placeholder="Filter by address..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-md px-3 py-2 text-sm text-gray-200 outline-none focus:border-emerald-400 transition-colors w-full sm:w-[360px] placeholder:text-gray-600"
        />
        <input
          type="number"
          placeholder="Min refund"
          value={minAmount}
          onChange={e => setMinAmount(e.target.value)}
          className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-md px-3 py-2 text-sm text-gray-200 outline-none focus:border-emerald-400 transition-colors w-[140px] placeholder:text-gray-600"
        />
        <input
          type="number"
          placeholder="Max refund"
          value={maxAmount}
          onChange={e => setMaxAmount(e.target.value)}
          className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-md px-3 py-2 text-sm text-gray-200 outline-none focus:border-emerald-400 transition-colors w-[140px] placeholder:text-gray-600"
        />
        <button
          onClick={load}
          disabled={loading}
          className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-md px-3.5 py-2 text-sm cursor-pointer hover:border-emerald-400 hover:text-emerald-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {filtered.length < data.length && (
        <div className="text-xs text-gray-500 mb-2">
          Showing {filtered.length} of {data.length} requests
        </div>
      )}

      {error ? (
        <div className="text-red-400 p-4 bg-[#1a1a1a] rounded-lg border border-red-900">{error}</div>
      ) : loading ? (
        <div className="text-center py-10 text-gray-500">Loading...</div>
      ) : (
        <div className="overflow-x-auto rounded-lg">
          <table className="w-full border-collapse bg-[#1a1a1a]">
            <thead className="bg-[#141414]">
              <tr>
                {([
                  ['owner_acct', 'Owner'],
                  ['funding_record_addr', 'Funding Record'],
                  ['committed_amount', 'Committed'],
                  ['refund_amount', 'Refund Amount'],
                ] as [SortCol, string][]).map(([col, label]) => (
                  <th
                    key={col}
                    onClick={() => handleSort(col)}
                    className={`text-left px-3.5 py-2.5 text-[11px] uppercase tracking-wider text-gray-500 font-medium cursor-pointer select-none hover:text-gray-300 whitespace-nowrap ${
                      col === 'committed_amount' || col === 'refund_amount' ? 'text-right' : ''
                    }`}
                  >
                    {label}{sortIcon(col)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.funding_record_addr} className="hover:bg-[#1f1f1f]">
                  <AddrCell addr={r.owner_acct} />
                  <AddrCell addr={r.funding_record_addr} />
                  <td className="px-3.5 py-2.5 text-sm text-right border-t border-[#222] tabular-nums">
                    {toHuman(r.committed_amount)}
                  </td>
                  <td className="px-3.5 py-2.5 text-sm text-right border-t border-[#222] tabular-nums text-emerald-400 font-medium">
                    {toHuman(r.refund_amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default App
