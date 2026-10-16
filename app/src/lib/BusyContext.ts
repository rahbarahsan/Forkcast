import { createContext, useContext } from 'react';

export const BusyContext = createContext(false);
export const useBusy = () => useContext(BusyContext);
