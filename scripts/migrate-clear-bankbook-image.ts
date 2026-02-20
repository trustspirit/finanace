/**
 * Migration: Clear bankBookImage base64 from user documents
 *
 * bankBookImage (base64) was stored redundantly alongside bankBookUrl.
 * This migration clears the base64 field to reduce document size.
 *
 * - Users with bankBookUrl or bankBookDriveUrl: clears bankBookImage to ''
 * - Users without any URL but with bankBookImage: SKIPPED (would lose data)
 *
 * SAFE: Idempotent - can be run multiple times.
 *
 * Usage:
 *   npx tsx scripts/migrate-clear-bankbook-image.ts              # production
 *   npx tsx scripts/migrate-clear-bankbook-image.ts --emulator   # emulator
 *   npx tsx scripts/migrate-clear-bankbook-image.ts --dry-run    # preview only
 *
 * Requires: functions/service-account.json (download from Firebase Console)
 *   Firebase Console → Project Settings → Service accounts → Generate new private key
 */

import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const useEmulator = process.argv.includes('--emulator')
const dryRun = process.argv.includes('--dry-run')

if (useEmulator) {
  process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080'
  initializeApp({ projectId: 'finance-96f46' })
} else {
  const keyPath = resolve(__dirname, '../functions/service-account.json')
  if (!existsSync(keyPath)) {
    console.error(`Service account key not found: ${keyPath}`)
    console.error('Download from: Firebase Console → Project Settings → Service accounts → Generate new private key')
    process.exit(1)
  }
  initializeApp({ credential: cert(keyPath) })
}

const db = getFirestore()

async function migrate() {
  console.log(`Clear bankBookImage migration (${useEmulator ? 'emulator' : 'production'})${dryRun ? ' [DRY RUN]' : ''}`)
  console.log()

  const userSnap = await db.collection('users').get()
  console.log(`Found ${userSnap.size} users`)

  let cleared = 0
  let skippedNoUrl = 0
  let skippedEmpty = 0
  const batch = db.batch()

  for (const doc of userSnap.docs) {
    const data = doc.data()
    const bankBookImage = data.bankBookImage || ''
    const bankBookUrl = data.bankBookUrl || ''
    const bankBookDriveUrl = data.bankBookDriveUrl || ''
    const hasUrl = !!(bankBookUrl || bankBookDriveUrl)
    const hasBase64 = bankBookImage.length > 0 && bankBookImage.startsWith('data:')

    if (!hasBase64) {
      skippedEmpty++
      continue
    }

    if (!hasUrl) {
      skippedNoUrl++
      const name = data.displayName || data.name || doc.id
      console.log(`  SKIP: ${name} - has base64 (${Math.round(bankBookImage.length / 1024)}KB) but no URL`)
      continue
    }

    const name = data.displayName || data.name || doc.id
    const sizeKB = Math.round(bankBookImage.length / 1024)
    console.log(`  CLEAR: ${name} - ${sizeKB}KB base64 → using URL: ${bankBookUrl || bankBookDriveUrl}`)

    if (!dryRun) {
      batch.update(doc.ref, { bankBookImage: '' })
    }
    cleared++
  }

  if (!dryRun && cleared > 0) {
    await batch.commit()
  }

  console.log()
  console.log('Summary:')
  console.log(`  Cleared: ${cleared}`)
  console.log(`  Skipped (already empty): ${skippedEmpty}`)
  console.log(`  Skipped (no URL - would lose data): ${skippedNoUrl}`)

  if (dryRun) {
    console.log()
    console.log('This was a dry run. Run without --dry-run to apply changes.')
  }

  process.exit(0)
}

migrate().catch((e) => {
  console.error('Migration failed:', e)
  process.exit(1)
})
