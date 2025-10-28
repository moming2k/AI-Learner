// Utility script to clean duplicate entries from existing sessions
// Run this in the browser console or as: node clean-duplicates.js

function cleanDuplicates() {
  // Function to remove consecutive duplicates from breadcrumbs
  function deduplicateBreadcrumbs(breadcrumbs) {
    if (!breadcrumbs || breadcrumbs.length === 0) return [];

    const deduplicated = [breadcrumbs[0]];
    for (let i = 1; i < breadcrumbs.length; i++) {
      if (breadcrumbs[i].id !== breadcrumbs[i - 1].id) {
        deduplicated.push(breadcrumbs[i]);
      }
    }
    return deduplicated;
  }

  // Get all sessions from localStorage
  const sessionsData = localStorage.getItem('learning_sessions');
  if (!sessionsData) {
    console.log('No sessions found in localStorage');
    return;
  }

  try {
    const sessions = JSON.parse(sessionsData);
    let totalDuplicatesRemoved = 0;

    // Clean each session
    const cleanedSessions = sessions.map(session => {
      const originalLength = session.breadcrumbs ? session.breadcrumbs.length : 0;
      const cleanedBreadcrumbs = deduplicateBreadcrumbs(session.breadcrumbs || []);
      const duplicatesRemoved = originalLength - cleanedBreadcrumbs.length;

      if (duplicatesRemoved > 0) {
        console.log(`Session ${session.id}: Removed ${duplicatesRemoved} duplicate(s)`);
        totalDuplicatesRemoved += duplicatesRemoved;
      }

      return {
        ...session,
        breadcrumbs: cleanedBreadcrumbs
      };
    });

    // Save cleaned sessions back to localStorage
    localStorage.setItem('learning_sessions', JSON.stringify(cleanedSessions));

    console.log(`✅ Cleaning complete!`);
    console.log(`Total duplicates removed: ${totalDuplicatesRemoved}`);

    // Also clean the current session if it exists
    const currentSessionId = localStorage.getItem('current_session');
    if (currentSessionId) {
      const currentSession = cleanedSessions.find(s => s.id === currentSessionId);
      if (currentSession) {
        console.log('Current session also cleaned');
      }
    }

    return totalDuplicatesRemoved;
  } catch (error) {
    console.error('Error cleaning sessions:', error);
    return 0;
  }
}

// If running in browser
if (typeof window !== 'undefined') {
  cleanDuplicates();
  console.log('Refresh the page to see the changes');
} else {
  console.log('This script should be run in the browser console');
  console.log('Copy and paste the cleanDuplicates function and run: cleanDuplicates()');
}