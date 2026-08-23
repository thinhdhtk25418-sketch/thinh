import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Pages - Student
import StudentDashboard from './pages/student/Dashboard';
import PromptLibrary from './pages/student/PromptLibrary';
import WritingWorkspace from './pages/student/WritingWorkspace';
import EssayReview from './pages/student/EssayReview';

// Pages - Teacher
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import GradingWorkspace from './pages/teacher/GradingWorkspace';
import PromptManagement from './pages/teacher/PromptManagement';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<StudentDashboard />} />
            <Route path="library" element={<PromptLibrary />} />
            <Route path="write/:promptId" element={<WritingWorkspace />} />
            <Route path="review/:essayId" element={<EssayReview />} />
            
            <Route path="teacher">
              <Route index element={<TeacherDashboard />} />
              <Route path="prompts" element={<PromptManagement />} />
              <Route path="grade/:essayId" element={<GradingWorkspace />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
