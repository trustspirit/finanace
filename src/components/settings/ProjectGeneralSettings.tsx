import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Project } from '../../types'
import { useGlobalSettings, useUpdateGlobalSettings } from '../../hooks/queries/useSettings'
import { useUpdateProject } from '../../hooks/queries/useProjects'

export default function ProjectGeneralSettings({ project }: { project: Project }) {
  const { t } = useTranslation()
  const { data: globalSettings } = useGlobalSettings()
  const defaultProjectId = globalSettings?.defaultProjectId || ''
  const isDefault = project.id === defaultProjectId

  const [editing, setEditing] = useState(false)
  const [editData, setEditData] = useState({
    name: project.name || '',
    description: project.description || '',
    documentNo: project.documentNo || '',
    directorApprovalThreshold: project.directorApprovalThreshold ?? 600000,
    budgetWarningThreshold: project.budgetWarningThreshold ?? 85,
  })
  const [saving, setSaving] = useState(false)

  const updateProject = useUpdateProject()
  const updateSettings = useUpdateGlobalSettings()

  const startEdit = () => {
    setEditData({
      name: project.name || '',
      description: project.description || '',
      documentNo: project.documentNo || '',
      directorApprovalThreshold: project.directorApprovalThreshold ?? 600000,
      budgetWarningThreshold: project.budgetWarningThreshold ?? 85,
    })
    setEditing(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateProject.mutateAsync({ projectId: project.id, data: editData })
      setEditing(false)
    } catch (err) { console.error('Failed to save:', err) }
    finally { setSaving(false) }
  }

  const handleSetDefault = async () => {
    try {
      await updateSettings.mutateAsync({ defaultProjectId: project.id })
    } catch (err) { console.error('Failed to set default:', err) }
  }

  const handleDelete = async () => {
    if (!confirm(t('common.confirm') + '?')) return
    try {
      await updateProject.mutateAsync({ projectId: project.id, data: { isActive: false } })
    } catch (err) { console.error('Failed to delete:', err) }
  }

  if (editing) {
    return (
      <div className="space-y-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">{t('project.name')}</label>
          <input type="text" value={editData.name} onChange={(e) => setEditData({ ...editData, name: e.target.value })}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">{t('project.description')}</label>
          <input type="text" value={editData.description} onChange={(e) => setEditData({ ...editData, description: e.target.value })}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">{t('dashboard.documentNo')}</label>
          <input type="text" value={editData.documentNo} onChange={(e) => setEditData({ ...editData, documentNo: e.target.value })}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm font-mono" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">{t('project.directorThreshold')}</label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">₩</span>
            <input type="number" value={editData.directorApprovalThreshold}
              onChange={(e) => setEditData({ ...editData, directorApprovalThreshold: Number(e.target.value) || 0 })}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm" step="10000" min="0" />
          </div>
          <p className="text-xs text-gray-400 mt-1">{t('project.directorThresholdHint')}</p>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">{t('budget.warningThreshold')}</label>
          <div className="flex items-center gap-2">
            <input type="number" value={editData.budgetWarningThreshold}
              onChange={(e) => setEditData({ ...editData, budgetWarningThreshold: Math.min(100, Math.max(0, Number(e.target.value) || 0)) })}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm" step="5" min="0" max="100" />
            <span className="text-sm text-gray-500">%</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">{t('budget.warningThresholdHint')}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleSave} disabled={saving} className="text-sm bg-blue-600 text-white px-4 py-1.5 rounded hover:bg-blue-700 disabled:bg-gray-400">
            {saving ? t('common.saving') : t('common.save')}
          </button>
          <button onClick={() => setEditing(false)} className="text-sm text-gray-500 hover:text-gray-700">{t('common.cancel')}</button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isDefault && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">{t('project.isDefault')}</span>}
        </div>
        <button onClick={startEdit} className="text-xs text-blue-600 hover:text-blue-800">{t('common.edit')}</button>
      </div>
      <dl className="space-y-2 text-sm">
        <div>
          <dt className="text-xs text-gray-500">{t('project.description')}</dt>
          <dd className="text-gray-700">{project.description || '-'}</dd>
        </div>
        <div>
          <dt className="text-xs text-gray-500">{t('dashboard.documentNo')}</dt>
          <dd className="font-mono text-gray-700">{project.documentNo || '-'}</dd>
        </div>
        <div>
          <dt className="text-xs text-gray-500">{t('project.directorThreshold')}</dt>
          <dd className="text-gray-700">₩{(project.directorApprovalThreshold ?? 600000).toLocaleString()}</dd>
        </div>
        <div>
          <dt className="text-xs text-gray-500">{t('budget.warningThreshold')}</dt>
          <dd className="text-gray-700">{project.budgetWarningThreshold ?? 85}%</dd>
        </div>
        <div>
          <dt className="text-xs text-gray-500">{t('project.members')}</dt>
          <dd className="text-gray-700">{t('project.memberCount', { count: (project.memberUids || []).length })}</dd>
        </div>
      </dl>
      {!isDefault && (
        <div className="flex gap-3 pt-2 border-t border-gray-100">
          <button onClick={handleSetDefault} className="text-xs text-green-600 hover:text-green-800">{t('project.setDefault')}</button>
          <button onClick={handleDelete} className="text-xs text-red-600 hover:text-red-800">{t('common.delete')}</button>
        </div>
      )}
    </div>
  )
}
