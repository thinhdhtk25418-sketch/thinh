import { memo, type MouseEvent, type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft, ArrowRight, BookOpen, Check, ChevronRight, CircleHelp, Clock3,
  FileDown, FilePenLine, GraduationCap, KeyRound, LayoutDashboard, LockKeyhole, Menu,
  Pencil,
  Plus, Send, Sparkles, Timer, Trash2, UserRound, X, Zap,
} from 'lucide-react';

type Task = 'task1' | 'task2';
type EssayStatus = 'draft' | 'submitted' | 'grading' | 'graded';
type Annotation = {
  id: string;
  start: number;
  end: number;
  quote: string;
  feedback: string;
  createdAt: number;
};
type Prompt = {
  id: string;
  type: string;
  text: string;
  sample?: string;
  image?: string;
};
type Essay = {
  id: string;
  task: Task;
  promptId: string;
  studentName: string;
  content: string;
  wordCount: number;
  status: EssayStatus;
  submittedAt?: number;
  gradedAt?: number;
  timerEndsAt?: number;
  timerExpiredAt?: number;
  ta?: number;
  cc?: number;
  lr?: number;
  gra?: number;
  feedback?: string;
  annotations?: Annotation[];
};

type View = 'home' | 'board';
type BoardMode = 'gallery' | 'editor' | 'review' | 'queue' | 'grade' | 'prompts';
type Toast = { id: number; message: string; error?: boolean };
type DraftSnapshot = Pick<Essay, 'content' | 'wordCount'>;

const renderCounts = new Map<string, number>();

function logRender(name: string) {
  if (!import.meta.env.DEV) return;
  const count = (renderCounts.get(name) ?? 0) + 1;
  renderCounts.set(name, count);
  if (count <= 3 || count % 10 === 0) {
    console.debug(`[render] ${name} #${count}`);
  }
}

const seedPrompts: Record<Task, Prompt[]> = {
  task1: [
    {
      id: 'task1-bar-organisation',
      type: 'Bar chart',
      text: 'The chart below shows the amount of money given to developing countries from five organisations from 2008 to 2011. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
    },
    {
      id: 'task1-line-commute',
      type: 'Line graph',
      text: 'The graph below shows the average number of hours spent commuting each week by workers in three different cities between 2000 and 2020. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
    },
    {
      id: 'task1-process-recycling',
      type: 'Process',
      text: 'The diagram below illustrates the process used to recycle glass bottles. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
    },
  ],
  task2: [
    {
      id: 'task2-technology-education',
      type: 'Opinion essay',
      text: 'Some people think that technology has made children less creative than they were in the past. To what extent do you agree or disagree?',
    },
    {
      id: 'task2-city-transport',
      type: 'Advantages · disadvantages',
      text: 'More and more people are choosing to live in large cities. What are the advantages and disadvantages of living in a big city?',
    },
    {
      id: 'task2-work-flexibility',
      type: 'Discussion essay',
      text: 'Some people believe that employers should focus on the results of an employee’s work rather than the hours they work. Discuss both views and give your own opinion.',
    },
  ],
};

const seedEssays: Essay[] = [];

const countWords = (text: string) => text.trim() ? text.trim().split(/\s+/).length : 0;
const taskLabel = (task: Task) => task === 'task1' ? 'Writing Task 1' : 'Writing Task 2';
const minWords = (task: Task) => task === 'task1' ? 150 : 250;
const statusLabel = (status: EssayStatus) => ({ draft: 'Nháp', submitted: 'Đã nộp', grading: 'Đang chấm', graded: 'Đã chấm' })[status];
const formatDate = (timestamp?: number) => timestamp ? new Date(timestamp).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) : '';
const writingTimeSeconds = (task: Task) => (task === 'task1' ? 20 : 40) * 60;
const formatTimer = (seconds: number) => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;

function renderAnnotatedContent(content: string, annotations: Annotation[], onContextMenu?: (event: MouseEvent, annotation: Annotation) => void) {
  const validAnnotations = annotations
    .filter((annotation) => annotation.start >= 0 && annotation.end > annotation.start && annotation.start < content.length)
    .map((annotation) => ({ ...annotation, end: Math.min(annotation.end, content.length) }))
    .sort((a, b) => a.start - b.start || a.end - b.end);
  const parts: ReactNode[] = [];
  let cursor = 0;
  validAnnotations.forEach((annotation) => {
    if (annotation.start < cursor) return;
    if (annotation.start > cursor) parts.push(content.slice(cursor, annotation.start));
    parts.push(
      <mark
        className="annotation-mark"
        key={annotation.id}
        title="Nhấp chuột phải để xem đánh giá"
        onContextMenu={(event) => onContextMenu?.(event, annotation)}
      >
        {content.slice(annotation.start, annotation.end)}
      </mark>,
    );
    cursor = annotation.end;
  });
  if (cursor < content.length) parts.push(content.slice(cursor));
  return parts;
}

function getTextOffset(root: HTMLElement, node: Node, offset: number) {
  const range = document.createRange();
  range.selectNodeContents(root);
  range.setEnd(node, offset);
  return range.toString().length;
}

function App() {
  const [prompts, setPrompts] = useState<Record<Task, Prompt[]>>(() => {
    try { return JSON.parse(localStorage.getItem('ielts-prompts') || 'null') || seedPrompts; } catch { return seedPrompts; }
  });
  const [essays, setEssays] = useState<Essay[]>(() => {
    try { return JSON.parse(localStorage.getItem('ielts-essays') || 'null') || seedEssays; } catch { return seedEssays; }
  });
  const [studentName, setStudentName] = useState(() => localStorage.getItem('ielts-student') || 'Học sinh');
  const [view, setView] = useState<View>('home');
  const [task, setTask] = useState<Task>('task2');
  const [mode, setMode] = useState<BoardMode>('gallery');
  const [activeEssayId, setActiveEssayId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | EssayStatus>('all');
  const [teacher, setTeacher] = useState(false);
  const [gateOpen, setGateOpen] = useState(false);
  const [gateCode, setGateCode] = useState('');
  const [gateError, setGateError] = useState('');
  const [mobileRail, setMobileRail] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [addingPrompt, setAddingPrompt] = useState(false);
  const [newPromptType, setNewPromptType] = useState('');
  const [newPromptText, setNewPromptText] = useState('');
  const [newPromptSample, setNewPromptSample] = useState('');
  const [newPromptImage, setNewPromptImage] = useState('');
  const [editingPromptId, setEditingPromptId] = useState<string | null>(null);
  const [essayToDelete, setEssayToDelete] = useState<Essay | null>(null);
  const [promptToDelete, setPromptToDelete] = useState<{ task: Task; prompt: Prompt } | null>(null);

  useEffect(() => { localStorage.setItem('ielts-prompts', JSON.stringify(prompts)); }, [prompts]);
  useEffect(() => { localStorage.setItem('ielts-essays', JSON.stringify(essays)); }, [essays]);
  useEffect(() => { localStorage.setItem('ielts-student', studentName); }, [studentName]);

  const toast = (message: string, error = false) => {
    const id = Date.now(); setToasts((prev) => [...prev, { id, message, error }]);
    window.setTimeout(() => setToasts((prev) => prev.filter((item) => item.id !== id)), 3200);
  };
  const activeEssay = essays.find((essay) => essay.id === activeEssayId) || null;
  const activePrompt = activeEssay ? prompts[activeEssay.task].find((item) => item.id === activeEssay.promptId) : null;

  const openHome = () => { setView('home'); setActiveEssayId(null); setMode(teacher ? 'queue' : 'gallery'); };
  const openBoard = (nextTask: Task) => { setTask(nextTask); setView('board'); setActiveEssayId(null); setMode(teacher ? 'queue' : 'gallery'); };
  const startEssay = (promptId: string) => {
    const id = `e${Date.now()}`;
    setEssays((prev) => [...prev, { id, task, promptId, studentName: studentName || 'Học sinh', content: '', wordCount: 0, status: 'draft' }]);
    setActiveEssayId(id); setMode('editor');
  };
  const openEssay = (essay: Essay) => { setActiveEssayId(essay.id); setMode(teacher ? 'grade' : essay.status === 'draft' ? 'editor' : 'review'); };
  const updateEssay = (patch: Partial<Essay>) => {
    if (!activeEssayId) return;
    setEssays((prev) => prev.map((essay) => essay.id === activeEssayId ? { ...essay, ...patch } : essay));
  };
  const submitEssay = (draft?: DraftSnapshot) => {
    const essayToSubmit = activeEssay ? { ...activeEssay, ...draft } : null;
    if (!essayToSubmit || essayToSubmit.wordCount < 10) { toast('Bài viết còn quá ngắn, hãy viết thêm trước khi nộp.', true); return; }
    updateEssay({ ...draft, status: 'submitted', submittedAt: Date.now() }); setMode('review'); toast('Đã nộp bài cho giáo viên.');
  };
  const editAgain = () => { if (activeEssay) { updateEssay({ status: 'draft' }); setMode('editor'); } };
  const saveDraft = () => toast('Đã lưu nháp trên thiết bị này.');
  const computeOverall = (essay: Essay) => Math.round(((essay.ta ?? 6) + (essay.cc ?? 6) + (essay.lr ?? 6) + (essay.gra ?? 6)) / 4 * 2) / 2;
  const saveGrade = (send: boolean) => {
    if (!activeEssay) return;
    updateEssay({ status: send ? 'graded' : 'grading', gradedAt: send ? Date.now() : activeEssay.gradedAt });
    if (send) { setMode('queue'); setActiveEssayId(null); toast('Đã gửi bài đã chấm cho học sinh.'); }
    else toast('Đã lưu bản chấm riêng tư.');
  };
  const deleteEssay = () => {
    if (!essayToDelete) return;
    const deletedStudent = essayToDelete.studentName;
    setEssays((prev) => prev.filter((essay) => essay.id !== essayToDelete.id));
    if (activeEssayId === essayToDelete.id) {
      setActiveEssayId(null);
      setMode('queue');
    }
    setEssayToDelete(null);
    toast(`Đã xoá bài của ${deletedStudent}.`);
  };
  const deletePrompt = () => {
    if (!promptToDelete) return;
    const { task: promptTask, prompt } = promptToDelete;
    const relatedEssays = essays.filter((essay) => essay.task === promptTask && essay.promptId === prompt.id).length;
    setPrompts((prev) => ({ ...prev, [promptTask]: prev[promptTask].filter((item) => item.id !== prompt.id) }));
    setEssays((prev) => prev.filter((essay) => !(essay.task === promptTask && essay.promptId === prompt.id)));
    if (activeEssayId && essays.some((essay) => essay.id === activeEssayId && essay.task === promptTask && essay.promptId === prompt.id)) {
      setActiveEssayId(null);
      setMode('queue');
    }
    setPromptToDelete(null);
    toast(relatedEssays ? `Đã xoá đề và ${relatedEssays} bài viết liên quan.` : 'Đã xoá đề bài.');
  };
  const resetPromptForm = () => {
    setNewPromptType('');
    setNewPromptText('');
    setNewPromptSample('');
    setNewPromptImage('');
    setEditingPromptId(null);
    setAddingPrompt(false);
  };
  const editPrompt = (prompt: Prompt) => {
    setEditingPromptId(prompt.id);
    setNewPromptType(prompt.type);
    setNewPromptText(prompt.text);
    setNewPromptSample(prompt.sample || '');
    setNewPromptImage(prompt.image || '');
    setAddingPrompt(true);
  };
  const savePrompt = () => {
    if (!newPromptText.trim()) { toast('Hãy nhập nội dung đề bài.', true); return; }
    const promptData = {
      type: newPromptType.trim() || 'Đề bài mới',
      text: newPromptText.trim(),
      sample: newPromptSample.trim() || undefined,
      image: task === 'task1' ? newPromptImage || undefined : undefined,
    };
    setPrompts((prev) => ({
      ...prev,
      [task]: editingPromptId
        ? prev[task].map((prompt) => prompt.id === editingPromptId ? { ...prompt, ...promptData } : prompt)
        : [...prev[task], { id: `custom-${Date.now()}`, ...promptData }],
    }));
    toast(editingPromptId ? 'Đã cập nhật đề bài.' : 'Đã thêm đề bài mới.');
    resetPromptForm();
  };
  const preparePromptImage = (file: File) => {
    if (!file.type.startsWith('image/')) { toast('Hãy chọn một tệp hình ảnh.', true); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const maxWidth = 1500;
        const scale = Math.min(1, maxWidth / image.width);
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext('2d');
        if (!context) { toast('Không thể đọc hình ảnh này.', true); return; }
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        setNewPromptImage(canvas.toDataURL('image/jpeg', 0.84));
      };
      image.onerror = () => toast('Không thể đọc hình ảnh này.', true);
      image.src = String(reader.result);
    };
    reader.onerror = () => toast('Không thể đọc tệp hình ảnh.', true);
    reader.readAsDataURL(file);
  };
  const unlockTeacher = () => {
    if (gateCode.trim().toLowerCase() !== 'tienthinhquesat') { setGateError('Mã truy cập chưa đúng.'); return; }
    setTeacher(true); setGateOpen(false); setGateCode(''); setGateError(''); setView('board'); setMode('queue'); setTask('task2'); toast('Đã mở không gian giáo viên.');
  };
  const leaveTeacher = () => { setTeacher(false); setMode('gallery'); setView('home'); };

  const visibleEssays = useMemo(() => essays
    .filter((essay) => teacher || (essay.task === task && essay.studentName === (studentName || 'Học sinh')))
    .filter((essay) => teacher ? (filter === 'all' ? true : filter === 'pending' ? essay.status === 'submitted' || essay.status === 'grading' : essay.status === filter) : true)
    .sort((a, b) => (b.submittedAt || 0) - (a.submittedAt || 0)), [essays, teacher, task, studentName, filter]);

  const goBackBoard = () => { setActiveEssayId(null); setMode(teacher ? 'queue' : 'gallery'); };
  const railClass = mobileRail ? 'side-rail mobile-open' : 'side-rail';

  return (
    <div className="app-shell">
      <aside className={railClass}>
        <div className="brand-lockup" role="button" tabIndex={0} onClick={openHome} onKeyDown={(e) => e.key === 'Enter' && openHome()}>
          <div className="brand-mark">W</div><div className="brand-copy"><p className="brand-name">Writing Studio</p><span className="brand-subtitle">IELTS · Việt Nam</span></div>
        </div>
        <div className="rail-section-label">Bàn viết</div>
        <nav className="rail-nav">
          <button className={`rail-button ${view === 'home' && !teacher ? 'active' : ''}`} onClick={openHome} data-testid="button-home"><LayoutDashboard size={16} /><span>Tổng quan</span></button>
          <button className={`rail-button ${view === 'board' && task === 'task1' && !teacher ? 'active' : ''}`} onClick={() => openBoard('task1')} data-testid="button-task1"><FilePenLine size={16} /><span>Task 1 · Report</span></button>
          <button className={`rail-button ${view === 'board' && task === 'task2' && !teacher ? 'active' : ''}`} onClick={() => openBoard('task2')} data-testid="button-task2"><BookOpen size={16} /><span>Task 2 · Essay</span></button>
        </nav>
        <div className="rail-divider" />
        <div className="rail-section-label">{teacher ? 'Giáo viên' : 'Góc của bạn'}</div>
        <nav className="rail-nav">
          {teacher ? <>
            <button className={`rail-button ${mode === 'queue' ? 'active' : ''}`} onClick={() => { setMode('queue'); setView('board'); }} data-testid="button-teacher-queue"><Clock3 size={16} /><span>Bài cần xem</span></button>
            <button className={`rail-button ${mode === 'prompts' ? 'active' : ''}`} onClick={() => { setMode('prompts'); setView('board'); }} data-testid="button-teacher-prompts"><Plus size={16} /><span>Thêm đề bài</span></button>
            <button className="rail-button" onClick={leaveTeacher} data-testid="button-leave-teacher"><UserRound size={16} /><span>Về tài khoản học sinh</span></button>
          </> : <button className="rail-button" onClick={() => toast('Mỗi bài viết đều được lưu tự động trên thiết bị này.')} data-testid="button-help"><CircleHelp size={16} /><span>Hướng dẫn nhanh</span></button>}
        </nav>
        <div className="rail-footer">Một căn phòng yên tĩnh<br />cho những câu chữ tốt hơn.<br /><button className="teacher-entry" onClick={() => setGateOpen(true)} data-testid="button-teacher-entry">{teacher ? 'Đang ở chế độ giáo viên' : 'Teacher access'}</button></div>
      </aside>

      <main className="main-stage">
        <div className="topline">
          <div className="crumb"><button className="quiet-button" onClick={() => setMobileRail(!mobileRail)} aria-label="Mở menu"><Menu size={15} /></button><span>IELTS Writing Studio</span><ChevronRight size={13} /><strong>{teacher ? 'Teacher desk' : view === 'home' ? 'Tổng quan' : taskLabel(task)}</strong></div>
          <div className="profile-pill"><div className="avatar">{teacher ? 'GV' : (studentName || 'H').slice(0, 1).toUpperCase()}</div><span>{teacher ? 'Không gian giáo viên' : studentName || 'Học sinh'}</span></div>
        </div>
         {view === 'home' ? <HomeView studentName={studentName} setStudentName={setStudentName} openBoard={openBoard} prompts={prompts} teacher={teacher} /> : (
       <BoardView task={task} setTask={setTask} teacher={teacher} mode={mode} setMode={setMode} prompts={prompts} visibleEssays={visibleEssays} activeEssay={activeEssay} activePrompt={activePrompt ?? null} filter={filter} setFilter={setFilter} startEssay={startEssay} openEssay={openEssay} goBackBoard={goBackBoard} updateEssay={updateEssay} saveDraft={saveDraft} submitEssay={submitEssay} editAgain={editAgain} computeOverall={computeOverall} saveGrade={saveGrade} requestDeleteEssay={setEssayToDelete} requestDeletePrompt={(prompt) => setPromptToDelete({ task, prompt })} addingPrompt={addingPrompt} setAddingPrompt={setAddingPrompt} newPromptType={newPromptType} setNewPromptType={setNewPromptType} newPromptText={newPromptText} setNewPromptText={setNewPromptText} newPromptSample={newPromptSample} setNewPromptSample={setNewPromptSample} newPromptImage={newPromptImage} setNewPromptImage={setNewPromptImage} editingPromptId={editingPromptId} editPrompt={editPrompt} resetPromptForm={resetPromptForm} preparePromptImage={preparePromptImage} savePrompt={savePrompt} />
        )}
      </main>
      {gateOpen && <TeacherGate code={gateCode} setCode={setGateCode} error={gateError} close={() => { setGateOpen(false); setGateError(''); }} unlock={unlockTeacher} />}
       {essayToDelete && <DeleteEssayDialog essay={essayToDelete} close={() => setEssayToDelete(null)} confirm={deleteEssay} />}
       {promptToDelete && <DeletePromptDialog prompt={promptToDelete.prompt} close={() => setPromptToDelete(null)} confirm={deletePrompt} />}
      <div className="toast-region" aria-live="polite">{toasts.map((item) => <div className={`toast ${item.error ? 'error' : ''}`} key={item.id}>{item.message}</div>)}</div>
    </div>
  );
}

function HomeView({ studentName, setStudentName, openBoard, prompts, teacher }: { studentName: string; setStudentName: (v: string) => void; openBoard: (t: Task) => void; prompts: Record<Task, Prompt[]>; teacher: boolean }) {
  return <div className="content">
    <section className="hero">
      <div><div className="eyebrow">{teacher ? 'Teacher desk' : `Chào ${studentName || 'bạn'}`}</div><h1>Viết chậm lại.<br /><em>Nghĩ sâu hơn.</em></h1><p className="hero-copy">Một không gian tập trung để luyện Task 1 và Task 2, theo dõi bản nháp, rồi nhận những góp ý đủ cụ thể để lần viết sau tốt hơn.</p></div>
      <div className="date-note">SESSION / {new Date().toLocaleDateString('vi-VN')}</div>
    </section>
    {!teacher && <div className="surface" style={{ marginBottom: 24, padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 12 }}><UserRound size={15} color="#a75a42" /><label className="field-label" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8, width: '100%' }}>Tên hiển thị <input className="field-input" style={{ maxWidth: 220, padding: '7px 9px' }} value={studentName} onChange={(e) => setStudentName(e.target.value)} data-testid="input-student-name" /></label></div>}
    <div className="section-heading"><h2>Chọn bàn viết</h2><span>Hai dạng bài, một thói quen tốt</span></div>
    <div className="task-grid">
      <TaskCard task="task1" count={prompts.task1.length} openBoard={openBoard} />
      <TaskCard task="task2" count={prompts.task2.length} openBoard={openBoard} />
    </div>
    <div className="studio-note"><Sparkles size={17} className="note-icon" /><span><strong>Gợi ý cho hôm nay:</strong> bắt đầu bằng một đề quen thuộc, dành 5 phút lập dàn ý, sau đó viết liền mạch trước khi sửa.</span></div>
    <div className="dashboard-lower">
      <div className="surface"><div className="section-heading"><h3>Nhịp luyện tập</h3><span>Tuần này</span></div><div className="mini-progress">{[1, 2, 3, 4, 5, 6, 7].map((day) => <i key={day} />)}</div><div className="surface-meta"><span>0 bài hoàn thành</span><span>Giữ nhịp đều</span></div></div>
      <div className="surface"><span className="quote-mark">“</span><p className="quote">Clarity is not a gift. It is a habit you can practise.</p><span className="quote-by">— Writing room note</span></div>
    </div>
  </div>;
}

function TaskCard({ task, count, openBoard }: { task: Task; count: number; openBoard: (t: Task) => void }) {
  const task1 = task === 'task1';
  return <article className={`task-card ${task1 ? '' : 'task-two'}`}><div className="task-label">{task1 ? <FilePenLine size={13} /> : <BookOpen size={13} />} {task1 ? 'Report writing' : 'Essay writing'}</div><h3>{taskLabel(task)}</h3><p>{task1 ? 'Mô tả biểu đồ đường, cột, tròn, quy trình và bản đồ. Tối thiểu 150 từ mỗi bài.' : 'Luyện các dạng lập luận: quan điểm, thảo luận, nguyên nhân – giải pháp. Tối thiểu 250 từ mỗi bài.'}</p><div className="task-footer"><span className="task-count">{count} đề bài</span><button className="arrow-button" onClick={() => openBoard(task)} data-testid={`button-open-${task}`}>Mở bàn viết <ArrowRight size={14} /></button></div></article>;
}

function BoardView(props: {
  task: Task; setTask: (task: Task) => void; teacher: boolean; mode: BoardMode; setMode: (m: BoardMode) => void; prompts: Record<Task, Prompt[]>; visibleEssays: Essay[]; activeEssay: Essay | null; activePrompt: Prompt | null; filter: 'all' | 'pending' | EssayStatus; setFilter: (f: 'all' | 'pending' | EssayStatus) => void; startEssay: (id: string) => void; openEssay: (e: Essay) => void; goBackBoard: () => void; updateEssay: (p: Partial<Essay>) => void; saveDraft: () => void; submitEssay: (draft?: DraftSnapshot) => void; editAgain: () => void; computeOverall: (e: Essay) => number; saveGrade: (send: boolean) => void; requestDeleteEssay: (essay: Essay) => void; requestDeletePrompt: (prompt: Prompt) => void; addingPrompt: boolean; setAddingPrompt: (v: boolean) => void; newPromptType: string; setNewPromptType: (v: string) => void; newPromptText: string; setNewPromptText: (v: string) => void; newPromptSample: string; setNewPromptSample: (v: string) => void; newPromptImage: string; setNewPromptImage: (v: string) => void; editingPromptId: string | null; editPrompt: (prompt: Prompt) => void; resetPromptForm: () => void; preparePromptImage: (file: File) => void; savePrompt: () => void;
}) {
  const { task, setTask, teacher, mode, setMode, prompts, visibleEssays, activeEssay, activePrompt, filter, setFilter, startEssay, openEssay, goBackBoard, updateEssay, saveDraft, submitEssay, editAgain, computeOverall, saveGrade, requestDeleteEssay, requestDeletePrompt, addingPrompt, setAddingPrompt, newPromptType, setNewPromptType, newPromptText, setNewPromptText, newPromptSample, setNewPromptSample, newPromptImage, setNewPromptImage, editingPromptId, editPrompt, resetPromptForm, preparePromptImage, savePrompt } = props;
  const title = teacher ? mode === 'prompts' ? 'Prompt library' : mode === 'grade' ? 'Reviewing a submission' : 'Teacher queue' : taskLabel(task);
  return <div className="content">
    <div className="board-header"><div><button className="back-link" onClick={goBackBoard} data-testid="button-back-board"><ArrowLeft size={14} /> Tổng quan</button><div className="board-kicker">{teacher ? 'PRIVATE TEACHER SPACE' : `WRITING ROOM / ${task.toUpperCase()}`}</div><h1>{title}</h1></div>{!teacher && mode === 'gallery' && <span className="date-note">MINIMUM / {minWords(task)} WORDS</span>}</div>
    {teacher && <div className="teacher-banner"><LockKeyhole size={14} style={{ verticalAlign: 'middle', marginRight: 7 }} /> Khu vực riêng của giáo viên. Bài viết và phản hồi chỉ hiển thị trong phiên làm việc này trên thiết bị của bạn.</div>}
    <div className="board-layout">
       <BoardSidebar task={task} teacher={teacher} mode={mode} setMode={setMode} visibleEssays={visibleEssays} activeEssay={activeEssay} filter={filter} setFilter={setFilter} openEssay={openEssay} requestDeleteEssay={requestDeleteEssay} />
      <section className={`panel ${teacher ? 'teacher-panel' : ''}`}>
        {mode === 'gallery' && <PromptGallery task={task} prompts={prompts[task]} startEssay={startEssay} />}
        {mode === 'editor' && activeEssay && activePrompt && <Editor key={activeEssay.id} essay={activeEssay} prompt={activePrompt} updateEssay={updateEssay} saveDraft={saveDraft} submitEssay={submitEssay} goBack={goBackBoard} />}
         {mode === 'review' && activeEssay && activePrompt && <StudentReview essay={activeEssay} prompt={activePrompt} studentEssays={visibleEssays} editAgain={editAgain} />}
         {mode === 'queue' && <TeacherQueue essays={visibleEssays} openEssay={openEssay} requestDeleteEssay={requestDeleteEssay} />}
        {mode === 'grade' && activeEssay && activePrompt && <Grader essay={activeEssay} prompt={activePrompt} updateEssay={updateEssay} computeOverall={computeOverall} saveGrade={saveGrade} />}
        {mode === 'prompts' && <PromptManager task={task} setTask={setTask} prompts={prompts[task]} addingPrompt={addingPrompt} setAddingPrompt={setAddingPrompt} newPromptType={newPromptType} setNewPromptType={setNewPromptType} newPromptText={newPromptText} setNewPromptText={setNewPromptText} newPromptSample={newPromptSample} setNewPromptSample={setNewPromptSample} newPromptImage={newPromptImage} setNewPromptImage={setNewPromptImage} editingPromptId={editingPromptId} editPrompt={editPrompt} resetPromptForm={resetPromptForm} preparePromptImage={preparePromptImage} savePrompt={savePrompt} startEssay={startEssay} requestDeletePrompt={requestDeletePrompt} />}
      </section>
    </div>
  </div>;
}

const BoardSidebar = memo(function BoardSidebar({ task, teacher, mode, setMode, visibleEssays, activeEssay, filter, setFilter, openEssay, requestDeleteEssay }: { task: Task; teacher: boolean; mode: BoardMode; setMode: (m: BoardMode) => void; visibleEssays: Essay[]; activeEssay: Essay | null; filter: 'all' | 'pending' | EssayStatus; setFilter: (f: 'all' | 'pending' | EssayStatus) => void; openEssay: (e: Essay) => void; requestDeleteEssay: (essay: Essay) => void }) {
  logRender('BoardSidebar');
  const filters: ('all' | 'pending' | EssayStatus)[] = teacher ? ['all', 'pending', 'graded'] : ['all', 'draft', 'submitted', 'graded'];
  return <aside className="board-sidebar">{teacher ? <button className="add-essay" onClick={() => setMode('prompts')} data-testid="button-add-prompt"><Plus size={14} /> Thêm đề bài</button> : null}<div className="sidebar-title"><strong>{teacher ? 'Bài nộp' : 'Bài của bạn'}</strong><span className="small-count">{visibleEssays.length} bài</span></div><div className="filter-row">{filters.map((item) => <button key={item} className={`filter-chip ${filter === item ? 'active' : ''}`} onClick={() => setFilter(item)} data-testid={`button-filter-${item}`}>{item === 'all' ? 'Tất cả' : item === 'pending' ? 'Chờ xem' : statusLabel(item)}</button>)}</div><div className="essay-list">{visibleEssays.length === 0 ? <div className="empty-state"><CircleHelp size={20} /><span>{teacher ? 'Chưa có bài nào trong hàng đợi.' : 'Bài viết bạn bắt đầu sẽ nằm ở đây.'}</span></div> : visibleEssays.map((essay) => <div className="essay-row" key={essay.id}><button className={`essay-item ${activeEssay?.id === essay.id ? 'selected' : ''}`} onClick={() => openEssay(essay)} data-testid={`button-essay-${essay.id}`}><div className="essay-top"><span className="essay-title">{essay.task === 'task1' ? 'Task 1' : 'Task 2'} · {essay.promptId}</span><span className={`status ${essay.status}`}>{statusLabel(essay.status)}</span></div><div className="essay-student">{teacher ? `${essay.studentName} · ` : ''}{essay.wordCount} từ {formatDate(essay.submittedAt) && `· ${formatDate(essay.submittedAt)}`}</div></button>{teacher && <button className="essay-delete" onClick={() => requestDeleteEssay(essay)} aria-label={`Xoá bài của ${essay.studentName}`} title="Xoá bài" data-testid={`button-delete-essay-${essay.id}`}><Trash2 size={14} /></button>}</div>)}</div></aside>;
});

const PromptGallery = memo(function PromptGallery({ task, prompts, startEssay }: { task: Task; prompts: Prompt[]; startEssay: (id: string) => void }) {
  logRender('PromptGallery');
  return <><div className="panel-heading"><div><h2>Chọn một đề để bắt đầu</h2><p>Đọc đề thật kỹ. Một dàn ý rõ ràng luôn đáng giá vài phút đầu tiên.</p></div><span className="small-count">{prompts.length} PROMPTS</span></div>{prompts.length === 0 ? <div className="empty-state prompt-empty"><FilePenLine size={22} /><strong>Chưa có đề bài</strong><span>Không gian này sẽ sẵn sàng khi giáo viên thêm đề mới.</span></div> : <div className="prompt-grid">{prompts.map((prompt) => <article className="prompt-card" key={prompt.id}><span className={`prompt-type ${task === 'task2' ? 'task-two-type' : ''}`}>{prompt.type}</span>{prompt.image && <PromptImage src={prompt.image} alt={`Biểu đồ cho đề ${prompt.type}`} compact />}<p>{prompt.text}</p><button className="start-link" onClick={() => startEssay(prompt.id)} data-testid={`button-start-${prompt.id}`}>Bắt đầu viết <ArrowRight size={13} /></button></article>)}</div>}</>;
});

const PromptBanner = memo(function PromptBanner({ prompt }: { prompt: Prompt }) {
  logRender('PromptBanner');
  return <div className="prompt-banner">{prompt.image && <PromptImage src={prompt.image} alt={`Biểu đồ cho đề ${prompt.type}`} />}<div><strong>{prompt.type}.</strong> {prompt.text}</div></div>;
});

const WritingTimer = memo(function WritingTimer({ task, timerExpired, timerStarted, remainingSeconds, startTimer }: { task: Task; timerExpired: boolean; timerStarted: boolean; remainingSeconds: number; startTimer: () => void }) {
  logRender('WritingTimer');
  return <div className={`writing-timer ${timerExpired ? 'expired' : timerStarted ? 'running' : 'idle'}`} aria-live="polite"><Timer size={15} /><div><strong>{timerExpired ? 'Hết giờ' : formatTimer(remainingSeconds)}</strong><span>{task === 'task1' ? 'Task 1 · 20 phút' : 'Task 2 · 40 phút'}</span></div>{!timerStarted && <button className="timer-start" onClick={startTimer} data-testid="button-start-timer">Bật đồng hồ</button>}</div>;
});

const EssayComposer = memo(function EssayComposer({ essay, timerExpired, onDraftValue, onDraftCommitted }: { essay: Essay; timerExpired: boolean; onDraftValue: (draft: DraftSnapshot) => void; onDraftCommitted: (draft: DraftSnapshot) => void }) {
  logRender('EssayComposer');
  const [draftContent, setDraftContent] = useState(essay.content);
  const draftRef = useRef<DraftSnapshot>({ content: essay.content, wordCount: essay.wordCount });
  const onDraftValueRef = useRef(onDraftValue);
  const onDraftCommittedRef = useRef(onDraftCommitted);

  onDraftValueRef.current = onDraftValue;
  onDraftCommittedRef.current = onDraftCommitted;

  useEffect(() => {
    draftRef.current = { content: essay.content, wordCount: essay.wordCount };
    setDraftContent(essay.content);
  }, [essay.id]);

  useEffect(() => {
    const draft = draftRef.current;
    onDraftValueRef.current(draft);
    const timeout = window.setTimeout(() => onDraftCommittedRef.current(draft), 450);
    return () => window.clearTimeout(timeout);
  }, [draftContent]);

  useEffect(() => () => {
    onDraftCommittedRef.current(draftRef.current);
  }, []);

  const handleChange = (value: string) => {
    const draft = { content: value, wordCount: countWords(value) };
    draftRef.current = draft;
    setDraftContent(value);
  };

  return <textarea className="editor-area" value={draftContent} disabled={timerExpired} onChange={(e) => handleChange(e.target.value)} placeholder={timerExpired ? 'Đã hết thời gian làm bài.' : 'Bắt đầu bằng một câu mở bài rõ ràng...'} data-testid="textarea-essay" />;
});

function Editor({ essay, prompt, updateEssay, saveDraft, submitEssay, goBack }: { essay: Essay; prompt: Prompt; updateEssay: (p: Partial<Essay>) => void; saveDraft: () => void; submitEssay: (draft?: DraftSnapshot) => void; goBack: () => void }) {
  logRender('Editor');
  const target = minWords(essay.task);
  const [draftWordCount, setDraftWordCount] = useState(essay.wordCount);
  const draftRef = useRef<DraftSnapshot>({ content: essay.content, wordCount: essay.wordCount });
  const pct = Math.min(100, Math.round(draftWordCount / target * 100)); const barColor = draftWordCount >= target ? '#6e9c73' : draftWordCount >= target * .7 ? '#bd9551' : '#b5654c';
  const durationSeconds = writingTimeSeconds(essay.task);
  const [now, setNow] = useState(() => Date.now());
  const timerStarted = Boolean(essay.timerEndsAt);
  const remainingSeconds = timerStarted ? Math.max(0, Math.ceil(((essay.timerEndsAt ?? 0) - now) / 1000)) : durationSeconds;
  const timerExpired = Boolean(essay.timerExpiredAt || (timerStarted && remainingSeconds === 0));

  useEffect(() => {
    if (!essay.timerEndsAt || essay.timerExpiredAt) return;
    const tick = () => {
      const current = Date.now();
      setNow(current);
      if (essay.timerEndsAt && current >= essay.timerEndsAt && !essay.timerExpiredAt) {
        updateEssay({ timerExpiredAt: current });
      }
    };
    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [essay.timerEndsAt, essay.timerExpiredAt, updateEssay]);

  const startTimer = useCallback(() => {
    if (!timerStarted) updateEssay({ timerEndsAt: Date.now() + durationSeconds * 1000 });
  }, [durationSeconds, timerStarted, updateEssay]);

  const handleDraftValue = useCallback((draft: DraftSnapshot) => {
    draftRef.current = draft;
    setDraftWordCount(draft.wordCount);
  }, []);
  const handleDraftCommitted = useCallback((draft: DraftSnapshot) => {
    draftRef.current = draft;
    updateEssay(draft);
  }, [updateEssay]);
  const handleSaveDraft = useCallback(() => {
    updateEssay(draftRef.current);
    saveDraft();
  }, [saveDraft, updateEssay]);
  const handleSubmit = useCallback(() => {
    submitEssay(draftRef.current);
  }, [submitEssay]);

  return <><div className="panel-heading"><div><h2>Viết bài của bạn</h2><p>{essay.task === 'task1' ? 'Task 1 · Report' : 'Task 2 · Essay'}</p></div><span className="status draft">Nháp</span></div><PromptBanner prompt={prompt} /><div className="editor-toolbar"><div className="word-status"><strong data-testid="text-word-count">{draftWordCount} từ</strong><span>/ {target} từ tối thiểu</span><div className="meter"><div className="meter-fill" style={{ width: `${pct}%`, background: barColor }} /></div></div><WritingTimer task={essay.task} timerExpired={timerExpired} timerStarted={timerStarted} remainingSeconds={remainingSeconds} startTimer={startTimer} /><span className="small-count">TỰ ĐỘNG LƯU · 450MS</span></div>{timerExpired && <div className="timer-notice expired-notice"><Timer size={14} /> Thời gian làm bài đã kết thúc. Bạn vẫn có thể nộp bài đang viết.</div>}<EssayComposer essay={essay} timerExpired={timerExpired} onDraftValue={handleDraftValue} onDraftCommitted={handleDraftCommitted} /><div className="editor-actions"><button className="btn btn-quiet" onClick={goBack} data-testid="button-cancel-editor">Để sau</button><button className="btn btn-quiet" onClick={handleSaveDraft} data-testid="button-save-draft"><Check size={14} /> Lưu nháp</button><button className="btn btn-primary" onClick={handleSubmit} data-testid="button-submit-essay"><Send size={14} /> Nộp bài</button></div></>;
}

function StudentReview({ essay, prompt, studentEssays, editAgain }: { essay: Essay; prompt: Prompt; studentEssays: Essay[]; editAgain: () => void }) {
  const scoreValues = [essay.ta, essay.cc, essay.lr, essay.gra].map((value) => value ?? 6);
  const overall = scoreValues.reduce((total, value) => total + value, 0) / scoreValues.length;
  const [selectedAnnotation, setSelectedAnnotation] = useState<Annotation | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; annotation: Annotation } | null>(null);
  const [sampleOpen, setSampleOpen] = useState(false);
  const annotations = essay.annotations ?? [];
  const requiredWords = minWords(essay.task);
  const submittedEssays = studentEssays.filter((item) => item.task === essay.task && item.promptId === essay.promptId && item.status !== 'draft');
  const bestSubmittedWordCount = submittedEssays.reduce((highest, item) => Math.max(highest, item.wordCount), 0);
  const hasEnoughWords = submittedEssays.some((item) => item.wordCount >= requiredWords);
  const hasSample = Boolean(prompt.sample?.trim());

  useEffect(() => {
    if (!contextMenu) return;
    const closeMenu = () => setContextMenu(null);
    window.addEventListener('click', closeMenu);
    window.addEventListener('scroll', closeMenu, true);
    return () => {
      window.removeEventListener('click', closeMenu);
      window.removeEventListener('scroll', closeMenu, true);
    };
  }, [contextMenu]);

  const handleAnnotationMenu = (event: MouseEvent, annotation: Annotation) => {
    event.preventDefault();
    event.stopPropagation();
    setContextMenu({
      x: Math.min(event.clientX, window.innerWidth - 180),
      y: Math.min(event.clientY, window.innerHeight - 58),
      annotation,
    });
  };

  const sampleMessage = !submittedEssays.length
    ? 'Nộp bài đủ số từ tối thiểu để mở khoá bài mẫu.'
    : !hasEnoughWords
      ? `Bài viết cần tối thiểu ${requiredWords} từ để mở khoá bài mẫu (bài của bạn hiện có ${bestSubmittedWordCount} từ).`
      : 'Đề này chưa có bài mẫu.';

  return <><div className="panel-heading"><div><h2>Bài viết đã gửi</h2><p>{prompt.type} · {essay.wordCount} từ</p></div><span className={`status ${essay.status}`}>{statusLabel(essay.status)}</span></div><div className="prompt-banner">{prompt.image && <PromptImage src={prompt.image} alt={`Biểu đồ cho đề ${prompt.type}`} />}<div><strong>{prompt.type}.</strong> {prompt.text}</div></div><div className={`review-annotation-layout ${selectedAnnotation ? 'has-annotation' : ''}`}><div className="review-content">{renderAnnotatedContent(essay.content, annotations, handleAnnotationMenu)}</div>{selectedAnnotation && <aside className="annotation-panel"><div className="annotation-panel-heading"><div><span className="annotation-kicker">ĐÁNH GIÁ ĐOẠN VĂN</span><h3>Nhận xét của giáo viên</h3></div><button className="quiet-button" onClick={() => setSelectedAnnotation(null)} aria-label="Đóng đánh giá"><X size={16} /></button></div><blockquote>“{selectedAnnotation.quote}”</blockquote><p>{selectedAnnotation.feedback}</p><span className="annotation-date">{new Date(selectedAnnotation.createdAt).toLocaleDateString('vi-VN')}</span></aside>}</div>{contextMenu && <div className="annotation-context-menu" style={{ left: contextMenu.x, top: contextMenu.y }} role="menu"><button onClick={() => { setSelectedAnnotation(contextMenu.annotation); setContextMenu(null); }} role="menuitem" data-testid={`button-view-annotation-${contextMenu.annotation.id}`}><CircleHelp size={14} /> Xem đánh giá</button></div>}{essay.status === 'graded' ? <><div className="overall"><span>Overall band score</span><strong>{overall.toFixed(1)}</strong></div><h3 style={{ fontSize: 17, marginBottom: 9 }}>Nhận xét từ giáo viên</h3><div className="feedback-view">{essay.feedback || 'Giáo viên chưa để lại nhận xét.'}</div></> : <div className="waiting"><Zap size={23} /><div><strong>Bài viết đang chờ giáo viên xem</strong><br /><span>Thường mất khoảng một buổi học. Bạn có thể quay lại chỉnh sửa bất cứ lúc nào.</span></div></div>}<div className="sample-access">{hasEnoughWords && hasSample ? <button className="btn btn-terra" onClick={() => setSampleOpen(true)} data-testid="button-view-sample"><BookOpen size={14} /> Xem bài mẫu</button> : <p className="sample-lock-note"><LockKeyhole size={14} /> {sampleMessage}</p>}</div><div className="editor-actions"><button className="btn btn-quiet" onClick={editAgain} data-testid="button-edit-again"><FilePenLine size={14} /> Chỉnh sửa lại</button></div>{sampleOpen && <SampleDialog prompt={prompt} close={() => setSampleOpen(false)} />}</>;
}

function TeacherQueue({ essays, openEssay, requestDeleteEssay }: { essays: Essay[]; openEssay: (e: Essay) => void; requestDeleteEssay: (essay: Essay) => void }) {
  return <><div className="panel-heading"><div><h2>Hàng đợi chấm bài</h2><p>Chọn một bài để xem toàn bộ câu trả lời và bắt đầu chấm theo bốn tiêu chí.</p></div><span className="small-count">{essays.filter((e) => e.status === 'submitted' || e.status === 'grading').length} CẦN XEM</span></div>{essays.length === 0 ? <div className="empty-state" style={{ padding: 75 }}><GraduationCap size={27} /><span>Chưa có bài nộp nào.</span></div> : <div className="essay-list" style={{ maxHeight: 'none' }}>{essays.map((essay) => <div className="essay-row" key={essay.id}><button className="essay-item" onClick={() => openEssay(essay)} style={{ padding: 16 }} data-testid={`button-grade-${essay.id}`}><div className="essay-top"><span className="essay-title">{essay.studentName} · {taskLabel(essay.task)}</span><span className={`status ${essay.status}`}>{statusLabel(essay.status)}</span></div><div className="essay-student">{essay.wordCount} từ · nộp {formatDate(essay.submittedAt)} <ChevronRight size={13} style={{ verticalAlign: 'middle', marginLeft: 5 }} /></div></button><button className="essay-delete" onClick={() => requestDeleteEssay(essay)} aria-label={`Xoá bài của ${essay.studentName}`} title="Xoá bài" data-testid={`button-delete-queue-essay-${essay.id}`}><Trash2 size={14} /></button></div>)}</div>}</>;
}

function Grader({ essay, prompt, updateEssay, computeOverall, saveGrade }: { essay: Essay; prompt: Prompt; updateEssay: (p: Partial<Essay>) => void; computeOverall: (e: Essay) => number; saveGrade: (send: boolean) => void }) {
  const criteria: { key: 'ta' | 'cc' | 'lr' | 'gra'; label: string }[] = [{ key: 'ta', label: 'Task response' }, { key: 'cc', label: 'Coherence' }, { key: 'lr', label: 'Vocabulary' }, { key: 'gra', label: 'Grammar' }];
  const essayRef = useRef<HTMLDivElement>(null);
  const [selection, setSelection] = useState<{ start: number; end: number; quote: string } | null>(null);
  const [annotationFeedback, setAnnotationFeedback] = useState('');
  const annotations = essay.annotations ?? [];

  const captureSelection = () => {
    const root = essayRef.current;
    const browserSelection = window.getSelection();
    if (!root || !browserSelection || browserSelection.rangeCount === 0 || browserSelection.isCollapsed) return;
    const range = browserSelection.getRangeAt(0);
    if (!root.contains(range.startContainer) || !root.contains(range.endContainer)) return;
    const startOffset = getTextOffset(root, range.startContainer, range.startOffset);
    const endOffset = getTextOffset(root, range.endContainer, range.endOffset);
    const start = Math.min(startOffset, endOffset);
    const end = Math.max(startOffset, endOffset);
    const rawQuote = essay.content.slice(start, end);
    const quote = rawQuote.trim();
    if (!quote) return;
    const leadingWhitespace = rawQuote.search(/\S/);
    const adjustedStart = start + Math.max(0, leadingWhitespace);
    setSelection({ start: adjustedStart, end: adjustedStart + quote.length, quote });
    setAnnotationFeedback('');
    browserSelection.removeAllRanges();
  };

  const saveAnnotation = () => {
    if (!selection || !annotationFeedback.trim()) return;
    const newAnnotation: Annotation = {
      id: `a${Date.now()}`,
      start: selection.start,
      end: selection.end,
      quote: selection.quote,
      feedback: annotationFeedback.trim(),
      createdAt: Date.now(),
    };
    updateEssay({ annotations: [...annotations, newAnnotation] });
    setSelection(null);
    setAnnotationFeedback('');
  };

  const exportPdf = () => {
    const previousTitle = document.title;
    document.title = `IELTS Writing - ${essay.studentName} - ${taskLabel(essay.task)}`;
    window.print();
    window.setTimeout(() => { document.title = previousTitle; }, 1000);
  };

  return <><div className="panel-heading"><div><h2>{essay.studentName} · {taskLabel(essay.task)}</h2><p>{prompt.text}</p></div><span className={`status ${essay.status}`}>{statusLabel(essay.status)}</span></div>{prompt.image && <PromptImage src={prompt.image} alt={`Biểu đồ cho đề ${prompt.type}`} />}<div ref={essayRef} className="review-content teacher-review-content" onMouseUp={captureSelection}>{renderAnnotatedContent(essay.content, annotations)}</div>{selection && <div className="annotation-composer"><div className="annotation-composer-heading"><div><span className="annotation-kicker">ĐOẠN ĐANG CHỌN</span><strong>“{selection.quote}”</strong></div><button className="quiet-button" onClick={() => setSelection(null)} aria-label="Bỏ chọn"><X size={16} /></button></div><textarea className="feedback-area" value={annotationFeedback} onChange={(e) => setAnnotationFeedback(e.target.value)} placeholder="Nhập lỗi sai hoặc góp ý cụ thể cho đoạn này..." autoFocus data-testid="textarea-inline-feedback" /><div className="editor-actions"><button className="btn btn-quiet" onClick={() => setSelection(null)}>Huỷ</button><button className="btn btn-terra" onClick={saveAnnotation} disabled={!annotationFeedback.trim()} data-testid="button-save-inline-feedback"><Check size={14} /> Lưu đánh giá đoạn</button></div></div>}<div className="annotation-hint"><CircleHelp size={14} /> Bôi đen đoạn cần góp ý, sau đó nhập đánh giá cho riêng đoạn đó. Các đoạn đã đánh dấu sẽ hiện màu vàng.</div><h3 style={{ fontSize: 17, margin: '0 0 3px' }}>Chấm theo tiêu chí</h3><p style={{ color: '#878b7b', fontSize: 11, margin: 0 }}>Điểm có thể thay đổi theo bước 0.5 · Lưu bản nháp để chỉ giáo viên nhìn thấy.</p><div className="score-grid">{criteria.map(({ key, label }) => <div className="score-box" key={key}><label>{label}</label><input type="range" min="4" max="9" step=".5" value={essay[key] ?? 6} onChange={(e) => updateEssay({ [key]: Number(e.target.value) })} data-testid={`input-score-${key}`} /><div className="score-value">{(essay[key] ?? 6).toFixed(1)}</div></div>)}</div><div className="overall"><span>Overall band score</span><strong>{computeOverall(essay).toFixed(1)}</strong></div><label className="field-label">Phản hồi riêng cho học sinh<textarea className="feedback-area" value={essay.feedback || ''} onChange={(e) => updateEssay({ feedback: e.target.value })} placeholder="Một điều làm tốt, một điều nên tập trung ở bài tiếp theo..." data-testid="textarea-feedback" /></label><div className="editor-actions"><button className="btn btn-quiet" onClick={exportPdf} data-testid="button-export-pdf"><FileDown size={14} /> Xuất PDF</button><button className="btn btn-quiet" onClick={() => saveGrade(false)} data-testid="button-save-grade"><Check size={14} /> Lưu riêng tư</button><button className="btn btn-terra" onClick={() => saveGrade(true)} data-testid="button-send-grade"><Send size={14} /> Gửi cho học sinh</button></div></>;
}

function PromptManager({ task, setTask, prompts, addingPrompt, setAddingPrompt, newPromptType, setNewPromptType, newPromptText, setNewPromptText, newPromptSample, setNewPromptSample, newPromptImage, setNewPromptImage, editingPromptId, editPrompt, resetPromptForm, preparePromptImage, savePrompt, startEssay, requestDeletePrompt }: { task: Task; setTask: (task: Task) => void; prompts: Prompt[]; addingPrompt: boolean; setAddingPrompt: (v: boolean) => void; newPromptType: string; setNewPromptType: (v: string) => void; newPromptText: string; setNewPromptText: (v: string) => void; newPromptSample: string; setNewPromptSample: (v: string) => void; newPromptImage: string; setNewPromptImage: (v: string) => void; editingPromptId: string | null; editPrompt: (prompt: Prompt) => void; resetPromptForm: () => void; preparePromptImage: (file: File) => void; savePrompt: () => void; startEssay: (id: string) => void; requestDeletePrompt: (prompt: Prompt) => void }) {
   return <><div className="panel-heading"><div><h2>Thư viện đề bài</h2><p>Đang quản lý đề cho {taskLabel(task)}. Đề mới và bài mẫu được lưu trong trình duyệt.</p></div><button className="btn btn-primary" onClick={() => addingPrompt ? resetPromptForm() : setAddingPrompt(true)} data-testid="button-toggle-add-prompt">{addingPrompt ? <X size={14} /> : <Plus size={14} />} {addingPrompt ? 'Đóng' : 'Thêm đề'}</button></div><div className="prompt-task-switcher" aria-label="Chọn loại bài để quản lý"><span>Quản lý đề cho</span><button className={task === 'task1' ? 'active' : ''} onClick={() => { setTask('task1'); resetPromptForm(); }} data-testid="button-manager-task1">Task 1 · Report</button><button className={task === 'task2' ? 'active' : ''} onClick={() => { setTask('task2'); resetPromptForm(); }} data-testid="button-manager-task2">Task 2 · Essay</button></div>{addingPrompt && <div className="surface" style={{ marginBottom: 16 }}><div className="form-grid"><label className="field-label">Dạng đề<input className="field-input" value={newPromptType} onChange={(e) => setNewPromptType(e.target.value)} placeholder="Ví dụ: Biểu đồ cột" data-testid="input-prompt-type" /></label><div className="prompt-text-pair"><label className="field-label">Nội dung đề<textarea className="feedback-area" style={{ minHeight: 100 }} value={newPromptText} onChange={(e) => setNewPromptText(e.target.value)} placeholder="Paste đề IELTS bằng tiếng Anh..." data-testid="textarea-prompt-text" /></label><label className="field-label">Bài mẫu <small>(không bắt buộc)</small><textarea className="feedback-area" style={{ minHeight: 100 }} value={newPromptSample} onChange={(e) => setNewPromptSample(e.target.value)} placeholder="Nhập bài mẫu để mở cho học sinh sau khi đủ điều kiện..." data-testid="textarea-prompt-sample" /></label></div>{task === 'task1' && <div className="image-upload-field"><label className="field-label">Hình ảnh biểu đồ <small>(không bắt buộc)</small><input className="file-input" type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => { const file = e.target.files?.[0]; if (file) preparePromptImage(file); }} data-testid="input-prompt-image" /></label>{newPromptImage ? <div className="image-preview-wrap"><PromptImage src={newPromptImage} alt="Xem trước biểu đồ" /><button className="btn btn-quiet" type="button" onClick={() => setNewPromptImage('')} data-testid="button-remove-prompt-image"><X size={14} /> Xoá ảnh</button></div> : <div className="upload-hint">Chọn ảnh PNG, JPG hoặc WebP của biểu đồ. Ảnh sẽ được thu gọn để lưu trên thiết bị.</div>}</div>}<div className="editor-actions" style={{ marginTop: 0 }}><button className="btn btn-terra" onClick={savePrompt} data-testid="button-save-prompt">{editingPromptId ? <Check size={14} /> : <Plus size={14} />} {editingPromptId ? 'Lưu thay đổi' : 'Lưu đề bài'}</button></div></div></div>}{prompts.length === 0 ? <div className="empty-state prompt-empty"><Plus size={22} /><strong>Thư viện đang trống</strong><span>Thêm một đề mới để học sinh có thể bắt đầu viết.</span></div> : <div className="prompt-grid">{prompts.map((prompt) => <article className="prompt-card" key={prompt.id}><div className="prompt-card-top"><span className={`prompt-type ${task === 'task2' ? 'task-two-type' : ''}`}>{prompt.type}</span><div className="prompt-card-actions"><button className="prompt-edit" onClick={() => editPrompt(prompt)} aria-label={`Sửa đề ${prompt.type}`} title="Sửa đề" data-testid={`button-edit-prompt-${prompt.id}`}><Pencil size={13} /></button><button className="prompt-delete" onClick={() => requestDeletePrompt(prompt)} aria-label={`Xoá đề ${prompt.type}`} title="Xoá đề" data-testid={`button-delete-prompt-${prompt.id}`}><Trash2 size={13} /></button></div></div>{prompt.image && <PromptImage src={prompt.image} alt={`Biểu đồ cho đề ${prompt.type}`} compact />}<p>{prompt.text}</p><div className="prompt-sample-status">{prompt.sample?.trim() ? <><Check size={12} /> Đã có bài mẫu</> : 'Chưa có bài mẫu'}</div><button className="start-link" onClick={() => startEssay(prompt.id)} data-testid={`button-preview-prompt-${prompt.id}`}>Thử đề này <ArrowRight size={13} /></button></article>)}</div>}</>;
}

function PromptImage({ src, alt, compact = false }: { src: string; alt: string; compact?: boolean }) {
  return <img className={`prompt-image ${compact ? 'compact' : ''}`} src={src} alt={alt} loading="lazy" />;
}

function SampleDialog({ prompt, close }: { prompt: Prompt; close: () => void }) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && close()}><section className="modal sample-dialog" role="dialog" aria-modal="true" aria-labelledby="sample-dialog-title"><div className="sample-dialog-heading"><div><div className="eyebrow" style={{ marginBottom: 8 }}>Writing reference</div><h2 id="sample-dialog-title">Bài mẫu · {prompt.type}</h2></div><button className="quiet-button" onClick={close} aria-label="Đóng bài mẫu" data-testid="button-close-sample"><X size={17} /></button></div><p>Đây là bài tham khảo do giáo viên cung cấp cho đúng đề bài bạn vừa hoàn thành.</p><div className="sample-dialog-content">{prompt.sample}</div><div className="modal-actions"><button className="btn btn-primary" onClick={close} data-testid="button-dismiss-sample"><Check size={14} /> Đã xem</button></div></section></div>;
}

function TeacherGate({ code, setCode, error, close, unlock }: { code: string; setCode: (v: string) => void; error: string; close: () => void; unlock: () => void }) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && close()}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="teacher-gate-title"><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}><div><div className="eyebrow" style={{ marginBottom: 8 }}>Private room</div><h2 id="teacher-gate-title">Teacher access</h2></div><button className="quiet-button" onClick={close} aria-label="Đóng" data-testid="button-close-gate"><X size={17} /></button></div><p>Khu vực này dành cho giáo viên xem bài, chấm điểm và thêm đề. Đây là khoá demo ở phía trình duyệt.</p><label className="field-label">Mã truy cập<input autoFocus type="password" className="field-input" value={code} onChange={(e) => setCode(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && unlock()} placeholder="Nhập mã truy cập" data-testid="input-teacher-code" /></label>{error && <p style={{ color: '#a24f3e', margin: '8px 0 0' }} role="alert">{error}</p>}<div className="modal-actions"><button className="btn btn-quiet" onClick={close} data-testid="button-cancel-gate">Huỷ</button><button className="btn btn-primary" onClick={unlock} data-testid="button-unlock-teacher"><KeyRound size={14} /> Mở không gian</button></div></section></div>;
}

function DeleteEssayDialog({ essay, close, confirm }: { essay: Essay; close: () => void; confirm: () => void }) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && close()}><section className="modal delete-modal" role="dialog" aria-modal="true" aria-labelledby="delete-essay-title"><div className="delete-icon"><Trash2 size={19} /></div><h2 id="delete-essay-title">Xoá bài viết này?</h2><p>Bài của <strong>{essay.studentName}</strong> sẽ bị xoá khỏi thiết bị này và không thể khôi phục.</p><div className="modal-actions"><button className="btn btn-quiet" onClick={close} data-testid="button-cancel-delete-essay">Giữ lại</button><button className="btn btn-danger" onClick={confirm} data-testid="button-confirm-delete-essay"><Trash2 size={14} /> Xoá bài</button></div></section></div>;
}

function DeletePromptDialog({ prompt, close, confirm }: { prompt: Prompt; close: () => void; confirm: () => void }) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && close()}><section className="modal delete-modal" role="dialog" aria-modal="true" aria-labelledby="delete-prompt-title"><div className="delete-icon"><Trash2 size={19} /></div><h2 id="delete-prompt-title">Xoá đề bài này?</h2><p>Đề <strong>{prompt.type}</strong> và các bài viết đã tạo từ đề này sẽ bị xoá khỏi thiết bị và không thể khôi phục.</p><div className="modal-actions"><button className="btn btn-quiet" onClick={close} data-testid="button-cancel-delete-prompt">Giữ lại</button><button className="btn btn-danger" onClick={confirm} data-testid="button-confirm-delete-prompt"><Trash2 size={14} /> Xoá đề</button></div></section></div>;
}

export default App;