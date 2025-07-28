import React from 'react';
import { useTheme } from '../context/ThemeContext';
import type { SidebarTab } from '../types/sidebar';
import { Files, Search, GitBranch, Bot, Settings } from 'lucide-react';

interface ActivityBarProps {
  activeTab: SidebarTab;
  onTabChange?: (tab: SidebarTab) => void;
}

const tabs: { key: SidebarTab; icon: React.ComponentType<{ size?: number }>; title: string }[] = [
  { key: 'explorer', icon: Files, title: 'Explorer' },
  { key: 'search', icon: Search, title: 'Search' },
  { key: 'git', icon: GitBranch, title: 'Git' },
  { key: 'bot', icon: Bot, title: 'Bot' },
  { key: 'settings', icon: Settings, title: 'Settings' },
];

export const ActivityBar: React.FC<ActivityBarProps> = ({ activeTab, onTabChange }) => {
  const { colors } = useTheme();
  return (
    <div
      className="flex flex-col items-center py-2 space-y-2"
      style={{
        width: '48px',
        backgroundColor: colors.secondary,
        borderRight: `1px solid ${colors.sidebarBorder}`,
        color: colors.sidebarForeground,
      }}
    >
      {
        tabs.length > 0 && tabs.map(({ key, icon: Icon, title }) => {
          const active = key === activeTab;
          return (
            <button
              key={key}
              title={title}
              onClick={() => onTabChange && onTabChange(key)}
              className="p-2 rounded transition-colors"
              style={{
                backgroundColor: active ? colors.active : 'transparent',
                color: active ? colors.textPrimary : colors.textMuted,
              }}
              onMouseEnter={(e) => {
                if (!active) e.currentTarget.style.backgroundColor = colors.hover;
              }}
              onMouseLeave={(e) => {
                if (!active) e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <Icon size={20} />
            </button>
          );
        })
      }
    </div>
  );
};

export default ActivityBar;
