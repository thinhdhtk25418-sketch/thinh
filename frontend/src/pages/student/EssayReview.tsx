import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export default function EssayReview() {
  const { essayId } = useParams();
  const navigate = useNavigate();
  const [activeAnnotationIndex, setActiveAnnotationIndex] = useState<number | null>(null);

  const { data: essay, isLoading } = useQuery({
    queryKey: ['essay', essayId],
    queryFn: async () => {
      const res = await api.get(`/essays/${essayId}`);
      return res.data;
    }
  });

  if (isLoading || !essay) return <div className="p-8">Đang tải...</div>;

  const prompt = essay.prompt;
  const isGraded = essay.status === 'graded';
  
  // Sample Logic Condition
  const minWords = prompt.task === 'task1' ? 150 : 250;
  const hasSample = !!prompt.sample;
  const isEnoughWords = essay.wordCount >= minWords;
  const canViewSample = essay.status !== 'draft' && isEnoughWords && hasSample;

  const renderContentWithAnnotations = () => {
    if (!essay.annotations || essay.annotations.length === 0) {
      return <p className="whitespace-pre-wrap">{essay.content}</p>;
    }

    let lastIndex = 0;
    const elements: any[] = [];
    
    // Sort annotations by start index
    const sortedAnnotations = [...essay.annotations].sort((a, b) => a.start - b.start);

    sortedAnnotations.forEach((anno, index) => {
      // Push text before annotation
      if (anno.start > lastIndex) {
        elements.push(
          <span key={`text-${lastIndex}`}>{essay.content.slice(lastIndex, anno.start)}</span>
        );
      }
      
      // Push annotated text
      elements.push(
        <mark
          key={`mark-${index}`}
          className={`cursor-pointer rounded-sm px-1 transition-colors ${
            activeAnnotationIndex === index ? 'bg-yellow-300' : 'bg-yellow-100 hover:bg-yellow-200'
          }`}
          onClick={() => setActiveAnnotationIndex(index)}
        >
          {essay.content.slice(anno.start, anno.end)}
        </mark>
      );
      lastIndex = anno.end;
    });

    // Push remaining text
    if (lastIndex < essay.content.length) {
      elements.push(<span key={`text-end`}>{essay.content.slice(lastIndex)}</span>);
    }

    return <div className="whitespace-pre-wrap leading-relaxed">{elements}</div>;
  };

  return (
    <div className="flex h-full overflow-hidden bg-slate-50">
      <div className="flex-1 p-8 overflow-y-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Xem lại bài viết</h1>
          <div className="space-x-2">
            {!canViewSample ? (
              <span className="text-sm text-slate-500">
                {!hasSample ? "Đề này chưa có bài mẫu" : `Cần viết đủ ${minWords} từ để xem bài mẫu (${essay.wordCount}/${minWords})`}
              </span>
            ) : (
              <Button variant="outline" onClick={() => alert(prompt.sample)}>Xem bài mẫu</Button>
            )}
            
            {!isGraded && (
              <Button variant="outline" onClick={() => navigate(`/write/${prompt.id}`)}>
                Chỉnh sửa lại
              </Button>
            )}
          </div>
        </div>

        {isGraded ? (
          <div className="grid grid-cols-5 gap-4">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4 text-center">
                <div className="text-sm text-slate-500">Overall</div>
                <div className="text-2xl font-bold text-blue-700">{essay.overall}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-sm text-slate-500">Task Response</div>
                <div className="text-xl font-semibold">{essay.ta}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-sm text-slate-500">Coherence</div>
                <div className="text-xl font-semibold">{essay.cc}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-sm text-slate-500">Lexical</div>
                <div className="text-xl font-semibold">{essay.lr}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-sm text-slate-500">Grammar</div>
                <div className="text-xl font-semibold">{essay.gra}</div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="p-4 bg-yellow-50 text-yellow-800 rounded-md border border-yellow-200">
            Trạng thái: Đang chờ giáo viên chấm bài.
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Bài làm của bạn</CardTitle>
          </CardHeader>
          <CardContent>
            {renderContentWithAnnotations()}
          </CardContent>
        </Card>
      </div>

      {/* Sidebar for Feedback */}
      {(essay.feedback || (essay.annotations && essay.annotations.length > 0)) && (
        <div className="w-80 bg-white border-l border-slate-200 overflow-y-auto p-6 space-y-6">
          <h2 className="font-bold text-lg">Nhận xét từ giáo viên</h2>
          
          {essay.feedback && (
            <div className="p-4 bg-slate-50 rounded-md text-sm text-slate-700 border border-slate-200">
              <span className="font-semibold block mb-1">Nhận xét chung:</span>
              {essay.feedback}
            </div>
          )}

          <div className="space-y-4">
            {essay.annotations?.map((anno: any, idx: number) => (
              <div 
                key={idx} 
                className={`p-3 rounded-md border text-sm cursor-pointer transition-colors ${
                  activeAnnotationIndex === idx ? 'border-yellow-400 bg-yellow-50' : 'border-slate-200 hover:border-yellow-300'
                }`}
                onClick={() => setActiveAnnotationIndex(idx)}
              >
                <div className="text-xs text-slate-500 italic mb-2 line-clamp-2">"{anno.quote}"</div>
                <div className="text-slate-800">{anno.feedback}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
