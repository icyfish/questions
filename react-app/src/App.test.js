import { render, screen } from '@testing-library/react';
import App from './App';

test('renders react-app link', () => {
  render(<App />);
  const linkElement = screen.getByText(/react-app/i);
  expect(linkElement).toBeInTheDocument();
});
