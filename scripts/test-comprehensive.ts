import {
  mapDbToEmployee,
  mapEmployeeToDb,
  isValidUuid,
  generateUuid,
  getEmployees,
  saveEmployee,
  deleteEmployee,
  archiveEmployee,
  restoreEmployee,
  calculateWorkingHours,
} from '../src/lib/storage';
import { safeLower, safeUpper, safeTrim, safeIncludes, safeInitial } from '../src/lib/safeStrings';
import { isMasterAdminEmail } from '../src/context/AuthContext';

console.log('=== STARTING COMPREHENSIVE SSP STABILITY & DATA AUDIT ===\n');

// 1. Test Defensive String Utilities
console.log('Test 1: Safe String Utilities with null/undefined');
if (safeLower(null) !== '' || safeLower(undefined) !== '') throw new Error('safeLower failed on null/undefined');
if (safeUpper(null) !== '' || safeUpper(undefined) !== '') throw new Error('safeUpper failed on null/undefined');
if (safeTrim(null) !== '' || safeTrim(undefined) !== '') throw new Error('safeTrim failed on null/undefined');
if (safeIncludes(null, 'test') || !safeIncludes('Ananya Rahman', 'ananya')) throw new Error('safeIncludes failed');
if (safeInitial(null, 'A') !== 'A' || safeInitial('', 'A') !== 'A' || safeInitial('Ananya', 'A') !== 'A') throw new Error('safeInitial failed');
console.log('  ✓ Safe string utilities are 100% crash-proof against null/undefined.');

// 2. Test UUID Validation and Generation
console.log('\nTest 2: UUID Validation & Generation');
const testUuid = generateUuid();
if (!isValidUuid(testUuid)) throw new Error(`generateUuid produced invalid UUID: ${testUuid}`);
if (isValidUuid('emp-seed-1') || isValidUuid('SSP-001') || isValidUuid(null)) throw new Error('isValidUuid incorrectly validated non-uuid');
console.log(`  ✓ UUID generator produce valid UUID format: ${testUuid}`);

// 3. Test Database Field Mapping (Supabase Schema)
console.log('\nTest 3: Database Field Mapping (Supabase Schema)');
const dbRowFromSupabase = {
  id: 'a1111111-2222-3333-4444-555555555555',
  profile_id: null,
  employee_code: 'SSP-001',
  full_name: 'Ananya Rahman',
  designation: 'Head of Student Support Team',
  department: 'Student Support Team',
  phone: '01711002233',
  email: 'rahman.ononnaa@gmail.com',
  joining_date: '2024-01-01',
  status: 'Active',
  notes: 'Team Lead',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

const mappedFrontendEmp = mapDbToEmployee(dbRowFromSupabase);
if (mappedFrontendEmp.name !== 'Ananya Rahman' || mappedFrontendEmp.full_name !== 'Ananya Rahman') {
  throw new Error(`Mapping failed: name is ${mappedFrontendEmp.name}`);
}
if (mappedFrontendEmp.position !== 'Head of Student Support Team' || mappedFrontendEmp.designation !== 'Head of Student Support Team') {
  throw new Error(`Mapping failed: position is ${mappedFrontendEmp.position}`);
}
if (mappedFrontendEmp.employee_id !== 'SSP-001' || mappedFrontendEmp.employee_code !== 'SSP-001') {
  throw new Error(`Mapping failed: employee_id is ${mappedFrontendEmp.employee_id}`);
}
console.log('  ✓ Correctly maps database columns (employee_code, full_name, designation) to frontend (employee_id, name, position).');

// 4. Test Extreme Null/Undefined Safety on Mapping
console.log('\nTest 4: Extreme Null/Undefined DB Row Mapping');
const emptyDbRow = {
  id: null,
  profile_id: null,
  employee_code: null,
  full_name: null,
  designation: null,
  department: null,
  phone: null,
  email: null,
  joining_date: null,
  status: null,
  notes: null,
};
const safeEmptyEmp = mapDbToEmployee(emptyDbRow);
if (!safeEmptyEmp.id || !safeEmptyEmp.name || !safeEmptyEmp.position || !safeEmptyEmp.status) {
  throw new Error('mapDbToEmployee failed on completely empty row');
}
// Confirm string calls on this empty object do not throw
safeEmptyEmp.name.toLowerCase();
safeEmptyEmp.employee_id.toLowerCase();
safeEmptyEmp.position.toLowerCase();
console.log('  ✓ Empty/null DB row mapped safely without throwing errors on string operations.');

// 5. Test Reverse Mapping for Supabase Insertion
console.log('\nTest 5: Reverse Mapping for Supabase Upsert');
const frontendEmp = {
  id: 'b1111111-2222-3333-4444-555555555555',
  employee_id: 'SSP-002',
  name: 'Tanvir Hossain',
  position: 'Senior SSP Executive',
  department: 'Student Support Team',
  email: 'tanvir@gmail.com',
  phone: '01811223344',
  joining_date: '2024-03-15',
  status: 'Active' as const,
  notes: 'Notes',
};
const dbRowToSave = mapEmployeeToDb(frontendEmp);
if (dbRowToSave.employee_code !== 'SSP-002' || dbRowToSave.full_name !== 'Tanvir Hossain' || dbRowToSave.designation !== 'Senior SSP Executive') {
  throw new Error('mapEmployeeToDb failed to map frontend aliases to Supabase columns');
}
// Confirm unsupported columns are not included
if ('employee_id' in dbRowToSave || 'position' in dbRowToSave || 'name' in dbRowToSave) {
  throw new Error('mapEmployeeToDb leaked frontend alias columns into DB payload');
}
console.log('  ✓ Reverse mapping produces pure Supabase schema payload matching database table.');

// 6. Test Master Admin Profile Check
console.log('\nTest 6: Master Admin Email Identification');
if (!isMasterAdminEmail('rahman.ononnaa@gmail.com')) throw new Error('rahman.ononnaa@gmail.com not recognized as master admin');
if (!isMasterAdminEmail('ananya@gmail.com')) throw new Error('ananya@gmail.com not recognized as master admin');
if (!isMasterAdminEmail('onuufool@gmail.com')) throw new Error('onuufool@gmail.com not recognized as master admin');
if (isMasterAdminEmail('other@gmail.com')) throw new Error('non-admin recognized as master admin');
console.log('  ✓ Ananya Rahman authorized master accounts correctly recognized.');

// 7. Test calculateWorkingHours Guard
console.log('\nTest 7: calculateWorkingHours Null Safety');
const resEmpty = calculateWorkingHours('', '');
if (resEmpty.workingHours !== 0) throw new Error('calculateWorkingHours failed on empty string');
const resNormal = calculateWorkingHours('10:00', '18:30', 45);
if (resNormal.workingHours !== 7.75) throw new Error(`Working hours failed: expected 7.75, got ${resNormal.workingHours}`);
console.log('  ✓ Working hours calculation is completely defensive and accurate.');

console.log('\n=== ALL COMPREHENSIVE AUDIT TESTS PASSED SUCCESSFULLY! ===');
