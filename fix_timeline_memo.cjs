const fs = require('fs');
let code = fs.readFileSync('src/components/JournalTimeline.tsx', 'utf8');

const originalFilter = `  // Filtering function
  const filteredEntries = entries.filter(entry => {
    // Search filter
    const matchesSearch = 
      entry.transcript.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.mood.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.topics.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
      entry.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    // Type filter
    if (filterType !== 'all') {
      if (filterType === 'recording' && !entry.audioUrl) return false;
      if (filterType === 'canvas' && !entry.canvasData) return false;
      if (filterType === 'text' && (entry.audioUrl || entry.canvasData)) return false;
    }

    return true;
  });`;

const memoizedFilter = `  // Filtering function
  const filteredEntries = useMemo(() => entries.filter(entry => {
    // Search filter
    const matchesSearch = 
      entry.transcript.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.mood.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.topics.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
      entry.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    // Type filter
    if (filterType !== 'all') {
      if (filterType === 'recording' && !entry.audioUrl) return false;
      if (filterType === 'canvas' && !entry.canvasData) return false;
      if (filterType === 'text' && (entry.audioUrl || entry.canvasData)) return false;
    }

    return true;
  }), [entries, searchQuery, filterType]);`;

code = code.replace(originalFilter, memoizedFilter);
fs.writeFileSync('src/components/JournalTimeline.tsx', code);
