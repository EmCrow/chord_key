import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App integration', () => {
  it('updates synchronized views when key and capo change', async () => {
    const user = userEvent.setup()
    render(<App />)

    const nashvillePanel = screen.getByRole('region', { name: 'Nashville number system' })
    const gButtons = within(nashvillePanel).getAllByRole('button', { name: 'G' })
    const keyButton = gButtons.find((button) => button.classList.contains('key-chip')) ?? gButtons[0]
    await user.click(keyButton)
    expect(screen.getByText('Active Key')).toBeInTheDocument()
    expect(screen.getAllByText('G').length).toBeGreaterThan(0)

    const capoSelect = screen.getByLabelText('New Tuning Capo')
    await user.selectOptions(capoSelect, '2')

    expect(screen.getByText(/with capo at fret 2/i)).toBeInTheDocument()
    expect(screen.getByText(/capo at 2/i)).toBeInTheDocument()
  })
})
