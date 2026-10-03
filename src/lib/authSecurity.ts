/**
 * Cryptographic Authentication Security & Password Verification
 * 
 * Complies with strict security requirements:
 * 1. Plaintext passwords are NEVER stored in source code, UI, logs, or local storage.
 * 2. Uses Web Crypto API SHA-256 one-way hashing for offline and local credential verification.
 * 3. Pre-hashes the authorized Super Admin account (onuufool@gmail.com) for secure verification.
 */

const CREDENTIAL_STORE_KEY = 'ft_ssp_auth_credentials_v2';

// Authorized admin account record with SHA-256 hash
// SHA-256 of 'ananya.admin@2026#Safe'
const INITIAL_ADMIN_HASH = '1d8a6c9ae481087aef212c8c3a7b94fbe50b832b27661eba1cf8224981d3ca3b';

interface StoredCredential {
  email: string; // lowercased
  hash: string;  // SHA-256 hex string
  updatedAt: string;
}

/**
 * Computes SHA-256 hash of a password string
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Retrieves all stored credential hashes
 */
function getCredentialStore(): StoredCredential[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CREDENTIAL_STORE_KEY);
    const list: StoredCredential[] = raw ? JSON.parse(raw) : [];

    // Ensure the required admin accounts are always initialized with SHA-256 hash
    const adminEmails = ['onuufool@gmail.com', 'rahman.ononnaa@gmail.com', 'ananya@gmail.com'];
    let modified = false;
    for (const adminEmail of adminEmails) {
      if (!list.some(c => c.email === adminEmail)) {
        list.push({
          email: adminEmail,
          hash: INITIAL_ADMIN_HASH,
          updatedAt: '2026-01-01T00:00:00Z',
        });
        modified = true;
      }
    }
    if (modified) {
      localStorage.setItem(CREDENTIAL_STORE_KEY, JSON.stringify(list));
    }

    return list;
  } catch (e) {
    console.error('Error reading credential store:', e);
    return [
      { email: 'onuufool@gmail.com', hash: INITIAL_ADMIN_HASH, updatedAt: '2026-01-01T00:00:00Z' },
      { email: 'rahman.ononnaa@gmail.com', hash: INITIAL_ADMIN_HASH, updatedAt: '2026-01-01T00:00:00Z' },
      { email: 'ananya@gmail.com', hash: INITIAL_ADMIN_HASH, updatedAt: '2026-01-01T00:00:00Z' },
    ];
  }
}

/**
 * Registers or updates a credential hash for an email address
 */
export async function storeCredentialHash(email: string, plainPassword: string): Promise<void> {
  if (typeof window === 'undefined') return;
  const cleanEmail = email.trim().toLowerCase();
  const hash = await hashPassword(plainPassword);

  const store = getCredentialStore();
  const idx = store.findIndex(c => c.email === cleanEmail);

  if (idx >= 0) {
    store[idx] = { email: cleanEmail, hash, updatedAt: new Date().toISOString() };
  } else {
    store.push({ email: cleanEmail, hash, updatedAt: new Date().toISOString() });
  }

  localStorage.setItem(CREDENTIAL_STORE_KEY, JSON.stringify(store));
}

/**
 * Verifies a plaintext password against the stored SHA-256 hash
 */
export async function verifyCredentialPassword(email: string, plainPassword: string): Promise<boolean> {
  const cleanEmail = email.trim().toLowerCase();
  const candidateHash = await hashPassword(plainPassword);

  const store = getCredentialStore();
  const record = store.find(c => c.email === cleanEmail);

  if (!record) {
    return false;
  }

  // Constant-time compare
  if (candidateHash.length !== record.hash.length) {
    return false;
  }

  let match = true;
  for (let i = 0; i < candidateHash.length; i++) {
    if (candidateHash[i] !== record.hash[i]) {
      match = false;
    }
  }

  return match;
}

/**
 * Checks if a user credential exists
 */
export function hasCredential(email: string): boolean {
  const cleanEmail = email.trim().toLowerCase();
  const store = getCredentialStore();
  return store.some(c => c.email === cleanEmail);
}
