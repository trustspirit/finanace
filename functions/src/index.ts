import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

admin.initializeApp()

const STORAGE_BUCKET = 'finance-96f46.firebasestorage.app'
const bucket = admin.storage().bucket(STORAGE_BUCKET)

interface FileInput {
  name: string
  data: string
}

interface UploadResult {
  fileName: string
  storagePath: string
  url: string
}

async function uploadFileToStorage(file: FileInput, storagePath: string): Promise<UploadResult> {
  if (!file.data.includes(',')) {
    throw new Error('File data must be a base64 data URI')
  }
  const base64Data = file.data.split(',')[1]
  const buffer = Buffer.from(base64Data, 'base64')
  const mimeType = file.data.split(';')[0].split(':')[1]

  const fileRef = bucket.file(storagePath)
  await fileRef.save(buffer, {
    metadata: { contentType: mimeType },
  })

  await fileRef.makePublic()
  const url = `https://storage.googleapis.com/${bucket.name}/${storagePath}`

  return {
    fileName: file.name,
    storagePath,
    url,
  }
}

// 영수증 업로드
export const uploadReceipts = functions.https.onCall(
  async (data: { files: FileInput[]; committee: string; projectId?: string }, context: functions.https.CallableContext) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Must be logged in')
    }

    const { files, committee, projectId } = data
    if (!files || files.length === 0) {
      throw new functions.https.HttpsError('invalid-argument', 'No files provided')
    }

    const results: UploadResult[] = []
    for (const file of files) {
      const storagePath = `receipts/${projectId || 'default'}/${committee}/${Date.now()}_${file.name}`
      results.push(await uploadFileToStorage(file, storagePath))
    }
    return results
  }
)

// 통장사본 업로드
export const uploadBankBook = functions.https.onCall(
  async (data: { file: FileInput }, context: functions.https.CallableContext) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Must be logged in')
    }

    const { file } = data
    if (!file) {
      throw new functions.https.HttpsError('invalid-argument', 'No file provided')
    }

    const storagePath = `bankbook/${context.auth.uid}/${Date.now()}_${file.name}`
    return await uploadFileToStorage(file, storagePath)
  }
)
