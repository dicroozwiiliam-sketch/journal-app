const fs = require('fs');
let code = fs.readFileSync('src/components/JournalTimeline.tsx', 'utf8');

if (!code.includes("const [visibleCount, setVisibleCount] = useState(15);")) {
    // Add visibleCount state
    code = code.replace(/const \[slashQuery, setSlashQuery\] = useState\(''\);/, "const [slashQuery, setSlashQuery] = useState('');\n  const [visibleCount, setVisibleCount] = useState(15);");
    
    // Add scroll listener for infinite loading
    const effect = `
  // Infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500) {
        setVisibleCount(prev => Math.min(prev + 10, filteredEntries.length));
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [filteredEntries.length]);
`;
    code = code.replace(/  \/\/ Filtering function/, effect + "\n  // Filtering function");
    
    // Slice the rendered array
    code = code.replace(/filteredEntries\.map\(\(entry, idx\) => \(/, "filteredEntries.slice(0, visibleCount).map((entry, idx) => (");
    
    fs.writeFileSync('src/components/JournalTimeline.tsx', code);
}
