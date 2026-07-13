import { useEffect } from 'react'

export function useMountEffect(effect: () => void | (() => void)) {
  // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only sync by design
  useEffect(effect, [])
}
