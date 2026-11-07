import React, { createContext, useContext, useEffect, useReducer, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Account, Trade, Payout, Achievement, TabType } from '../types';

type Theme = 'dark' | 'light';

interface AppState {
  accounts: Account[];
  trades: Trade[];
  payouts: Payout[];
  achievements: Achievement[];
  selectedAccountId: string | null;
  activeTab: TabType;
  calendarYear: number;
  calendarMonth: number;
  loading: boolean;
  theme: Theme;
}

type Action =
  | { type: 'SET_ACCOUNTS'; payload: Account[] }
  | { type: 'SET_TRADES'; payload: Trade[] }
  | { type: 'SET_PAYOUTS'; payload: Payout[] }
  | { type: 'SET_ACHIEVEMENTS'; payload: Achievement[] }
  | { type: 'SET_SELECTED_ACCOUNT'; payload: string | null }
  | { type: 'SET_ACTIVE_TAB'; payload: TabType }
  | { type: 'SET_CALENDAR'; payload: { year: number; month: number } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_THEME'; payload: Theme };

const now = new Date();

const initialState: AppState = {
  accounts: [],
  trades: [],
  payouts: [],
  achievements: [],
  selectedAccountId: null,
  activeTab: 'dashboard',
  calendarYear: now.getFullYear(),
  calendarMonth: now.getMonth(),
  loading: true,
  theme: 'dark',
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_ACCOUNTS':
      return { ...state, accounts: action.payload };
    case 'SET_TRADES':
      return { ...state, trades: action.payload };
    case 'SET_PAYOUTS':
      return { ...state, payouts: action.payload };
    case 'SET_ACHIEVEMENTS':
      return { ...state, achievements: action.payload };
    case 'SET_SELECTED_ACCOUNT':
      return { ...state, selectedAccountId: action.payload };
    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.payload };
    case 'SET_CALENDAR':
      return { ...state, calendarYear: action.payload.year, calendarMonth: action.payload.month };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_THEME':
      return { ...state, theme: action.payload };
    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  selectedAccount: Account | null;
  accountTrades: Trade[];
  accountPayouts: Payout[];
  accountAchievements: Achievement[];
  dispatch: React.Dispatch<Action>;
  refreshTrades: () => Promise<void>;
  refreshPayouts: () => Promise<void>;
  refreshAchievements: () => Promise<void>;
  refreshAccounts: () => Promise<void>;
  toggleTheme: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const refreshAccounts = useCallback(async () => {
    const { data } = await supabase.from('accounts').select('*').order('created_at');
    if (data) {
      dispatch({ type: 'SET_ACCOUNTS', payload: data });
      if (data.length > 0 && !state.selectedAccountId) {
        dispatch({ type: 'SET_SELECTED_ACCOUNT', payload: data[0].id });
      }
    }
  }, [state.selectedAccountId]);

  const refreshTrades = useCallback(async () => {
    const { data } = await supabase.from('trades').select('*').order('date').order('created_at');
    if (data) dispatch({ type: 'SET_TRADES', payload: data });
  }, []);

  const refreshPayouts = useCallback(async () => {
    const { data } = await supabase.from('payouts').select('*').order('request_date', { ascending: false });
    if (data) dispatch({ type: 'SET_PAYOUTS', payload: data });
  }, []);

  const refreshAchievements = useCallback(async () => {
    const { data } = await supabase.from('achievements').select('*').order('date', { ascending: false });
    if (data) dispatch({ type: 'SET_ACHIEVEMENTS', payload: data });
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        const { data: accounts } = await supabase.from('accounts').select('*').order('created_at');
        if (mounted && accounts) {
          dispatch({ type: 'SET_ACCOUNTS', payload: accounts });
          if (accounts.length > 0) {
            dispatch({ type: 'SET_SELECTED_ACCOUNT', payload: accounts[0].id });
          }
        }
        const [tradesRes, payoutsRes, achievementsRes] = await Promise.all([
          supabase.from('trades').select('*').order('date').order('created_at'),
          supabase.from('payouts').select('*').order('request_date', { ascending: false }),
          supabase.from('achievements').select('*').order('date', { ascending: false }),
        ]);
        if (mounted) {
          if (tradesRes.data) dispatch({ type: 'SET_TRADES', payload: tradesRes.data });
          if (payoutsRes.data) dispatch({ type: 'SET_PAYOUTS', payload: payoutsRes.data });
          if (achievementsRes.data) dispatch({ type: 'SET_ACHIEVEMENTS', payload: achievementsRes.data });
        }
      } catch (err) {
        console.error('Failed to load initial data:', err);
      } finally {
        if (mounted) {
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      }
    })();

    const timer = setTimeout(() => {
      if (mounted) dispatch({ type: 'SET_LOADING', payload: false });
    }, 4000);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, []);

  const selectedAccount = state.accounts.find((a) => a.id === state.selectedAccountId) ?? null;
  const accountTrades = state.trades.filter((t) => t.account_id === state.selectedAccountId);
  const accountPayouts = state.payouts.filter((p) => p.account_id === state.selectedAccountId);
  const accountAchievements = state.achievements.filter((a) => a.account_id === state.selectedAccountId);

  const toggleTheme = useCallback(() => {
    dispatch({ type: 'SET_THEME', payload: state.theme === 'dark' ? 'light' : 'dark' });
  }, [state.theme]);

  // Apply theme class to document
  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(state.theme);
  }, [state.theme]);

  return (
    <AppContext.Provider
      value={{
        state,
        selectedAccount,
        accountTrades,
        accountPayouts,
        accountAchievements,
        dispatch,
        refreshTrades,
        refreshPayouts,
        refreshAchievements,
        refreshAccounts,
        toggleTheme,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
