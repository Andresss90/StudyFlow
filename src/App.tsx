import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  verifyPasswordResetCode,
  confirmPasswordReset
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  updateDoc
} from 'firebase/firestore';

// Importamos la lista de usuarios directamente desde usuarios.json
import usersList from './usuarios.json';

// --- FIREBASE CONFIGURATION ---
const firebaseConfig = {
  apiKey: "AIzaSyBw0Xl5MPhWpoC_ePwGQzqMXoyUceP8EFQ",
  authDomain: "class-calendar-c19f0.firebaseapp.com",
  projectId: "class-calendar-c19f0",
  storageBucket: "class-calendar-c19f0.firebasestorage.app",
  messagingSenderId: "213057512290",
  appId: "1:213057512290:web:ba63149566e350444e823b"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Convertimos usuarios.json en un diccionario para búsqueda instantánea por email
const usersDatabaseData = usersList.reduce((acc, user) => {
  acc[user.email] = {
    role: user.role as 'student' | 'representative' | 'teacher',
    courseId: user.courseId,
    name: user.name,
    courses: user.courses || [],
  };
  return acc;
}, {} as Record<string, { role: 'student' | 'representative' | 'teacher'; courseId: string; name: string; courses: string[] }>);

// SVG Icons
const CalendarIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const CheckSquareIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ClockIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const RefreshIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const ChevronLeftIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
  </svg>
);

const ArrowLeftIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const UserIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const PencilIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
  </svg>
);

const InfoIcon = () => (
  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" strokeWidth="2" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M12 16v-4.5M12 8.25h.01" />
  </svg>
);

// Small "?" button that opens a popover explaining a section. The popover's
// position is computed from the button's actual location on screen (instead
// of a fixed side) so it never runs off the edge on narrow phone screens.
const InfoTip = ({ isOpen, onToggle, onClose, text }: { isOpen: boolean; onToggle: () => void; onClose: () => void; text: string }) => {
  const btnRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const popoverWidth = 240;

  useEffect(() => {
    if (!isOpen) {
      setPos(null);
      return;
    }
    const place = () => {
      const btn = btnRef.current;
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      const margin = 12;
      let left = rect.left;
      if (left + popoverWidth + margin > window.innerWidth) {
        left = window.innerWidth - popoverWidth - margin;
      }
      if (left < margin) left = margin;
      setPos({ top: rect.bottom + 8, left });
    };
    place();
    window.addEventListener('resize', onClose);
    window.addEventListener('scroll', onClose, true);
    return () => {
      window.removeEventListener('resize', onClose);
      window.removeEventListener('scroll', onClose, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  return (
    <div className="relative inline-flex">
      <button
        ref={btnRef}
        type="button"
        onClick={onToggle}
        className="w-4 h-4 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-500 flex items-center justify-center transition shrink-0"
        aria-label="More information"
      >
        <InfoIcon />
      </button>
      {isOpen && pos && (
        <>
          <div className="fixed inset-0 z-40" onClick={onClose} />
          <div
            className="fixed z-50 bg-slate-800 text-white text-xs font-normal normal-case tracking-normal leading-snug rounded-lg shadow-xl p-3"
            style={{ top: pos.top, left: pos.left, width: popoverWidth }}
          >
            {text}
          </div>
        </>
      )}
    </div>
  );
};

interface UserProfile {
  uid: string;
  email: string;
  role: 'student' | 'representative' | 'teacher';
  courseId: string;
  name: string;
  availableCourses: string[];
}

interface Task {
  id: string;
  dateStr: string;
  title: string;
  description?: string;
  color: string;
  completed: boolean;
  courseId: string;
  isPersonal?: boolean;
  isEvent?: boolean;
}

const SUBJECT_DETAILS: Record<string, { short: string; color: string }> = {
  'English': { short: 'ING', color: 'bg-[#558b2f]' },
  'Enterprise': { short: 'ENT', color: 'bg-[#0070f3]' },
  'Mathematics': { short: 'MAT', color: 'bg-[#00b0ff]' },
  'Portuguese': { short: 'PRT', color: 'bg-[#ffcdd2]' },
  'Chemistry': { short: 'QUI', color: 'bg-[#ff80ab]' },
  'Spanish': { short: 'ESP', color: 'bg-[#ffeb3b]' },
  'Politics and Economics': { short: 'PYE', color: 'bg-[#fff59d]' },
  'Biology': { short: 'BIO', color: 'bg-[#81c784]' },
  'Global Perspectives': { short: 'GP', color: 'bg-[#388e3c]' },
  'Technology': { short: 'ICT', color: 'bg-[#a800ff]' },
  'Philosophy': { short: 'FIL', color: 'bg-[#fff176]' },
  'Physical Education': { short: 'EF', color: 'bg-[#00e676]' },
  'Social Studies': { short: 'CS', color: 'bg-[#757575]' },
  'Mandarin': { short: 'MN', color: 'bg-[#fb8c00]' },
  'Physics': { short: 'FIS', color: 'bg-[#546e7a]' },
  'Character Counts': { short: 'CC', color: 'bg-transparent' },
  'Club': { short: 'CLB', color: 'bg-transparent' },
  'Arts': { short: 'ART', color: 'bg-transparent' },
};

const AVAILABLE_SUBJECTS = Object.keys(SUBJECT_DETAILS);

// Colores sólidos reutilizados para las materias, para asignarle uno distinto
// a cada curso en el horario personal "My Flow" de los profesores.
const SOLID_SUBJECT_COLORS = Object.values(SUBJECT_DETAILS).map(d => d.color).filter(c => c !== 'bg-transparent');

const MY_FLOW_ID = 'MyFlow';
type Schedule = Record<number, string[]>;

const initialSchedule: Schedule = {
  1: ['English', 'English', 'Enterprise', 'Enterprise', 'Mathematics', 'Mathematics', 'Portuguese'],
  2: ['Mathematics', 'Mathematics', 'Chemistry', 'Chemistry', 'Spanish', 'Politics and Economics', 'Biology'],
  3: ['Global Perspectives', 'Global Perspectives', 'Technology', 'Technology', 'Philosophy', 'Philosophy', 'Portuguese'],
  4: ['English', 'Technology', 'Spanish', 'Spanish', 'Physical Education', 'Physical Education', 'Biology'],
  5: ['Spanish', 'Spanish', 'Mathematics', 'Mathematics', 'English', 'English', 'Portuguese'],
  6: ['Social Studies', 'Social Studies', 'Mandarin', 'Mandarin', 'Physics', 'Physics', 'Physics'],
};

const pastelColors = [
  { name: 'Pastel Blue', bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
  { name: 'Pastel Purple', bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-200' },
  { name: 'Pastel Pink', bg: 'bg-pink-100', text: 'text-pink-800', border: 'border-pink-200' },
  { name: 'Pastel Green', bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-200' },
  { name: 'Pastel Orange', bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200' },
  { name: 'Pastel Mint', bg: 'bg-teal-100', text: 'text-teal-800', border: 'border-teal-200' },
  { name: 'Pastel Indigo', bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-200' },
];

// Cronograma académico 2026: cada ciclo dura 6 días de clase (no necesariamente consecutivos,
// ya que festivos y recesos interrumpen la secuencia). Se listan las 6 fechas reales de cada
// ciclo en vez de un simple rango, para no marcar como "ciclo" los días de vacaciones intermedios.
const ACADEMIC_CYCLES: { trimester: number; cycle: number; dates: string[] }[] = [
  { trimester: 1, cycle: 1, dates: ['2026-02-03', '2026-02-04', '2026-02-05', '2026-02-06', '2026-02-09', '2026-02-10'] },
  { trimester: 1, cycle: 2, dates: ['2026-02-11', '2026-02-12', '2026-02-13', '2026-02-16', '2026-02-17', '2026-02-18'] },
  { trimester: 1, cycle: 3, dates: ['2026-02-19', '2026-02-20', '2026-02-23', '2026-02-24', '2026-02-25', '2026-02-26'] },
  { trimester: 1, cycle: 4, dates: ['2026-02-27', '2026-03-02', '2026-03-03', '2026-03-04', '2026-03-05', '2026-03-06'] },
  { trimester: 1, cycle: 5, dates: ['2026-03-09', '2026-03-10', '2026-03-11', '2026-03-12', '2026-03-13', '2026-03-16'] },
  { trimester: 1, cycle: 6, dates: ['2026-03-17', '2026-03-18', '2026-03-19', '2026-03-20', '2026-03-24', '2026-03-25'] },
  { trimester: 1, cycle: 7, dates: ['2026-03-26', '2026-04-06', '2026-04-07', '2026-04-08', '2026-04-09', '2026-04-10'] },
  { trimester: 1, cycle: 8, dates: ['2026-04-13', '2026-04-14', '2026-04-15', '2026-04-16', '2026-04-17', '2026-04-20'] },
  { trimester: 1, cycle: 9, dates: ['2026-04-21', '2026-04-22', '2026-04-23', '2026-04-27', '2026-04-28', '2026-04-29'] },

  { trimester: 2, cycle: 1, dates: ['2026-04-30', '2026-05-04', '2026-05-05', '2026-05-06', '2026-05-07', '2026-05-08'] },
  { trimester: 2, cycle: 2, dates: ['2026-05-11', '2026-05-12', '2026-05-13', '2026-05-14', '2026-05-15', '2026-05-19'] },
  { trimester: 2, cycle: 3, dates: ['2026-05-20', '2026-05-21', '2026-05-22', '2026-05-25', '2026-05-26', '2026-05-27'] },
  { trimester: 2, cycle: 4, dates: ['2026-05-28', '2026-06-01', '2026-06-02', '2026-06-03', '2026-06-04', '2026-06-05'] },
  { trimester: 2, cycle: 5, dates: ['2026-06-09', '2026-06-10', '2026-06-11', '2026-06-12', '2026-06-16', '2026-06-17'] },
  { trimester: 2, cycle: 6, dates: ['2026-06-18', '2026-06-19', '2026-07-14', '2026-07-15', '2026-07-16', '2026-07-17'] },
  { trimester: 2, cycle: 7, dates: ['2026-07-21', '2026-07-22', '2026-07-23', '2026-07-24', '2026-07-27', '2026-07-28'] },
  { trimester: 2, cycle: 8, dates: ['2026-07-29', '2026-07-30', '2026-07-31', '2026-08-03', '2026-08-04', '2026-08-05'] },
  { trimester: 2, cycle: 9, dates: ['2026-08-06', '2026-08-10', '2026-08-11', '2026-08-12', '2026-08-13', '2026-08-14'] },

  { trimester: 3, cycle: 1, dates: ['2026-08-18', '2026-08-19', '2026-08-20', '2026-08-21', '2026-08-24', '2026-08-25'] },
  { trimester: 3, cycle: 2, dates: ['2026-08-26', '2026-08-27', '2026-08-28', '2026-08-31', '2026-09-01', '2026-09-02'] },
  { trimester: 3, cycle: 3, dates: ['2026-09-03', '2026-09-04', '2026-09-07', '2026-09-08', '2026-09-09', '2026-09-10'] },
  { trimester: 3, cycle: 4, dates: ['2026-09-11', '2026-09-14', '2026-09-15', '2026-09-16', '2026-09-17', '2026-09-18'] },
  { trimester: 3, cycle: 5, dates: ['2026-09-21', '2026-09-22', '2026-09-23', '2026-09-24', '2026-09-28', '2026-09-29'] },
  { trimester: 3, cycle: 6, dates: ['2026-09-30', '2026-10-01', '2026-10-02', '2026-10-13', '2026-10-14', '2026-10-15'] },
  { trimester: 3, cycle: 7, dates: ['2026-10-16', '2026-10-19', '2026-10-20', '2026-10-21', '2026-10-22', '2026-10-23'] },
  { trimester: 3, cycle: 8, dates: ['2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29', '2026-11-03', '2026-11-04'] },
  { trimester: 3, cycle: 9, dates: ['2026-11-05', '2026-11-09', '2026-11-10', '2026-11-11', '2026-11-12', '2026-11-13'] },
];

// Mapa de acceso instantáneo: fecha -> a qué ciclo pertenece y en qué posición (0-5) del ciclo cae
const CYCLE_BY_DATE: Record<string, { trimester: number; cycle: number; dayIndex: number }> = {};
ACADEMIC_CYCLES.forEach(c => {
  c.dates.forEach((dateStr, dayIndex) => {
    CYCLE_BY_DATE[dateStr] = { trimester: c.trimester, cycle: c.cycle, dayIndex };
  });
});

// --- GENERAL SCHOOL EVENTS (Semana Santa, Día de la Familia, MUN, etc.) ---
// Son los eventos fijos del cronograma institucional: por defecto los ve TODO el colegio.
// Si un profesor/representante los edita o los oculta, el cambio se guarda como un "override"
// específico de su curso (colección generalEventOverrides), sin afectar a los demás cursos.
interface GeneralEventDefault {
  id: string;
  title: string;
  description: string;
  dateStr: string;
  endDateStr?: string;
  color: string;
}

interface GeneralEventOverride {
  baseEventId: string;
  courseId: string;
  title?: string;
  description?: string;
  dateStr?: string;
  endDateStr?: string | null;
  color?: string;
  deleted?: boolean;
}

// Fechas "último ciclo de Agosto/Noviembre" del cronograma están marcadas como estimadas
// (tomé el último día de ese ciclo); confírmalas si tienes la fecha exacta.
const DEFAULT_GENERAL_EVENTS: GeneralEventDefault[] = [
  { id: 'reunion-padres-1', title: 'Parent Meeting', description: 'General parent meeting.', dateStr: '2026-01-31', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { id: 'reunion-padres-2', title: 'Parent Meeting', description: 'General parent meeting.', dateStr: '2026-02-07', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { id: 'salida-pedagogica-1', title: 'Field Trip (Class Bonding)', description: 'School-wide bonding activity.', dateStr: '2026-03-27', color: 'bg-teal-100 text-teal-800 border-teal-200' },
  { id: 'receso-semana-santa', title: 'School Break - Holy Week', description: 'No classes during the Holy Week break.', dateStr: '2026-03-30', endDateStr: '2026-04-03', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  { id: 'festival-dia-idioma', title: 'Cultural Festival (Language Day)', description: 'School-wide cultural festival.', dateStr: '2026-04-24', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  { id: 'dia-funcionario', title: 'GCRB Staff Day', description: '', dateStr: '2026-05-29', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  { id: 'jornada-pedagogica', title: 'Professional Development Day', description: '', dateStr: '2026-07-06', color: 'bg-teal-100 text-teal-800 border-teal-200' },
  { id: 'festival-colombianidad', title: 'Cultural Festival (Colombian Heritage Day)', description: 'School-wide cultural festival.', dateStr: '2026-07-24', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  { id: 'salida-pedagogica-2', title: 'Field Trip (Class Bonding)', description: 'School-wide bonding activity. (Estimated date: last cycle of August)', dateStr: '2026-08-14', color: 'bg-teal-100 text-teal-800 border-teal-200' },
  { id: 'concurso-talentos', title: 'House Talent Contest', description: 'Preparation for GCRB Family Day.', dateStr: '2026-09-25', color: 'bg-pink-100 text-pink-800 border-pink-200' },
  { id: 'dia-familia', title: 'GCRB Family Day', description: '', dateStr: '2026-09-26', color: 'bg-pink-100 text-pink-800 border-pink-200' },
  { id: 'mun-gcrb', title: 'MUN GCRB', description: 'Model United Nations simulation.', dateStr: '2026-10-01', endDateStr: '2026-10-02', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  { id: 'dia-estudiante', title: 'Student Day', description: '', dateStr: '2026-10-30', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  { id: 'festival-international-day', title: 'Cultural Festival (International Day)', description: 'School-wide cultural festival.', dateStr: '2026-11-06', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  { id: 'salida-pedagogica-3', title: 'Field Trip (Class Bonding)', description: 'School-wide bonding activity. (Estimated date: last cycle of November)', dateStr: '2026-11-13', color: 'bg-teal-100 text-teal-800 border-teal-200' },
  { id: 'promocion-gcrb', title: 'GCRB Graduation and International Baccalaureate', description: '18th GCRB Graduating Class and 5th International Baccalaureate (CIE Curriculum) Graduating Class.', dateStr: '2026-12-02', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
];

const eventCoversDate = (ev: { dateStr: string; endDateStr?: string | null }, dateStr: string) =>
  dateStr >= ev.dateStr && dateStr <= (ev.endDateStr || ev.dateStr);

// Formatea una fecha como YYYY-MM-DD usando la hora LOCAL del dispositivo.
// No usar toISOString() para esto: convierte a UTC primero, así que en zonas
// horarias detrás de UTC (como Colombia, UTC-5) ya marca el día siguiente
// desde las 7pm hora local en adelante.
const formatLocalDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export default function App() {
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authMessage, setAuthMessage] = useState('');

  // Estado del flujo "restablecer contraseña" cuando se llega desde el link del correo
  const [resetOobCode, setResetOobCode] = useState<string | null>(null);
  const [resetStatus, setResetStatus] = useState<'checking' | 'ready' | 'invalid' | 'done'>('checking');
  const [resetEmailForCode, setResetEmailForCode] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [resetError, setResetError] = useState('');

  // Refresco manual/automático de datos, y aviso de nueva versión disponible
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const swRegistrationRef = useRef<ServiceWorkerRegistration | null>(null);

  // Aviso de "hay contenido nuevo": es solo un respaldo visual, ya que los
  // datos se sincronizan solos en segundo plano (ver el intervalo de
  // sincronización silenciosa más abajo). Guardamos los ids ya vistos de
  // tareas/eventos del curso para detectar cuándo alguien más publicó algo.
  const [newContentAvailable, setNewContentAvailable] = useState(false);
  const knownSchoolTaskIdsRef = useRef<Set<string> | null>(null);
  const knownSchoolEventIdsRef = useRef<Set<string> | null>(null);
  const knownGeneralOverrideIdsRef = useRef<Set<string> | null>(null);

  const [activeTab, setActiveTab] = useState<'calendar' | 'tasks' | 'schedule'>('calendar');
  const [showCycles, setShowCycles] = useState<boolean>(() => localStorage.getItem('showCycles') === 'true');
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showCoursePicker, setShowCoursePicker] = useState(false);
  const [openInfoTip, setOpenInfoTip] = useState<string | null>(null);
  const [pickerYear, setPickerYear] = useState<number>(new Date().getFullYear());
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [schedule, setSchedule] = useState<Schedule>(initialSchedule);

  const [isScheduleEditMode, setIsScheduleEditMode] = useState(false);
  const [editingCell, setEditingCell] = useState<{ dayNum: number; hourIdx: number } | null>(null);
  const [hoveredCell, setHoveredCell] = useState<{ dayNum: number; hourIdx: number } | null>(null);

  const today = new Date();
  const maxDateObj = new Date();
  maxDateObj.setFullYear(today.getFullYear() + 2);
  const minDateStr = formatLocalDate(today);
  const maxDateStr = formatLocalDate(maxDateObj);
  const minPickerYear = today.getFullYear() - 2;
  const maxPickerYear = today.getFullYear() + 2;

  const [selectedDayDetails, setSelectedDayDetails] = useState<{
    dateStr: string;
    dayNum: number;
    dayName: string;
    schoolDayNum: number | null;
  } | null>(null);

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskDate, setNewTaskDate] = useState(minDateStr);
  const [selectedPastelIndex, setSelectedPastelIndex] = useState(0);

  const [schoolTasks, setSchoolTasks] = useState<Task[]>([]);
  const [schoolEvents, setSchoolEvents] = useState<Task[]>([]);
  const [personalToDos, setPersonalToDos] = useState<Task[]>([]);
  const [completedSchoolTaskIds, setCompletedSchoolTaskIds] = useState<Set<string>>(new Set());

  // Overrides por curso de los eventos generales (Semana Santa, Día de la Familia, etc.)
  const [generalEventOverrides, setGeneralEventOverrides] = useState<Record<string, GeneralEventOverride>>({});
  const [editingGeneralEvent, setEditingGeneralEvent] = useState<(GeneralEventDefault & { isOverridden: boolean }) | null>(null);
  const [genEventTitle, setGenEventTitle] = useState('');
  const [genEventDescription, setGenEventDescription] = useState('');
  const [genEventStartDate, setGenEventStartDate] = useState('');
  const [genEventEndDate, setGenEventEndDate] = useState('');
  const [genEventColorIdx, setGenEventColorIdx] = useState(0);

  // Lógica que fuerza la sincronización desde el JSON al iniciar sesión
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async user => {
      if (user) {
        setFirebaseUser(user);

        // Buscamos los datos correctos en el diccionario generado desde usuarios.json
        const userInfo = usersDatabaseData[user.email || ''];
        const defaultName = user.email ? user.email.split('@')[0] : 'User';
        const availableCourses = userInfo?.courses || [];

        // Los profesores no tienen un curso fijo: usamos el último que eligieron (guardado en este
        // navegador) o, si no hay ninguno guardado, el primero de la lista de cursos que dictan.
        let resolvedCourseId = userInfo ? userInfo.courseId : '10B';
        if (userInfo?.role === 'teacher' && availableCourses.length > 0) {
          const savedChoice = localStorage.getItem(`activeCourse_${user.uid}`);
          const savedChoiceIsValid = savedChoice && (availableCourses.includes(savedChoice) || savedChoice === MY_FLOW_ID);
          resolvedCourseId = savedChoiceIsValid ? savedChoice! : availableCourses[0];
        }

        const updatedProfile: UserProfile = {
          uid: user.uid,
          email: user.email || '',
          name: userInfo ? userInfo.name : defaultName,
          role: userInfo ? userInfo.role : 'student',
          courseId: resolvedCourseId,
          availableCourses,
        };

        // Sobrescribimos el documento para garantizar que siempre tenga la información correcta del JSON
        const docRef = doc(db, 'users', user.uid);
        await setDoc(docRef, updatedProfile);
        setUserProfile(updatedProfile);
      } else {
        setFirebaseUser(null);
        setUserProfile(null);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (userProfile && firebaseUser) {
      fetchSchoolTasks();
      fetchSchoolEvents();
      fetchPersonalToDos();
      fetchCompletedSchoolTasks();
      fetchSchedule();
      fetchGeneralEventOverrides();
    }
  }, [userProfile, firebaseUser]);

  // Sincronización silenciosa: trae datos frescos y revisa si hay una versión
  // nueva de la app, sin spinner ni interacción del usuario. Se dispara (a)
  // cuando la pestaña/app vuelve a primer plano y (b) periódicamente mientras
  // queda abierta en primer plano, para que las tareas/eventos nuevos y el
  // aviso de "nueva versión" aparezcan solos, sin depender de que alguien
  // cierre la app o toque el botón de refrescar.
  useEffect(() => {
    if (!userProfile || !firebaseUser) return;
    let lastRefresh = Date.now();

    const silentSync = () => {
      lastRefresh = Date.now();
      fetchSchoolTasks();
      fetchSchoolEvents();
      fetchPersonalToDos();
      fetchCompletedSchoolTasks();
      fetchSchedule();
      fetchGeneralEventOverrides();
      swRegistrationRef.current?.update();
    };

    const handleResume = () => {
      if (document.visibilityState !== 'visible') return;
      if (Date.now() - lastRefresh < 15000) return;
      silentSync();
    };

    document.addEventListener('visibilitychange', handleResume);
    window.addEventListener('focus', handleResume);
    const intervalId = setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      silentSync();
    }, 60000);
    return () => {
      document.removeEventListener('visibilitychange', handleResume);
      window.removeEventListener('focus', handleResume);
      clearInterval(intervalId);
    };
  }, [userProfile, firebaseUser]);

  // El aviso de contenido nuevo es solo un respaldo informativo (los datos ya
  // se sincronizaron solos): se oculta solo a los pocos segundos.
  useEffect(() => {
    if (!newContentAvailable) return;
    const timeoutId = setTimeout(() => setNewContentAvailable(false), 8000);
    return () => clearTimeout(timeoutId);
  }, [newContentAvailable]);

  const handleManualRefresh = async () => {
    if (!userProfile || !firebaseUser || isRefreshing) return;
    setIsRefreshing(true);
    try {
      await Promise.all([
        fetchSchoolTasks(),
        fetchSchoolEvents(),
        fetchPersonalToDos(),
        fetchCompletedSchoolTasks(),
        fetchSchedule(),
        fetchGeneralEventOverrides(),
      ]);
      // Además de traer datos frescos, chequea si hay una versión nueva de la
      // app lista y, si la hay, la aplica ya mismo (recarga sola).
      const reg = swRegistrationRef.current;
      if (reg) {
        await reg.update();
        if (reg.waiting) {
          reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  // Detecta cuando hay una versión nueva de la app lista (el service worker
  // nuevo terminó de instalar y está "esperando"), para poder ofrecer
  // aplicarla ya mismo en vez de depender de que cierren la app del todo.
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.getRegistration().then(reg => {
      if (!reg) return;
      swRegistrationRef.current = reg;
      if (reg.waiting && navigator.serviceWorker.controller) setUpdateAvailable(true);
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (!newWorker) return;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            setUpdateAvailable(true);
          }
        });
      });
    });
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });
  }, []);

  const applyUpdate = () => {
    swRegistrationRef.current?.waiting?.postMessage({ type: 'SKIP_WAITING' });
  };

  useEffect(() => {
    localStorage.setItem('showCycles', String(showCycles));
  }, [showCycles]);

  // Si el link del correo de "reset password" trajo ?mode=resetPassword&oobCode=...,
  // mostramos la pantalla para elegir la nueva contraseña en vez del login normal.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode');
    const oobCode = params.get('oobCode');
    if (mode === 'resetPassword' && oobCode) {
      setResetOobCode(oobCode);
      verifyPasswordResetCode(auth, oobCode)
        .then(email => {
          setResetEmailForCode(email);
          setResetStatus('ready');
        })
        .catch(() => setResetStatus('invalid'));
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthMessage('');
    try {
      await signInWithEmailAndPassword(auth, authEmail.trim(), authPassword);
    } catch (err: any) {
      setAuthError('Incorrect email or password. Please verify your credentials.');
    }
  };

  const handlePasswordReset = async () => {
    setAuthError('');
    setAuthMessage('');
    if (!authEmail.trim()) {
      setAuthError('Please enter your email address in the field above first.');
      return;
    }
    try {
      // Apunta el link del correo de vuelta a esta misma app (en vez de la página
      // genérica de Firebase), para poder manejar el reseteo dentro de la app.
      await sendPasswordResetEmail(auth, authEmail.trim(), {
        url: window.location.origin + import.meta.env.BASE_URL,
        handleCodeInApp: true,
      });
      setAuthMessage('Email sent! Check your inbox to reset your password. (It may be in spam)');
    } catch (err: any) {
      setAuthError('Could not send the email: ' + (err.message || 'Error'));
    }
  };

  const handleConfirmNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    if (!resetOobCode) return;
    if (newPasswordInput.length < 6) {
      setResetError('Password must be at least 6 characters.');
      return;
    }
    try {
      await confirmPasswordReset(auth, resetOobCode, newPasswordInput);
      setResetStatus('done');
      window.history.replaceState(null, '', window.location.pathname);
    } catch (err: any) {
      setResetError('Could not reset the password. The link may have expired — go back and request a new one.');
    }
  };

  const handleLogout = () => {
    signOut(auth);
  };

  const handleSwitchCourse = (newCourseId: string) => {
    if (!userProfile || !firebaseUser) return;
    localStorage.setItem(`activeCourse_${firebaseUser.uid}`, newCourseId);
    setUserProfile({ ...userProfile, courseId: newCourseId });
    setShowCoursePicker(false);
  };

  const fetchSchoolTasks = async () => {
    if (!userProfile) return;
    try {
      const querySnapshot = await getDocs(collection(db, 'schoolTasks'));
      const tasks: Task[] = [];
      const userCourse = userProfile.courseId || '10B';
      querySnapshot.forEach(docSnap => {
        const data = docSnap.data() as Task;
        if (data.courseId === userCourse) {
          tasks.push({ ...data, id: docSnap.id, isPersonal: false, isEvent: false });
        }
      });
      const newIds = new Set(tasks.map(t => t.id));
      if (knownSchoolTaskIdsRef.current && tasks.some(t => !knownSchoolTaskIdsRef.current!.has(t.id))) {
        setNewContentAvailable(true);
      }
      knownSchoolTaskIdsRef.current = newIds;
      setSchoolTasks(tasks);
    } catch (err) {
      console.error('Error fetching school tasks:', err);
    }
  };

  const fetchSchoolEvents = async () => {
    if (!userProfile) return;
    try {
      const querySnapshot = await getDocs(collection(db, 'schoolEvents'));
      const events: Task[] = [];
      const userCourse = userProfile.courseId || '10B';
      querySnapshot.forEach(docSnap => {
        const data = docSnap.data() as Task;
        if (data.courseId === userCourse) {
          events.push({ ...data, id: docSnap.id, isEvent: true, isPersonal: false });
        }
      });
      const newIds = new Set(events.map(e => e.id));
      if (knownSchoolEventIdsRef.current && events.some(e => !knownSchoolEventIdsRef.current!.has(e.id))) {
        setNewContentAvailable(true);
      }
      knownSchoolEventIdsRef.current = newIds;
      setSchoolEvents(events);
    } catch (err) {
      console.error('Error fetching school events:', err);
    }
  };

  const fetchPersonalToDos = async () => {
    if (!firebaseUser) return;
    try {
      const querySnapshot = await getDocs(collection(db, `users/${firebaseUser.uid}/personalTodos`));
      const todos: Task[] = [];
      querySnapshot.forEach(docSnap => {
        todos.push({ ...(docSnap.data() as Task), id: docSnap.id, isPersonal: true, isEvent: false });
      });
      setPersonalToDos(todos);
    } catch (err) {
      console.error('Error fetching personal tasks:', err);
    }
  };

  const fetchCompletedSchoolTasks = async () => {
    if (!firebaseUser) return;
    try {
      const querySnapshot = await getDocs(collection(db, `users/${firebaseUser.uid}/completedSchoolTasks`));
      const completedIds = new Set<string>();
      querySnapshot.forEach(docSnap => {
        completedIds.add(docSnap.id);
      });
      setCompletedSchoolTaskIds(completedIds);
    } catch (err) {
      console.error('Error fetching completed school tasks:', err);
    }
  };

  const togglePersonalSchoolTask = async (taskId: string) => {
    if (!firebaseUser) return;
    const isCurrentlyCompleted = completedSchoolTaskIds.has(taskId);
    const newSet = new Set(completedSchoolTaskIds);

    if (isCurrentlyCompleted) {
      newSet.delete(taskId);
    } else {
      newSet.add(taskId);
    }
    setCompletedSchoolTaskIds(newSet);

    try {
      const docRef = doc(db, `users/${firebaseUser.uid}/completedSchoolTasks`, taskId);
      if (isCurrentlyCompleted) {
        await deleteDoc(docRef);
      } else {
        await setDoc(docRef, { completedAt: new Date().toISOString() });
      }
    } catch (err) {
      setCompletedSchoolTaskIds(completedSchoolTaskIds);
      console.error('Error toggling school task completion:', err);
    }
  };

  const fetchSchedule = async () => {
    if (!userProfile || !firebaseUser) return;
    try {
      const targetDocId = userProfile.courseId === MY_FLOW_ID ? `myflow_${firebaseUser.uid}` : (userProfile.courseId || '10B');
      const docRef = doc(db, 'schedules', targetDocId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setSchedule(docSnap.data().scheduleData as Schedule);
      } else {
        // Sin horario guardado todavía para este curso/My Flow: arranca en blanco
        // en vez de dejar en pantalla el horario del curso que se veía antes.
        setSchedule({});
      }
    } catch (err) {
      console.error('Error fetching schedule:', err);
    }
  };

  const fetchGeneralEventOverrides = async () => {
    if (!userProfile) return;
    try {
      const querySnapshot = await getDocs(collection(db, 'generalEventOverrides'));
      const userCourse = userProfile.courseId || '10B';
      const overrides: Record<string, GeneralEventOverride> = {};
      querySnapshot.forEach(docSnap => {
        const data = docSnap.data() as GeneralEventOverride;
        if (data.courseId === userCourse) {
          overrides[data.baseEventId] = data;
        }
      });
      const newIds = new Set(Object.keys(overrides));
      if (knownGeneralOverrideIdsRef.current && [...newIds].some(id => !knownGeneralOverrideIdsRef.current!.has(id))) {
        setNewContentAvailable(true);
      }
      knownGeneralOverrideIdsRef.current = newIds;
      setGeneralEventOverrides(overrides);
    } catch (err) {
      console.error('Error fetching general event overrides:', err);
    }
  };

  const openGeneralEventEditor = (evt: GeneralEventDefault & { isOverridden: boolean }) => {
    setEditingGeneralEvent(evt);
    setGenEventTitle(evt.title);
    setGenEventDescription(evt.description);
    setGenEventStartDate(evt.dateStr);
    setGenEventEndDate(evt.endDateStr || evt.dateStr);
    const foundIdx = pastelColors.findIndex(c => `${c.bg} ${c.text} ${c.border}` === evt.color);
    setGenEventColorIdx(foundIdx !== -1 ? foundIdx : 0);
  };

  const saveGeneralEventOverride = async () => {
    if (!editingGeneralEvent || !userProfile || userProfile.role === 'student' || !genEventTitle.trim() || !genEventStartDate) return;
    const targetCourse = userProfile.courseId;
    const overrideId = `${targetCourse}__${editingGeneralEvent.id}`;
    const currentColor = pastelColors[genEventColorIdx];

    const overrideData: GeneralEventOverride = {
      baseEventId: editingGeneralEvent.id,
      courseId: targetCourse,
      title: genEventTitle.trim(),
      description: genEventDescription.trim(),
      dateStr: genEventStartDate,
      endDateStr: genEventEndDate && genEventEndDate !== genEventStartDate ? genEventEndDate : null,
      color: `${currentColor.bg} ${currentColor.text} ${currentColor.border}`,
      deleted: false,
    };

    try {
      await setDoc(doc(db, 'generalEventOverrides', overrideId), overrideData);
      setGeneralEventOverrides(prev => ({ ...prev, [editingGeneralEvent.id]: overrideData }));
      setEditingGeneralEvent(null);
    } catch (err: any) {
      alert(`Error saving event changes: ${err.message || 'Error'}`);
    }
  };

  const hideGeneralEventForCourse = async (evt: GeneralEventDefault) => {
    if (!userProfile || userProfile.role === 'student') return;
    const targetCourse = userProfile.courseId;
    const overrideId = `${targetCourse}__${evt.id}`;
    const overrideData: GeneralEventOverride = { baseEventId: evt.id, courseId: targetCourse, deleted: true };
    try {
      await setDoc(doc(db, 'generalEventOverrides', overrideId), overrideData);
      setGeneralEventOverrides(prev => ({ ...prev, [evt.id]: overrideData }));
    } catch (err) {
      console.error('Error hiding general event:', err);
    }
  };

  const resetGeneralEventOverride = async (evt: GeneralEventDefault) => {
    if (!userProfile || userProfile.role === 'student') return;
    const targetCourse = userProfile.courseId;
    const overrideId = `${targetCourse}__${evt.id}`;
    try {
      await deleteDoc(doc(db, 'generalEventOverrides', overrideId));
      setGeneralEventOverrides(prev => {
        const copy = { ...prev };
        delete copy[evt.id];
        return copy;
      });
    } catch (err) {
      console.error('Error resetting general event:', err);
    }
  };

  const openCreateModal = () => {
    setEditingTask(null);
    setNewTaskTitle('');
    setNewTaskDescription('');
    setNewTaskDate(minDateStr);
    setSelectedPastelIndex(0);
    setIsTaskModalOpen(true);
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setNewTaskTitle(task.title);
    setNewTaskDescription(task.description || '');
    setNewTaskDate(task.dateStr);

    const foundIdx = pastelColors.findIndex(c => `${c.bg} ${c.text} ${c.border}` === task.color);
    setSelectedPastelIndex(foundIdx !== -1 ? foundIdx : 0);
    setIsTaskModalOpen(true);
  };

  const handleSaveItem = async (type: 'personal' | 'school' | 'event') => {
    if (!newTaskTitle.trim() || !userProfile || !firebaseUser) return;

    const activeCourse = userProfile.courseId;

    const currentColor = pastelColors[selectedPastelIndex];
    const fullColorClass = `${currentColor.bg} ${currentColor.text} ${currentColor.border}`;

    if (editingTask) {
      const updatedData = {
        title: newTaskTitle.trim(),
        description: newTaskDescription.trim(),
        dateStr: newTaskDate,
        color: fullColorClass,
      };

      try {
        if (editingTask.isEvent) {
          const docRef = doc(db, 'schoolEvents', editingTask.id);
          await updateDoc(docRef, updatedData);
          setSchoolEvents(schoolEvents.map(e => e.id === editingTask.id ? { ...e, ...updatedData } : e));
        } else if (editingTask.isPersonal) {
          const docRef = doc(db, `users/${firebaseUser.uid}/personalTodos`, editingTask.id);
          await updateDoc(docRef, updatedData);
          setPersonalToDos(personalToDos.map(t => t.id === editingTask.id ? { ...t, ...updatedData } : t));
        } else {
          const docRef = doc(db, 'schoolTasks', editingTask.id);
          await updateDoc(docRef, updatedData);
          setSchoolTasks(schoolTasks.map(t => t.id === editingTask.id ? { ...t, ...updatedData } : t));
        }
        setIsTaskModalOpen(false);
      } catch (err: any) {
        alert(`Error updating item: ${err.message || 'Error'}`);
      }
    } else {
      if (type === 'event') {
        if (userProfile.role === 'student') {
          alert('Only teachers or representatives can create school events.');
          return;
        }

        const newEventData = {
          dateStr: newTaskDate,
          title: newTaskTitle.trim(),
          description: newTaskDescription.trim(),
          color: fullColorClass,
          completed: false,
          courseId: activeCourse,
        };

        try {
          const docRef = await addDoc(collection(db, 'schoolEvents'), newEventData);
          setSchoolEvents([...schoolEvents, { ...newEventData, id: docRef.id, isEvent: true, isPersonal: false }]);
          setIsTaskModalOpen(false);
        } catch (err: any) {
          alert(`Error saving event: ${err.message || 'Error'}`);
        }
      } else if (type === 'school') {
        if (userProfile.role === 'student') {
          alert('Only teachers or representatives can create school tasks.');
          return;
        }

        const newTaskData = {
          dateStr: newTaskDate,
          title: newTaskTitle.trim(),
          description: newTaskDescription.trim(),
          color: fullColorClass,
          completed: false,
          courseId: activeCourse,
        };

        try {
          const docRef = await addDoc(collection(db, 'schoolTasks'), newTaskData);
          setSchoolTasks([...schoolTasks, { ...newTaskData, id: docRef.id, isPersonal: false, isEvent: false }]);
          setIsTaskModalOpen(false);
        } catch (err: any) {
          alert(`Error saving school task: ${err.message || 'Error'}`);
        }
      } else {
        const newTodoData = {
          dateStr: newTaskDate,
          title: newTaskTitle.trim(),
          description: newTaskDescription.trim(),
          color: fullColorClass,
          completed: false,
          courseId: activeCourse,
        };

        try {
          const docRef = await addDoc(collection(db, `users/${firebaseUser.uid}/personalTodos`), newTodoData);
          setPersonalToDos([...personalToDos, { ...newTodoData, id: docRef.id, isPersonal: true, isEvent: false }]);
          setIsTaskModalOpen(false);
        } catch (err) {
          alert('Error saving personal task.');
        }
      }
    }
  };

  const togglePersonalToDo = async (id: string, currentCompleted: boolean) => {
    if (!firebaseUser) return;
    try {
      const taskRef = doc(db, `users/${firebaseUser.uid}/personalTodos`, id);
      await updateDoc(taskRef, { completed: !currentCompleted });
      setPersonalToDos(personalToDos.map(t => t.id === id ? { ...t, completed: !currentCompleted } : t));
    } catch (err) {
      console.error(err);
    }
  };

  const deletePersonalToDo = async (id: string) => {
    if (!firebaseUser) return;
    try {
      await deleteDoc(doc(db, `users/${firebaseUser.uid}/personalTodos`, id));
      setPersonalToDos(personalToDos.filter(t => t.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const deleteSchoolTask = async (id: string) => {
    if (!userProfile || userProfile.role === 'student') return;
    try {
      await deleteDoc(doc(db, 'schoolTasks', id));
      setSchoolTasks(schoolTasks.filter(t => t.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const deleteSchoolEvent = async (id: string) => {
    if (!userProfile || userProfile.role === 'student') return;
    try {
      await deleteDoc(doc(db, 'schoolEvents', id));
      setSchoolEvents(schoolEvents.filter(e => e.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectSubject = async (subjectName: string) => {
    if (!editingCell || !userProfile || !firebaseUser || !isScheduleEditMode) return;
    const editingMyFlow = userProfile.role === 'teacher' && userProfile.courseId === MY_FLOW_ID;
    if (userProfile.role !== 'representative' && !editingMyFlow) {
      alert('Only representatives are allowed to edit the class schedule.');
      setEditingCell(null);
      return;
    }

    const { dayNum, hourIdx } = editingCell;
    const updatedSchedule = { ...schedule };
    updatedSchedule[dayNum] = [...updatedSchedule[dayNum]];
    updatedSchedule[dayNum][hourIdx] = subjectName;

    try {
      const targetDocId = editingMyFlow ? `myflow_${firebaseUser.uid}` : (userProfile.courseId || '10B');
      await setDoc(doc(db, 'schedules', targetDocId), { scheduleData: updatedSchedule });
      setSchedule(updatedSchedule);
      setEditingCell(null);
    } catch (err) {
      alert('Error updating schedule.');
    }
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  let startDayOfWeek = firstDayOfMonth.getDay() - 1;
  if (startDayOfWeek === -1) startDayOfWeek = 6;
  const daysInMonth = lastDayOfMonth.getDate();

  // El número de "Day" viene directamente del cronograma real (ACADEMIC_CYCLES), no de contar
  // días hábiles, para que festivos, Semana Santa y recesos corran la numeración correctamente.
  const getSchoolDayNumber = (dateStr: string) => {
    const cycleInfo = CYCLE_BY_DATE[dateStr];
    return cycleInfo ? cycleInfo.dayIndex + 1 : null;
  };

  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const openMonthPicker = () => {
    setPickerYear(year);
    setShowMonthPicker(true);
  };
  const selectMonth = (monthIdx: number) => {
    setCurrentDate(new Date(pickerYear, monthIdx, 1));
    setShowMonthPicker(false);
  };

  const renderReadonlyDayColumn = (schoolDayNum: number) => {
    const dayClasses = schedule[schoolDayNum] || [];
    const renderElements: React.ReactNode[] = [];
    let h = 0;

    while (h < 7) {
      const currentSubject = dayClasses[h] || '';
      const nextSubject = h < 6 ? dayClasses[h + 1] : null;
      const isDouble = currentSubject !== '' && currentSubject === nextSubject;
      const details = (currentSubject && activeSubjectDetails[currentSubject]) || emptyCellDetails;
      const startHourIdx = h;

      if (isDouble) {
        renderElements.push(
          <div key={`readonly-${schoolDayNum}-${startHourIdx}`} className="bg-white relative h-[129px] border-b border-slate-800 last:border-b-0 overflow-hidden">
            {currentSubject !== '' && <div className={`absolute left-0 top-0 bottom-0 w-6 ${details.color} z-10 pointer-events-none`} />}
            <div className="absolute inset-0 flex items-center justify-center pl-4 pointer-events-none z-10">
              <span className="font-normal text-2xl md:text-3xl text-slate-900 tracking-tight text-center">{details.short}</span>
            </div>
          </div>
        );
        h += 2;
      } else {
        renderElements.push(
          <div key={`readonly-${schoolDayNum}-${startHourIdx}`} className="bg-white relative h-[64px] p-2 flex items-center justify-center border-b border-slate-800 last:border-b-0">
            {currentSubject !== '' && <div className={`absolute left-0 top-0 bottom-0 w-6 ${details.color}`} />}
            <span className="font-normal text-2xl md:text-3xl text-slate-900 tracking-tight text-center pl-4">{details.short}</span>
          </div>
        );
        h += 1;
      }
    }

    return (
      <div className="flex items-start gap-3">
        <div className="flex flex-col gap-[1px]">
          {[1, 2, 3, 4, 5, 6, 7].map(hourNum => (
            <div key={hourNum} className="h-16 w-8 flex items-center justify-center font-semibold text-2xl text-slate-700">{hourNum}</div>
          ))}
        </div>
        <div className="w-52 border border-slate-800 rounded-lg overflow-hidden bg-white shadow-sm">
          <div className="flex flex-col bg-white">{renderElements}</div>
        </div>
      </div>
    );
  };

  // LOGIN SCREEN
  if (resetOobCode) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 max-w-md w-full p-6 space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-2xl font-black text-slate-900">Reset Password</h2>
            {resetStatus === 'ready' && <p className="text-xs text-slate-500">Choose a new password for {resetEmailForCode}</p>}
          </div>

          {resetStatus === 'checking' && <p className="text-sm text-slate-500 text-center py-2">Checking link...</p>}

          {resetStatus === 'invalid' && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-md border border-red-200">
              This link is invalid or has expired. Go back to the sign-in screen and request a new one.
            </div>
          )}

          {resetStatus === 'ready' && (
            <form onSubmit={handleConfirmNewPassword} className="space-y-4">
              {resetError && <div className="p-3 bg-red-50 text-red-700 text-xs rounded-md border border-red-200">{resetError}</div>}
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">New Password</label>
                <input type="password" required minLength={6} value={newPasswordInput} onChange={e => setNewPasswordInput(e.target.value)} className="w-full p-2.5 text-sm bg-slate-50 border rounded-md" placeholder="••••••" />
              </div>
              <button type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-md shadow transition">Save New Password</button>
            </form>
          )}

          {resetStatus === 'done' && (
            <div className="space-y-4 text-center">
              <div className="p-3 bg-emerald-50 text-emerald-700 text-xs rounded-md border border-emerald-200">Password updated. You can sign in now.</div>
              <button onClick={() => setResetOobCode(null)} className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-md shadow transition">Go to Sign In</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!firebaseUser || !userProfile) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 max-w-md w-full p-6 space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-2xl font-black text-slate-900">StudyFlow</h2>
            <p className="text-xs text-slate-500">Sign in with your institutional credentials</p>
          </div>

          {authError && <div className="p-3 bg-red-50 text-red-700 text-xs rounded-md border border-red-200">{authError}</div>}
          {authMessage && <div className="p-3 bg-emerald-50 text-emerald-700 text-xs rounded-md border border-emerald-200">{authMessage}</div>}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">Email Address</label>
              <input type="email" required value={authEmail} onChange={e => setAuthEmail(e.target.value)} className="w-full p-2.5 text-sm bg-slate-50 border rounded-md" placeholder="user@school.edu" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">Password</label>
              <input type="password" required value={authPassword} onChange={e => setAuthPassword(e.target.value)} className="w-full p-2.5 text-sm bg-slate-50 border rounded-md" placeholder="••••••••" />
            </div>
            <div className="flex items-center justify-between">
              <button type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-md shadow transition">Sign In</button>
            </div>
          </form>

          <div className="text-center pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={handlePasswordReset}
              className="text-xs text-indigo-600 hover:underline font-semibold"
            >
              Forgot or want to change your password?
            </button>
          </div>
        </div>
      </div>
    );
  }

  const activeCourse = userProfile.courseId || '10B';
  const isMyFlow = userProfile.role === 'teacher' && activeCourse === MY_FLOW_ID;

  // "My Flow" es el espacio personal de organización de cada profesor: en vez
  // de materias, las opciones del horario son los cursos que dicta (con un
  // color distinto por curso, igual de estilo que las materias) más "Free" y
  // "Club" para los espacios libres.
  const myFlowSubjectDetails: Record<string, { short: string; color: string }> = {};
  userProfile.availableCourses.forEach((c, idx) => {
    myFlowSubjectDetails[c] = { short: c, color: SOLID_SUBJECT_COLORS[idx % SOLID_SUBJECT_COLORS.length] };
  });
  myFlowSubjectDetails['Free'] = { short: '-', color: 'bg-transparent' };
  myFlowSubjectDetails['Club'] = { short: 'CLB', color: 'bg-transparent' };

  const activeSubjectDetails = isMyFlow ? myFlowSubjectDetails : SUBJECT_DETAILS;
  const activeSubjectList = Object.keys(activeSubjectDetails);
  const emptyCellDetails = { short: '', color: 'bg-transparent' };

  // Help text for the Tasks & Events tab: it changes based on role, since
  // permissions for each category differ between account types.
  const courseScopeText = userProfile.role === 'teacher' ? 'the course you have selected above' : 'your course';
  const sectionInfoText = {
    personal: 'Only you can see these tasks: they are private and no one else at school can see or edit them.',
    schoolTasks: userProfile.role === 'student'
      ? 'Published by your teacher or representative for your course. You can mark them as complete, but not edit or delete them.'
      : `You can create, edit, and delete tasks for ${courseScopeText}. Students in that course will see them and can mark them as complete.`,
    schoolEvents: userProfile.role === 'student'
      ? 'Published by your teacher or representative for your course. Only they can create, edit, or delete them.'
      : `You can create, edit, and delete events for ${courseScopeText}.`,
    generalEvents: userProfile.role === 'student'
      ? 'Set by the school and visible to everyone. Your teacher or representative can customize how they appear for your course.'
      : `These events belong to the school and appear in every course. If you edit or delete one, the change only affects how it looks in ${courseScopeText} — other courses keep seeing the original.`,
  };

  const renderInfoTip = (id: string, text: string) => (
    <InfoTip
      isOpen={openInfoTip === id}
      onToggle={() => setOpenInfoTip(openInfoTip === id ? null : id)}
      onClose={() => setOpenInfoTip(null)}
      text={text}
    />
  );

  // Eventos generales por defecto, con el override del curso aplicado (si existe) y ocultando los que el curso borró
  const displayedGeneralEvents: (GeneralEventDefault & { isOverridden: boolean })[] = DEFAULT_GENERAL_EVENTS
    .map(def => {
      const override = generalEventOverrides[def.id];
      if (override?.deleted) return null;
      if (override) {
        return {
          ...def,
          title: override.title ?? def.title,
          description: override.description ?? def.description,
          dateStr: override.dateStr ?? def.dateStr,
          endDateStr: override.endDateStr === null ? undefined : override.endDateStr ?? def.endDateStr,
          color: override.color ?? def.color,
          isOverridden: true,
        };
      }
      return { ...def, isOverridden: false };
    })
    .filter((e): e is GeneralEventDefault & { isOverridden: boolean } => e !== null)
    .sort((a, b) => a.dateStr.localeCompare(b.dateStr));

  // Listas para la vista de Tasks & Events: siempre ordenadas por fecha (la
  // más cercana primero), sin control manual de orden.
  const sortedPersonalToDos = [...personalToDos].sort((a, b) => a.dateStr.localeCompare(b.dateStr));
  const sortedSchoolTasks = [...schoolTasks].sort((a, b) => a.dateStr.localeCompare(b.dateStr));
  const sortedSchoolEvents = [...schoolEvents].sort((a, b) => a.dateStr.localeCompare(b.dateStr));

  const monthPickerControl = (
    <div className="relative">
      <button
        type="button"
        onClick={openMonthPicker}
        className="flex items-center gap-1.5 text-3xl md:text-2xl font-bold text-slate-900 capitalize"
      >
        {monthName}
        <ChevronDownIcon />
      </button>
      {showMonthPicker && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowMonthPicker(false)} />
          <div className="absolute top-full left-0 mt-2 bg-white border border-slate-200 rounded-lg shadow-xl p-3 z-50 w-64">
            <div className="flex items-center justify-between mb-2">
              <button
                type="button"
                onClick={() => setPickerYear(y => Math.max(minPickerYear, y - 1))}
                disabled={pickerYear <= minPickerYear}
                className="p-1 hover:bg-slate-100 rounded text-slate-600 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed"
              >
                <ChevronLeftIcon />
              </button>
              <span className="text-sm font-bold text-slate-800">{pickerYear}</span>
              <button
                type="button"
                onClick={() => setPickerYear(y => Math.min(maxPickerYear, y + 1))}
                disabled={pickerYear >= maxPickerYear}
                className="p-1 hover:bg-slate-100 rounded text-slate-600 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed"
              >
                <ChevronRightIcon />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {Array.from({ length: 12 }).map((_, idx) => {
                const isCurrentSelection = pickerYear === year && idx === month;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => selectMonth(idx)}
                    className={`px-2 py-1.5 rounded-md text-xs font-semibold transition ${isCurrentSelection ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                  >
                    {new Date(2000, idx, 1).toLocaleDateString('en-US', { month: 'short' })}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );

  const userMenuControl = (
    <div className="relative">
      <button
        type="button"
        onClick={() => setShowUserMenu(v => !v)}
        className="w-[54px] h-[54px] md:w-9 md:h-9 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 flex items-center justify-center text-slate-600 transition shrink-0"
        title={userProfile.name}
      >
        <UserIcon className="w-6 h-6 md:w-5 md:h-5" />
      </button>
      {showUserMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
          <div className="absolute top-full right-0 mt-2 bg-white border border-slate-200 rounded-lg shadow-xl p-4 z-50 w-56">
            <div className="mb-5 flex items-start justify-between gap-2">
              <div>
                <span className="text-sm font-bold block text-slate-800">{userProfile.name} ({activeCourse})</span>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">{userProfile.role}</span>
              </div>
              <button
                type="button"
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                title="Refresh data and check for updates"
                aria-label="Refresh data and check for updates"
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition shrink-0 disabled:opacity-60"
              >
                <RefreshIcon className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <button onClick={handleLogout} className="w-full px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-md transition">Sign Out</button>
          </div>
        </>
      )}
    </div>
  );

  const courseControl = (
    <div className="relative">
      {userProfile.role === 'teacher' ? (
        <>
          <button
            type="button"
            onClick={() => setShowCoursePicker(v => !v)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
            title="Switch course"
          >
            {isMyFlow ? 'My Flow' : userProfile.courseId}
            <ChevronDownIcon />
          </button>
          {showCoursePicker && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowCoursePicker(false)} />
              <div className="absolute top-full right-0 mt-2 bg-white border border-slate-200 rounded-lg shadow-xl p-2 z-50 w-32 max-h-64 overflow-y-auto">
                {userProfile.availableCourses.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => handleSwitchCourse(c)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs font-semibold transition ${c === userProfile.courseId ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                  >
                    {c}
                  </button>
                ))}
                <div className="my-1 border-t border-slate-100" />
                <button
                  type="button"
                  onClick={() => handleSwitchCourse(MY_FLOW_ID)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs font-semibold transition ${isMyFlow ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  My Flow
                </button>
              </div>
            </>
          )}
        </>
      ) : (
        <span className="hidden md:inline-block px-2.5 py-1.5 text-xs font-bold text-slate-500">{userProfile.courseId}</span>
      )}
    </div>
  );

  const cyclesToggleControl = activeTab === 'calendar' && (
    <button
      type="button"
      onClick={() => setShowCycles(v => !v)}
      className="flex items-center gap-2 px-2 py-1 rounded-md text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
      title="Show or hide academic cycles on the calendar"
    >
      <span className={`w-10 h-6 rounded-full p-0.5 flex items-center transition-colors ${showCycles ? 'bg-indigo-600 justify-end' : 'bg-slate-300 justify-start'}`}>
        <span className="w-5 h-5 bg-white rounded-full shadow-sm" />
      </span>
      <span className="hidden sm:inline">Cycles</span>
    </button>
  );

  const tabsGroupControl = (
    <div className="flex items-center bg-slate-100 p-1 rounded-full border border-slate-200 -mt-1.5 md:mt-0">
      <button onClick={() => { setActiveTab('calendar'); setSelectedDayDetails(null); }} className={`flex items-center justify-center gap-2 px-3.5 py-2.5 md:px-3.5 md:py-1.5 rounded-full text-xs md:text-sm font-semibold transition ${activeTab === 'calendar' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
        <CalendarIcon className="w-6 h-6 md:w-4 md:h-4" />
        <span className="hidden md:inline">Calendar</span>
      </button>
      <button onClick={() => setActiveTab('tasks')} className={`flex items-center justify-center gap-2 px-3.5 py-2.5 md:px-3.5 md:py-1.5 rounded-full text-xs md:text-sm font-semibold transition ${activeTab === 'tasks' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
        <CheckSquareIcon className="w-6 h-6 md:w-4 md:h-4" />
        <span className="hidden md:inline">Tasks</span>
      </button>
      <button onClick={() => setActiveTab('schedule')} className={`flex items-center justify-center gap-2 px-3.5 py-2.5 md:px-3.5 md:py-1.5 rounded-full text-xs md:text-sm font-semibold transition ${activeTab === 'schedule' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
        <ClockIcon className="w-6 h-6 md:w-4 md:h-4" />
        <span className="hidden md:inline">Schedule</span>
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 p-4 md:p-8 pt-[calc(0.5rem+env(safe-area-inset-top))] md:pt-8">
      {(updateAvailable || newContentAvailable) && (
        <div className="fixed bottom-4 inset-x-4 md:inset-x-auto md:right-6 md:left-auto md:w-80 z-[60] flex flex-col gap-2">
          {newContentAvailable && (
            <div className="bg-slate-900 text-white rounded-lg shadow-2xl p-4 flex items-center justify-between gap-3">
              <span className="text-sm font-semibold">There's new material available.</span>
              <button
                type="button"
                onClick={() => { setNewContentAvailable(false); handleManualRefresh(); }}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-md transition shrink-0"
              >
                Refresh
              </button>
            </div>
          )}
          {updateAvailable && (
            <div className="bg-slate-900 text-white rounded-lg shadow-2xl p-4 flex items-center justify-between gap-3">
              <span className="text-sm font-semibold">A new version is ready.</span>
              <button
                type="button"
                onClick={applyUpdate}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-md transition shrink-0"
              >
                Update now
              </button>
            </div>
          )}
        </div>
      )}
      <header className="max-w-7xl mx-auto mb-6 bg-transparent md:bg-white p-0 md:p-5 rounded-none md:rounded-lg border-0 md:border md:border-slate-200 shadow-none md:shadow-sm">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 md:gap-4">
          <div className="flex justify-start">
            <div className="md:hidden">{cyclesToggleControl}</div>
            <div className="hidden md:flex">{monthPickerControl}</div>
          </div>

          <div className="relative flex justify-center">
            <div className="hidden md:block absolute right-full mr-3 top-1/2 -translate-y-1/2 whitespace-nowrap">
              {cyclesToggleControl}
            </div>
            {tabsGroupControl}
          </div>

          <div className="flex justify-end items-center gap-2">
            {courseControl}
            {userMenuControl}
          </div>
        </div>
      </header>

      {activeTab === 'calendar' && (
        <div className="md:hidden max-w-7xl mx-auto mb-3">
          {monthPickerControl}
        </div>
      )}

      {activeTab === 'calendar' && (
        <div className="-mx-4 md:mx-auto md:max-w-7xl bg-transparent md:bg-white rounded-none md:rounded-lg border-0 md:border md:border-slate-200 shadow-none md:shadow-sm overflow-hidden">
          {selectedDayDetails ? (
            (() => {
              const dayEvent =
                displayedGeneralEvents.find(e => eventCoversDate(e, selectedDayDetails.dateStr)) ||
                schoolEvents.find(e => e.dateStr === selectedDayDetails.dateStr);
              return (
                <div className="p-6 md:p-8 space-y-8 flex flex-col items-center bg-white">
                  <div className="w-full flex items-center justify-between border-b border-slate-100 pb-5">
                    <button onClick={() => setSelectedDayDetails(null)} className="w-10 h-10 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full flex items-center justify-center transition shadow-sm shrink-0"><ArrowLeftIcon/></button>

                    <div className="flex-1 text-center flex items-center justify-center gap-2 flex-wrap">
                      <span className="text-3xl md:text-4xl font-extrabold text-slate-900 leading-none">{selectedDayDetails.dayNum}</span>
                      <span className="text-xl md:text-2xl font-bold text-slate-700 capitalize leading-tight">{selectedDayDetails.dayName}</span>
                      {selectedDayDetails.schoolDayNum && (
                        <span className="text-xl md:text-2xl font-bold text-slate-700 leading-tight">- Day {selectedDayDetails.schoolDayNum}</span>
                      )}
                      {dayEvent && (
                        <span className={`text-xl md:text-2xl font-extrabold px-3 py-1 rounded-lg ml-1.5 shadow-sm border ${dayEvent.color}`}>
                          {dayEvent.title}
                        </span>
                      )}
                    </div>

                    <div className="w-10" />
                  </div>

                  <div className="w-full max-w-5xl flex flex-col md:flex-row justify-center items-start gap-8">
                    {selectedDayDetails.schoolDayNum && (
                      <div className="flex flex-col items-center gap-3 shrink-0 mx-auto md:mx-0">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Classes for Today</h3>
                        {renderReadonlyDayColumn(selectedDayDetails.schoolDayNum)}
                      </div>
                    )}

                    <div className="flex-1 w-full flex flex-col items-center gap-3">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">School Tasks</h3>
                      {schoolTasks.filter(t => t.dateStr === selectedDayDetails.dateStr).length === 0 ? (
                        <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-md text-center text-slate-400 text-sm w-full">No school tasks scheduled for this date.</div>
                      ) : (
                        <div className="space-y-2 w-full">
                          {schoolTasks.filter(t => t.dateStr === selectedDayDetails.dateStr).map(task => {
                            const isDone = completedSchoolTaskIds.has(task.id);
                            return (
                              <div key={task.id} className={`p-3.5 rounded-md border text-sm font-semibold transition flex items-center justify-between ${task.color}`}>
                                <div className="flex items-start gap-3">
                                  <input type="checkbox" checked={isDone} onChange={() => togglePersonalSchoolTask(task.id)} className="w-4 h-4 mt-0.5 text-indigo-600 rounded cursor-pointer shrink-0" />
                                  <div>
                                    <span className={isDone ? 'line-through opacity-60 block' : 'block'}>{task.title}</span>
                                    {task.description && <p className="text-xs opacity-75 font-normal mt-1">{task.description}</p>}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 w-full flex flex-col items-center gap-3">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Personal Tasks</h3>
                      {personalToDos.filter(t => t.dateStr === selectedDayDetails.dateStr).length === 0 ? (
                        <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-md text-center text-slate-400 text-sm w-full">No personal tasks scheduled for this date.</div>
                      ) : (
                        <div className="space-y-2 w-full">
                          {personalToDos.filter(t => t.dateStr === selectedDayDetails.dateStr).map(task => (
                            <div key={task.id} className={`p-3.5 rounded-md border text-sm font-semibold transition flex items-center justify-between ${task.color}`}>
                              <div className="flex items-center gap-2">
                                <input type="checkbox" checked={task.completed} onChange={() => togglePersonalToDo(task.id, task.completed)} className="w-4 h-4 text-indigo-600 rounded cursor-pointer" />
                                <span className={task.completed ? 'line-through opacity-60' : ''}>{task.title}</span>
                              </div>
                              <button onClick={() => deletePersonalToDo(task.id)} className="text-slate-400 hover:text-red-500"><TrashIcon/></button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()
          ) : (
            <>
              <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/50 text-center text-xs font-semibold text-slate-500 py-3">
                <div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div className="text-blue-500">Sat</div><div className="text-blue-500">Sun</div>
              </div>
              <div className="grid grid-cols-7 auto-rows-fr bg-slate-200 gap-[1px]">
                {Array.from({ length: startDayOfWeek }).map((_, i) => <div key={`empty-${i}`} className="bg-slate-50/30 min-h-[120px] p-2"></div>)}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const dayNum = i + 1;
                  const dateObj = new Date(year, month, dayNum);
                  const dayOfWeek = dateObj.getDay();
                  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                  const formattedDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                  const schoolDayNum = getSchoolDayNumber(formattedDateStr);

                  const dayEvent =
                    displayedGeneralEvents.find(e => eventCoversDate(e, formattedDateStr)) ||
                    schoolEvents.find(e => e.dateStr === formattedDateStr);
                  const daySchoolTasks = schoolTasks.filter(t => t.dateStr === formattedDateStr);
                  const dayPersonalTasks = personalToDos.filter(t => t.dateStr === formattedDateStr);
                  const combinedTasks = [
                    ...daySchoolTasks.map(t => ({ ...t, isDone: completedSchoolTaskIds.has(t.id) })),
                    ...dayPersonalTasks.map(t => ({ ...t, isDone: t.completed }))
                  ];

                  const todayStr = formatLocalDate(new Date());
                  const isToday = formattedDateStr === todayStr;
                  const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });

                  const dayBgClass = dayEvent
                    ? `${dayEvent.color} hover:brightness-95`
                    : isWeekend
                    ? 'bg-blue-50/60 hover:bg-blue-100/50'
                    : 'bg-white hover:bg-slate-50/80';

                  const cycleInfo = showCycles ? CYCLE_BY_DATE[formattedDateStr] : undefined;
                  const cycleIsStart = cycleInfo?.dayIndex === 0;
                  const cycleBarClass = cycleInfo
                    ? cycleInfo.cycle % 2 === 0
                      ? 'border-t-4 border-t-amber-400'
                      : 'border-t-4 border-t-indigo-400'
                    : '';
                  return (
                    <div key={dayNum} onClick={() => setSelectedDayDetails({ dateStr: formattedDateStr, dayNum, dayName, schoolDayNum })} className={`min-h-[130px] p-1.5 md:p-2 transition cursor-pointer flex flex-col justify-between ${dayBgClass} ${cycleBarClass}`}>
                      <div className="flex flex-col md:flex-row items-center md:justify-between gap-0.5 md:gap-1 mb-1.5 flex-wrap min-w-0">
                        <div className="flex flex-col md:flex-row items-center gap-0.5 md:gap-1 shrink-0 text-center">
                          <span className={`text-xs font-bold ${isToday ? 'bg-slate-900 text-white w-5 h-5 flex items-center justify-center rounded-full' : isWeekend ? 'text-blue-700' : 'text-slate-700'}`}>{dayNum}</span>
                          {schoolDayNum && (
                            <span className="text-[10px] md:text-[11px] font-medium opacity-75 leading-none">
                              <span className="hidden md:inline">- </span>Day {schoolDayNum}
                            </span>
                          )}
                          {cycleIsStart && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wide bg-slate-900 text-white leading-none">
                              Cycle {cycleInfo!.cycle}
                            </span>
                          )}
                        </div>
                        {dayEvent && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold truncate border border-slate-900/20 bg-white/70 text-slate-900 shadow-2xs max-w-full min-w-0" title={dayEvent.title}>
                            {dayEvent.title}
                          </span>
                        )}
                      </div>

                      <div className="space-y-1 min-w-0">
                        {combinedTasks.slice(0, 2).map(task => (
                          <div key={task.id} className={`px-2 py-0.5 rounded-md text-[10px] font-medium leading-tight border truncate flex items-center gap-1 ${dayEvent ? 'bg-white/80 text-slate-800' : task.color}`}>
                            <span className="font-bold text-[9px] uppercase tracking-wider">{task.isPersonal ? '•' : 'S:'}</span>
                            <span className={task.isDone ? 'line-through opacity-60' : ''}>{task.title}</span>
                          </div>
                        ))}
                        {combinedTasks[2] && (
                          <div key={combinedTasks[2].id} className={`hidden md:flex px-2 py-0.5 rounded-md text-[10px] font-medium leading-tight border truncate items-center gap-1 ${dayEvent ? 'bg-white/80 text-slate-800' : combinedTasks[2].color}`}>
                            <span className="font-bold text-[9px] uppercase tracking-wider">{combinedTasks[2].isPersonal ? '•' : 'S:'}</span>
                            <span className={combinedTasks[2].isDone ? 'line-through opacity-60' : ''}>{combinedTasks[2].title}</span>
                          </div>
                        )}
                        {combinedTasks.length > 2 && (
                          <span className="md:hidden text-[10px] font-semibold text-slate-400 block">+{combinedTasks.length - 2}</span>
                        )}
                        {combinedTasks.length > 3 && (
                          <span className="hidden md:block text-[9px] font-bold opacity-75 text-right">+{combinedTasks.length - 3} more</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'tasks' && (
        <div className="max-w-4xl mx-auto bg-transparent md:bg-white p-0 md:p-6 rounded-none md:rounded-lg border-0 md:border md:border-slate-200 shadow-none md:shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Tasks & Events</h2>
            </div>
            <button onClick={openCreateModal} className="w-10 h-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full flex items-center justify-center shadow-md transition"><PlusIcon/></button>
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-1.5 mb-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">My Personal Tasks (To-Do List)</h3>
                {renderInfoTip('personal', sectionInfoText.personal)}
              </div>
              {sortedPersonalToDos.length === 0 ? <p className="text-slate-400 text-sm py-2">No personal tasks registered.</p> : (
                <div className="space-y-2">
                  {sortedPersonalToDos.map(task => (
                    <div key={task.id} className={`flex items-start justify-between p-3.5 rounded-md border transition ${task.color}`}>
                      <div className="flex items-start gap-3">
                        <input type="checkbox" checked={task.completed} onChange={() => togglePersonalToDo(task.id, task.completed)} className="w-5 h-5 mt-0.5 text-indigo-600 rounded cursor-pointer shrink-0" />
                        <div>
                          <span className={`text-sm font-bold block ${task.completed ? 'line-through opacity-50' : ''}`}>{task.title}</span>
                          {task.description && <p className="text-xs text-slate-500">{task.description}</p>}
                          <span className="text-[10px] text-slate-400">Due date: {task.dateStr}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => openEditModal(task)} className="p-1 text-slate-400 hover:text-indigo-600 transition"><PencilIcon/></button>
                        <button onClick={() => deletePersonalToDo(task.id)} className="p-1 text-slate-400 hover:text-red-500 transition"><TrashIcon/></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {!isMyFlow && (
            <>
            <div className="border-t pt-4">
              <div className="flex items-center gap-1.5 mb-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">School Tasks for Course ({activeCourse})</h3>
                {renderInfoTip('schoolTasks', sectionInfoText.schoolTasks)}
              </div>
              {sortedSchoolTasks.length === 0 ? <p className="text-slate-400 text-sm py-2">No school tasks published.</p> : (
                <div className="space-y-2">
                  {sortedSchoolTasks.map(task => {
                    const isDone = completedSchoolTaskIds.has(task.id);
                    return (
                      <div key={task.id} className={`flex items-start justify-between p-3.5 rounded-md border transition ${task.color}`}>
                        <div className="flex items-start gap-3">
                          <input type="checkbox" checked={isDone} onChange={() => togglePersonalSchoolTask(task.id)} className="w-5 h-5 mt-0.5 text-indigo-600 rounded cursor-pointer shrink-0" />
                          <div>
                            <span className={`text-sm font-bold block ${isDone ? 'line-through opacity-50' : ''}`}>{task.title}</span>
                            {task.description && <p className="text-xs text-slate-500">{task.description}</p>}
                            <span className="text-[10px] text-slate-400">Due date: {task.dateStr}</span>
                          </div>
                        </div>
                        {userProfile.role !== 'student' && (
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => openEditModal(task)} className="p-1 text-slate-400 hover:text-indigo-600 transition"><PencilIcon/></button>
                            <button onClick={() => deleteSchoolTask(task.id)} className="p-1 text-slate-400 hover:text-red-500 transition"><TrashIcon/></button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center gap-1.5 mb-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">School Events</h3>
                {renderInfoTip('schoolEvents', sectionInfoText.schoolEvents)}
              </div>
              {sortedSchoolEvents.length === 0 ? <p className="text-slate-400 text-sm py-2">No school events registered.</p> : (
                <div className="space-y-2">
                  {sortedSchoolEvents.map(event => (
                    <div key={event.id} className={`flex items-start justify-between p-3.5 rounded-md border transition ${event.color}`}>
                      <div>
                        <span className="text-sm font-extrabold block">🎉 {event.title}</span>
                        {event.description && <p className="text-xs opacity-80 mt-0.5">{event.description}</p>}
                        <span className="text-[10px] opacity-75 block mt-1">Date: {event.dateStr}</span>
                      </div>
                      {userProfile.role !== 'student' && (
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => openEditModal(event)} className="p-1 text-slate-500 hover:text-indigo-600 transition"><PencilIcon/></button>
                          <button onClick={() => deleteSchoolEvent(event.id)} className="p-1 text-slate-500 hover:text-red-500 transition"><TrashIcon/></button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center gap-1.5 mb-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">General School Events (all courses)</h3>
                {renderInfoTip('generalEvents', sectionInfoText.generalEvents)}
              </div>
              {displayedGeneralEvents.length === 0 ? <p className="text-slate-400 text-sm py-2">No general events for your course.</p> : (
                <div className="space-y-2">
                  {displayedGeneralEvents.map(event => (
                    <div key={event.id} className={`flex items-start justify-between p-3.5 rounded-md border transition ${event.color}`}>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-extrabold block">🎉 {event.title}</span>
                          {event.isOverridden && (
                            <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-white/70 border border-slate-900/10">
                              Customized for your course
                            </span>
                          )}
                        </div>
                        {event.description && <p className="text-xs opacity-80 mt-0.5">{event.description}</p>}
                        <span className="text-[10px] opacity-75 block mt-1">
                          Date: {event.dateStr}{event.endDateStr ? ` – ${event.endDateStr}` : ''}
                        </span>
                      </div>
                      {userProfile.role !== 'student' && (
                        <div className="flex items-center gap-1.5">
                          {event.isOverridden && (
                            <button onClick={() => resetGeneralEventOverride(event)} className="text-[10px] font-semibold text-slate-600 hover:text-indigo-600 transition px-1">Reset</button>
                          )}
                          <button onClick={() => openGeneralEventEditor(event)} className="p-1 text-slate-500 hover:text-indigo-600 transition"><PencilIcon/></button>
                          <button onClick={() => hideGeneralEventForCourse(event)} className="p-1 text-slate-500 hover:text-red-500 transition"><TrashIcon/></button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            </>
            )}
          </div>
        </div>
      )}

      {/* PESTAÑA: CLASS SCHEDULE */}
      {activeTab === 'schedule' && (
        <div className="max-w-5xl mx-auto bg-transparent md:bg-white p-0 md:p-8 rounded-none md:rounded-xl border-0 md:border md:border-slate-200 shadow-none md:shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">{isMyFlow ? 'My Flow' : `Schedule Template (${activeCourse})`}</h2>
              <p className="text-xs text-slate-500 mt-1">
                {userProfile.role === 'representative' || isMyFlow
                  ? isScheduleEditMode
                    ? 'Editing mode active: Click on any cell to change subjects.'
                    : isMyFlow
                      ? 'Your personal schedule — click the pencil icon to organize it however you like.'
                      : 'Click the pencil icon on the right to enable editing.'
                  : 'Static view of your course schedule.'}
              </p>
            </div>

            {/* BOTONES DE EDICIÓN PARA REPRESENTANTES (horario del curso) Y PROFESORES (My Flow) */}
            {(userProfile.role === 'representative' || isMyFlow) && (
              <div className="flex items-center gap-2">
                {isScheduleEditMode && (
                  <button
                    onClick={() => { setIsScheduleEditMode(false); setEditingCell(null); }}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-md transition shadow-sm"
                  >
                    Cancel
                  </button>
                )}
                <button
                  onClick={() => setIsScheduleEditMode(!isScheduleEditMode)}
                  title={isScheduleEditMode ? 'Exit Edit Mode' : 'Edit Schedule'}
                  className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md transition ${isScheduleEditMode ? 'bg-indigo-700 text-white ring-4 ring-indigo-200' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
                >
                  <PencilIcon/>
                </button>
              </div>
            )}
          </div>

          {/* TABLA CON EFECTO DE TITILEO/PARPADEO SI ESTÁ EN MODO EDICIÓN */}
          <div className={`flex items-start gap-3 overflow-x-auto pb-2 transition-all ${isScheduleEditMode ? 'animate-pulse' : ''}`}>
            <div className="pt-10 flex flex-col gap-[1px]">
              {[1, 2, 3, 4, 5, 6, 7].map(hourNum => (
                <div key={hourNum} className="h-16 w-8 flex items-center justify-center font-semibold text-2xl text-slate-700">{hourNum}</div>
              ))}
            </div>

            <div className="flex-1 flex flex-col min-w-[600px]">
              <div className="grid grid-cols-6 mb-2">
                {[1, 2, 3, 4, 5, 6].map(dayNum => <div key={dayNum} className="text-center font-bold text-xl text-slate-700">Day {dayNum}</div>)}
              </div>

              <div className="border border-slate-800 rounded-lg overflow-hidden bg-white shadow-sm">
                <div className="grid grid-cols-6 relative bg-slate-800 gap-[1px]">
                  {[1, 2, 3, 4, 5, 6].map(dayNum => {
                    const dayClasses = schedule[dayNum] || [];
                    const renderElements: React.ReactNode[] = [];
                    let h = 0;

                    while (h < 7) {
                      const currentSubject = dayClasses[h] || '';
                      const nextSubject = h < 6 ? dayClasses[h + 1] : null;
                      const isDouble = currentSubject !== '' && currentSubject === nextSubject;
                      const details = (currentSubject && activeSubjectDetails[currentSubject]) || emptyCellDetails;
                      const startHourIdx = h;
                      const isHovered = hoveredCell?.dayNum === dayNum && hoveredCell?.hourIdx === startHourIdx;

                      if (isDouble) {
                        renderElements.push(
                          <div
                            key={`${dayNum}-${startHourIdx}`}
                            onMouseEnter={() => isScheduleEditMode && setHoveredCell({ dayNum, hourIdx: startHourIdx })}
                            onMouseLeave={() => setHoveredCell(null)}
                            className="bg-white relative h-[129px] border-b border-slate-800 overflow-hidden"
                          >
                            {currentSubject !== '' && <div className={`absolute left-0 top-0 bottom-0 w-6 ${details.color} z-10 pointer-events-none`} />}
                            <div className="absolute inset-0 flex items-center justify-center pl-4 pointer-events-none z-10">
                              <span className="font-normal text-2xl md:text-3xl text-slate-900 tracking-tight text-center">{details.short}</span>
                            </div>
                            {isScheduleEditMode && isHovered && (
                              <div className="absolute top-[64px] left-6 right-0 h-[1px] bg-slate-300 animate-pulse z-20 pointer-events-none" />
                            )}
                            {isScheduleEditMode && (
                              <div className="absolute inset-0 flex flex-col z-20">
                                <button onClick={() => setEditingCell({ dayNum, hourIdx: startHourIdx })} className="h-[64px] w-full hover:bg-indigo-50/30 transition-colors" />
                                <button onClick={() => setEditingCell({ dayNum, hourIdx: startHourIdx + 1 })} className="h-[64px] w-full hover:bg-indigo-50/30 transition-colors" />
                              </div>
                            )}
                          </div>
                        );
                        h += 2;
                      } else {
                        renderElements.push(
                          <div
                            key={`${dayNum}-${startHourIdx}`}
                            onClick={() => isScheduleEditMode && setEditingCell({ dayNum, hourIdx: startHourIdx })}
                            className={`bg-white relative h-[64px] p-2 flex items-center justify-center transition border-b border-slate-800 ${isScheduleEditMode ? 'cursor-pointer hover:bg-indigo-50/50' : ''}`}
                          >
                            {currentSubject !== '' && <div className={`absolute left-0 top-0 bottom-0 w-6 ${details.color}`} />}
                            <span className="font-normal text-2xl md:text-3xl text-slate-900 tracking-tight text-center pl-4">{details.short}</span>
                          </div>
                        );
                        h += 1;
                      }
                    }

                    return <div key={dayNum} className="flex flex-col border-r border-slate-800 last:border-r-0 bg-white">{renderElements}</div>;
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {editingCell && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full border border-slate-200 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-800 border-b pb-2">{isMyFlow ? 'Select Course' : 'Select Subject'} (Day {editingCell.dayNum} - Hour {editingCell.hourIdx + 1})</h3>
            <div className="grid grid-cols-1 gap-1.5 max-h-72 overflow-y-auto pr-1">
              {activeSubjectList.map((subj, idx) => {
                const details = activeSubjectDetails[subj];
                return (
                  <button key={idx} onClick={() => handleSelectSubject(subj)} className="flex items-center gap-3 p-2.5 rounded-md border border-slate-100 bg-slate-50 hover:bg-indigo-50 transition text-left group">
                    <div className={`w-3.5 h-6 rounded ${details.color} shrink-0`} />
                    <span className="text-sm font-semibold text-slate-800 group-hover:text-indigo-600">{subj}</span>
                  </button>
                );
              })}
            </div>
            <div className="flex justify-end pt-2 border-t">
              <button onClick={() => setEditingCell(null)} className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-md">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {isTaskModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-5">
            <h3 className="text-lg font-bold text-slate-800">
              {editingTask ? 'Edit Item' : 'Create New Item'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Title *</label>
                <input type="text" placeholder="Title..." value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} className="w-full text-sm p-2.5 bg-slate-50 border rounded-md" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Description</label>
                <textarea rows={2} placeholder="Details..." value={newTaskDescription} onChange={e => setNewTaskDescription(e.target.value)} className="w-full text-sm p-2.5 bg-slate-50 border rounded-md resize-none" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Date</label>
                <input type="date" value={newTaskDate} min={minDateStr} max={maxDateStr} onChange={e => setNewTaskDate(e.target.value)} className="w-full text-sm p-2.5 bg-slate-50 border rounded-md" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-2">Color Tag:</label>
                <div className="flex flex-wrap gap-2.5">
                  {pastelColors.map((col, idx) => {
                    const isSelected = selectedPastelIndex === idx;
                    return (
                      <button key={idx} type="button" onClick={() => setSelectedPastelIndex(idx)} className={`w-7 h-7 rounded-full border-2 transition ${col.bg} ${col.border} ${isSelected ? 'ring-2 ring-indigo-600 scale-110' : ''}`} />
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t">
              <button type="button" onClick={() => setIsTaskModalOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-500">Cancel</button>
              {editingTask ? (
                <button type="button" onClick={() => handleSaveItem(editingTask.isEvent ? 'event' : editingTask.isPersonal ? 'personal' : 'school')} className="px-5 py-2 text-xs bg-indigo-600 text-white font-semibold rounded-md">Save Changes</button>
              ) : userProfile.role !== 'student' && !isMyFlow ? (
                <div className="flex gap-2">
                  <button type="button" onClick={() => handleSaveItem('personal')} className="px-3 py-2 text-xs bg-slate-800 text-white font-semibold rounded-md">Save Personal</button>
                  <button type="button" onClick={() => handleSaveItem('school')} className="px-3 py-2 text-xs bg-indigo-600 text-white font-semibold rounded-md">Publish Task</button>
                  <button type="button" onClick={() => handleSaveItem('event')} className="px-3 py-2 text-xs bg-amber-600 text-white font-semibold rounded-md">Publish Event</button>
                </div>
              ) : (
                <button type="button" onClick={() => handleSaveItem('personal')} className="px-5 py-2 text-xs bg-indigo-600 text-white font-semibold rounded-md">Save Personal</button>
              )}
            </div>
          </div>
        </div>
      )}

      {editingGeneralEvent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-5">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Edit General Event</h3>
              <p className="text-xs text-slate-500 mt-1">
                Changes only apply to your course ({activeCourse}). Other courses keep seeing the original event.
              </p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Title *</label>
                <input type="text" value={genEventTitle} onChange={e => setGenEventTitle(e.target.value)} className="w-full text-sm p-2.5 bg-slate-50 border rounded-md" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Description</label>
                <textarea rows={2} value={genEventDescription} onChange={e => setGenEventDescription(e.target.value)} className="w-full text-sm p-2.5 bg-slate-50 border rounded-md resize-none" />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Start Date</label>
                  <input type="date" value={genEventStartDate} onChange={e => setGenEventStartDate(e.target.value)} className="w-full text-sm p-2.5 bg-slate-50 border rounded-md" />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-semibold text-slate-600 block mb-1">End Date</label>
                  <input type="date" value={genEventEndDate} min={genEventStartDate} onChange={e => setGenEventEndDate(e.target.value)} className="w-full text-sm p-2.5 bg-slate-50 border rounded-md" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-2">Color Tag:</label>
                <div className="flex flex-wrap gap-2.5">
                  {pastelColors.map((col, idx) => {
                    const isSelected = genEventColorIdx === idx;
                    return (
                      <button key={idx} type="button" onClick={() => setGenEventColorIdx(idx)} className={`w-7 h-7 rounded-full border-2 transition ${col.bg} ${col.border} ${isSelected ? 'ring-2 ring-indigo-600 scale-110' : ''}`} />
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t">
              <button type="button" onClick={() => setEditingGeneralEvent(null)} className="px-4 py-2 text-xs font-semibold text-slate-500">Cancel</button>
              <button type="button" onClick={saveGeneralEventOverride} className="px-5 py-2 text-xs bg-indigo-600 text-white font-semibold rounded-md">Save for My Course</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
