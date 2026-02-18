/**
 * Migration: Add project layer
 * - Creates a default project from existing settings
 * - Adds projectId to all existing requests and settlements
 * - Adds projectIds to all existing users
 * - Creates settings/global with defaultProjectId
 *
 * SAFE: Idempotent - can be run multiple times.
 *
 * For emulator: FIRESTORE_EMULATOR_HOST is set automatically.
 * For production: set GOOGLE_APPLICATION_CREDENTIALS env var.
 */

import { initializeApp } from 'firebase-admin/app'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'

const useEmulator = process.argv.includes('--emulator')
if (useEmulator) {
  process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080'
}

initializeApp({ projectId: 'finance-96f46' })
const db = getFirestore()

const DEFAULT_PROJECT_ID = 'default'

async function migrate() {
  console.log(`Starting project migration (${useEmulator ? 'emulator' : 'production'})...`)

  // 1. Read existing settings
  const budgetSnap = await db.doc('settings/budget-config').get()
  const docNoSnap = await db.doc('settings/document-no').get()

  const budgetConfig = budgetSnap.exists
    ? budgetSnap.data()
    : { totalBudget: 0, byCode: {} }

  const documentNo = docNoSnap.exists
    ? (docNoSnap.data()?.value || '')
    : ''

  // 2. Create default project (if not exists)
  const projectRef = db.doc(`projects/${DEFAULT_PROJECT_ID}`)
  const projectSnap = await projectRef.get()

  if (!projectSnap.exists) {
    await projectRef.set({
      name: 'Default Project',
      description: 'Migrated from existing data',
      createdAt: Timestamp.now(),
      createdBy: { uid: 'system', name: 'Migration', email: '' },
      budgetConfig,
      documentNo,
      driveFolders: { operations: '', preparation: '', bankbook: '' },
      memberUids: [],
      isActive: true,
    })
    console.log('  Created default project')
  } else {
    console.log('  Default project already exists, skipping')
  }

  // 3. Add projectId to all requests
  const reqSnap = await db.collection('requests').get()
  let reqCount = 0
  const batch1 = db.batch()
  for (const doc of reqSnap.docs) {
    if (!doc.data().projectId) {
      batch1.update(doc.ref, { projectId: DEFAULT_PROJECT_ID })
      reqCount++
    }
  }
  if (reqCount > 0) await batch1.commit()
  console.log(`  Updated ${reqCount} requests`)

  // 4. Add projectId to all settlements
  const stlSnap = await db.collection('settlements').get()
  let stlCount = 0
  const batch2 = db.batch()
  for (const doc of stlSnap.docs) {
    if (!doc.data().projectId) {
      batch2.update(doc.ref, { projectId: DEFAULT_PROJECT_ID })
      stlCount++
    }
  }
  if (stlCount > 0) await batch2.commit()
  console.log(`  Updated ${stlCount} settlements`)

  // 5. Add projectIds to all users and collect UIDs
  const userSnap = await db.collection('users').get()
  const allUids: string[] = []
  let userCount = 0
  const batch3 = db.batch()
  for (const doc of userSnap.docs) {
    allUids.push(doc.id)
    if (!doc.data().projectIds) {
      batch3.update(doc.ref, { projectIds: [DEFAULT_PROJECT_ID] })
      userCount++
    }
  }
  if (userCount > 0) await batch3.commit()
  console.log(`  Updated ${userCount} users`)

  // Update project memberUids
  await projectRef.update({ memberUids: allUids })

  // 6. Create settings/global
  await db.doc('settings/global').set(
    { defaultProjectId: DEFAULT_PROJECT_ID },
    { merge: true }
  )
  console.log('  Set default project in settings/global')

  console.log('Migration complete!')
  process.exit(0)
}

migrate().catch((e) => {
  console.error('Migration failed:', e)
  process.exit(1)
})
