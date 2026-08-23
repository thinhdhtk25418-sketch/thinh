import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Menu, ChevronRight, Lock, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');

  const { data: essays, isLoading } = useQuery({
    queryKey: ['essays'],
    queryFn: async () => {
      const res = await api.get('/essays');
      return res.data;
    }
  });

  if (isLoading) return <div className="p-8 font-sans">Đang tải dữ liệu...</div>;

  const filteredEssays = essays?.filter((e: any) => {
    if (filter === 'pending') return e.status === 'submitted' || e.status === 'grading';
    if (filter === 'graded') return e.status === 'graded';
    return true;
  }) || [];

  return (
    <div className="h-full flex flex-col font-sans overflow-x-hidden bg-[#F5F2EC]">
      {/* Header */}
      <header className="flex items-center justify-between px-10 py-6">
        <div className="flex items-center space-x-2 text-slate-500 text-sm">
          <Menu className="w-5 h-5 mr-2" />
          <span>IELTS Writing Studio</span>
          <ChevronRight className="w-4 h-4" />
          <span className="font-semibold text-slate-900">Teacher desk</span>
        </div>
        <div className="flex items-center space-x-3 bg-white/50 border border-[#E5E0D8] px-3 py-1.5 rounded-full">
          <div className="w-6 h-6 rounded-full bg-[#A3B19B] flex items-center justify-center text-xs font-bold text-white">
            GV
          </div>
          <span className="text-sm font-medium pr-2">Không gian giáo viên</span>
        </div>
      </header>

      <div className="px-10 max-w-6xl w-full mx-auto pb-12">
        <div className="mt-2 mb-8">
          <Link to="/" className="text-slate-500 hover:text-slate-900 text-sm flex items-center space-x-1 mb-6">
            <span>&larr; Tổng quan</span>
          </Link>
          <h2 className="text-[#A3B19B] text-sm font-bold tracking-widest uppercase mb-2">PRIVATE TEACHER SPACE</h2>
          <h1 className="text-4xl font-serif text-[#23372B] font-bold">Teacher queue</h1>
        </div>

        {/* Alert Box */}
        <div className="bg-[#F2E5DD] rounded-xl p-4 mb-8 flex items-start space-x-3 border border-[#E8D9CE]">
          <Lock className="w-5 h-5 text-[#C87556] mt-0.5" />
          <p className="text-sm text-[#8B5E45] leading-relaxed">
            Khu vực riêng của giáo viên. Bài viết và phản hồi chỉ hiển thị trong phiên làm việc này trên thiết bị của bạn.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column - Bài nộp */}
          <div className="lg:col-span-4 space-y-4">
            <Link to="/teacher/prompts">
              <button className="w-full border-2 border-dashed border-[#C87556]/30 hover:border-[#C87556] text-[#C87556] rounded-xl py-3 flex items-center justify-center space-x-2 font-medium transition-colors bg-[#FCFAF6]/50 hover:bg-[#FCFAF6]">
                <Plus className="w-4 h-4" />
                <span>Thêm đề bài</span>
              </button>
            </Link>

            <div className="bg-[#FCFAF6] rounded-2xl p-6 border border-[#E5E0D8] shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-serif font-bold text-[#23372B]">Bài nộp</h3>
                <span className="text-xs font-mono text-slate-400">{filteredEssays.length} bài</span>
              </div>

              <div className="flex bg-[#F5F2EC] rounded-lg p-1 mb-6">
                <button 
                  onClick={() => setFilter('all')}
                  className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${filter === 'all' ? 'bg-[#23372B] text-white' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Tất cả
                </button>
                <button 
                  onClick={() => setFilter('pending')}
                  className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${filter === 'pending' ? 'bg-[#23372B] text-white' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Chờ xem
                </button>
                <button 
                  onClick={() => setFilter('graded')}
                  className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${filter === 'graded' ? 'bg-[#23372B] text-white' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Đã chấm
                </button>
              </div>

              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                {filteredEssays.map((essay: any) => (
                  <div 
                    key={essay.id} 
                    onClick={() => navigate(`/teacher/grade/${essay.id}`)}
                    className="p-4 border border-[#E5E0D8] rounded-xl bg-white hover:border-[#C87556] cursor-pointer transition-colors group"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-slate-800 text-sm line-clamp-1 group-hover:text-[#C87556] transition-colors">
                        {essay.prompt?.type || essay.task}
                      </h4>
                      <span className="bg-[#E5E0D8] text-slate-600 text-[10px] uppercase font-bold px-2 py-0.5 rounded">
                        {essay.status === 'draft' ? 'Nháp' : essay.status === 'submitted' ? 'Chờ xem' : essay.status === 'grading' ? 'Đang chấm' : 'Đã chấm'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-mono">
                      {essay.studentName} · {essay.wordCount || 0} từ
                    </p>
                  </div>
                ))}
                
                {filteredEssays.length === 0 && (
                  <p className="text-sm text-slate-400 text-center py-4">Không có bài nộp nào</p>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Hàng đợi chấm bài */}
          <div className="lg:col-span-8">
            <div className="bg-[#FCFAF6] rounded-2xl p-8 border border-[#E5E0D8] shadow-sm min-h-[500px]">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-2xl font-serif font-bold text-[#23372B]">Hàng đợi chấm bài</h3>
                <span className="text-xs font-mono text-slate-400 uppercase">{filteredEssays.filter((e:any) => e.status === 'submitted').length} CẦN XEM</span>
              </div>
              <p className="text-sm text-slate-500 mb-8">
                Chọn một bài để xem toàn bộ câu trả lời và bắt đầu chấm theo bốn tiêu chí.
              </p>

              <div className="space-y-4">
                {filteredEssays.filter((e:any) => e.status === 'submitted').map((essay: any) => (
                  <div key={essay.id} className="flex items-stretch border border-[#E5E0D8] rounded-xl bg-[#F5F2EC]/50 hover:bg-[#F5F2EC] transition-colors group overflow-hidden">
                    <div 
                      className="flex-1 p-5 cursor-pointer"
                      onClick={() => navigate(`/teacher/grade/${essay.id}`)}
                    >
                      <h4 className="font-bold text-[#23372B] mb-1">
                        {essay.studentName} - Writing {essay.task === 'task1' ? 'Task 1' : 'Task 2'}
                      </h4>
                      <p className="text-sm text-slate-500 font-mono">
                        {essay.wordCount || 0} từ · Nộp lúc {new Date(essay.updatedAt).toLocaleTimeString('vi-VN')}
                      </p>
                    </div>
                    <div className="w-16 border-l border-[#E5E0D8] flex flex-col items-center justify-center space-y-2 p-2">
                       <span className="bg-[#E5E0D8] text-slate-600 text-[10px] uppercase font-bold px-2 py-0.5 rounded">
                        Nháp
                       </span>
                       <button className="text-[#C87556]/60 hover:text-[#C87556] p-2 rounded-lg hover:bg-white transition-colors">
                         <Trash2 className="w-4 h-4" />
                       </button>
                    </div>
                  </div>
                ))}
                
                {filteredEssays.filter((e:any) => e.status === 'submitted').length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-16 h-16 bg-[#F5F2EC] rounded-full flex items-center justify-center mb-4">
                      <Lock className="w-6 h-6 text-slate-300" />
                    </div>
                    <p className="text-slate-400 font-medium">Chưa có bài nào trong hàng đợi</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
