import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App integration', () => {
  it('updates synchronized views when key and capo change', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.selectOptions(screen.getByLabelText('Key'), 'G')
    expect(screen.getByText('Active Key')).toBeInTheDocument()
    expect(screen.getAllByText('G').length).toBeGreaterThan(0)

    const capoSelect = screen.getByLabelText('New Tuning Capo')
    await user.selectOptions(capoSelect, '2')

    expect(screen.getByText(/with capo at fret 2/i)).toBeInTheDocument()
    expect(screen.getByText(/capo at 2/i)).toBeInTheDocument()
  })

  it('switches to minor harmony mode from the compact Nashville controls', async () => {
    const user = userEvent.setup()
    render(<App />)

    const nashvillePanel = screen.getByRole('region', { name: 'Nashville number system' })
    await user.selectOptions(screen.getByLabelText('Key'), 'A')
    await user.selectOptions(within(nashvillePanel).getByLabelText('Mode'), 'minor')

    expect(within(nashvillePanel).getByRole('button', { name: /i Am 1/i })).toHaveClass('active')

    const circlePanel = screen.getByRole('region', { name: 'Circle of fifths' })
    expect(within(circlePanel).getByText(/^Am$/, { selector: 'strong' })).toBeInTheDocument()
  })

  it('renders research-backed translator output and keeps fretboard capped at fret 15', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(screen.getByRole('columnheader', { name: 'Research-backed Shape' })).toBeInTheDocument()
    expect(screen.getByText(/Research voicing:/i)).toBeInTheDocument()
    expect(screen.getAllByText(/Source:/i).length).toBeGreaterThan(0)

    const targetTuningSelect = screen.getByLabelText('New Tuning')
    await user.selectOptions(targetTuningSelect, 'drop_d')

    expect(screen.getAllByText(/fallback tuning standard/i).length).toBeGreaterThan(0)

    const fretboardPanel = screen.getByRole('region', { name: '15 fret fretboard' })
    expect(within(fretboardPanel).getByRole('columnheader', { name: '15' })).toBeInTheDocument()
    expect(within(fretboardPanel).queryByRole('columnheader', { name: '16' })).not.toBeInTheDocument()
  })

  it('renders the fretboard with high E on top and low E on bottom', () => {
    render(<App />)

    const fretboardPanel = screen.getByRole('region', { name: '15 fret fretboard' })
    const stringHeaders = within(fretboardPanel)
      .getAllByRole('rowheader')
      .map((header) => header.textContent)

    expect(stringHeaders).toEqual(['E4', 'B3', 'G3', 'D3', 'A2', 'E2'])
  })

  it('keeps Nashville compact with common degrees and a dropdown for less common degrees', async () => {
    const user = userEvent.setup()
    render(<App />)

    const nashvillePanel = screen.getByRole('region', { name: 'Nashville number system' })
    expect(within(nashvillePanel).getByRole('button', { name: /I C 1/i })).toBeInTheDocument()
    expect(within(nashvillePanel).getByRole('button', { name: /IV F 4/i })).toBeInTheDocument()
    expect(within(nashvillePanel).queryByRole('button', { name: /ii Dm 2/i })).not.toBeInTheDocument()

    await user.selectOptions(within(nashvillePanel).getByLabelText('More'), '2')
    expect(within(nashvillePanel).getByLabelText('More')).toHaveValue('2')
  })

  it('tags all seven active key degrees on the circle of fifths', () => {
    render(<App />)

    const circlePanel = screen.getByRole('region', { name: 'Circle of fifths' })
    for (const roman of ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°']) {
      expect(within(circlePanel).getAllByText(roman).length).toBeGreaterThan(0)
    }
  })
})
