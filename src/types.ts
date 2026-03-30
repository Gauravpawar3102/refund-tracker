export type RefundRequest = {
  owner_acct: string
  funding_record_addr: string
  committed_amount: number
  refund_amount: number
}

export type SortCol = keyof RefundRequest
export type SortDir = 'asc' | 'desc'
