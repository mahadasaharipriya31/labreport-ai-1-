import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthUser, UserRole } from '../types';

export interface DemoPatientProfile {
  id: string;
  name: string;
  age: number;
  sex: string;
  email: string;
  phone: string;
  primaryCondition: string;
  assignedDoctor: string;
  lastReportDate: string;
}

export const DEMO_PATIENTS: DemoPatientProfile[] = [
  {
    id: 'P001',
    name: 'Ravi Kumar',
    age: 45,
    sex: 'Male',
    email: 'ravi.kumar@gmail.com',
    phone: '+1 (555) 234-8901',
    primaryCondition: 'Hyperglycemia & Borderline Dyslipidemia',
    assignedDoctor: 'Dr. Sarah Jenkins, MD',
    lastReportDate: '2026-09-23',
  },
  {
    id: 'P002',
    name: 'Sita Devi',
    age: 32,
    sex: 'Female',
    email: 'sita.devi@outlook.com',
    phone: '+1 (555) 345-9012',
    primaryCondition: 'Microcytic Anemia & Thyroid (TSH 6.8 uIU/mL)',
    assignedDoctor: 'Dr. Michael Chang, MD',
    lastReportDate: '2026-09-22',
  },
  {
    id: 'P003',
    name: 'Arthur Pendelton',
    age: 68,
    sex: 'Male',
    email: 'arthur.pendelton@gmail.com',
    phone: '+1 (555) 456-0123',
    primaryCondition: 'Critical Hyperkalemia & Renal Dysfunction',
    assignedDoctor: 'Dr. Sarah Jenkins, MD',
    lastReportDate: '2026-09-20',
  },
  {
    id: 'P004',
    name: 'Elena Rostova',
    age: 24,
    sex: 'Female',
    email: 'elena.rostova@icloud.com',
    phone: '+1 (555) 567-1234',
    primaryCondition: 'Elevated Total Cholesterol (6.2 mmol/L)',
    assignedDoctor: 'Dr. Michael Chang, MD',
    lastReportDate: '2026-09-17',
  },
  {
    id: 'P007',
    name: 'David Chen',
    age: 52,
    sex: 'Male',
    email: 'david.chen@gmail.com',
    phone: '+1 (555) 678-2345',
    primaryCondition: 'Routine Wellness Check / Normal Biomarkers',
    assignedDoctor: 'Dr. Sarah Jenkins, MD',
    lastReportDate: '2026-09-06',
  },
  {
    id: 'P009',
    name: 'Carlos Santana',
    age: 61,
    sex: 'Male',
    email: 'carlos.santana@yahoo.com',
    phone: '+1 (555) 789-3456',
    primaryCondition: 'Type 2 Diabetes (HbA1c 8.2%) & Elevated Creatinine',
    assignedDoctor: 'Dr. Michael Chang, MD',
    lastReportDate: '2026-08-28',
  },
];

export const DEMO_USERS: Record<UserRole, AuthUser> = {
  doctor: {
    id: 'USR-DOC-02',
    name: 'Dr. Michael Chang, MD',
    title: 'Attending Physician & Clinical Endocrinologist',
    role: 'doctor',
    email: 'michael.chang@metrohealth.org',
    initials: 'MC',
    facility: 'MetroHealth Central Pathology (San Francisco)',
    licenseNumber: 'MD-CA-771920',
    lastLogin: 'Today at 08:30 AM',
  },
  pathologist: {
    id: 'USR-PATH-01',
    name: 'Dr. Sarah Jenkins, MD, FACP',
    title: 'Chief Pathologist & Medical Director',
    role: 'pathologist',
    email: 'sarah.jenkins@metrohealth.org',
    initials: 'SJ',
    facility: 'MetroHealth Central Pathology (San Francisco)',
    licenseNumber: 'MD-CAP-892341',
    lastLogin: 'Today at 08:14 AM',
  },
  technologist: {
    id: 'USR-TECH-04',
    name: 'Marcus Vance, CLS, MLS(ASCP)',
    title: 'Senior Clinical Lab Technologist',
    role: 'technologist',
    email: 'marcus.vance@metrohealth.org',
    initials: 'MV',
    facility: 'MetroHealth Central Pathology (San Francisco)',
    licenseNumber: 'CLS-CA-55102',
    lastLogin: 'Today at 07:30 AM',
  },
  compliance: {
    id: 'USR-COMP-02',
    name: 'Dr. Priya Nair, PhD',
    title: 'Quality Assurance & CAP Compliance Lead',
    role: 'compliance',
    email: 'priya.nair@metrohealth.org',
    initials: 'PN',
    facility: 'MetroHealth Central Pathology (San Francisco)',
    licenseNumber: 'QA-NABL-7729',
    lastLogin: 'Yesterday at 04:45 PM',
  },
  admin: {
    id: 'USR-ADM-01',
    name: 'Elena Gomez, LIS Admin',
    title: 'Laboratory Informatics Administrator',
    role: 'admin',
    email: 'elena.gomez@metrohealth.org',
    initials: 'EG',
    facility: 'MetroHealth Central Pathology (San Francisco)',
    licenseNumber: 'LIS-SYS-1049',
    lastLogin: 'Today at 06:10 AM',
  },
  patient: {
    id: 'PAT-P001',
    name: 'Ravi Kumar',
    title: 'Registered Patient',
    role: 'patient',
    email: 'ravi.kumar@gmail.com',
    initials: 'RK',
    facility: 'MetroHealth Memorial Clinic',
    licenseNumber: 'MRN-994821',
    patientId: 'P001',
    age: 45,
    sex: 'Male',
    phone: '+1 (555) 234-8901',
    lastLogin: 'Today at 09:05 AM',
  },
};

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isDoctor: boolean;
  isPatient: boolean;
  login: (emailOrId: string, pass: string, role?: UserRole, facility?: string) => Promise<boolean>;
  loginAsRole: (role: UserRole, facility?: string) => void;
  loginAsPatient: (patientId: string) => void;
  logout: () => void;
  switchRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'labreport_auth_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to parse stored auth user', e);
    }
    // Default logged in user for immediate clinical demonstration
    return DEMO_USERS.doctor;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [user]);

  const login = async (
    emailOrId: string,
    pass: string,
    role: UserRole = 'doctor',
    facility?: string
  ): Promise<boolean> => {
    await new Promise((resolve) => setTimeout(resolve, 350));
    
    // Check if logging in with Patient ID / Patient Email
    const term = emailOrId.trim().toLowerCase();
    const foundPatient = DEMO_PATIENTS.find(
      (p) => p.id.toLowerCase() === term || p.email.toLowerCase() === term
    );

    if (role === 'patient' || foundPatient) {
      const pat = foundPatient || {
        id: emailOrId.toUpperCase(),
        name: emailOrId.includes('@') ? emailOrId.split('@')[0] : `Patient ${emailOrId}`,
        age: 42,
        sex: 'Other',
        email: emailOrId.includes('@') ? emailOrId : `${emailOrId.toLowerCase()}@patient.metrohealth.org`,
        phone: '+1 (555) 000-1122',
        primaryCondition: 'Clinical Observation',
        assignedDoctor: 'Dr. Sarah Jenkins, MD',
        lastReportDate: '2026-09-25',
      };

      const patientUser: AuthUser = {
        id: `PAT-${pat.id}`,
        name: pat.name,
        title: 'Verified Patient',
        role: 'patient',
        email: pat.email,
        initials: pat.name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2),
        facility: facility || 'MetroHealth Central Diagnostic Center',
        licenseNumber: `MRN-${pat.id}`,
        patientId: pat.id,
        age: pat.age,
        sex: pat.sex,
        phone: pat.phone,
        lastLogin: 'Just now',
      };
      setUser(patientUser);
      return true;
    }

    const matchedUser = Object.values(DEMO_USERS).find(
      (u) => u.email.toLowerCase() === term
    ) || DEMO_USERS[role] || DEMO_USERS.doctor;

    const updatedUser: AuthUser = {
      ...matchedUser,
      facility: facility || matchedUser.facility,
      lastLogin: 'Just now',
    };

    setUser(updatedUser);
    return true;
  };

  const loginAsRole = (role: UserRole, facility?: string) => {
    const baseUser = DEMO_USERS[role] || DEMO_USERS.doctor;
    setUser({
      ...baseUser,
      facility: facility || baseUser.facility,
      lastLogin: 'Just now',
    });
  };

  const loginAsPatient = (patientId: string) => {
    const matched = DEMO_PATIENTS.find((p) => p.id.toLowerCase() === patientId.toLowerCase());
    if (matched) {
      const patUser: AuthUser = {
        id: `PAT-${matched.id}`,
        name: matched.name,
        title: 'Verified Patient',
        role: 'patient',
        email: matched.email,
        initials: matched.name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2),
        facility: 'MetroHealth Central Diagnostic Center',
        licenseNumber: `MRN-${matched.id}`,
        patientId: matched.id,
        age: matched.age,
        sex: matched.sex,
        phone: matched.phone,
        lastLogin: 'Just now',
      };
      setUser(patUser);
    } else {
      login(patientId, '', 'patient');
    }
  };

  const logout = () => {
    setUser(null);
  };

  const switchRole = (role: UserRole) => {
    if (role === 'patient') {
      loginAsPatient(DEMO_PATIENTS[0].id);
      return;
    }
    if (DEMO_USERS[role]) {
      setUser(DEMO_USERS[role]);
    }
  };

  const isDoctor = user?.role === 'doctor' || user?.role === 'pathologist';
  const isPatient = user?.role === 'patient';

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isDoctor,
        isPatient,
        login,
        loginAsRole,
        loginAsPatient,
        logout,
        switchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
