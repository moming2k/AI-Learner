/**
 * Utility functions for status-based styling
 * Centralizes the styling logic for viewed/unviewed/not-generated states
 */

export type LinkStatus = 'viewed' | 'unviewed' | 'not-generated';

interface StatusStyleVariant {
  base: string;
  hover: string;
  border: string;
  text: string;
}

const STATUS_STYLES: Record<LinkStatus, StatusStyleVariant> = {
  viewed: {
    base: 'from-green-50 to-emerald-50',
    hover: 'hover:from-green-100 hover:to-emerald-100',
    border: 'border-green-300',
    text: 'text-green-700'
  },
  unviewed: {
    base: 'from-blue-50 to-indigo-50',
    hover: 'hover:from-blue-100 hover:to-indigo-100',
    border: 'border-blue-300',
    text: 'text-blue-700'
  },
  'not-generated': {
    base: 'from-purple-50 to-pink-50',
    hover: 'hover:from-purple-100 hover:to-pink-100',
    border: 'border-purple-300',
    text: 'text-purple-700'
  }
};

/**
 * Get gradient background classes for a given status
 */
export function getStatusGradientClasses(status: LinkStatus): string {
  const styles = STATUS_STYLES[status];
  return `bg-gradient-to-r ${styles.base} border ${styles.border} ${styles.text} ${styles.hover}`;
}

/**
 * Get gradient background classes with hover border for a given status
 */
export function getStatusGradientWithHoverBorder(status: LinkStatus): string {
  const styles = STATUS_STYLES[status];
  return `bg-gradient-to-r ${styles.base} border ${styles.border} ${styles.text} ${styles.hover} hover:border-${status === 'viewed' ? 'green' : status === 'unviewed' ? 'blue' : 'purple'}-400`;
}

/**
 * Get white background with status-based border for a given status
 */
export function getStatusWhiteBackgroundClasses(status: LinkStatus): string {
  const borderColor = status === 'viewed' ? 'green' : status === 'unviewed' ? 'blue' : 'purple';
  const hoverBase = status === 'viewed' 
    ? 'from-green-50 to-emerald-50' 
    : status === 'unviewed' 
    ? 'from-blue-50 to-indigo-50' 
    : 'from-purple-50 to-pink-50';
  const hoverBorder = `${borderColor}-400`;
  
  return `bg-white border border-${borderColor}-300 text-gray-700 hover:bg-gradient-to-r hover:${hoverBase} hover:border-${hoverBorder}`;
}

/**
 * Get icon color classes for external link icon
 */
const STATUS_ICON_COLORS: Record<LinkStatus, string> = {
  viewed: 'text-green-400 group-hover:text-green-600',
  unviewed: 'text-blue-400 group-hover:text-blue-600',
  'not-generated': 'text-purple-400 group-hover:text-purple-600'
};

export function getStatusIconColor(status: LinkStatus): string {
  return STATUS_ICON_COLORS[status];
}

/**
 * Get title text for a given status
 */
export function getStatusTitle(status: LinkStatus, context: 'full' | 'short' = 'full'): string {
  if (context === 'short') {
    return status === 'viewed' 
      ? 'Already viewed' 
      : status === 'unviewed' 
      ? 'Generated but not viewed' 
      : 'Not generated yet';
  }
  
  return status === 'viewed'
    ? 'Already viewed - Click to revisit'
    : status === 'unviewed'
    ? 'Generated but not viewed yet - Click to explore'
    : 'Not generated yet - Click to create';
}

/**
 * Get library grid card classes based on view status and active state
 * Used for grid view in Library component
 */
export function getLibraryGridCardClasses(isViewed: boolean, isActive: boolean): string {
  if (isActive) {
    return isViewed
      ? 'border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 hover:border-green-400 hover:from-green-100 hover:to-emerald-100'
      : 'border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 hover:border-blue-400 hover:from-blue-100 hover:to-indigo-100';
  }
  return isViewed
    ? 'border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 hover:border-green-300 hover:from-green-100 hover:to-emerald-100'
    : 'border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 hover:border-blue-300 hover:from-blue-100 hover:to-indigo-100';
}

/**
 * Get library list card classes based on view status and active state
 * Used for list view in Library component
 */
export function getLibraryListCardClasses(isViewed: boolean, isActive: boolean): string {
  if (isActive) {
    return isViewed
      ? 'border-green-500 bg-gradient-to-r from-green-50 to-emerald-50 hover:border-green-400 hover:from-green-100 hover:to-emerald-100'
      : 'border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 hover:border-blue-400 hover:from-blue-100 hover:to-indigo-100';
  }
  return isViewed
    ? 'border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 hover:border-green-300 hover:from-green-100 hover:to-emerald-100'
    : 'border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 hover:border-blue-300 hover:from-blue-100 hover:to-indigo-100';
}
