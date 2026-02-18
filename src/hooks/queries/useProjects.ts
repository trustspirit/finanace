import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { collection, getDocs, doc, getDoc, setDoc, query, where, writeBatch } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { queryKeys } from './queryKeys'
import type { AppUser, Project, GlobalSettings } from '../../types'

async function fetchProjects(appUser: AppUser): Promise<Project[]> {
  let projectIds = appUser.projectIds || []

  if (projectIds.length === 0) {
    const globalSnap = await getDoc(doc(db, 'settings', 'global'))
    if (globalSnap.exists()) {
      const { defaultProjectId } = globalSnap.data() as GlobalSettings
      if (defaultProjectId) projectIds = [defaultProjectId]
    }
  }

  if (projectIds.length === 0) return []

  let allProjects: Project[] = []
  if (appUser.role === 'admin') {
    const q = query(collection(db, 'projects'), where('isActive', '==', true))
    const snap = await getDocs(q)
    allProjects = snap.docs.map(d => ({ id: d.id, ...d.data() } as Project))
  } else {
    const chunks: string[][] = []
    for (let i = 0; i < projectIds.length; i += 30) {
      chunks.push(projectIds.slice(i, i + 30))
    }
    for (const chunk of chunks) {
      const q = query(collection(db, 'projects'), where('__name__', 'in', chunk))
      const snap = await getDocs(q)
      snap.docs.forEach(d => allProjects.push({ id: d.id, ...d.data() } as Project))
    }
  }

  return allProjects.filter(p => p.isActive)
}

export function useProjects(appUser: AppUser | null) {
  return useQuery({
    queryKey: appUser ? queryKeys.projects.all(appUser.uid) : ['projects', 'none'],
    queryFn: () => fetchProjects(appUser!),
    enabled: !!appUser,
  })
}

export function useCreateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: {
      project: Omit<Project, 'id'>
      projectId: string
    }) => {
      await setDoc(doc(db, 'projects', params.projectId), params.project)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}

export function useUpdateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: {
      projectId: string
      data: Partial<Project>
    }) => {
      await setDoc(doc(db, 'projects', params.projectId), params.data, { merge: true })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}

export function useUpdateProjectMembers() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: {
      projectId: string
      addUids: string[]
      removeUids: string[]
      currentMemberUids: string[]
    }) => {
      const batch = writeBatch(db)
      const newMemberUids = [
        ...params.currentMemberUids.filter(uid => !params.removeUids.includes(uid)),
        ...params.addUids,
      ]
      batch.update(doc(db, 'projects', params.projectId), { memberUids: newMemberUids })

      for (const uid of params.addUids) {
        const userSnap = await getDoc(doc(db, 'users', uid))
        if (userSnap.exists()) {
          const userData = userSnap.data()
          const projectIds = userData.projectIds || []
          if (!projectIds.includes(params.projectId)) {
            batch.update(doc(db, 'users', uid), { projectIds: [...projectIds, params.projectId] })
          }
        }
      }

      for (const uid of params.removeUids) {
        const userSnap = await getDoc(doc(db, 'users', uid))
        if (userSnap.exists()) {
          const userData = userSnap.data()
          const projectIds = (userData.projectIds || []).filter((id: string) => id !== params.projectId)
          batch.update(doc(db, 'users', uid), { projectIds })
        }
      }

      await batch.commit()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}
