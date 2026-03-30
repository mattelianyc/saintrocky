import {
  mdiAccount,
  mdiAlert,
  mdiAlertCircle,
  mdiAccountGroupOutline,
  mdiArchiveArrowDownOutline,
  mdiArrowLeft,
  mdiArrowRight,
  mdiCalendar,
  mdiChartLine,
  mdiCheck,
  mdiChevronLeft,
  mdiChevronRight,
  mdiChatOutline,
  mdiClose,
  mdiCog,
  mdiCreditCardOutline,
  mdiEmail,
  mdiEyeOutline,
  mdiFileDocumentOutline,
  mdiHome,
  mdiInformation,
  mdiLightbulbOutline,
  mdiLock,
  mdiLogout,
  mdiPauseCircleOutline,
  mdiPencilOutline,
  mdiPlayCircleOutline,
  mdiSend,
  mdiMagnify,
  mdiMenu,
  mdiMinus,
  mdiPlus,
  mdiShieldCheckOutline,
  mdiSwapHorizontal,
  mdiTagOutline,
  mdiTrophy,
  mdiViewDashboard,
  mdiWallet
} from '@mdi/js';

const iconPathMap = {
  add: mdiPlus,
  remove: mdiMinus,
  close: mdiClose,
  check: mdiCheck,
  chevronLeft: mdiChevronLeft,
  chevronRight: mdiChevronRight,
  arrowLeft: mdiArrowLeft,
  arrowRight: mdiArrowRight,
  search: mdiMagnify,
  settings: mdiCog,
  user: mdiAccount,
  users: mdiAccountGroupOutline,
  home: mdiHome,
  dashboard: mdiViewDashboard,
  menu: mdiMenu,
  blog: mdiFileDocumentOutline,
  posts: mdiFileDocumentOutline,
  categories: mdiTagOutline,
  authors: mdiAccount,
  calendar: mdiCalendar,
  bookings: mdiCalendar,
  lock: mdiLock,
  email: mdiEmail,
  alert: mdiAlertCircle,
  info: mdiInformation,
  analytics: mdiChartLine,
  payments: mdiCreditCardOutline,
  seo: mdiMagnify,
  warning: mdiAlert,
  chat: mdiChatOutline,
  logout: mdiLogout,
  send: mdiSend,
  wallet: mdiWallet,
  trades: mdiSwapHorizontal,
  trophy: mdiTrophy,
  tactics: mdiShieldCheckOutline,
  strategy: mdiLightbulbOutline,
  edit: mdiPencilOutline,
  inspect: mdiEyeOutline,
  pause: mdiPauseCircleOutline,
  activate: mdiPlayCircleOutline,
  archive: mdiArchiveArrowDownOutline
};

export const iconNames = Object.keys(iconPathMap);

export function Icon({ name, size = 20, color = 'currentColor', className = '', title = '' } = {}) {
  const path = iconPathMap[name];
  if (!path) {
    if (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn(`[icons] Unknown icon name: ${String(name)}`);
    }
    return null;
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      role={title ? 'img' : 'presentation'}
      aria-hidden={title ? undefined : true}
      className={className}
    >
      {title ? <title>{title}</title> : null}
      <path fill={color} d={path} />
    </svg>
  );
}

