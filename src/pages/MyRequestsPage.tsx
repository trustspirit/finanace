import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../contexts/AuthContext'
import { PaymentRequest } from '../types'
import Layout from '../components/Layout'
import StatusBadge from '../components/StatusBadge'
import Spinner from '../components/Spinner'
import EmptyState from '../components/EmptyState'
import PageHeader from '../components/PageHeader'

export default function MyRequestsPage() {
  const { user } = useAuth()
  const [requests, setRequests] = useState<PaymentRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    const fetchRequests = async () => {
      try {
        setError(null)
        const q = query(
          collection(db, 'requests'),
          where('requestedBy.uid', '==', user.uid),
          orderBy('createdAt', 'desc')
        )
        const snap = await getDocs(q)
        setRequests(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as PaymentRequest)))
      } catch (err) {
        console.error('Failed to fetch requests:', err)
        setError('신청 내역을 불러오는 중 오류가 발생했습니다.')
      } finally {
        setLoading(false)
      }
    }
    fetchRequests()
  }, [user])

  return (
    <Layout>
      <PageHeader
        title="내 신청 내역"
        action={{ label: '새 신청서 작성', to: '/request/new' }}
      />
      {loading ? (
        <Spinner />
      ) : error ? (
        <p className="text-red-500 text-sm">{error}</p>
      ) : requests.length === 0 ? (
        <EmptyState
          title="신청 내역이 없습니다"
          description="새 신청서를 작성해보세요"
          actionLabel="새 신청서 작성"
          actionTo="/request/new"
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden sm:block">
            <div className="bg-white rounded-lg shadow overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">날짜</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">세션</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">항목수</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">합계</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-600">상태</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {requests.map((req) => (
                    <tr key={req.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <Link to={`/request/${req.id}`} className="text-blue-600 hover:underline">{req.date}</Link>
                      </td>
                      <td className="px-4 py-3">{req.session}</td>
                      <td className="px-4 py-3">{req.items.length}건</td>
                      <td className="px-4 py-3 text-right">₩{req.totalAmount.toLocaleString()}</td>
                      <td className="px-4 py-3 text-center"><StatusBadge status={req.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile card list */}
          <div className="sm:hidden space-y-3">
            {requests.map((req) => (
              <Link key={req.id} to={`/request/${req.id}`} className="block bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-600">{req.date}</span>
                  <StatusBadge status={req.status} />
                </div>
                <div className="text-sm text-gray-600 mb-1">{req.session}</div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">{req.items.length}건</span>
                  <span className="font-medium">₩{req.totalAmount.toLocaleString()}</span>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </Layout>
  )
}
