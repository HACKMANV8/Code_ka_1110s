/**
 * Test script to demonstrate signature tampering detection
 * Run this to see what happens when someone tries to modify the signatures
 */
import { SUSPICIOUS_PROCESS_SIGNATURES, SIGNATURE_HASH } from './src/suspiciousApps.js';
import { validateOrThrow, calculateSignatureHash } from './src/signatureValidator.js';

console.log('=== Signature Integrity Test ===\n');

// Test 1: Validate original signatures
console.log('Test 1: Validating original signatures...');
try {
  validateOrThrow(SUSPICIOUS_PROCESS_SIGNATURES, SIGNATURE_HASH);
  console.log('✅ PASSED: Original signatures are valid\n');
} catch (error) {
  console.log('❌ FAILED:', error.message, '\n');
}

// Test 2: Simulate student tampering (removing ChatGPT)
console.log('Test 2: Simulating tampering (removing ChatGPT signature)...');
const tamperedSignatures = SUSPICIOUS_PROCESS_SIGNATURES.filter(
  sig => sig.label !== 'ChatGPT Desktop'
);
try {
  validateOrThrow(tamperedSignatures, SIGNATURE_HASH);
  console.log('❌ FAILED: Tampered signatures passed validation (security breach!)\n');
} catch (error) {
  console.log('✅ PASSED: Tampering detected successfully!');
  console.log('   Error message:', error.message, '\n');
}

// Test 3: Simulate student adding fake signature
console.log('Test 3: Simulating tampering (adding fake signature)...');
const fakeSignatures = [
  ...SUSPICIOUS_PROCESS_SIGNATURES,
  { label: 'Fake App', patterns: ['fake'] }
];
try {
  validateOrThrow(fakeSignatures, SIGNATURE_HASH);
  console.log('❌ FAILED: Modified signatures passed validation (security breach!)\n');
} catch (error) {
  console.log('✅ PASSED: Tampering detected successfully!');
  console.log('   Error message:', error.message, '\n');
}

// Test 4: Show hash comparison
console.log('Test 4: Hash comparison');
console.log('   Expected hash:', SIGNATURE_HASH);
console.log('   Original hash:', calculateSignatureHash(SUSPICIOUS_PROCESS_SIGNATURES));
console.log('   Tampered hash:', calculateSignatureHash(tamperedSignatures));
console.log('\n=== All Tests Complete ===');
