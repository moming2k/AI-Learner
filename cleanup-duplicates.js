// Utility to clean duplicate pages from localStorage
// Run this in the browser console to remove duplicates

function cleanupDuplicates() {
  const STORAGE_KEY = 'wiki_pages';

  // Get all pages
  const pagesData = localStorage.getItem(STORAGE_KEY);
  if (!pagesData) {
    console.log('No pages found in localStorage');
    return;
  }

  try {
    const pages = JSON.parse(pagesData);
    console.log(`Found ${pages.length} total pages`);

    // Create map to track unique pages
    const uniquePages = new Map();
    const duplicateGroups = new Map();

    // Find duplicates
    pages.forEach(page => {
      const normalizedTitle = page.title.toLowerCase().trim();

      if (!duplicateGroups.has(normalizedTitle)) {
        duplicateGroups.set(normalizedTitle, []);
      }
      duplicateGroups.get(normalizedTitle).push(page);
    });

    // Keep only the most recent page for each title
    duplicateGroups.forEach((group, title) => {
      if (group.length > 1) {
        // Sort by creation time (newest first)
        group.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        console.log(`  Found ${group.length} copies of "${group[0].title}"`);
      }
      // Keep the most recent one
      uniquePages.set(title, group[0]);
    });

    const uniquePagesArray = Array.from(uniquePages.values());
    const duplicatesRemoved = pages.length - uniquePagesArray.length;

    if (duplicatesRemoved > 0) {
      // Save cleaned pages
      localStorage.setItem(STORAGE_KEY, JSON.stringify(uniquePagesArray));

      console.log('✅ Cleanup Complete!');
      console.log(`  Removed ${duplicatesRemoved} duplicate pages`);
      console.log(`  Kept ${uniquePagesArray.length} unique pages`);
      console.log('\nRefresh the page to see the changes.');
    } else {
      console.log('✅ No duplicates found - your library is already clean!');
    }

    return {
      originalCount: pages.length,
      uniqueCount: uniquePagesArray.length,
      duplicatesRemoved: duplicatesRemoved
    };
  } catch (error) {
    console.error('Error cleaning duplicates:', error);
    return null;
  }
}

// Show duplicate info without removing
function showDuplicateInfo() {
  const STORAGE_KEY = 'wiki_pages';

  const pagesData = localStorage.getItem(STORAGE_KEY);
  if (!pagesData) {
    console.log('No pages found');
    return;
  }

  try {
    const pages = JSON.parse(pagesData);
    const titleMap = new Map();

    pages.forEach(page => {
      const normalizedTitle = page.title.toLowerCase().trim();
      if (!titleMap.has(normalizedTitle)) {
        titleMap.set(normalizedTitle, []);
      }
      titleMap.get(normalizedTitle).push(page);
    });

    console.log('📊 Library Statistics:');
    console.log(`  Total pages: ${pages.length}`);
    console.log(`  Unique topics: ${titleMap.size}`);
    console.log(`  Duplicates: ${pages.length - titleMap.size}`);

    const duplicates = [];
    titleMap.forEach((group, title) => {
      if (group.length > 1) {
        duplicates.push({
          title: group[0].title,
          count: group.length
        });
      }
    });

    if (duplicates.length > 0) {
      console.log('\n📑 Duplicate Pages:');
      duplicates.forEach(dup => {
        console.log(`  - "${dup.title}": ${dup.count} copies`);
      });
      console.log('\nRun cleanupDuplicates() to remove duplicates');
    } else {
      console.log('\n✅ No duplicates found!');
    }
  } catch (error) {
    console.error('Error analyzing pages:', error);
  }
}

// Run automatically if in browser
if (typeof window !== 'undefined') {
  console.log('🧹 Duplicate Page Cleanup Utility');
  console.log('==================================');
  console.log('\nCommands:');
  console.log('  showDuplicateInfo() - Show duplicate information');
  console.log('  cleanupDuplicates() - Remove all duplicate pages');
  console.log('\nChecking your library...\n');

  showDuplicateInfo();
} else {
  console.log('This script must be run in the browser console');
}