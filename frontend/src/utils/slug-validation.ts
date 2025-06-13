/**
 * Tenant Slug Validation Utilities
 * 
 * Tenant slugs should be:
 * - Lowercase only
 * - No diacritics (accented characters)
 * - Only letters (a-z) and hyphens (-)
 * - Must start and end with a letter
 * - Between 3-30 characters
 */

/**
 * Remove diacritics from a string and convert to lowercase
 */
export function removeDiacritics(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .toLowerCase();
}

/**
 * Convert a string to a valid tenant slug format
 */
export function generateSlug(name: string): string {
  return removeDiacritics(name)
    .replace(/[^a-z0-9\s-]/g, '') // Remove non-alphanumeric except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    .substring(0, 30); // Limit to 30 characters
}

/**
 * Validate if a string is a valid tenant slug
 */
export function isValidTenantSlug(slug: string): boolean {
  if (!slug || typeof slug !== 'string') {
    return false;
  }

  // Check length
  if (slug.length < 3 || slug.length > 30) {
    return false;
  }

  // Check format: only lowercase letters and hyphens, must start and end with letter
  const slugRegex = /^[a-z][a-z-]*[a-z]$|^[a-z]$/;
  if (!slugRegex.test(slug)) {
    return false;
  }

  // Check for consecutive hyphens
  if (slug.includes('--')) {
    return false;
  }

  return true;
}

/**
 * Get validation error message for invalid slug
 */
export function getSlugValidationError(slug: string): string | null {
  if (!slug || typeof slug !== 'string') {
    return 'Slug không được để trống';
  }

  if (slug.length < 3) {
    return 'Slug phải có ít nhất 3 ký tự';
  }

  if (slug.length > 30) {
    return 'Slug không được vượt quá 30 ký tự';
  }

  if (!/^[a-z-]+$/.test(slug)) {
    return 'Slug chỉ được chứa chữ cái thường và dấu gạch ngang';
  }

  if (!/^[a-z]/.test(slug)) {
    return 'Slug phải bắt đầu bằng chữ cái';
  }

  if (!/[a-z]$/.test(slug)) {
    return 'Slug phải kết thúc bằng chữ cái';
  }

  if (slug.includes('--')) {
    return 'Slug không được chứa hai dấu gạch ngang liên tiếp';
  }

  return null;
}

/**
 * Reserved slugs that cannot be used as tenant slugs
 */
export const RESERVED_SLUGS = [
  'api',
  'www',
  'admin',
  'system',
  'dashboard',
  'auth',
  'signin',
  'signup',
  'register',
  'login',
  'logout',
  'account',
  'settings',
  'help',
  'support',
  'docs',
  'documentation',
  'blog',
  'news',
  'about',
  'contact',
  'privacy',
  'terms',
  'legal',
  'security',
  'status',
  'health',
  'ping',
  'assets',
  'static',
  'public',
  'cdn',
  'media',
  'images',
  'js',
  'css',
  'files',
  'download',
  'uploads',
  'webhooks',
  'callback',
  'oauth',
  'sso',
  'saml',
  'ldap',
  'mail',
  'email',
  'smtp',
  'ftp',
  'sftp',
  'ssh',
  'git',
  'svn',
  'test',
  'testing',
  'dev',
  'development',
  'staging',
  'prod',
  'production',
  'demo',
  'sandbox',
  'preview',
  'beta',
  'alpha',
  'v1',
  'v2',
  'v3',
  'app',
  'apps',
  'mobile',
  'ios',
  'android',
  'web',
  'site',
  'website',
];

/**
 * Check if a slug is reserved
 */
export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.includes(slug.toLowerCase());
}

/**
 * Validate tenant slug with all checks including reserved words
 */
export function validateTenantSlug(slug: string): { valid: boolean; error?: string } {
  const formatError = getSlugValidationError(slug);
  if (formatError) {
    return { valid: false, error: formatError };
  }

  if (isReservedSlug(slug)) {
    return { valid: false, error: 'Slug này đã được hệ thống sử dụng, vui lòng chọn slug khác' };
  }

  return { valid: true };
}
