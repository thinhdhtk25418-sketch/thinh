import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../../lib/api';
import { Card, CardContent } from '../../components/ui/Card';
import { useAppStore } from '../../store/useAppStore';
import { Menu, ChevronRight, PenTool, Image as ImageIcon, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PromptLibrary() {
  const [searchParams] = useSearchParams();
  const taskFilter = searchParams.get('task') || 'task1';
  const navigate = useNavigate();
  const { studentName } = useAppStore();

  const { data: prompts, isLoading } = useQuery({
    queryKey: ['prompts', taskFilter],
    queryFn: async () => {
      const res = await api.get(`/prompts?task=${taskFilter}`);
      return res.data;
    }
  });

  const isTask1 = taskFilter === 'task1';
  const themeColor = isTask1 ? '#23372B' : '#C87556';
  const themeBgColor = isTask1 ? 'bg-[#23372B]' : 'bg-[#C87556]';
  const themeHoverColor = isTask1 ? 'hover:bg-[#1a2a20]' : 'hover:bg-[#b06144]';

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
  };

  return (
    <div className="h-full flex flex-col font-sans overflow-x-hidden bg-[#F5F2EC]">
      {/* Header */}
      <header className="flex items-center justify-between px-10 py-6">
        <div className="flex items-center space-x-2 text-slate-500 text-sm">
          <Menu className="w-5 h-5 mr-2" />
          <span>IELTS Writing Studio</span>
          <ChevronRight className="w-4 h-4" />
          <Link to="/" className="hover:text-slate-900">Tổng quan</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="font-semibold text-slate-900">Thư viện đề</span>
        </div>
        <div className="flex items-center space-x-3 bg-white/50 border border-slate-200 px-3 py-1.5 rounded-full">
          <div className="w-6 h-6 rounded-full bg-[#A3B19B] flex items-center justify-center text-xs font-bold text-white">
            {studentName.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm font-medium pr-2">Học sinh</span>
        </div>
      </header>

      <div className="px-10 max-w-6xl w-full mx-auto pb-12">
        <div className="mt-2 mb-10 flex items-end justify-between">
          <div>
            <Link to="/" className="text-slate-500 hover:text-slate-900 text-sm flex items-center space-x-1 mb-6">
              <span>&larr; Quay lại chọn bàn viết</span>
            </Link>
            <h2 className="text-[#A3B19B] text-sm font-bold tracking-widest uppercase mb-2">PROMPT LIBRARY</h2>
            <h1 className="text-5xl font-serif text-[#23372B] font-bold">
              Thư viện đề {isTask1 ? 'Task 1' : 'Task 2'}
            </h1>
          </div>
          <div className="flex items-center space-x-2 text-sm font-mono text-slate-400 uppercase tracking-widest pb-1 border-b-2" style={{ borderBottomColor: themeColor }}>
            <PenTool className="w-4 h-4 mr-2" style={{ color: themeColor }} />
            {isTask1 ? 'Report Writing' : 'Essay Writing'}
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-20 text-slate-500 font-medium animate-pulse">Đang chuẩn bị không gian viết...</div>
        ) : (
          <motion.div 
            variants={containerVariants} 
            initial="hidden" 
            animate="show" 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {prompts?.map((prompt: any) => (
              <motion.div variants={itemVariants} key={prompt.id}>
                <Card className="bg-[#FCFAF6] border-[#E5E0D8] shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col group h-full rounded-2xl relative">
                  
                  {/* Decorative corner */}
                  <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full opacity-10 transition-transform duration-700 group-hover:scale-150" style={{ backgroundColor: themeColor }} />

                  <div className="px-6 py-4 border-b border-[#E5E0D8]/50 flex justify-between items-center relative z-10">
                    <span className="text-[10px] uppercase font-bold px-2.5 py-1 rounded-full tracking-widest" style={{ color: themeColor, backgroundColor: `${themeColor}15` }}>
                      {prompt.type}
                    </span>
                  </div>
                  
                  <CardContent className="p-6 flex-1 flex flex-col relative z-10">
                    <p className="font-serif text-lg font-semibold text-[#23372B] mb-6 leading-relaxed line-clamp-4 group-hover:line-clamp-none transition-all duration-300">
                      {prompt.text}
                    </p>
                    
                    {prompt.image && (
                      <div className="mb-6 bg-white rounded-xl p-3 border border-[#E5E0D8] flex justify-center shadow-sm">
                        <img src={import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') + prompt.image : `http://localhost:3000${prompt.image}`} alt="Biểu đồ" className="max-h-32 object-contain rounded" />
                      </div>
                    )}
                    
                    <div className="flex-1" />
                    
                    <button 
                      onClick={() => navigate(`/write/${prompt.id}`)}
                      className={`w-full ${themeBgColor} ${themeHoverColor} text-white px-5 py-3 rounded-xl font-medium flex items-center justify-center space-x-2 transition-all duration-300 mt-2 shadow-sm group-hover:shadow`}
                    >
                      <span>Bắt đầu viết</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}

            {prompts?.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-24 text-center bg-[#FCFAF6] rounded-[2rem] border border-dashed border-[#E5E0D8]">
                <div className="w-20 h-20 bg-[#F5F2EC] rounded-full flex items-center justify-center mb-6 text-slate-300">
                  <ImageIcon className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-serif text-[#23372B] font-bold mb-2">Chưa có đề bài nào</h3>
                <p className="text-slate-500 font-medium">Giáo viên của bạn chưa thêm đề bài cho {isTask1 ? 'Task 1' : 'Task 2'}.</p>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
