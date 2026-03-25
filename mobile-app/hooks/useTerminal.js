import { useContext } from 'react';
import { TerminalContext } from '../context/TerminalContext';

export const useTerminal = () => {
  const context = useContext(TerminalContext);
  if (!context) {
    throw new Error('useTerminal must be used within a TerminalProvider');
  }
  return context;
};
