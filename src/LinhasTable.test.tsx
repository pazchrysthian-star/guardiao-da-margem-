import { describe, it, expect } from 'vitest'
import { render, fireEvent, screen } from '@testing-library/react'
import { LinhasTable } from '@/components/margem/LinhasTable'
import { calc } from '@/lib/calc'
import seed from '@/data/seed.json'
import type { MargemRow } from '@/lib/calc'

describe('LinhasTable sorting', () => {
  it('does not crash when clicking each header', () => {
    const c = calc(seed as MargemRow[], 'Mai/2026', 'Jul/2026', 15, 31)
    render(<LinhasTable c={c} />)
    const headers = screen.getAllByRole('columnheader')
    headers.forEach((h) => {
      fireEvent.click(h)
      fireEvent.click(h)
    })
    expect(document.body.innerHTML.length).toBeGreaterThan(0)
  })
})
