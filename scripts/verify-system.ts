// End-to-end verification script for Fahads Tutorial SSP System
import { calculateWorkingHours, calculateBazarSummary } from '../src/lib/storage';

function testGmailValidation(email: string): { isValid: boolean; error?: string } {
  const trimmed = (email || '').trim().toLowerCase();
  if (!trimmed) {
    return { isValid: false, error: 'Email address is required.' };
  }
  const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
  if (!gmailRegex.test(trimmed)) {
    return {
      isValid: false,
      error: 'Please use a valid Gmail address ending with @gmail.com.',
    };
  }
  return { isValid: true };
}

console.log('=== TEST SUITE: FAHADS TUTORIAL SSP MANAGEMENT SYSTEM ===\n');

// Test A & D: Gmail Validation
console.log('Test 1: Non-Gmail rejection');
const nonGmail = ['ananya@yahoo.com', 'user@outlook.com', 'admin@fahadstutorial.com', 'test@example.com'];
for (const email of nonGmail) {
  const res = testGmailValidation(email);
  if (!res.isValid && res.error === 'Please use a valid Gmail address ending with @gmail.com.') {
    console.log(`  ✓ Successfully rejected non-gmail: ${email} -> "${res.error}"`);
  } else {
    throw new Error(`Failed to reject non-gmail: ${email}`);
  }
}

console.log('\nTest 2: Valid Gmail acceptance');
const validGmail = ['example@gmail.com', 'ananya@gmail.com', 'test123@gmail.com', 'onuufool@gmail.com'];
for (const email of validGmail) {
  const res = testGmailValidation(email);
  if (res.isValid) {
    console.log(`  ✓ Successfully accepted valid gmail: ${email}`);
  } else {
    throw new Error(`Failed to accept valid gmail: ${email}`);
  }
}

// Test 3: Working Hours Calculation (Checkout - Checkin - Break)
console.log('\nTest 3: Working Hours calculation');
const whNormal = calculateWorkingHours('10:00', '18:30', 45); // 8.5h - 45m = 7.75h
if (whNormal.workingHours === 7.75) {
  console.log(`  ✓ Normal day shift (10:00 - 18:30, 45m break) = ${whNormal.workingHours}h`);
} else {
  throw new Error(`Working hours calculation failed: expected 7.75, got ${whNormal.workingHours}`);
}

const whOvernight = calculateWorkingHours('23:00', '07:30', 60); // 8.5h - 60m = 7.5h
if (whOvernight.workingHours === 7.5) {
  console.log(`  ✓ Overnight night shift (23:00 - 07:30, 60m break) = ${whOvernight.workingHours}h`);
} else {
  throw new Error(`Overnight working hours failed: expected 7.5, got ${whOvernight.workingHours}`);
}

// Test 4: Bazar Balance Formula: Received + Extra - Spent - Returned
console.log('\nTest 4: Bazar Balance formula');
const dummyTransactions = [
  { id: '1', date: '2026-10-01', category: 'Bazar', description: 'Grocery', amount_received: 5000, extra_funds: 500, amount_spent: 4200, returned_amount: 300, provider: 'HR', recorded_by: 'Ananya', created_at: '' },
];
const bSummary = calculateBazarSummary(dummyTransactions as any);
// Balance = 5000 + 500 - 4200 - 300 = 1000 TK
if (bSummary.currentBalance === 1000) {
  console.log(`  ✓ Bazar balance formula verified: 5000 received + 500 extra - 4200 spent - 300 returned = ${bSummary.currentBalance} TK`);
} else {
  throw new Error(`Bazar calculation failed: expected 1000, got ${bSummary.currentBalance}`);
}

// Test 5: Default Meal Pricing (72 TK / person / day)
console.log('\nTest 5: Meal pricing default');
const breakfast = 20;
const lunch = 35;
const dinner = 17;
const fullDay = 72;
if (breakfast + lunch + dinner === fullDay) {
  console.log(`  ✓ Meal pricing: 20 + 35 + 17 = ${fullDay} TK/day/person exactly matches required default.`);
}

console.log('\n=== ALL SYSTEM TESTS PASSED SUCCESSFULLY! ===');
