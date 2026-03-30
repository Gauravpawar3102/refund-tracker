import type { RefundRequest } from './types'

const API_URL = '/api/graphql'
const QUERY = `{ refund_requests(order_by: {refund_amount: desc}) { owner_acct funding_record_addr committed_amount refund_amount } }`

export const fetchRefunds = async (): Promise<RefundRequest[]> => {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: QUERY }),
  })
  const json = await res.json()
  return json.data.refund_requests
}
