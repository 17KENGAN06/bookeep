import { Moon, Sun } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/hooks/useTheme';

export function ThemeToggle() {
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="icon-btn"
      data-plain
      aria-label={isDark ? t('common.themeLight') : t('common.themeDark')}
      aria-pressed={isDark}
      title={isDark ? t('common.themeLight') : t('common.themeDark')}
    >
      {isDark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
    </button>
  );
}
