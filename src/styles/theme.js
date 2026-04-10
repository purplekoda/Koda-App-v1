const theme = {
  colors: {
    // Primary brand
    teal: '#1D9E75',
    tealLight: '#E1F5EE',
    tealMid: '#9FE1CB',
    tealDark: '#085041',

    // AI accent
    purple: '#7F77DD',
    purpleLight: '#EEEDFE',
    purpleMid: '#CECBF6',
    purpleDark: '#3C3489',

    // Amber (breakfast, warnings)
    amber: '#BA7517',
    amberLight: '#FAEEDA',
    amberMid: '#FAC775',
    amberDark: '#633806',

    // Coral (urgent, expiring)
    coral: '#D85A30',
    coralLight: '#FAECE7',
    coralMid: '#F0997B',

    // Blue (calendar, info)
    blue: '#185FA5',
    blueLight: '#E6F1FB',

    // Gray (neutral, structural)
    gray: '#5F5E5A',
    grayLight: '#F1EFE8',
    grayMid: '#888888',
    grayDark: '#444441',

    // Freshness (pantry scan)
    freshGreen: '#5DCAA5',
    freshGreenBg: '#E1F5EE',
    expiringAmber: '#EF9F27',
    expiringAmberBg: '#FAEEDA',
    lowCoral: '#F0997B',
    lowCoralBg: '#FAECE7',

    // UI
    background: '#FAFAF8',
    surface: '#FFFFFF',
    textPrimary: '#1F2937',
    textSecondary: '#6B7280',
    textMuted: '#9CA3AF',
    border: '#E5E7EB',
    borderLight: '#F3F4F6',

    // Semantic
    success: '#1D9E75',
    warning: '#BA7517',
    error: '#D85A30',
    info: '#185FA5',
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    xxl: '32px',
    xxxl: '48px',
  },
  radii: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    pill: '99px',
  },
  shadows: {
    card: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
    elevated: '0 4px 12px rgba(0,0,0,0.08)',
    input: '0 2px 8px rgba(0,0,0,0.04)',
  },
  fonts: {
    body: "var(--font-inter), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  fontSizes: {
    xs: '11px',
    sm: '12px',
    md: '12px',
    body: '16px',
    lg: '22px',
    xl: '28px',
    xxl: '36px',
  },
  breakpoints: {
    mobile: '768px',
    tablet: '1024px',
    desktop: '1280px',
  },
  touchTarget: '44px',
  bottomNavHeight: '48px',
  sidebarWidth: '240px',
}

export default theme
