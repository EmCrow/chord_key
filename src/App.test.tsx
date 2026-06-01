import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App integration', () => {
  it('updates synchronized views when key and capo change', async () => {
    const user = userEvent.setup()
    render(<App />)

    const controlsPanel = screen.getByRole('region', { name: 'Global controls' })
    await user.selectOptions(within(controlsPanel).getByLabelText('Key'), 'G')
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
    const controlsPanel = screen.getByRole('region', { name: 'Global controls' })
    await user.selectOptions(within(controlsPanel).getByLabelText('Key'), 'A')
    await user.selectOptions(within(nashvillePanel).getByLabelText('Mode'), 'minor')

    expect(within(nashvillePanel).getByRole('button', { name: /i Am 1/i })).toHaveClass('active')

    const circlePanel = screen.getByRole('region', { name: 'Circle of fifths' })
    expect(within(circlePanel).getByText(/^Am$/, { selector: 'strong' })).toBeInTheDocument()
  })

  it('renders clean translator output and keeps fretboard capped at fret 15', async () => {
    const user = userEvent.setup()
    render(<App />)

    const translatorPanel = screen.getByRole('region', { name: 'Tuning translator' })
    expect(within(translatorPanel).queryByRole('columnheader', { name: 'Research-backed Shape' })).not.toBeInTheDocument()
    expect(within(translatorPanel).getByRole('columnheader', { name: 'Open Shape' })).toBeInTheDocument()
    expect(within(translatorPanel).getByText('Progression Alignment')).toBeInTheDocument()
    expect(screen.getByText(/Research voicing:/i)).toBeInTheDocument()
    expect(within(translatorPanel).queryByText(/Source:/i)).not.toBeInTheDocument()

    const targetTuningSelect = screen.getByLabelText('New Tuning')
    await user.selectOptions(targetTuningSelect, 'drop_d')

    expect(screen.getAllByText(/fallback tuning standard/i).length).toBeGreaterThan(0)

    const fretboardPanel = screen.getByRole('region', { name: '15 fret fretboard' })
    expect(within(fretboardPanel).getByRole('columnheader', { name: 'Nut' })).toBeInTheDocument()
    expect(within(fretboardPanel).getByRole('columnheader', { name: '15' })).toBeInTheDocument()
    expect(within(fretboardPanel).queryByRole('columnheader', { name: '16' })).not.toBeInTheDocument()
  })

  it('shows capo translations as open chord shape names', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.selectOptions(screen.getByLabelText('New Tuning Capo'), '5')

    const translatorPanel = screen.getByRole('region', { name: 'Tuning translator' })
    expect(within(translatorPanel).getAllByText('G shape').length).toBeGreaterThan(0)
  })

  it('renders the fretboard with high E on top and low E on bottom', () => {
    render(<App />)

    const fretboardPanel = screen.getByRole('region', { name: '15 fret fretboard' })
    const stringHeaders = within(fretboardPanel)
      .getAllByRole('rowheader')
      .map((header) => header.textContent)

    expect(stringHeaders).toEqual(['E4', 'B3', 'G3', 'D3', 'A2', 'E2'])
  })

  it('highlights the exact research-backed chord shape frets on the fretboard', () => {
    render(<App />)

    const fretboardPanel = screen.getByRole('region', { name: '15 fret fretboard' })
    const shapeFrets = within(fretboardPanel).getAllByRole('cell', { name: /selected chord shape fret/i })

    expect(shapeFrets).toHaveLength(5)
    expect(within(fretboardPanel).getByRole('cell', { name: /E4 string fret 3: G.*selected chord shape fret/i })).toBeInTheDocument()
    expect(within(fretboardPanel).getByRole('cell', { name: /B3 string fret 5: E.*selected chord shape fret/i })).toBeInTheDocument()
    expect(within(fretboardPanel).getByRole('cell', { name: /G3 string fret 5: C.*selected chord shape fret/i })).toBeInTheDocument()
    expect(within(fretboardPanel).getByRole('cell', { name: /D3 string fret 5: G.*selected chord shape fret/i })).toBeInTheDocument()
    expect(within(fretboardPanel).getByRole('cell', { name: /A2 string fret 3: C.*selected chord shape fret/i })).toBeInTheDocument()
  })

  it('shows all seven Nashville chord degrees as visible cards', () => {
    render(<App />)

    const nashvillePanel = screen.getByRole('region', { name: 'Nashville number system' })
    expect(within(nashvillePanel).getByRole('button', { name: /I C 1/i })).toBeInTheDocument()
    expect(within(nashvillePanel).getByRole('button', { name: /IV F 4/i })).toBeInTheDocument()
    expect(within(nashvillePanel).getByRole('button', { name: /ii Dm 2/i })).toBeInTheDocument()
    expect(within(nashvillePanel).getByRole('button', { name: /iii Em 3/i })).toBeInTheDocument()
    expect(within(nashvillePanel).getByRole('button', { name: /vii° Bdim 7/i })).toBeInTheDocument()
    expect(within(nashvillePanel).getByText('Selected chord')).toBeInTheDocument()
    expect(within(nashvillePanel).getByText('Chord construction')).toBeInTheDocument()
    expect(within(nashvillePanel).getByText('Voice leading')).toBeInTheDocument()
  })

  it('tags all seven active key degrees on the circle of fifths', () => {
    render(<App />)

    const circlePanel = screen.getByRole('region', { name: 'Circle of fifths' })
    for (const roman of ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°']) {
      expect(within(circlePanel).getAllByText(roman).length).toBeGreaterThan(0)
    }
  })

  it('lets Nashville panel pick common keys and syncs the app key', async () => {
    const user = userEvent.setup()
    render(<App />)

    const nashvillePanel = screen.getByRole('region', { name: 'Nashville number system' })
    const controlsPanel = screen.getByRole('region', { name: 'Global controls' })

    await user.selectOptions(within(nashvillePanel).getByLabelText('Mode'), 'minor')
    await user.click(within(nashvillePanel).getByRole('button', { name: 'Key Em' }))

    expect(within(controlsPanel).getByLabelText('Key')).toHaveValue('E')
    expect(within(nashvillePanel).getByRole('button', { name: /i Em 1/i })).toHaveClass('active')
  })

  it('updates Nashville learning details for the selected chord function', async () => {
    const user = userEvent.setup()
    render(<App />)

    const nashvillePanel = screen.getByRole('region', { name: 'Nashville number system' })
    await user.click(within(nashvillePanel).getByRole('button', { name: /V G 5/i }))

    expect(within(nashvillePanel).getByText('V in C')).toBeInTheDocument()
    expect(within(nashvillePanel).getAllByText('Dominant').length).toBeGreaterThan(0)
    expect(within(nashvillePanel).getByText('G -> C')).toBeInTheDocument()
    expect(within(nashvillePanel).getByText(/Chord tones 1 3 5 use scale degrees 5 7 2/i)).toBeInTheDocument()
  })
})
