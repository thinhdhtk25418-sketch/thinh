import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Role = 'student' | 'teacher';

interface AppState {
  role: Role;
  studentName: string;
  setRole: (role: Role) => void;
  setStudentName: (name: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      role: 'student',
      studentName: 'Học sinh ẩn danh',
      setRole: (role) => set({ role }),
      setStudentName: (studentName) => set({ studentName }),
    }),
    {
      name: 'writing-studio-storage',
    }
  )
);
