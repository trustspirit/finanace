import { Committee, RequestStatus } from '../types'

export const COMMITTEE_LABELS: Record<Committee, string> = {
  operations: '운영 위원회',
  preparation: '준비 위원회',
}

export const COMMITTEE_LABELS_SHORT: Record<Committee, string> = {
  operations: '운영',
  preparation: '준비',
}

export const STATUS_LABELS: Record<RequestStatus, string> = {
  pending: '대기',
  approved: '승인',
  rejected: '반려',
  settled: '정산',
  cancelled: '취소',
}

export const STATUS_FILTER_LABELS: Record<RequestStatus | 'all', string> = {
  all: '전체',
  pending: '대기',
  approved: '승인',
  settled: '정산',
  rejected: '반려',
  cancelled: '취소',
}
