import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../../lib/api';
import { useAppStore } from '../../store/useAppStore';
import { Button } from '../../components/ui/Button';
import { Menu, ChevronRight, Save, Clock, CheckCircle2 } from 'lucide-react';

export default function WritingWorkspace() {
  const { promptId } = useParams();
  const navigate = useNavigate();
  const { studentName } = useAppStore();
  
  const [content, setContent] = useState('');
  const [essayId, setEssayId] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isTimerEnabled, setIsTimerEnabled] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: prompt, isLoading } = useQuery({
    queryKey: ['prompt', promptId],
    queryFn: async () => {
      const res = await api.get(`/prompts/${promptId}`);
      return res.data;
    }
  });

  const saveMutation = useMutation({
    mutationFn: async ({ content, isSubmit = false }: { content: string, isSubmit?: boolean }) => {
      if (essayId) {
        return api.put(`/essays/${essayId}`, { content, status: isSubmit ? 'submitted' : 'draft', wordCount: getWordCount(content) });
      } else {
        return api.post('/essays', {
          promptId,
          task: prompt?.task,
          studentName: studentName || 'Học sinh',
          content,
          wordCount: getWordCount(content),
          status: isSubmit ? 'submitted' : 'draft'
        });
      }
    },
    onMutate: () => setSaveStatus('saving'),
    onSuccess: (res) => {
      setSaveStatus('saved');
      if (!essayId) setEssayId(res.data.id);
      if (res.data.status === 'submitted') {
        navigate(`/review/${res.data.id}`);
      }
      setTimeout(() => setSaveStatus('idle'), 2000);
    }
  });

  useEffect(() => {
    if (prompt && timeLeft === null) {
      setTimeLeft(prompt.task === 'task1' ? 20 * 60 : 40 * 60);
    }
  }, [prompt, timeLeft]);

  useEffect(() => {
    if (isTimerEnabled && isTimerRunning && timeLeft !== null && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else if (isTimerEnabled && timeLeft === 0) {
      alert("Hết giờ! Bài của bạn sẽ được tự động nộp.");
      saveMutation.mutate({ content, isSubmit: true });
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timeLeft, isTimerRunning, isTimerEnabled, content, saveMutation]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      saveMutation.mutate({ content: newContent });
    }, 450);
  };

  const getWordCount = (text: string) => text.trim().split(/\s+/).filter(w => w.length > 0).length;
  const wordCount = getWordCount(content);
  const minWords = prompt?.task === 'task1' ? 150 : 250;
  const isTargetMet = wordCount >= minWords;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (isLoading) return <div className="p-8">Đang chuẩn bị không gian viết...</div>;
  if (!prompt) return <div className="p-8">Không tìm thấy đề bài</div>;

  const isTask1 = prompt.task === 'task1';
  const themeColor = isTask1 ? '#23372B' : '#C87556';
  const themeBgColor = isTask1 ? 'bg-[#23372B]' : 'bg-[#C87556]';
  const themeHoverColor = isTask1 ? 'hover:bg-[#1a2a20]' : 'hover:bg-[#b06144]';

  return (
    <div className="h-full flex flex-col font-sans overflow-x-hidden bg-[#F5F2EC]">
      {/* Header */}
      <header className="flex items-center justify-between px-10 py-6">
        <div className="flex items-center space-x-2 text-slate-500 text-sm">
          <Menu className="w-5 h-5 mr-2" />
          <span>IELTS Writing Studio</span>
          <ChevronRight className="w-4 h-4" />
          <Link to={`/library?task=${prompt.task}`} className="hover:text-slate-900">Thư viện đề</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="font-semibold text-slate-900">Bàn viết</span>
        </div>
        <div className="flex items-center space-x-3 bg-white/50 border border-slate-200 px-3 py-1.5 rounded-full">
          <div className="w-6 h-6 rounded-full bg-[#A3B19B] flex items-center justify-center text-xs font-bold text-white">
            {studentName.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm font-medium pr-2">{studentName}</span>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row gap-6 px-10 max-w-[1400px] w-full mx-auto pb-10 h-[calc(100vh-100px)]">
        {/* Left: Prompt Panel */}
        <div className="w-full lg:w-[40%] flex flex-col bg-[#FCFAF6] rounded-3xl border border-[#E5E0D8] p-8 shadow-sm overflow-y-auto">
          <div className="flex items-center justify-between mb-8">
            <span className="text-[10px] uppercase font-bold px-3 py-1.5 rounded-full tracking-widest" style={{ color: themeColor, backgroundColor: `${themeColor}15` }}>
              {prompt.type}
            </span>
            
            {isTimerEnabled ? (
              <div className="flex items-center space-x-2 text-slate-500 bg-white border border-[#E5E0D8] px-3 py-1.5 rounded-full shadow-sm">
                <Clock className="w-4 h-4" />
                <span className={`font-mono font-bold ${timeLeft !== null && timeLeft < 300 ? 'text-red-500' : ''}`}>
                  {timeLeft !== null ? formatTime(timeLeft) : '...'}
                </span>
                <button 
                  onClick={() => {
                    setIsTimerEnabled(false);
                    setIsTimerRunning(false);
                  }} 
                  className="ml-2 pl-2 border-l border-[#E5E0D8] text-slate-400 hover:text-red-500 transition-colors"
                  title="Tắt đồng hồ"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
              </div>
            ) : (
              <button 
                onClick={() => {
                  setIsTimerEnabled(true);
                  setIsTimerRunning(true);
                }}
                className="flex items-center space-x-2 text-slate-500 hover:text-slate-700 bg-white border border-[#E5E0D8] hover:border-slate-300 px-3 py-1.5 rounded-full shadow-sm transition-colors cursor-pointer"
              >
                <Clock className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Bật tính giờ</span>
              </button>
            )}
          </div>

          <h2 className="font-serif text-2xl font-bold text-[#23372B] leading-relaxed mb-6">
            {prompt.text}
          </h2>

          {prompt.image && (
            <div className="mt-4 bg-white rounded-xl p-4 border border-[#E5E0D8] flex justify-center shadow-sm">
              <img src={import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') + prompt.image : `http://localhost:3000${prompt.image}`} alt="Prompt visual" className="w-full rounded-md object-contain" />
            </div>
          )}
        </div>

        {/* Right: Writing Area */}
        <div className="w-full lg:w-[60%] flex flex-col bg-white rounded-3xl border border-[#E5E0D8] shadow-sm overflow-hidden relative">
          
          {/* Top Bar inside writing area */}
          <div className="px-8 py-4 border-b border-[#E5E0D8] flex justify-between items-center bg-[#FCFAF6]">
            <div className="flex items-center space-x-3 text-sm">
              <div className={`flex items-center space-x-1 ${saveStatus === 'saving' ? 'text-blue-500' : saveStatus === 'saved' ? 'text-emerald-500' : 'text-slate-400'}`}>
                {saveStatus === 'saving' ? <Save className="w-4 h-4 animate-pulse" /> : <CheckCircle2 className="w-4 h-4" />}
                <span className="font-medium">{saveStatus === 'saving' ? 'Đang lưu...' : saveStatus === 'saved' ? 'Đã lưu' : 'Bản nháp'}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex flex-col items-end">
                <span className={`font-mono text-lg font-bold ${isTargetMet ? 'text-emerald-600' : 'text-slate-500'}`}>
                  {wordCount} <span className="text-sm font-sans font-normal text-slate-400">/ {minWords} từ</span>
                </span>
                <div className="w-32 h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${isTargetMet ? 'bg-emerald-500' : 'bg-[#C87556]'}`}
                    style={{ width: `${Math.min(100, (wordCount / minWords) * 100)}%` }}
                  />
                </div>
              </div>
              
              <button 
                onClick={() => {
                  if (confirm("Bạn có chắc muốn nộp bài? Bạn sẽ không thể sửa lại sau khi nộp.")) {
                    saveMutation.mutate({ content, isSubmit: true });
                  }
                }}
                disabled={saveMutation.isPending}
                className={`${themeBgColor} ${themeHoverColor} text-white px-6 py-2.5 rounded-full font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Nộp bài
              </button>
            </div>
          </div>

          {/* Textarea */}
          <textarea
            className="flex-1 p-8 resize-none focus:outline-none focus:ring-0 text-slate-700 text-lg leading-relaxed bg-white font-serif"
            placeholder="Bắt đầu viết bài của bạn tại đây..."
            value={content}
            onChange={handleChange}
            autoFocus
          />
        </div>
      </div>
    </div>
  );
}
