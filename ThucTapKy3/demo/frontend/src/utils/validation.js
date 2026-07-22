// Shared client-side validation helpers, reused by every form instead of re-deriving the same
// rule per component. Mirrors the backend's Jakarta Bean Validation constraints exactly
// (RegisterRequest/CreateStaffRequest/UpdateStaffRequest's @Email; password fields' @Size(min=8),
// bumped from 6 on Day 10 - see docs.txt KEY DECISIONS) so a client-side rejection always agrees
// with what the server would also reject, never stricter or looser.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email) {
  return EMAIL_RE.test(email.trim());
}

export const PASSWORD_MIN_LENGTH = 8;
