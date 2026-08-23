import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Menu, ChevronRight, Plus, X, Trash2, Image as ImageIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PromptManagement() {
  const queryClient = useQueryClient();
  const [taskFilter, setTaskFilter] = useState('task1');
  const [isAdding, setIsAdding] = useState(false);
  const [newPrompt, setNewPrompt] = useState({ type: '', text: '', sample: '' });

  const { data: prompts, isLoading } = useQuery({
    queryKey: ['prompts-manage', taskFilter],
    queryFn: async () => {
      const res = await api.get(`/prompts?task=${taskFilter}`);
      return res.data;
    }
  });

  const [imageFile, setImageFile] = useState<File | null>(null);

  const createMutation = useMutation({
    mutationFn: async (e: React.FormEvent) => {
      e.preventDefault();
      const formData = new FormData();
      formData.append('task', taskFilter);
      formData.append('type', newPrompt.type);
      formData.append('text', newPrompt.text);
      if (newPrompt.sample) formData.append('sample', newPrompt.sample);
      if (imageFile) formData.append('image', imageFile);

      await api.post('/prompts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompts-manage'] });
      setIsAdding(false);
      setNewPrompt({ type: '', text: '', sample: '' });
      setImageFile(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/prompts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompts-manage'] });
    }
  });

  return (
    <div className="h-full flex flex-col font-sans overflow-x-hidden bg-[#F5F2EC]">
      {/* Header */}
      <header className="flex items-center justify-between px-10 py-6">
        <div className="flex items-center space-x-2 text-slate-500 text-sm">
          <Menu className="w-5 h-5 mr-2" />
          <span>IELTS Writing Studio</span>
          <ChevronRight className="w-4 h-4" />
          <Link to="/teacher" className="hover:text-slate-900">Teacher desk</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="font-semibold text-slate-900">Quản lý kho đề</span>
        </div>
        <div className="flex items-center space-x-3 bg-white/50 border border-[#E5E0D8] px-3 py-1.5 rounded-full">
          <div className="w-6 h-6 rounded-full bg-[#A3B19B] flex items-center justify-center text-xs font-bold text-white">
            GV
          </div>
          <span className="text-sm font-medium pr-2">Không gian giáo viên</span>
        </div>
      </header>

      <div className="px-10 max-w-5xl w-full mx-auto pb-12">
        <div className="mt-2 mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-[#A3B19B] text-sm font-bold tracking-widest uppercase mb-2">PROMPT LIBRARY</h2>
            <h1 className="text-4xl font-serif text-[#23372B] font-bold">Kho đề bài</h1>
          </div>
          
          <div className="flex bg-white rounded-lg p-1 border border-[#E5E0D8] shadow-sm">
            <button 
              onClick={() => setTaskFilter('task1')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${taskFilter === 'task1' ? 'bg-[#23372B] text-white' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
            >
              Task 1
            </button>
            <button 
              onClick={() => setTaskFilter('task2')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${taskFilter === 'task2' ? 'bg-[#23372B] text-white' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
            >
              Task 2
            </button>
          </div>
        </div>

        <div className="flex justify-end mb-6">
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="bg-[#C87556] hover:bg-[#b06144] text-white px-5 py-2.5 rounded-full font-medium flex items-center space-x-2 transition-colors shadow-sm"
          >
            {isAdding ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            <span>{isAdding ? 'Hủy' : 'Thêm đề mới'}</span>
          </button>
        </div>

        {isAdding && (
          <Card className="mb-8 border-[#C87556]/30 bg-[#FCFAF6] shadow-sm overflow-hidden">
            <div className="bg-[#C87556]/10 px-6 py-4 border-b border-[#C87556]/20">
              <h3 className="font-serif font-bold text-lg text-[#23372B]">Tạo đề bài mới</h3>
            </div>
            <CardContent className="p-6">
              <form onSubmit={(e) => createMutation.mutate(e as any)} className="space-y-5">
                <div>
                  <label className="text-sm font-bold text-[#23372B] mb-1.5 block uppercase tracking-wider text-xs">Loại biểu đồ / Dạng bài</label>
                  <Input required value={newPrompt.type} onChange={(e) => setNewPrompt({...newPrompt, type: e.target.value})} placeholder={taskFilter === 'task1' ? "Bar chart, Line graph..." : "Opinion, Discussion..."} className="bg-white border-[#E5E0D8] focus-visible:ring-[#23372B]" />
                </div>
                <div>
                  <label className="text-sm font-bold text-[#23372B] mb-1.5 block uppercase tracking-wider text-xs">Nội dung đề (Prompt)</label>
                  <textarea required className="w-full border border-[#E5E0D8] rounded-md p-3 bg-white focus:outline-none focus:ring-2 focus:ring-[#23372B] focus:border-transparent min-h-[100px]" value={newPrompt.text} onChange={(e) => setNewPrompt({...newPrompt, text: e.target.value})} placeholder="Viết đề bài vào đây..." />
                </div>
                <div>
                  <label className="text-sm font-bold text-[#23372B] mb-1.5 block uppercase tracking-wider text-xs">Bài mẫu (Sample - Tùy chọn)</label>
                  <textarea className="w-full border border-[#E5E0D8] rounded-md p-3 bg-white focus:outline-none focus:ring-2 focus:ring-[#23372B] focus:border-transparent min-h-[120px]" value={newPrompt.sample} onChange={(e) => setNewPrompt({...newPrompt, sample: e.target.value})} placeholder="Bài mẫu tham khảo..." />
                </div>
                {taskFilter === 'task1' && (
                  <div>
                    <label className="text-sm font-bold text-[#23372B] mb-1.5 flex items-center uppercase tracking-wider text-xs">
                      <ImageIcon className="w-4 h-4 mr-1.5" />
                      Ảnh đính kèm
                    </label>
                    <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-[#23372B]/10 file:text-[#23372B] hover:file:bg-[#23372B]/20 cursor-pointer" />
                  </div>
                )}
                <div className="pt-2">
                  <Button type="submit" disabled={createMutation.isPending} className="bg-[#23372B] hover:bg-[#1a2a20] text-white rounded-full px-8">
                    {createMutation.isPending ? 'Đang lưu...' : 'Lưu đề bài'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <div className="text-center py-12 text-slate-500">Đang tải đề bài...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {prompts?.map((prompt: any) => (
              <Card key={prompt.id} className="bg-white border-[#E5E0D8] shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col group">
                <div className="bg-[#F5F2EC] px-5 py-3 border-b border-[#E5E0D8] flex justify-between items-center">
                  <span className="bg-white text-[#23372B] border border-[#E5E0D8] text-[10px] uppercase font-bold px-2 py-1 rounded tracking-wider">
                    {prompt.type}
                  </span>
                  <button onClick={() => {
                    if (confirm('Bạn có chắc muốn xóa đề này?')) {
                      deleteMutation.mutate(prompt.id);
                    }
                  }} className="text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <CardContent className="p-5 flex-1 flex flex-col">
                  <h3 className="font-serif text-lg font-bold text-[#23372B] mb-3 leading-snug">{prompt.text}</h3>
                  
                  {prompt.image && (
                    <div className="mb-4 bg-slate-50 rounded-lg p-2 border border-slate-100 flex justify-center">
                      <img src={import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') + prompt.image : `http://localhost:3000${prompt.image}`} alt="Prompt" className="max-h-40 object-contain rounded" />
                    </div>
                  )}
                  
                  {prompt.sample ? (
                    <div className="mt-auto pt-4 border-t border-slate-100">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Sample Available</p>
                      <p className="text-sm text-slate-500 italic line-clamp-2">{prompt.sample}</p>
                    </div>
                  ) : (
                    <div className="mt-auto pt-4 border-t border-slate-100">
                      <p className="text-xs text-slate-400 italic">Chưa có bài mẫu</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            {prompts?.length === 0 && !isAdding && (
              <div className="col-span-full flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-dashed border-[#E5E0D8]">
                <div className="w-16 h-16 bg-[#F5F2EC] rounded-full flex items-center justify-center mb-4 text-slate-300">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <p className="text-slate-500 font-medium mb-2">Chưa có đề bài nào trong kho.</p>
                <p className="text-sm text-slate-400">Hãy thêm đề bài đầu tiên để học sinh có thể luyện tập.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
