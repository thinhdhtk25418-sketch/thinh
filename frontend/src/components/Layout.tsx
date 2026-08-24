import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { LayoutDashboard, PenTool, BookOpen, HelpCircle } from 'lucide-react';
import { cn } from '../lib/utils';

export const Layout = () => {
  const { role } = useAppStore();
  const location = useLocation();

  const navItems = role === 'student' ? [
    { icon: LayoutDashboard, path: '/' },
    { icon: PenTool, path: '/library' },
  ] : [
    { icon: LayoutDashboard, path: '/teacher' },
    { icon: BookOpen, path: '/teacher/prompts' },
  ];

  return (
    <div className="flex h-screen bg-[#F5F2EC] text-slate-900 font-sans">
      {/* Sidebar - Dark Green */}
      <aside className="w-20 flex flex-col items-center bg-[#23372B] py-6 space-y-8 z-10">
        <div className="w-12 h-12 bg-[#C87556] rounded-xl flex items-center justify-center text-white font-serif font-bold text-2xl shadow-lg">
          W
        </div>
        
        <nav className="flex-1 w-full flex flex-col items-center space-y-4 mt-8">
          {navItems.map((item, idx) => {
            const isActive = location.pathname === item.path || 
                             (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link 
                key={idx} 
                to={item.path} 
                className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                  isActive ? "bg-white/10 text-white shadow-inner" : "text-white/60 hover:text-white hover:bg-white/5"
                )}
              >
                <item.icon className="w-5 h-5" />
              </Link>
            )
          })}
        </nav>

          <button 
            onClick={() => {
              if (role === 'student') {
                const pwd = prompt('Nhập mã truy cập giáo viên:');
                const correctPwd = import.meta.env.VITE_TEACHER_PASSWORD || '123456';
                if (pwd === correctPwd) {
                  useAppStore.getState().setRole('teacher');
                  window.location.href = '/teacher';
                } else {
                  alert('Sai mã truy cập');
                }
              } else {
                useAppStore.getState().setRole('student');
                window.location.href = '/';
              }
            }}
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white/60 hover:text-white hover:bg-white/5 transition-colors mt-auto mb-4"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};
