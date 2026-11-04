const MESSAGES: Record<string, string> = {
  shop_unavailable: 'This shop is not accepting orders right now.',
  pricing_unavailable: 'This print option is not priced yet. Please choose another.',
  invalid_phone: 'Please enter a valid phone number (10 to 15 digits).',
  shop_closed: 'This shop is not accepting print orders right now. Please check back shortly.',
  invalid_secret: 'The Razorpay key secret looks too short or too long.',
  invalid_copies: 'Copies must be between 1 and 100.',
  invalid_page_count: 'The page count for this file is not valid.',
  invalid_file_type: 'Only PDF, JPG and PNG files are supported.',
  invalid_file_size: 'Files must be 50 MB or smaller.',
  amount_mismatch: 'The payment did not match your order total. Please try again.',
  not_authorized: 'You do not have permission to do that.',
  order_not_paid: 'This order has not been paid yet.',
  slug_taken: 'That shop link is already taken. Please choose another name for the link.',
  already_registered: 'This account already manages a shop. Open the admin page to continue.',
  invalid_slug: 'The shop link can use only lowercase letters, numbers and dashes (3 to 40 characters).',
  invalid_name: 'Please enter your business name.',
  not_authenticated: 'Please sign in again to continue.',
  'Invalid login credentials': 'Email or password is incorrect.',
  'User already registered': 'An account with this email already exists. Try signing in.',
};

export function getErrorMessage(error: unknown): string {
  const raw =
    typeof error === 'object' && error !== null && 'message' in error
      ? String((error as { message: unknown }).message)
      : '';
  if (MESSAGES[raw]) return MESSAGES[raw];
  if (/failed to fetch|network/i.test(raw)) {
    return 'Network problem. Please check your connection and try again.';
  }
  if (/password/i.test(raw)) return 'Password must be at least 6 characters.';
  return 'Something went wrong. Please try again.';
}
