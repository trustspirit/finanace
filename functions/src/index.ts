import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import { google } from 'googleapis'
import { Readable } from 'stream'
import * as path from 'path'

admin.initializeApp()

const SCOPES = ['https://www.googleapis.com/auth/drive.file']
const SERVICE_ACCOUNT_PATH = path.join(__dirname, '..', 'service-account.json')

// 위원회별 Google Drive 폴더 ID
const FOLDER_IDS: Record<string, string> = {
  operations: process.env.GDRIVE_FOLDER_OPERATIONS || '',
  preparation: process.env.GDRIVE_FOLDER_PREPARATION || '',
}

function getDriveService() {
  const auth = new google.auth.GoogleAuth({
    keyFile: SERVICE_ACCOUNT_PATH,
    scopes: SCOPES,
  })
  return google.drive({ version: 'v3', auth })
}

interface FileInput {
  name: string
  data: string
}

interface ReceiptOutput {
  fileName: string
  driveFileId: string
  driveUrl: string
}

export const uploadReceipts = functions.https.onCall(
  async (request: functions.https.CallableRequest<{ files: FileInput[]; committee: string }>) => {
    if (!request.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Must be logged in')
    }

    const { files, committee } = request.data
    if (!files || files.length === 0) {
      throw new functions.https.HttpsError('invalid-argument', 'No files provided')
    }

    const folderId = FOLDER_IDS[committee] || ''
    if (!folderId) {
      throw new functions.https.HttpsError('invalid-argument', `Unknown committee: ${committee}`)
    }

    const drive = getDriveService()
    const results: ReceiptOutput[] = []

    for (const file of files) {
      const base64Data = file.data.split(',')[1]
      const buffer = Buffer.from(base64Data, 'base64')
      const mimeType = file.data.split(';')[0].split(':')[1]

      const stream = new Readable()
      stream.push(buffer)
      stream.push(null)

      const response = await drive.files.create({
        requestBody: {
          name: `${Date.now()}_${file.name}`,
          parents: [folderId],
        },
        media: {
          mimeType,
          body: stream,
        },
        fields: 'id, webViewLink',
      })

      await drive.permissions.create({
        fileId: response.data.id!,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
      })

      results.push({
        fileName: file.name,
        driveFileId: response.data.id!,
        driveUrl: response.data.webViewLink!,
      })
    }

    return results
  }
)
