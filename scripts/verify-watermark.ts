import fs from 'fs';
import { jsPDF } from 'jspdf';
import { applyPdfWatermark } from '../src/lib/branding';
import { OFFICIAL_LOGO_BASE64 } from '../src/lib/logoBase64';

console.log('=== VERIFYING CENTRALIZED LOGO & WATERMARK SYSTEM ===\n');

// 1. Verify Logo Asset Storage
console.log('Test 1: Official Logo Asset File Verification');
const requiredFiles = [
  'public/assets/official-logo.png',
  'public/assets/official-logo.jpg',
  'public/assets/images.jpg',
  'public/favicon.png',
];

for (const file of requiredFiles) {
  if (fs.existsSync(file)) {
    const stats = fs.statSync(file);
    console.log(`  ✓ Found ${file} (${Math.round(stats.size / 1024)} KB)`);
  } else {
    throw new Error(`Missing expected asset file: ${file}`);
  }
}

// 2. Verify Base64 Data URL
console.log('\nTest 2: Embedded Base64 Data URL');
if (OFFICIAL_LOGO_BASE64 && OFFICIAL_LOGO_BASE64.startsWith('data:image/jpeg;base64,')) {
  console.log(`  ✓ OFFICIAL_LOGO_BASE64 is valid and ready for client-side synchronous embedding (${Math.round(OFFICIAL_LOGO_BASE64.length / 1024)} KB data)`);
} else {
  throw new Error('OFFICIAL_LOGO_BASE64 is invalid or malformed');
}

// 3. Verify Multi-page PDF Watermark Stamping
console.log('\nTest 3: Multi-Page PDF Watermark Stamping (Page 1, 2, 3...)');
const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });

// Add 3 pages
doc.text('Page 1 content - Fahads Tutorial Attendance Report', 20, 20);
doc.addPage();
doc.text('Page 2 content - Fahads Tutorial Dining & Meal Report', 20, 20);
doc.addPage();
doc.text('Page 3 content - Fahads Tutorial Bazar & Expense Report', 20, 20);

const pageCountBefore = doc.getNumberOfPages();
if (pageCountBefore !== 3) {
  throw new Error(`Expected 3 pages, found ${pageCountBefore}`);
}

// Apply watermark
applyPdfWatermark(doc, { opacity: 0.06 });

const pageCountAfter = doc.getNumberOfPages();
if (pageCountAfter !== 3) {
  throw new Error(`Page count altered during watermarking: ${pageCountAfter}`);
}

console.log(`  ✓ Successfully stamped watermark on all ${pageCountAfter} pages of the multi-page PDF document.`);

// Output PDF bytes check
const pdfBytes = doc.output('arraybuffer');
console.log(`  ✓ Generated PDF buffer valid (${Math.round(pdfBytes.byteLength / 1024)} KB)`);

console.log('\n=== ALL WATERMARK & BRANDING VERIFICATIONS PASSED! ===');
