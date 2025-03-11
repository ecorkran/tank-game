import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ControlSelector from '../../components/game/ControlSelector';

describe('ControlSelector', () => {
  it('renders both control options', () => {
    const mockSelect = jest.fn();
    render(<ControlSelector onSelect={mockSelect} />);
    
    expect(screen.getByText('Keyboard Controls')).toBeInTheDocument();
    expect(screen.getByText('Mouse Controls')).toBeInTheDocument();
  });

  it('triggers selection callback', async () => {
    const user = userEvent.setup();
    const mockSelect = jest.fn();
    render(<ControlSelector onSelect={mockSelect} />);
    
    await user.click(screen.getByText('Keyboard Controls'));
    expect(mockSelect).toHaveBeenCalledWith('keyboard');
    
    await user.click(screen.getByText('Mouse Controls')); 
    expect(mockSelect).toHaveBeenCalledWith('mouse');
  });
});
