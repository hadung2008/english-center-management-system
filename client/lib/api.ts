import { Student, Teacher, Class, Course, Transaction, AttendanceRecord, Grade, Reward, Redemption, PointTransaction, Room, StudentLevel, User, UserRole, Permission, AttendanceStatus } from '../types';

// --- API CONFIGURATION ---
const API_BASE_URL = 'https://english-center-management-system-api.onrender.com';
let isConnectionError = false;

// --- HELPER FUNCTIONS ---

// A generic fetch wrapper to handle requests, content types, and errors
async function apiFetch(url: string, options: RequestInit = {}) {
    if (isConnectionError) {
        // Prevent further API calls if the server is known to be down
        throw new Error('Server connection previously failed.');
    }
    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });
        if (!response.ok) {
            const errorData = await response.text();
            console.error(`API Error (${response.status}): ${errorData}`);
            throw new Error(`Server responded with status ${response.status}`);
        }
        // Handle cases with no response body (e.g., 204 No Content)
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            return await response.json();
        }
        return null;
    } catch (error) {
        console.error('API request failed:', error);
        // Set a flag to show a connection error screen instead of failing on every call
        isConnectionError = true; 
        throw error;
    }
}

// FIX: Updated the generic function to correctly handle union types for creation and updates.
// The new signature uses a generic for the result type and a simpler type for the input data,
// resolving type inference issues.
// A generic function for creating or updating entities
async function saveEntity<TResult>(endpoint: string, data: { id?: string }): Promise<TResult> {
    const isUpdate = data.id;
    const url = isUpdate ? `${API_BASE_URL}/${endpoint}/${data.id}` : `${API_BASE_URL}/${endpoint}`;
    const method = isUpdate ? 'PUT' : 'POST';
    return apiFetch(url, { method, body: JSON.stringify(data) });
}

// --- API OBJECT ---

export const api = {
    async getInitialData() {
        return apiFetch(`${API_BASE_URL}/data/initial`);
    },

    async login(email: string, password?: string): Promise<User | null> {
        try {
            const user = await apiFetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                body: JSON.stringify({ email, password }),
            });
            // If login is successful, reset the connection error flag
            isConnectionError = false;
            return user;
        } catch (e) {
            // Login is the first call, so if it fails, we assume a connection error
            isConnectionError = true; 
            throw e;
        }
    },

    async saveStudent(studentData: Omit<Student, 'id'> | Student): Promise<Student> {
        return saveEntity<Student>('students', studentData);
    },
    
    async saveTeacher(teacherData: Omit<Teacher, 'id'> | Teacher): Promise<Teacher> {
        return saveEntity<Teacher>('teachers', teacherData);
    },

    async saveClass(classData: Omit<Class, 'id'> | Class): Promise<Class> {
        return saveEntity<Class>('classes', classData);
    },

    async saveRoom(roomData: Omit<Room, 'id'> | Room): Promise<Room> {
        return saveEntity<Room>('rooms', roomData);
    },

    async saveCourse(courseData: Omit<Course, 'id'> | Course): Promise<Course> {
        return saveEntity<Course>('courses', courseData);
    },

    async saveTransaction(transactionData: Omit<Transaction, 'id'> | Transaction): Promise<Transaction> {
        return saveEntity<Transaction>('transactions', transactionData);
    },

    async saveReward(rewardData: Omit<Reward, 'id'> | Reward): Promise<Reward> {
        return saveEntity<Reward>('rewards', rewardData);
    },

    async updateRedemption(redemptionId: string, status: 'Approved' | 'Rejected'): Promise<any> {
        return apiFetch(`${API_BASE_URL}/redemptions/${redemptionId}`, {
            method: 'PUT',
            body: JSON.stringify({ status }),
        });
    },

    async addPoints(studentId: string, points: number, reason: string): Promise<any> {
        return apiFetch(`${API_BASE_URL}/students/${studentId}/points`, {
            method: 'POST',
            body: JSON.stringify({ points, reason }),
        });
    },

    async redeemReward(studentId: string, reward: Reward, reason: string): Promise<any> {
        return apiFetch(`${API_BASE_URL}/students/${studentId}/redeem`, {
            method: 'POST',
            body: JSON.stringify({ rewardId: reward.id, reason }),
        });
    },

    async saveStudentLevel(levelData: Omit<StudentLevel, 'id'>): Promise<StudentLevel> {
        return apiFetch(`${API_BASE_URL}/student-levels`, {
            method: 'POST',
            body: JSON.stringify(levelData),
        });
    },

    async saveUser(userData: Omit<User, 'id'> | User): Promise<User> {
        return saveEntity<User>('users', userData);
    },

    async createRole(roleName: string): Promise<Record<UserRole, Permission[]>> {
        return apiFetch(`${API_BASE_URL}/roles`, {
            method: 'POST',
            body: JSON.stringify({ roleName }),
        });
    },

    async deleteRole(roleName: string): Promise<Record<UserRole, Permission[]>> {
        return apiFetch(`${API_BASE_URL}/roles/${roleName}`, {
            method: 'DELETE',
        });
    },

    async savePermissions(role: UserRole, permissions: Permission[]): Promise<Record<UserRole, Permission[]>> {
        return apiFetch(`${API_BASE_URL}/roles/${role}/permissions`, {
            method: 'PUT',
            body: JSON.stringify({ permissions }),
        });
    },

    async saveAttendance(classId: string, date: string, attendance: Record<string, AttendanceStatus>): Promise<AttendanceRecord[]> {
        return apiFetch(`${API_BASE_URL}/attendance`, {
            method: 'POST',
            body: JSON.stringify({ classId, date, attendance }),
        });
    },

    async saveGrades(classId: string, gradesToSave: any[]): Promise<Grade[]> {
        return apiFetch(`${API_BASE_URL}/grades`, {
            method: 'POST',
            body: JSON.stringify({ classId, grades: gradesToSave }),
        });
    }
};
