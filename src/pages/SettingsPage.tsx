import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { useProject } from '../contexts/ProjectContext'
import Layout from '../components/Layout'
import PersonalSettings from '../components/settings/PersonalSettings'
import ProjectGeneralSettings from '../components/settings/ProjectGeneralSettings'
import MemberManagement from '../components/settings/MemberManagement'
import ProjectCreateForm from '../components/settings/ProjectCreateForm'

function ProjectManagement() {
  const { t } = useTranslation()
  const { projects } = useProject()
  const activeProjects = projects.filter(p => p.isActive)

  const [selectedId, setSelectedId] = useState(activeProjects[0]?.id || '')
  const [creating, setCreating] = useState(false)
  const [subTab, setSubTab] = useState<'general' | 'members'>('general')

  const selectedProject = activeProjects.find(p => p.id === selectedId)

  const handleSelect = (value: string) => {
    if (value === '__create__') {
      setCreating(true)
    } else {
      setSelectedId(value)
      setCreating(false)
    }
  }

  const handleCreated = (newId: string) => {
    setSelectedId(newId)
    setCreating(false)
  }

  return (
    <div className="space-y-4">
      {/* Project Selector */}
      <select
        value={creating ? '__create__' : selectedId}
        onChange={(e) => handleSelect(e.target.value)}
        className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
      >
        {activeProjects.map(p => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
        <option value="__create__">+ {t('project.create')}</option>
      </select>

      {creating ? (
        <ProjectCreateForm onCreated={handleCreated} onCancel={() => setCreating(false)} />
      ) : selectedProject ? (
        <>
          {/* Sub-tabs */}
          <div className="flex gap-1">
            {([
              { key: 'general' as const, label: t('project.general') },
              { key: 'members' as const, label: t('project.members') },
            ]).map(item => (
              <button key={item.key} onClick={() => setSubTab(item.key)}
                className={`px-3 py-1.5 rounded-md text-sm transition-colors ${subTab === item.key ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-500 hover:bg-gray-100'}`}>
                {item.label}
              </button>
            ))}
          </div>

          {subTab === 'general' ? (
            <ProjectGeneralSettings project={selectedProject} />
          ) : (
            <MemberManagement project={selectedProject} />
          )}
        </>
      ) : null}
    </div>
  )
}

export default function SettingsPage() {
  const { t } = useTranslation()
  const { appUser } = useAuth()
  const isAdmin = appUser?.role === 'admin'
  const [tab, setTab] = useState<'personal' | 'project'>(isAdmin ? 'project' : 'personal')

  const tabs = [
    ...(isAdmin ? [
      { key: 'project' as const, label: t('project.projectSettings') },
    ] : []),
    { key: 'personal' as const, label: t('project.personalSettings') },
  ]

  return (
    <Layout>
      <div className="bg-white rounded-lg shadow p-6 max-w-lg mx-auto">
        <h2 className="text-xl font-bold mb-6">{t('settings.title')}</h2>

        {tabs.length > 1 && (
          <div className="flex gap-1 mb-6 border-b border-gray-200 overflow-x-auto">
            {tabs.map(item => (
              <button key={item.key} onClick={() => setTab(item.key)}
                className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${tab === item.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                {item.label}
              </button>
            ))}
          </div>
        )}

        {tab === 'personal' ? <PersonalSettings /> : <ProjectManagement />}
      </div>
    </Layout>
  )
}
