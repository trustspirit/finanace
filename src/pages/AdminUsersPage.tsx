import { useEffect, useState } from 'react'
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../contexts/AuthContext'
import { AppUser, UserRole } from '../types'
import Layout from '../components/Layout'

const ROLE_LABELS: Record<UserRole, string> = {
  user: '일반 사용자',
  approver: '승인자',
  admin: '관리자',
}

export default function AdminUsersPage() {
  const { appUser: currentUser } = useAuth()
  const [users, setUsers] = useState<AppUser[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const snap = await getDocs(collection(db, 'users'))
        setUsers(snap.docs.map((d) => d.data() as AppUser))
      } catch (error) {
        console.error('Failed to fetch users:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchUsers()
  }, [])

  const handleRoleChange = async (uid: string, newRole: UserRole) => {
    if (uid === currentUser?.uid) {
      alert('본인의 권한은 변경할 수 없습니다.')
      return
    }
    const confirmed = window.confirm(`권한을 "${ROLE_LABELS[newRole]}"(으)로 변경하시겠습니까?`)
    if (!confirmed) return

    try {
      await updateDoc(doc(db, 'users', uid), { role: newRole })
      setUsers((prev) => prev.map((u) => (u.uid === uid ? { ...u, role: newRole } : u)))
    } catch (error) {
      console.error('Failed to update role:', error)
      alert('권한 변경에 실패했습니다.')
    }
  }

  return (
    <Layout>
      <h2 className="text-xl font-bold mb-6">사용자 관리</h2>
      {loading ? (
        <p className="text-gray-500">불러오는 중...</p>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">이름</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">이메일</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">전화번호</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">권한</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.map((u) => (
                <tr key={u.uid} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    {u.displayName || u.name || '-'}
                    {u.displayName && u.name && u.displayName !== u.name && (
                      <span className="ml-1 text-xs text-gray-400">({u.name})</span>
                    )}
                    {u.uid === currentUser?.uid && (
                      <span className="ml-2 text-xs text-blue-600">(나)</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{u.email}</td>
                  <td className="px-4 py-3 text-gray-500">{u.phone || '-'}</td>
                  <td className="px-4 py-3 text-center">
                    <select
                      value={u.role}
                      disabled={u.uid === currentUser?.uid}
                      onChange={(e) => handleRoleChange(u.uid, e.target.value as UserRole)}
                      className={`border border-gray-300 rounded px-2 py-1 text-sm ${
                        u.uid === currentUser?.uid ? 'bg-gray-100 text-gray-400' : ''
                      }`}
                    >
                      <option value="user">일반 사용자</option>
                      <option value="approver">승인자</option>
                      <option value="admin">관리자</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  )
}
