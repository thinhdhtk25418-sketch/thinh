import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Loader } from '../../components/ui/Loader';
import { Menu, ChevronRight, MessageSquarePlus, Save, Send, Clock, BookOpen, User, CheckCircle2 } from 'lucide-react';

export default function GradingWorkspace() {
  const { essayId } = useParams();
  const navigate = useNavigate();
  const contentRef = useRef<HTMLDivElement>(null);

  const [annotations, setAnnotations] = useState<any[]>([]);
  const [scores, setScores] = useState({ ta: 0, cc: 0, lr: 0, gra: 0 });
  const [feedback, setFeedback] = useState('');
  
  const [selection, setSelection] = useState<{ start: number, end: number, text: string, top: number, left: number } | null>(null);
  const [annoInput, setAnnoInput] = useState('');

  const { data: essay, isLoading } = useQuery({
    queryKey: ['essay', essayId],
    queryFn: async () => {
      const res = await api.get(`/essays/${essayId}`);
      return res.data;
    }
  });

  useEffect(() => {
    if (essay) {
      setAnnotations(essay.annotations || []);
      setScores({
        ta: essay.ta || 0,
        cc: essay.cc || 0,
        lr: essay.lr || 0,
        gra: essay.gra || 0
      });
      setFeedback(essay.feedback || '');
    }
  }, [essay]);

  const gradeMutation = useMutation({
    mutationFn: async (status: 'grading' | 'graded') => {
      const overall = (scores.ta + scores.cc + scores.lr + scores.gra) / 4;
      await api.put(`/essays/${essayId}/grade`, {
        ta: scores.ta,
        cc: scores.cc,
        lr: scores.lr,
        gra: scores.gra,
        overall,
        feedback,
        annotations,
        status
      });
    },
    onSuccess: () => {
      navigate('/teacher');
    }
  });

  const handleMouseUp = () => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !contentRef.current) return;
    
    try {
      const range = sel.getRangeAt(0);
      const preSelectionRange = range.cloneRange();
      preSelectionRange.selectNodeContents(contentRef.current);
      preSelectionRange.setEnd(range.startContainer, range.startOffset);
      
      const start = preSelectionRange.toString().length;
      const text = range.toString();
      const end = start + text.length;

      const rect = range.getBoundingClientRect();
      
      setSelection({
        start,
        end,
        text,
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX
      });
    } catch (e) {
      // Ignored
    }
  };

  const handleAddAnnotation = () => {
    if (!selection || !annoInput.trim()) return;
    setAnnotations([...annotations, {
      start: selection.start,
      end: selection.end,
      quote: selection.text,
      feedback: annoInput,
      createdAt: new Date().toISOString()
    }]);
    setSelection(null);
    setAnnoInput('');
    window.getSelection()?.removeAllRanges();
  };

  const removeAnnotation = (indexToRemove: number) => {
    if(confirm("Xóa nhận xét này?")) {
      setAnnotations(annotations.filter((_, i) => i !== indexToRemove));
    }
  };

  if (isLoading) return <Loader />;
  if (!essay) return <div className="p-8 text-slate-500">Không tìm thấy bài viết.</div>;

  const renderContentWithAnnotations = () => {
    if (!annotations || annotations.length === 0) {
      return essay.content;
    }
    
    let lastIndex = 0;
    const elements: any[] = [];
    const sortedAnnotations = [...annotations].sort((a, b) => a.start - b.start);

    sortedAnnotations.forEach((anno, index) => {
      if (anno.start > lastIndex) {
        elements.push(<span key={`text-${lastIndex}`}>{essay.content.slice(lastIndex, anno.start)}</span>);
      }
      elements.push(
        <mark 
          key={`mark-${index}`} 
          onClick={() => removeAnnotation(index)}
          className="bg-[#C87556]/20 text-[#C87556] rounded-sm px-1 py-0.5 relative group cursor-pointer transition-colors hover:bg-[#C87556]/30 border-b border-[#C87556]/50"
        >
          {essay.content.slice(anno.start, anno.end)}
          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-[#23372B] text-[#F5F2EC] text-sm p-3 rounded-lg shadow-xl hidden group-hover:block z-10 font-sans font-medium after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-4 after:border-transparent after:border-t-[#23372B]">
            {anno.feedback}
            <span className="block text-[10px] text-white/50 mt-2 border-t border-white/10 pt-1">Nhấn để xóa</span>
          </span>
        </mark>
      );
      lastIndex = anno.end;
    });
    if (lastIndex < essay.content.length) {
      elements.push(<span key={`text-end`}>{essay.content.slice(lastIndex)}</span>);
    }
    return elements;
  };

  const getOverallScore = () => ((scores.ta + scores.cc + scores.lr + scores.gra) / 4).toFixed(1);

  return (
    <div className="h-full flex flex-col font-sans overflow-hidden bg-[#F5F2EC]">
      {/* Header */}
      <header className="flex flex-shrink-0 items-center justify-between px-10 py-5 bg-[#F5F2EC] z-10 relative border-b border-[#E5E0D8]/50">
        <div className="flex items-center space-x-2 text-slate-500 text-sm">
          <Menu className="w-5 h-5 mr-2" />
          <span>IELTS Writing Studio</span>
          <ChevronRight className="w-4 h-4" />
          <Link to="/teacher" className="hover:text-slate-900 font-medium">Teacher desk</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="font-semibold text-slate-900">Chấm bài</span>
        </div>
        <div className="flex items-center space-x-3 bg-white/50 border border-[#E5E0D8] px-3 py-1.5 rounded-full">
          <div className="w-6 h-6 rounded-full bg-[#A3B19B] flex items-center justify-center text-xs font-bold text-white">
            GV
          </div>
          <span className="text-sm font-medium pr-2">Không gian giáo viên</span>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Essay Content */}
        <div className="flex-1 flex flex-col overflow-y-auto px-10 py-8 scroll-smooth">
          <div className="max-w-3xl w-full mx-auto">
            
            <div className="mb-8">
              <h2 className="text-[#A3B19B] text-xs font-bold tracking-widest uppercase mb-2 flex items-center">
                <User className="w-3.5 h-3.5 mr-1" /> Học sinh
              </h2>
              <h1 className="text-3xl font-serif text-[#23372B] font-bold">
                {essay.studentName}
              </h1>
              <div className="flex space-x-4 mt-3 text-sm text-slate-500 font-mono">
                <span>{essay.wordCount} từ</span>
                <span>•</span>
                <span>Nộp lúc: {new Date(essay.updatedAt).toLocaleTimeString('vi-VN')}</span>
              </div>
            </div>

            <div className="bg-[#FCFAF6] border border-[#E5E0D8] rounded-2xl p-8 mb-8 shadow-sm">
              <h3 className="flex items-center text-xs font-bold uppercase tracking-widest text-[#23372B] mb-4">
                <BookOpen className="w-4 h-4 mr-2" />
                Đề bài ({essay.prompt.type})
              </h3>
              <p className="font-serif text-lg text-slate-800 leading-relaxed font-semibold">
                {essay.prompt.text}
              </p>
              {essay.prompt.image && (
                <div className="mt-6 p-4 bg-white border border-[#E5E0D8] rounded-xl flex justify-center">
                  <img src={import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') + essay.prompt.image : `http://localhost:3000${essay.prompt.image}`} alt="Prompt visual" className="max-h-64 object-contain rounded" />
                </div>
              )}
            </div>

            <div className="bg-white border border-[#E5E0D8] rounded-2xl p-10 shadow-sm relative mb-20">
              <div className="absolute top-0 right-0 bg-[#F5F2EC] text-[#8B5E45] text-[10px] font-bold uppercase px-3 py-1.5 rounded-bl-xl rounded-tr-2xl border-l border-b border-[#E5E0D8]">
                Bôi đen để nhận xét
              </div>
              <div 
                ref={contentRef}
                onMouseUp={handleMouseUp}
                className="whitespace-pre-wrap leading-[2.2] text-xl font-serif text-slate-800 selection:bg-[#C87556]/20 selection:text-slate-900"
              >
                {renderContentWithAnnotations()}
              </div>
            </div>

          </div>
        </div>

        {/* Right: Grading Sidebar */}
        <div className="w-[380px] bg-white border-l border-[#E5E0D8] shadow-2xl flex flex-col z-20">
          <div className="p-6 bg-[#FCFAF6] border-b border-[#E5E0D8]">
            <h2 className="font-serif text-2xl font-bold text-[#23372B]">Chấm điểm</h2>
            <p className="text-sm text-slate-500 mt-1">Đánh giá theo 4 tiêu chí IELTS</p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            
            {/* Sliders */}
            <div className="space-y-6">
              {[
                { id: 'ta', label: 'Task Achievement', color: 'bg-emerald-500' },
                { id: 'cc', label: 'Coherence & Cohesion', color: 'bg-blue-500' },
                { id: 'lr', label: 'Lexical Resource', color: 'bg-purple-500' },
                { id: 'gra', label: 'Grammar', color: 'bg-amber-500' }
              ].map(crit => (
                <div key={crit.id} className="space-y-3">
                  <div className="flex justify-between items-end">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">{crit.id}</span>
                      <span className="text-sm font-medium text-slate-700">{crit.label}</span>
                    </div>
                    <span className="text-xl font-serif font-bold text-[#23372B]">{scores[crit.id as keyof typeof scores].toFixed(1)}</span>
                  </div>
                  <input 
                    type="range" min="0" max="9" step="0.5" 
                    value={scores[crit.id as keyof typeof scores]} 
                    onChange={(e) => setScores({...scores, [crit.id]: parseFloat(e.target.value)})}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#23372B]"
                  />
                </div>
              ))}
            </div>

            {/* Overall */}
            <div className="pt-6 border-t border-[#E5E0D8] bg-[#F5F2EC] -mx-6 px-6 py-4">
              <div className="flex justify-between items-center">
                <span className="font-bold text-[#23372B] uppercase tracking-wider text-sm">Overall Band</span>
                <span className="text-4xl font-serif font-bold text-[#C87556]">
                  {getOverallScore()}
                </span>
              </div>
            </div>

            {/* General Feedback */}
            <div className="space-y-3 pt-4">
              <label className="text-sm font-bold text-[#23372B] uppercase tracking-wider flex items-center">
                <MessageSquarePlus className="w-4 h-4 mr-2 text-[#C87556]" />
                Nhận xét chung
              </label>
              <textarea
                className="w-full rounded-xl border border-[#E5E0D8] p-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#C87556]/50 bg-[#FCFAF6] min-h-[140px] resize-none leading-relaxed"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Viết nhận xét tổng quan cho học sinh tại đây..."
              />
            </div>
            
          </div>

          {/* Action Buttons */}
          <div className="p-6 bg-white border-t border-[#E5E0D8] space-y-3 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
            <button 
              className="w-full bg-[#23372B] hover:bg-[#1a2a20] text-white py-3.5 rounded-full font-medium transition-colors flex items-center justify-center space-x-2"
              onClick={() => gradeMutation.mutate('graded')} 
              disabled={gradeMutation.isPending}
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>Chốt điểm & Gửi học sinh</span>
            </button>
            <button 
              className="w-full bg-white hover:bg-slate-50 text-slate-600 border border-[#E5E0D8] py-3.5 rounded-full font-medium transition-colors flex items-center justify-center space-x-2"
              onClick={() => gradeMutation.mutate('grading')} 
              disabled={gradeMutation.isPending}
            >
              <Save className="w-4 h-4" />
              <span>Lưu nháp chấm bài</span>
            </button>
          </div>
        </div>

      </div>

      {/* Annotation Popover */}
      {selection && (
        <div 
          className="fixed bg-white border border-[#E5E0D8] shadow-2xl rounded-2xl p-4 flex flex-col space-y-3 z-50 w-80 animate-in fade-in zoom-in-95 duration-200"
          style={{ top: selection.top + 15, left: Math.min(selection.left - 160, window.innerWidth - 340) }}
        >
          <div className="flex items-center space-x-2 text-[#C87556] mb-1">
            <MessageSquarePlus className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Thêm nhận xét</span>
          </div>
          <div className="text-xs italic text-slate-500 border-l-2 border-[#C87556]/30 pl-2 line-clamp-2">"{selection.text}"</div>
          
          <textarea 
            autoFocus
            placeholder="Nhận xét của bạn về đoạn này..." 
            value={annoInput}
            onChange={(e) => setAnnoInput(e.target.value)}
            className="w-full text-sm p-3 border border-[#E5E0D8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C87556]/50 resize-none min-h-[80px]"
          />
          
          <div className="flex justify-end space-x-2 pt-2">
            <button 
              className="px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
              onClick={() => setSelection(null)}
            >
              Hủy
            </button>
            <button 
              className="px-4 py-2 text-sm font-medium bg-[#C87556] text-white hover:bg-[#b06144] rounded-lg transition-colors shadow-sm"
              onClick={handleAddAnnotation}
            >
              Lưu nhận xét
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
