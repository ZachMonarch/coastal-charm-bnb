/**
 * Script to upload brand images to Vercel Blob for use in email signatures and BIMI
 * 
 * Run with: node --env-file-if-exists=/vercel/share/.env.project scripts/upload-brand-images.mjs
 */

import { put, list } from '@vercel/blob';

// Brand images to upload - using the provided logo files
const BRAND_IMAGES = [
  {
    name: 'monarch-logo-dark-bg.png',
    description: 'Monarch Property Management logo on dark background',
    sourceUrl: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/IMG_3376-2A5u92sOMLlH99v1dYSNpOKjncxXhe.png',
  },
  {
    name: 'monarch-logo-light-bg.jpeg',
    description: 'Monarch Property Management logo on light/white background',
    sourceUrl: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/IMG_3377-eAfalIWVuFmKd8M8dzmAsyrCkDE3CW.jpeg',
  },
];

async function fetchImageAsBuffer(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image from ${url}: ${response.status}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

async function uploadBrandImages() {
  console.log('Starting brand image upload to Vercel Blob CDN...\n');
  console.log('Target domain: monarchpropertymmgt.online\n');

  const results = [];

  for (const image of BRAND_IMAGES) {
    try {
      console.log(`Uploading: ${image.name}`);
      console.log(`  Source: ${image.sourceUrl}`);
      
      // Fetch the image
      const imageBuffer = await fetchImageAsBuffer(image.sourceUrl);
      console.log(`  Fetched: ${(imageBuffer.length / 1024).toFixed(2)} KB`);

      // Upload to Vercel Blob with public access
      // Using a consistent folder structure for brand assets
      const blob = await put(`brand/monarchpropertymmgt/${image.name}`, imageBuffer, {
        access: 'public',
        contentType: image.name.endsWith('.png') ? 'image/png' : 'image/jpeg',
        addRandomSuffix: false, // Keep stable URLs for email signatures and BIMI
      });

      console.log(`  Uploaded successfully!`);
      console.log(`  Public URL: ${blob.url}\n`);

      results.push({
        name: image.name,
        description: image.description,
        url: blob.url,
        size: imageBuffer.length,
      });
    } catch (error) {
      console.error(`  Error uploading ${image.name}:`, error.message);
    }
  }

  // Print summary
  console.log('\n========================================');
  console.log('CDN UPLOAD COMPLETE');
  console.log('========================================\n');
  console.log('Uploaded Images for monarchpropertymmgt.online:\n');
  
  for (const result of results) {
    console.log(`${result.name}`);
    console.log(`  Description: ${result.description}`);
    console.log(`  Size: ${(result.size / 1024).toFixed(2)} KB`);
    console.log(`  CDN URL: ${result.url}`);
    console.log('');
  }

  console.log('\n========================================');
  console.log('USAGE INSTRUCTIONS');
  console.log('========================================\n');
  
  console.log('For Email Signatures:');
  console.log('  Use the CDN URLs directly in your HTML email signature:');
  console.log('  <img src="[CDN_URL]" alt="Monarch Property Management" />\n');
  
  console.log('For BIMI (Brand Indicators for Message Identification):');
  console.log('  1. Convert the logo to SVG Tiny PS format (required for BIMI)');
  console.log('  2. Host the SVG at a publicly accessible HTTPS URL');
  console.log('  3. Add a BIMI DNS record:');
  console.log('     default._bimi.monarchpropertymmgt.online TXT "v=BIMI1; l=[SVG_URL]"');
  console.log('  4. Optionally add a VMC (Verified Mark Certificate) for broader support\n');

  console.log('Note: These URLs are:');
  console.log('  - Publicly accessible over HTTPS');
  console.log('  - Do not require authentication');
  console.log('  - Have stable, non-random URLs');
  console.log('  - Served via Vercel\'s global CDN for fast delivery');

  return results;
}

// Run the upload
uploadBrandImages().catch(console.error);
