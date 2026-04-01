export const desktopNavigationItems = [
  { id: 'home', label: 'Dashboard', href: '#home', iconName: 'dashboard' },
  { id: 'rules', label: 'Enforcement', href: '#rules', iconName: 'lock' },
  { id: 'violations', label: 'Violations', href: '#violations', iconName: 'alert' },
  { id: 'activity', label: 'Activity', href: '#activity', iconName: 'analytics' },
  { id: 'settings', label: 'Settings', href: '#settings', iconName: 'settings' }
];

const desktopSectionIds = new Set(desktopNavigationItems.map((item) => item.id));

export function resolveDesktopNavigationPath(activePath) {
  const normalizedPath = typeof activePath === 'string' && activePath.trim() ? activePath.trim() : '#home';
  const normalizedSectionId = normalizedPath.replace(/^#/, '');

  if (!desktopSectionIds.has(normalizedSectionId)) {
    return '#home';
  }

  return `#${normalizedSectionId}`;
}

export function resolveDesktopSectionId(activePath) {
  return resolveDesktopNavigationPath(activePath).replace(/^#/, '');
}
