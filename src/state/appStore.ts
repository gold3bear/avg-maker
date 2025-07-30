import { useSyncExternalStore } from 'react';
import type { SidebarTab } from '../types/sidebar';

export type AppMode = 'initializing' | 'welcome' | 'error';

export interface AppState {
  mode: AppMode;
  projectPath: string | null;
  activeFile: string | null;
  view: 'preview' | 'graph';
  sidebarVisible: boolean;
  activeTab: SidebarTab;
  licenseAccepted: boolean;
  showRecoveryModal: boolean;
}

type Listener = () => void;

let state: AppState = {
  mode: 'initializing',
  projectPath: null,
  activeFile: null,
  view: 'preview',
  sidebarVisible: true,
  activeTab: 'explorer',
  licenseAccepted: false,
  showRecoveryModal: false,
};

const listeners = new Set<Listener>();

function setState(update: Partial<AppState>): void {
  state = { ...state, ...update };
  listeners.forEach((l) => l());
}

function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useAppStore<T>(selector: (s: AppState) => T): T {
  return useSyncExternalStore(subscribe, () => selector(state));
}

export const appActions = {
  setMode: (mode: AppMode) => setState({ mode }),
  setProjectPath: (projectPath: string | null) => setState({ projectPath }),
  setActiveFile: (activeFile: string | null) => setState({ activeFile }),
  setView: (view: 'preview' | 'graph') => setState({ view }),
  setSidebarVisible: (sidebarVisible: boolean) => setState({ sidebarVisible }),
  setActiveTab: (activeTab: SidebarTab) => setState({ activeTab }),
  setLicenseAccepted: (accepted: boolean) => setState({ licenseAccepted: accepted }),
  setShowRecoveryModal: (show: boolean) => setState({ showRecoveryModal: show }),
  getState: () => state,
};

export type { AppState as AppStoreState };
