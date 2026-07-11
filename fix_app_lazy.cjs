const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Replace synchronous imports with lazy imports
const lazyImports = `
const Onboarding = React.lazy(() => import('./components/Onboarding'));
const Auth = React.lazy(() => import('./components/Auth'));
const RecordingScreen = React.lazy(() => import('./components/RecordingScreen'));
const JournalTimeline = React.lazy(() => import('./components/JournalTimeline'));
const MoodAnalytics = React.lazy(() => import('./components/MoodAnalytics'));
const AiCoach = React.lazy(() => import('./components/AiCoach'));
const ProfilePage = React.lazy(() => import('./components/ProfilePage'));
const RealTimeDashboard = React.lazy(() => import('./components/RealTimeDashboard'));
const JournalToolsPanel = React.lazy(() => import('./components/JournalToolsPanel'));
`;

code = code.replace(/import Onboarding from '\.\/components\/Onboarding';\nimport Auth from '\.\/components\/Auth';\nimport RecordingScreen from '\.\/components\/RecordingScreen';\nimport JournalTimeline from '\.\/components\/JournalTimeline';\nimport MoodAnalytics from '\.\/components\/MoodAnalytics';\nimport AiCoach from '\.\/components\/AiCoach';\nimport ProfilePage from '\.\/components\/ProfilePage';\nimport RealTimeDashboard from '\.\/components\/RealTimeDashboard';\nimport JournalToolsPanel from '\.\/components\/JournalToolsPanel';/, lazyImports);

fs.writeFileSync('src/App.tsx', code);
