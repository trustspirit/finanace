import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { collection, getDocs, orderBy, query } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { formatFirestoreDate } from '../lib/utils'
import { Settlement } from '../types'
import Layout from '../components/Layout'
import Spinner from '../components/Spinner'
import EmptyState from '../components/EmptyState'
import PageHeader from '../components/PageHeader'

export default function SettlementListPage() {
  const [settlements, setSettlements] = useState<Settlement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      try {
        const q = query(collection(db, 'settlements'), orderBy('createdAt', 'desc'))
        const snap = await getDocs(q)
        setSettlements(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Settlement)))
      } catch (error) {
        console.error('Failed to fetch settlements:', error)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  const formatDate = (s: Settlement) => formatFirestoreDate(s.createdAt)

  return (
    <Layout>
      <PageHeader
        title="정산 내역"
        action={{ label: '새 정산 처리', to: '/admin/settlement/new', variant: 'purple' }}
      />

      {loading ? (
        <Spinner />
      ) : settlements.length === 0 ? (
        <EmptyState
          title="정산 내역이 없습니다"
          description="승인된 신청서를 선택하여 정산 처리를 시작하세요"
          actionLabel="새 정산 처리"
          actionTo="/admin/settlement/new"
        />
      ) : (
        <>
          {/* Desktop */}
          <div className="hidden sm:block">
            <div className="bg-white rounded-lg shadow overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">정산일</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">신청자</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">위원회</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">은행/계좌</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">총액</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-600">건수</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-600"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {settlements.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">{formatDate(s)}</td>
                      <td className="px-4 py-3">{s.payee}</td>
                      <td className="px-4 py-3">{s.committee === 'operations' ? '운영' : '준비'}</td>
                      <td className="px-4 py-3 text-gray-500">{s.bankName} {s.bankAccount}</td>
                      <td className="px-4 py-3 text-right font-medium">₩{s.totalAmount.toLocaleString()}</td>
                      <td className="px-4 py-3 text-center">{s.requestIds.length}건</td>
                      <td className="px-4 py-3 text-center">
                        <Link to={`/admin/settlement/${s.id}`}
                          className="text-purple-600 hover:underline text-sm">리포트</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile */}
          <div className="sm:hidden space-y-3">
            {settlements.map((s) => (
              <Link key={s.id} to={`/admin/settlement/${s.id}`}
                className="block bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{s.payee}</span>
                  <span className="text-xs text-gray-400">{formatDate(s)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">
                    {s.committee === 'operations' ? '운영' : '준비'} | {s.requestIds.length}건
                  </span>
                  <span className="font-medium text-purple-700">₩{s.totalAmount.toLocaleString()}</span>
                </div>
                <div className="text-xs text-gray-400 mt-1">{s.bankName} {s.bankAccount}</div>
              </Link>
            ))}
          </div>
        </>
      )}
    </Layout>
  )
}
