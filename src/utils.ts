const DECIMALS = 6

export const toHuman = (raw: number) =>
  (raw / 10 ** DECIMALS).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

export const toRaw = (human: number) => human * 10 ** DECIMALS

export const truncateAddr = (addr: string) =>
  `${addr.slice(0, 6)}...${addr.slice(-4)}`

export const copyToClipboard = (text: string) =>
  navigator.clipboard.writeText(text)
