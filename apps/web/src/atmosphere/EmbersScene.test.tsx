import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { EmbersScene } from './EmbersScene'

describe('EmbersScene', () => {
  it('renders a canvas for the particle background', () => {
    render(<EmbersScene />)
    expect(screen.getByTestId('embers-canvas')).toBeInTheDocument()
  })

  it('renders a static gradient when reduced motion is requested', () => {
    render(<EmbersScene reduced />)
    expect(screen.getByTestId('embers-reduced')).toBeInTheDocument()
    expect(screen.queryByTestId('embers-canvas')).not.toBeInTheDocument()
  })
})
