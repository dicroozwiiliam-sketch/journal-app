const fs = require('fs');
let code = fs.readFileSync('src/components/MoodAnalytics.tsx', 'utf8');

const original = `  const monthlyEntries = entries.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
  });`;

const memoized = `  const monthlyEntries = useMemo(() => entries.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
  }), [entries, selectedMonth, selectedYear]);`;

code = code.replace(original, memoized);

const originalMonthlyGoals = `  const monthlyGoals = (goals || []).filter(g => g.deadline.startsWith(targetPrefix));`;
const memoizedMonthlyGoals = `  const monthlyGoals = useMemo(() => (goals || []).filter(g => g.deadline.startsWith(targetPrefix)), [goals, targetPrefix]);`;

code = code.replace(originalMonthlyGoals, memoizedMonthlyGoals);

fs.writeFileSync('src/components/MoodAnalytics.tsx', code);
