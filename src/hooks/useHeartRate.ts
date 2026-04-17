import { useState } from 'react'

export function useHeartRate(threshold = 100) {
  const [hr, setHr] = useState(0)
  const isExceeded = hr > 0 && hr > threshold
  return { hr, setHr, isExceeded }
}
