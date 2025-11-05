export type UserRole = string;

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  role: UserRole;
  profileId?: string; // Links to Student ID or Teacher ID
}

export interface Student {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  phone: string;
  dob: string;
  status: 'Active' | 'Inactive' | 'Pending';
  enrolledDate: string;
  course: string;
  paymentStatus: 'Paid' | 'Unpaid' | 'Overdue';
  rewardPoints: number;
}

export interface Teacher {
    id: string;
    name: string;
    email: string;
    avatarUrl: string;
    phone: string;
    specialization: string;
    contractType: 'Full-time' | 'Part-time';
    startDate: string;
    payRate: number;
}

export interface Room {
    id: string;
    name: string;
    capacity: number;
}

export interface Class {
    id: string;
    name: string;
    course: string;
    teacher: string;
    schedule: string;
    studentIds: string[];
    capacity: number;
    roomId: string;
}

export interface Course {
    id: string;
    name: string;
    level: 'Starter' | 'Movers' | 'Flyers' | 'IELTS';
    duration: string;
    fee: number;
    description: string;
}

export interface Transaction {
    id: string;
    date: string;
    description: string;
    category: 'Tuition Fee' | 'Salary' | 'Operational Cost' | 'Other';
    type: 'Income' | 'Expense';
    amount: number;
    status: 'Completed' | 'Pending' | 'Failed';
}

export type AttendanceStatus = 'Present' | 'Absent' | 'Late';

export interface AttendanceRecord {
    id: string;
    studentId: string;
    classId: string;
    date: string;
    status: AttendanceStatus;
}

export interface Grade {
    id: string;
    studentId: string;
    classId: string;
    assessmentName: string;
    score: number;
    maxScore: number;
    date: string;
}

export interface Reward {
    id: string;
    name: string;
    imageUrl: string;
    points: number;
    stock: number;
}

export interface Redemption {
    id: string;
    studentId: string;
    rewardId: string;
    date: string;
    status: 'Pending' | 'Approved' | 'Rejected';
}

export interface PointTransaction {
    id: string;
    studentId: string;
    points: number;
    reason: string;
    date: string;
}

export interface StudentLevel {
    id: string;
    studentId: string;
    level: 'Starter' | 'Movers' | 'Flyers' | 'IELTS';
    assessmentDate: string;
    notes?: string;
}

// Permissions
export type Permission = 
  // Users
  | 'VIEW_USERS'
  | 'MANAGE_USERS'
  | 'MANAGE_ROLES'
  // Students
  | 'VIEW_STUDENTS'
  | 'MANAGE_STUDENTS'
  | 'MANAGE_STUDENT_LEVELS'
  | 'MANAGE_STUDENT_POINTS'
  // Teachers
  | 'VIEW_TEACHERS'
  | 'MANAGE_TEACHERS'
  // Classes
  | 'VIEW_CLASSES'
  | 'MANAGE_CLASSES'
  | 'MANAGE_ROOMS'
  | 'TAKE_ATTENDANCE'
  | 'MANAGE_GRADES'
  // Courses
  | 'VIEW_COURSES'
  | 'MANAGE_COURSES'
  // Finance
  | 'VIEW_FINANCE'
  | 'MANAGE_TRANSACTIONS'
  | 'MANAGE_PAYROLL'
  // Rewards
  | 'VIEW_REWARDS'
  | 'MANAGE_REWARDS'
  | 'APPROVE_REDEMPTIONS'
  // Reports
  | 'VIEW_REPORTS'
  // Student specific
  | 'VIEW_OWN_CLASSES'
  | 'VIEW_OWN_GRADES'
  | 'VIEW_OWN_POINTS'
  | 'REDEEM_OWN_REWARDS';

export const ALL_PERMISSIONS: Record<string, Permission[]> = {
    users: ['VIEW_USERS', 'MANAGE_USERS', 'MANAGE_ROLES'],
    students: ['VIEW_STUDENTS', 'MANAGE_STUDENTS', 'MANAGE_STUDENT_LEVELS', 'MANAGE_STUDENT_POINTS'],
    teachers: ['VIEW_TEACHERS', 'MANAGE_TEACHERS'],
    classes: ['VIEW_CLASSES', 'MANAGE_CLASSES', 'MANAGE_ROOMS', 'TAKE_ATTENDANCE', 'MANAGE_GRADES'],
    courses: ['VIEW_COURSES', 'MANAGE_COURSES'],
    finance: ['VIEW_FINANCE', 'MANAGE_TRANSACTIONS', 'MANAGE_PAYROLL'],
    rewards: ['VIEW_REWARDS', 'MANAGE_REWARDS', 'APPROVE_REDEMPTIONS'],
    reports: ['VIEW_REPORTS'],
    student_self_service: ['VIEW_OWN_CLASSES', 'VIEW_OWN_GRADES', 'VIEW_OWN_POINTS', 'REDEEM_OWN_REWARDS']
};