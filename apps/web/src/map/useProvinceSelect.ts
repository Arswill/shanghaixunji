import { useCallback } from 'react'

export function useProvinceSelect(onSelect: (province: string) => void) {
  return useCallback(
    (province: string) => {
      onSelect(province)
    },
    [onSelect]
  )
}
