import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import api from '../../lib/api';
import { Menu, ChevronRight, User, BookOpen, PenTool, CheckCircle2, FileText, X, ArrowRight, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '../../components/ui/Input';

export default function StudentDashboard() {
  const { studentName, setStudentName } = useAppStore();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerView, setDrawerView] = useState<'menu' | 'draft' | 'submitted' | 'graded'>('menu');
  const navigate = useNavigate();

  const { data: historyEssays, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['history', studentName],
    queryFn: async () => {
      if (!studentName) return [];
      const res = await api.get(`/essays?studentName=${encodeURIComponent(studentName)}`);
      return res.data;
    },
    enabled: isDrawerOpen && !!studentName
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  return (
    <div className="h-full flex flex-col overflow-x-hidden">
      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between px-10 py-6"
      >
        <div className="flex items-center space-x-2 text-slate-500 text-sm">
          <Menu className="w-5 h-5 mr-2" />
          <span>IELTS Writing Studio</span>
          <ChevronRight className="w-4 h-4" />
          <span className="font-semibold text-slate-900">Tổng quan</span>
        </div>
        <button 
          onClick={() => setIsDrawerOpen(true)}
          className="flex items-center space-x-3 bg-white border border-[#E5E0D8] hover:border-[#C87556] px-3 py-1.5 rounded-full shadow-sm transition-all group"
        >
          <div className="w-6 h-6 rounded-full bg-[#A3B19B] flex items-center justify-center text-xs font-bold text-white">
            {studentName ? studentName.charAt(0).toUpperCase() : 'A'}
          </div>
          <span className="text-sm font-medium pr-1 text-slate-700 group-hover:text-[#C87556]">{studentName || 'Học sinh'}</span>
          <Menu className="w-4 h-4 text-slate-400 group-hover:text-[#C87556]" />
        </button>
      </motion.header>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="px-10 max-w-5xl"
      >
        <motion.div variants={itemVariants} className="mt-4 mb-10">
          <h2 className="text-[#C87556] text-sm font-bold tracking-widest uppercase mb-4">Chào học sinh</h2>
          <h1 className="text-6xl font-serif text-[#23372B] leading-tight mb-2">
            Viết chậm lại.<br/>
            <span className="italic text-[#C87556]">Nghĩ sâu hơn.</span>
          </h1>
          <div className="flex justify-between items-end mt-6">
            <p className="text-slate-600 text-lg max-w-xl leading-relaxed">
              Một không gian tập trung để luyện Task 1 và Task 2, theo dõi bản nháp, rồi nhận những góp ý đủ cụ thể để lần viết sau tốt hơn.
            </p>
            <div className="text-xs font-mono tracking-widest text-slate-400 uppercase">
              Session / {new Date().toLocaleDateString('vi-VN')}
            </div>
          </div>
        </motion.div>

        {/* Input Name Block */}
        <motion.div variants={itemVariants} className="flex items-center p-2 pl-4 mb-12 bg-[#FCFAF6] border border-[#E5E0D8] rounded-2xl max-w-2xl shadow-sm hover:shadow-md transition-shadow">
          <User className="w-5 h-5 text-[#C87556] mr-3" />
          <span className="text-sm font-medium text-slate-600 mr-4 whitespace-nowrap">Tên hiển thị</span>
          <Input 
            value={studentName} 
            onChange={(e) => setStudentName(e.target.value)} 
            placeholder="Học sinh" 
            className="border-none shadow-none bg-transparent focus-visible:ring-0 text-base py-3 font-medium h-auto"
          />
        </motion.div>

        {/* Cards Section */}
        <motion.div variants={itemVariants} className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-serif font-bold text-[#23372B]">Chọn bàn viết</h3>
          <span className="text-slate-500 text-sm">Hai dạng bài, một thói quen tốt</span>
        </motion.div>

        <motion.div variants={itemVariants} className="grid md:grid-cols-2 gap-8 pb-12">
          {/* Card 1 */}
          <motion.div 
            whileHover={{ y: -8, transition: { duration: 0.3 } }}
            className="bg-[#FCFAF6] rounded-[2rem] p-10 border border-[#E5E0D8] shadow-sm relative overflow-hidden group"
          >
            {/* Decorative shape */}
            <div className="absolute -bottom-16 -right-16 w-48 h-48 rounded-full border-[1.5rem] border-[#E8ECE4] opacity-50 transition-transform duration-700 group-hover:scale-110 group-hover:rotate-12" />
            
            <div className="flex items-center space-x-2 text-xs font-bold tracking-widest uppercase text-[#23372B] mb-6">
              <span className="opacity-60">■</span>
              <span className="opacity-80">Report Writing</span>
            </div>
            
            <h2 className="text-4xl font-serif font-bold text-[#23372B] mb-4">Writing Task 1</h2>
            <p className="text-slate-600 leading-relaxed max-w-sm mb-16 relative z-10">
              Mô tả biểu đồ đường, cột, tròn, quy trình và bản đồ. Tối thiểu 150 từ mỗi bài.
            </p>
            
            <div className="flex items-center justify-between mt-auto relative z-10">
              <Link to="/library?task=task1">
                <button className="bg-[#2B4236] hover:bg-[#1f2f27] text-white px-6 py-3 rounded-full font-medium flex items-center space-x-2 transition-colors">
                  <span>Mở bàn viết</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
            </div>
          </motion.div>

          {/* Card 2 */}
          <motion.div 
            whileHover={{ y: -8, transition: { duration: 0.3 } }}
            className="bg-[#FCFAF6] rounded-[2rem] p-10 border border-[#E5E0D8] shadow-sm relative overflow-hidden group"
          >
            {/* Decorative shape */}
            <div className="absolute -bottom-8 -right-8 w-40 h-40 bg-[#F2E5DD] rounded-full opacity-50 transition-transform duration-700 group-hover:scale-125" />
            
            <div className="flex items-center space-x-2 text-xs font-bold tracking-widest uppercase text-[#C87556] mb-6">
              <span className="opacity-60">◆</span>
              <span className="opacity-80">Essay Writing</span>
            </div>
            
            <h2 className="text-4xl font-serif font-bold text-[#23372B] mb-4">Writing Task 2</h2>
            <p className="text-slate-600 leading-relaxed max-w-sm mb-16 relative z-10">
              Luyện các dạng lập luận: quan điểm, thảo luận, nguyên nhân – giải pháp. Tối thiểu 250 từ mỗi bài.
            </p>
            
            <div className="flex items-center justify-between mt-auto relative z-10">
              <Link to="/library?task=task2">
                <button className="bg-[#C87556] hover:bg-[#b06144] text-white px-6 py-3 rounded-full font-medium flex items-center space-x-2 transition-colors">
                  <span>Mở bàn viết</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Right Drawer */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setIsDrawerOpen(false); setTimeout(() => setDrawerView('menu'), 300); }}
              className="fixed inset-0 bg-[#23372B]/20 backdrop-blur-sm z-40"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
              className="fixed inset-y-0 right-0 w-full max-w-md bg-[#F5F2EC] shadow-2xl z-50 flex flex-col border-l border-[#E5E0D8]"
            >
              <div className="flex-1 relative overflow-hidden bg-white">
                <AnimatePresence mode="wait">
                  {drawerView === 'menu' && (
                    <motion.div 
                      key="menu"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      className="absolute inset-0 p-8 h-full flex flex-col font-mono text-slate-600"
                    >
                      <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center space-x-3 text-lg font-bold text-[#23372B]">
                          <Menu className="w-5 h-5" />
                          <span>Menu</span>
                        </div>
                        <button onClick={() => { setIsDrawerOpen(false); setTimeout(() => setDrawerView('menu'), 300); }} className="text-slate-400 hover:text-slate-600 transition-colors">
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="space-y-4 text-[13px] whitespace-pre font-medium">
                        <div onClick={() => setDrawerView('draft')} className="flex items-center cursor-pointer hover:text-[#C87556] transition-colors group">
                          <span className="text-slate-300 mr-3 group-hover:text-[#C87556] transition-colors">├──</span>
                          <span className="flex-1">Bài đang viết (nháp)</span>
                          <span className="text-slate-400">[{historyEssays?.filter((e:any) => e.status === 'draft').length || 0}]</span>
                        </div>
                        
                        <div onClick={() => setDrawerView('submitted')} className="flex items-center cursor-pointer hover:text-[#C87556] transition-colors group">
                          <span className="text-slate-300 mr-3 group-hover:text-[#C87556] transition-colors">├──</span>
                          <span className="flex-1">Bài đã gửi</span>
                          <span className="text-slate-400">[{historyEssays?.filter((e:any) => e.status === 'submitted' || e.status === 'grading').length || 0}]</span>
                        </div>
                        
                        <div onClick={() => setDrawerView('graded')} className="flex items-center cursor-pointer hover:text-[#C87556] transition-colors group">
                          <span className="text-slate-300 mr-3 group-hover:text-[#C87556] transition-colors">├──</span>
                          <span className="flex-1">Bài đã được chấm</span>
                          <span className="text-slate-400">[{historyEssays?.filter((e:any) => e.status === 'graded').length || 0}]</span>
                        </div>

                        <div className="flex items-center text-slate-200 py-2">
                          <span className="mr-3">├──</span>
                          <span className="text-slate-200/50">───────────────</span>
                        </div>

                        <div className="flex items-center cursor-pointer hover:text-[#C87556] transition-colors group opacity-50">
                          <span className="text-slate-300 mr-3 group-hover:text-[#C87556]">├──</span>
                          <span className="flex-1">Bài mẫu đã mở khoá</span>
                        </div>

                        <div onClick={() => setDrawerView('progress')} className="flex items-center cursor-pointer hover:text-[#C87556] transition-colors group">
                          <span className="text-slate-300 mr-3 group-hover:text-[#C87556]">├──</span>
                          <span className="flex-1">Tiến độ của tôi</span>
                        </div>

                        <div className="flex items-center text-slate-200 py-2">
                          <span className="mr-3">├──</span>
                          <span className="text-slate-200/50">───────────────</span>
                        </div>

                        <div className="flex items-center cursor-pointer hover:text-[#C87556] transition-colors group opacity-50">
                          <span className="text-slate-300 mr-3 group-hover:text-[#C87556]">└──</span>
                          <span className="flex-1">Cài đặt tài khoản</span>
                        </div>
                      </div>

                      <div className="mt-auto pt-8 flex justify-center opacity-30">
                        <span className="text-[10px] tracking-widest uppercase">IELTS Writing Studio</span>
                      </div>
                    </motion.div>
                  )}

                  {(drawerView === 'draft' || drawerView === 'submitted' || drawerView === 'graded') && (
                    <motion.div 
                      key="list"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3 }}
                      className="absolute inset-0 flex flex-col font-sans bg-[#FCFAF6]"
                    >
                      {/* Header for sub-view */}
                      <div className="flex items-center justify-between px-6 py-5 border-b border-[#E5E0D8] bg-white sticky top-0 z-10">
                        <button 
                          onClick={() => setDrawerView('menu')} 
                          className="flex items-center text-slate-500 hover:text-[#C87556] transition-colors group text-sm font-medium"
                        >
                          <ChevronRight className="w-4 h-4 mr-1 rotate-180 group-hover:-translate-x-1 transition-transform" />
                          <span>Menu</span>
                        </button>
                        <h3 className="font-serif text-lg font-bold text-[#23372B]">
                          {drawerView === 'draft' ? 'Bản nháp' : drawerView === 'submitted' ? 'Đã gửi' : 'Đã chấm'}
                        </h3>
                      </div>

                      <div className="flex-1 overflow-y-auto p-6">
                        {isLoadingHistory ? (
                          <div className="text-center py-10 text-slate-500 text-sm animate-pulse">Đang tải lịch sử...</div>
                        ) : (() => {
                          const filtered = historyEssays?.filter((e: any) => {
                            if (drawerView === 'graded') return e.status === 'graded';
                            if (drawerView === 'submitted') return e.status === 'submitted' || e.status === 'grading';
                            if (drawerView === 'draft') return e.status === 'draft';
                            return false;
                          }) || [];

                          if (filtered.length === 0) {
                            return (
                              <motion.div 
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-col items-center justify-center py-20 text-center opacity-60"
                              >
                                <BookOpen className="w-10 h-10 mb-4 text-[#A3B19B]" />
                                <p className="text-slate-500 text-sm font-medium">Trống trơn.</p>
                                <p className="text-xs text-slate-400 mt-1">Chưa có bài nào trong mục này.</p>
                              </motion.div>
                            );
                          }

                          return (
                            <motion.div 
                              variants={{ show: { transition: { staggerChildren: 0.1 } } }}
                              initial="hidden"
                              animate="show"
                              className="space-y-4"
                            >
                              {filtered.map((essay: any) => (
                                <motion.div 
                                  variants={{
                                    hidden: { opacity: 0, y: 15 },
                                    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
                                  }}
                                  key={essay.id}
                                  onClick={() => {
                                    if (essay.status === 'graded') navigate(`/review/${essay.id}`);
                                    else if (essay.status === 'draft') navigate(`/write/${essay.promptId}`);
                                  }}
                                  className={`bg-white p-5 rounded-2xl border border-[#E5E0D8] shadow-sm hover:shadow-md transition-all group relative overflow-hidden ${essay.status !== 'submitted' && essay.status !== 'grading' ? 'cursor-pointer hover:border-[#C87556]' : ''}`}
                                >
                                  {essay.status === 'graded' && (
                                    <div className="absolute top-0 right-0 w-16 h-16 bg-[#23372B]/5 rounded-bl-full -z-0 group-hover:scale-150 transition-transform duration-500" />
                                  )}
                                  
                                  <div className="flex justify-between items-start mb-3 relative z-10">
                                    <h4 className="font-serif font-bold text-slate-800 text-base leading-snug pr-4 group-hover:text-[#23372B] transition-colors">
                                      {essay.prompt?.type || (essay.task === 'task1' ? 'Task 1' : 'Task 2')}
                                    </h4>
                                    {essay.status === 'graded' && (
                                      <div className="flex flex-col items-end">
                                        <span className="text-[10px] font-bold uppercase text-slate-400 mb-0.5 tracking-wider">Overall</span>
                                        <span className="text-2xl font-serif font-bold text-[#C87556] leading-none">
                                          {essay.overall ? essay.overall.toFixed(1) : '—'}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                  
                                  <p className="text-xs font-mono text-slate-500 mb-4 relative z-10">
                                    {essay.wordCount} từ · {new Date(essay.updatedAt).toLocaleDateString('vi-VN')}
                                  </p>
                                  
                                  <div className="relative z-10 pt-3 border-t border-[#E5E0D8]/50">
                                    {essay.status === 'draft' && (
                                      <div className="text-xs text-[#C87556] font-bold uppercase tracking-wider flex items-center group-hover:translate-x-1 transition-transform">
                                        <PenTool className="w-3.5 h-3.5 mr-1.5" /> Tiếp tục viết
                                      </div>
                                    )}
                                    {(essay.status === 'submitted' || essay.status === 'grading') && (
                                      <div className="text-xs text-[#A3B19B] font-bold uppercase tracking-wider flex items-center">
                                        <Clock className="w-3.5 h-3.5 mr-1.5" /> Đang đợi chấm...
                                      </div>
                                    )}
                                    {essay.status === 'graded' && (
                                      <div className="text-xs text-[#23372B] font-bold uppercase tracking-wider flex items-center group-hover:translate-x-1 transition-transform">
                                        <FileText className="w-3.5 h-3.5 mr-1.5" /> Xem nhận xét chi tiết
                                      </div>
                                    )}
                                  </div>
                                </motion.div>
                              ))}
                            </motion.div>
                          );
                        })()}
                      </div>
                    </motion.div>
                  )}

                  {drawerView === 'progress' && (
                    <motion.div 
                      key="progress"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3 }}
                      className="absolute inset-0 flex flex-col font-sans bg-[#FCFAF6]"
                    >
                      <div className="flex items-center justify-between px-6 py-5 border-b border-[#E5E0D8] bg-white sticky top-0 z-10">
                        <button 
                          onClick={() => setDrawerView('menu')} 
                          className="flex items-center text-slate-500 hover:text-[#C87556] transition-colors group text-sm font-medium"
                        >
                          <ChevronRight className="w-4 h-4 mr-1 rotate-180 group-hover:-translate-x-1 transition-transform" />
                          <span>Menu</span>
                        </button>
                        <h3 className="font-serif text-lg font-bold text-[#23372B]">
                          Tiến độ của tôi
                        </h3>
                      </div>
                      
                      <div className="flex-1 overflow-y-auto p-6">
                        {(() => {
                          const gradedEssays = [...(historyEssays?.filter((e: any) => e.status === 'graded') || [])]
                            .sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());

                          if (gradedEssays.length === 0) {
                            return (
                              <motion.div 
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-col items-center justify-center py-20 text-center opacity-60"
                              >
                                <BookOpen className="w-10 h-10 mb-4 text-[#A3B19B]" />
                                <p className="text-slate-500 text-sm font-medium">Chưa đủ dữ liệu.</p>
                                <p className="text-xs text-slate-400 mt-1">Hãy nộp bài và chờ giáo viên chấm để xem biểu đồ tiến độ nhé.</p>
                              </motion.div>
                            );
                          }

                          return (
                            <motion.div 
                              initial={{ opacity: 0, y: 15 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="bg-white p-6 rounded-2xl border border-[#E5E0D8] shadow-sm"
                            >
                              <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-6">Biểu đồ Overall Band</h4>
                              
                              <div className="flex items-end space-x-2 h-48 mt-4 border-b border-slate-200 pb-2 relative ml-6">
                                {/* Y-axis */}
                                <div className="absolute -left-6 bottom-0 top-0 flex flex-col justify-between text-[10px] text-slate-400 font-mono py-2">
                                  <span>9.0</span>
                                  <span>7.0</span>
                                  <span>5.0</span>
                                  <span>3.0</span>
                                  <span>0.0</span>
                                </div>

                                {/* Bars */}
                                {gradedEssays.map((essay, index) => {
                                  const heightPercent = (essay.overall / 9) * 100;
                                  return (
                                    <div key={essay.id} className="flex-1 max-w-[40px] h-full flex flex-col justify-end group relative">
                                      {/* Tooltip */}
                                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-[#23372B] text-white text-[10px] py-1.5 px-2.5 rounded-lg whitespace-nowrap z-20 pointer-events-none shadow-xl">
                                        <div className="text-white/60 mb-0.5">{new Date(essay.updatedAt).toLocaleDateString('vi-VN')}</div>
                                        <span className="font-bold text-[#C87556] text-xs">Band {essay.overall.toFixed(1)}</span>
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#23372B]" />
                                      </div>
                                      
                                      {/* Bar */}
                                      <motion.div 
                                        initial={{ height: 0 }}
                                        animate={{ height: `${heightPercent}%` }}
                                        transition={{ type: 'spring', damping: 20, delay: index * 0.05 + 0.2 }}
                                        className="w-full bg-[#A3B19B]/30 group-hover:bg-[#C87556] rounded-t transition-colors cursor-pointer"
                                      />
                                    </div>
                                  );
                                })}
                              </div>
                              <div className="mt-6 text-center text-xs text-slate-500 font-medium">
                                Tiến độ {gradedEssays.length} bài viết gần nhất
                              </div>
                            </motion.div>
                          );
                        })()}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
