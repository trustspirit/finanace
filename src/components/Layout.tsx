import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Layout({ children }: { children: React.ReactNode }) {
  const { appUser, logout } = useAuth()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const isAdmin = appUser?.role === 'admin' || appUser?.role === 'approver'
  const userName = appUser?.displayName || appUser?.name || appUser?.email

  const navItems = [
    { to: '/request/new', label: '새 신청서' },
    { to: '/my-requests', label: '내 신청 내역' },
  ]

  const adminItems = [
    { to: '/admin/requests', label: '신청 관리' },
    { to: '/admin/settlements', label: '정산' },
    { to: '/admin/dashboard', label: '대시보드' },
    { to: '/admin/users', label: '사용자 관리' },
  ]

  const allItems = isAdmin ? [...navItems, ...adminItems] : navItems

  const isActive = (path: string) => location.pathname === path

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-40">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <Link to="/my-requests" className="font-bold text-lg shrink-0">
              지불/환불 신청
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-1">
              {allItems.map((item) => (
                <Link key={item.to} to={item.to}
                  className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                    isActive(item.to)
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}>
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Desktop Right */}
            <div className="hidden md:flex items-center gap-3">
              <span className="text-sm text-gray-700">
                {userName}
                {appUser?.role === 'admin' && <span className="ml-1.5 text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">관리자</span>}
                {appUser?.role === 'approver' && <span className="ml-1.5 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">승인자</span>}
              </span>
              <Link to="/settings" aria-label="설정"
                className={`p-2 rounded-md transition-colors ${isActive('/settings') ? 'bg-gray-100' : 'hover:bg-gray-100'}`}>
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </Link>
              <button onClick={logout}
                className="text-sm text-gray-500 hover:text-gray-700 px-2 py-1 rounded-md hover:bg-gray-100 transition-colors">
                로그아웃
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-md hover:bg-gray-100"
              aria-label="메뉴"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-gray-100 py-2">
              {allItems.map((item) => (
                <Link key={item.to} to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2.5 rounded-md text-sm ${
                    isActive(item.to)
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}>
                  {item.label}
                </Link>
              ))}
              <div className="border-t border-gray-100 mt-2 pt-2">
                <Link to="/settings" onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-50 rounded-md">
                  설정
                </Link>
                <div className="px-3 py-2 flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    {userName}
                    {appUser?.role === 'admin' && <span className="ml-1.5 text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">관리자</span>}
                    {appUser?.role === 'approver' && <span className="ml-1.5 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">승인자</span>}
                  </span>
                  <button onClick={logout} className="text-sm text-red-600 hover:text-red-700">로그아웃</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>
      <main className="max-w-6xl mx-auto px-4 py-6 mt-14">{children}</main>
    </div>
  )
}
