/**
 * Signature Validator - Prevents tampering with suspicious app signatures
 * Uses cryptographic hashing to ensure integrity of the signature list
 * This runs CLIENT-SIDE on the student's machine to detect tampering
 */
import crypto from 'crypto';

// Secret salt - Students can't generate valid hashes without knowing this exact value
const SIGNATURE_SALT = 'exam_monitor_secure_v1_2024_hackman_detector_salt_key';

/**
 * Calculate SHA-256 hash of the signature data
 * @param {Array} signatures - Array of signature objects
 * @returns {string} Hex string of the hash
 */
export function calculateSignatureHash(signatures) {
  // Normalize the signatures to ensure consistent hashing
  const normalized = signatures.map(sig => ({
    label: sig.label.trim(),
    patterns: sig.patterns.map(p => p.trim().toLowerCase()).sort()
  })).sort((a, b) => a.label.localeCompare(b.label));
  
  const dataString = JSON.stringify(normalized);
  const hash = crypto
    .createHmac('sha256', SIGNATURE_SALT)
    .update(dataString)
    .digest('hex');
  
  return hash;
}

/**
 * Verify that signature list hasn't been tampered with
 * @param {Array} signatures - Array of signature objects to verify
 * @param {string} expectedHash - The known good hash
 * @returns {boolean} True if signatures are valid
 */
export function verifySignatureIntegrity(signatures, expectedHash) {
  const currentHash = calculateSignatureHash(signatures);
  
  // Use timing-safe comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(currentHash, 'hex'),
      Buffer.from(expectedHash, 'hex')
    );
  } catch (error) {
    // If lengths don't match, timingSafeEqual throws
    return false;
  }
}

/**
 * Validate signatures and throw error if tampered
 * @param {Array} signatures - Signatures to validate
 * @param {string} expectedHash - Expected hash value
 * @throws {Error} If signatures have been modified
 */
export function validateOrThrow(signatures, expectedHash) {
  if (!verifySignatureIntegrity(signatures, expectedHash)) {
    // Log the tampering attempt
    console.error('🚨 SECURITY ALERT: Signature tampering detected!');
    console.error('Expected hash:', expectedHash);
    console.error('Current hash:', calculateSignatureHash(signatures));
    
    throw new Error(
      'Signature validation failed. The application appears to have been tampered with. ' +
      'Please contact your administrator or reinstall the application.'
    );
  }
  
  return true;
}

/**
 * Generate a new hash for updated signatures (admin tool only)
 * Run this when you legitimately update the signature list
 * @param {Array} signatures - New signature list
 */
export function generateNewHash(signatures) {
  const hash = calculateSignatureHash(signatures);
  console.log('\n=== NEW SIGNATURE HASH ===');
  console.log('Paste this into suspiciousApps.js as SIGNATURE_HASH:');
  console.log(`export const SIGNATURE_HASH = "${hash}";`);
  console.log('===========================\n');
  return hash;
}
