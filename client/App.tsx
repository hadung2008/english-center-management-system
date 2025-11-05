import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Teachers from './pages/Teachers';
import Classes from './pages/Classes';
import Courses from './pages/Courses';
import Finance from './pages/Finance';
import Rewards from './pages/Rewards';
import Reports from './pages/Reports';
import Users from './pages/Users';
import LoginPage from './pages/Login';
import { Student, Teacher, Class, Course, Transaction, AttendanceRecord, Grade, Reward, Redemption, PointTransaction, Room, StudentLevel, User, UserRole, Permission } from './types';
import { api } from './lib/api';
import { useTranslation } from './lib/i18n';

export type Page = 'Dashboard' | 'Students' | 'Teachers' | 'Classes' | 'Courses' | 'Finance' | 'Rewards' | 'Reports' | 'Users';
export type Theme = 'light' | 'dark';

const ConnectionErrorScreen: React.FC = () => {
    const { t } = useTranslation();
    return (
        <div className="flex h-screen w-full items-center justify-center bg-secondary dark:bg-gray-900">
            <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md mx-4">
                <svg className="mx-auto h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <h1 className="text-2xl font-bold text-red-600 dark:text-red-500 mt-4 mb-2">{t('connectionError.title')}</h1>
                <p className="text-gray-600 dark:text-gray-400 mb-6">{t('connectionError.message')}</p>
                <p className="text-gray-600 dark:text-gray-400 mb-4">{t('connectionError.instructions')}</p>
                <pre className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 p-3 rounded-md text-left font-mono text-sm">
                    <code>npm run start:server</code>
                </pre>
            </div>
        </div>
    );
};


const App: React.FC = () => {
  const [activePage, setActivePage] = useState<Page>('Dashboard');
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('theme') as Theme) || 'light');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Centralized State
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [pointTransactions, setPointTransactions] = useState<PointTransaction[]>([]);
  const [studentLevels, setStudentLevels] = useState<StudentLevel[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [rolePermissions, setRolePermissions] = useState<Record<UserRole, Permission[]>>({} as Record<UserRole, Permission[]>);

  // Auth State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Initial Data Fetch
  useEffect(() => {
    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await api.getInitialData();
            setStudents(data.students);
            setTeachers(data.teachers);
            setClasses(data.classes);
            setRooms(data.rooms);
            setCourses(data.courses);
            setTransactions(data.transactions);
            setAttendanceRecords(data.attendanceRecords);
            setGrades(data.grades);
            setRewards(data.rewards);
            setRedemptions(data.redemptions);
            setPointTransactions(data.pointTransactions);
            setStudentLevels(data.studentLevels);
            setUsers(data.users);
            setRolePermissions(data.rolePermissions);
        } catch (e) {
            console.error("Failed to fetch initial data:", e);
            setError('Failed to load mock data.');
        } finally {
            setLoading(false);
        }
    };
    fetchData();
  }, []);
  
  // Handlers
  const handleLogin = async (email: string, password?: string): Promise<User | null> => {
    const user = await api.login(email, password);
    if (user) {
        setCurrentUser(user);
        setIsLoggedIn(true);
        setActivePage('Dashboard');
        return user;
    }
    return null;
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
  };

  const handleSaveStudent = async (studentData: Omit<Student, 'id'> | Student) => {
    // 1. CREATE new student
    if (!('id' in studentData) || !studentData.id) {
        const savedStudent = await api.saveStudent(studentData);
        setStudents(prev => [savedStudent, ...prev]);
        return;
    }

    // 2. UPDATE existing student
    const studentId = studentData.id;
    const originalStudent = students.find(s => s.id === studentId);

    if (!originalStudent) {
        console.error("Student not found for update:", studentId);
        return;
    }

    // --- Start transaction-like logic ---
    
    // A. Determine the final state of the student to be saved.
    // We create a mutable copy to apply our business logic to.
    const studentUpdatePayload: Student = { ...originalStudent, ...studentData };

    const isBeingActivated = studentUpdatePayload.status === 'Active' && originalStudent.status === 'Inactive';
    const isBeingDeactivated = studentUpdatePayload.status === 'Inactive' && originalStudent.status !== 'Inactive';

    if (isBeingActivated && originalStudent.paymentStatus === 'Unpaid') {
        // Business Rule: An unpaid inactive student cannot become Active directly. They must become Pending.
        studentUpdatePayload.status = 'Pending';
    }

    // B. Save the primary record (the student).
    // The API returns the confirmed state of the student.
    const savedStudent = await api.saveStudent(studentUpdatePayload);

    // C. Handle side-effects based on the action that was taken.
    if (isBeingDeactivated) {
        // Business Rule: Inactivating a student removes them from all classes.
        
        // Create a new array of classes with the student removed.
        const newClassesState = classes.map(cls => {
            if (cls.studentIds.includes(studentId)) {
                // Return a new class object with the student ID filtered out.
                return { ...cls, studentIds: cls.studentIds.filter(sid => sid !== studentId) };
            }
            return cls;
        });

        // Identify only the classes that were actually changed to save API calls.
        const classesToSave = newClassesState.filter(newCls => {
            const oldCls = classes.find(c => c.id === newCls.id);
            // A class needs saving if the old one had the student and the new one doesn't.
            return oldCls && oldCls.studentIds.includes(studentId);
        });
      
        if (classesToSave.length > 0) {
            // Save all updated classes to the backend.
            await Promise.all(classesToSave.map(cls => api.saveClass(cls)));
        }

        // Update local state for classes *after* successful save.
        setClasses(newClassesState);
    }

    // D. Update the student list with the confirmed data from the API.
    // This is the final step to ensure UI consistency.
    setStudents(prev => prev.map(s => (s.id === savedStudent.id ? savedStudent : s)));
  };


  const handleSaveTeacher = async (teacherData: Omit<Teacher, 'id'> | Teacher) => {
    const savedTeacher = await api.saveTeacher(teacherData);
    if ('id' in teacherData && teacherData.id) {
        setTeachers(prev => prev.map(t => t.id === savedTeacher.id ? savedTeacher : t));
    } else {
        setTeachers(prev => [savedTeacher, ...prev]);
    }
  };
  
  const handleSaveClass = async (classData: Omit<Class, 'id'> | Class) => {
    const savedClass = await api.saveClass(classData);
     if ('id' in classData && classData.id) {
        setClasses(prev => prev.map(c => c.id === savedClass.id ? savedClass : c));
    } else {
        setClasses(prev => [savedClass, ...prev]);
    }
  };
  
  const handleSaveRoom = async (roomData: Omit<Room, 'id'> | Room) => {
    const savedRoom = await api.saveRoom(roomData);
     if ('id' in roomData && roomData.id) {
        setRooms(prev => prev.map(r => r.id === savedRoom.id ? savedRoom : r));
    } else {
        setRooms(prev => [savedRoom, ...prev]);
    }
  };

  const handleSaveCourse = async (courseData: Omit<Course, 'id'> | Course) => {
      const savedCourse = await api.saveCourse(courseData);
      if('id' in courseData && courseData.id) {
          setCourses(prev => prev.map(c => c.id === savedCourse.id ? savedCourse : c));
      } else {
          setCourses(prev => [savedCourse, ...prev]);
      }
  };

  const handleSaveTransaction = async (transactionData: Omit<Transaction, 'id'> | Transaction) => {
      const savedTransaction = await api.saveTransaction(transactionData);
      if('id' in transactionData && transactionData.id) {
          setTransactions(prev => prev.map(t => t.id === savedTransaction.id ? savedTransaction : t));
      } else {
          setTransactions(prev => [savedTransaction, ...prev]);
      }
  };
  
  const handleAddTransaction = async (transactionData: Omit<Transaction, 'id' | 'date'>) => {
    // FIX: Add a dummy date property to satisfy the `api.saveTransaction` type.
    // The API will set the correct date for new transactions.
    const newTransaction = await api.saveTransaction({ ...transactionData, date: '' });
    setTransactions(prev => [newTransaction, ...prev]);
  };
  
  const handleSaveReward = async (rewardData: Omit<Reward, 'id'> | Reward) => {
    const savedReward = await api.saveReward(rewardData);
    if ('id' in rewardData && rewardData.id) {
        setRewards(prev => prev.map(r => r.id === savedReward.id ? savedReward : r));
    } else {
        setRewards(prev => [savedReward, ...prev]);
    }
  };
  
  const handleUpdateRedemption = async (redemptionId: string, status: 'Approved' | 'Rejected') => {
    const { 
        updatedRedemption, 
        updatedStudent, 
        updatedReward, 
        newPointTransaction 
    } = await api.updateRedemption(redemptionId, status);

    // Always update the redemption status
    setRedemptions(prev => prev.map(r => r.id === updatedRedemption.id ? updatedRedemption : r));

    // If a student was updated (points refunded), update students state
    if (updatedStudent) {
        setStudents(prev => prev.map(s => s.id === updatedStudent.id ? updatedStudent : s));
    }

    // If a reward was updated (restocked), update rewards state
    if (updatedReward) {
        setRewards(prev => prev.map(r => r.id === updatedReward.id ? updatedReward : r));
    }
    
    // If a refund transaction was created, add it to the state
    if (newPointTransaction) {
        setPointTransactions(prev => [newPointTransaction, ...prev]);
    }
  };

  const handleAddPoints = async (studentId: string, points: number, reason: string) => {
    const { updatedStudent, newTransaction } = await api.addPoints(studentId, points, reason);
    setStudents(prev => prev.map(s => s.id === updatedStudent.id ? updatedStudent : s));
    setPointTransactions(prev => [newTransaction, ...prev]);
  };
  
  const handleRedeemReward = async (studentId: string, reward: Reward, reason: string) => {
    const { updatedStudent, newPointTransaction, newRedemption } = await api.redeemReward(studentId, reward, reason);
    setStudents(prev => prev.map(s => s.id === updatedStudent.id ? updatedStudent : s));
    setPointTransactions(prev => [newPointTransaction, ...prev]);
    setRedemptions(prev => [newRedemption, ...prev]);
    setRewards(prev => prev.map(r => r.id === reward.id ? {...r, stock: r.stock -1} : r));
  };
  
  const handleSaveStudentLevel = async (levelData: Omit<StudentLevel, 'id'>) => {
      const newLevel = await api.saveStudentLevel(levelData);
      setStudentLevels(prev => [newLevel, ...prev]);
  };
  
  const handleSaveUser = async (userData: Omit<User, 'id'> | User) => {
    const savedUser = await api.saveUser(userData);
    if ('id' in userData && userData.id) {
        setUsers(prev => prev.map(u => u.id === savedUser.id ? savedUser : u));
    } else {
        setUsers(prev => [savedUser, ...prev]);
    }
  };
  
  const handleSavePermissions = async (role: UserRole, permissions: Permission[]) => {
      const updatedPermissions = await api.savePermissions(role, permissions);
      setRolePermissions(updatedPermissions);
  };

  const handleCreateRole = async (roleName: string) => {
    const updatedPermissions = await api.createRole(roleName);
    setRolePermissions(updatedPermissions);
  };

  const handleDeleteRole = async (roleName: string) => {
    const updatedPermissions = await api.deleteRole(roleName);
    setRolePermissions(updatedPermissions);
  };
  
  const handleSaveAttendance = async (classId: string, date: string, attendance: Record<string, any>) => {
      const newRecords = await api.saveAttendance(classId, date, attendance);
      const otherRecords = attendanceRecords.filter(r => r.classId !== classId || r.date !== date);
      setAttendanceRecords([...otherRecords, ...newRecords]);
  };

  const handleSaveGrades = async (classId: string, gradesToSave: any[]) => {
      const savedGrades = await api.saveGrades(classId, gradesToSave);
      const otherGrades = grades.filter(g => g.classId !== classId);
      const updatedClassGrades = grades.filter(g => g.classId === classId).map(og => savedGrades.find(sg => sg.id === og.id) || og);
      const newGrades = savedGrades.filter(sg => !grades.some(og => og.id === sg.id));
      setGrades([...otherGrades, ...updatedClassGrades, ...newGrades]);
      return savedGrades;
  };

  const hasPermission = (permission: Permission): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'Admin') return true;
    const permissionsForRole = rolePermissions[currentUser.role];
    if (!permissionsForRole) return false;
    return permissionsForRole.includes(permission);
  };

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };
  
  const renderPage = () => {
    if (!currentUser) return null; // Should not happen if isLoggedIn is true
    const pageProps = { hasPermission, currentUser };
    switch (activePage) {
      case 'Dashboard':
        return <Dashboard students={students} teachers={teachers} courses={courses} transactions={transactions} classes={classes} rooms={rooms} {...pageProps} />;
      case 'Students':
        return <Students 
          students={students} onSaveStudent={handleSaveStudent} 
          courses={courses} onAddTransaction={handleAddTransaction} 
          classes={classes} grades={grades} onAddPoints={handleAddPoints}
          pointTransactions={pointTransactions} redemptions={redemptions}
          rewards={rewards} onRedeemReward={handleRedeemReward}
          studentLevels={studentLevels} onSaveStudentLevel={handleSaveStudentLevel}
          {...pageProps} />;
      case 'Teachers':
        return <Teachers teachers={teachers} onSaveTeacher={handleSaveTeacher} {...pageProps} />;
      case 'Classes':
        return <Classes 
          classes={classes} onSaveClass={handleSaveClass} 
          students={students} attendanceRecords={attendanceRecords}
          onSaveAttendance={handleSaveAttendance} grades={grades}
          onSaveGrades={handleSaveGrades} onAddPoints={handleAddPoints}
          rooms={rooms} onSaveRoom={handleSaveRoom} teachers={teachers}
          {...pageProps} />;
       case 'Courses':
        return <Courses courses={courses} onSaveCourse={handleSaveCourse} {...pageProps} />;
      case 'Finance':
        return <Finance 
          transactions={transactions} onSaveTransaction={handleSaveTransaction} 
          onAddTransaction={handleAddTransaction} teachers={teachers}
          classes={classes} attendanceRecords={attendanceRecords}
          {...pageProps} />;
      case 'Rewards':
        return <Rewards 
          rewards={rewards} onSaveReward={handleSaveReward}
          redemptions={redemptions} onUpdateRedemption={handleUpdateRedemption}
          students={students} {...pageProps} />;
      case 'Reports':
        return <Reports 
            students={students} 
            teachers={teachers} 
            classes={classes}
            courses={courses}
            transactions={transactions}
            attendanceRecords={attendanceRecords}
            grades={grades}
            rewards={rewards}
            redemptions={redemptions}
            pointTransactions={pointTransactions}
            {...pageProps} 
          />;
      case 'Users':
        return <Users 
          users={users} onSaveUser={handleSaveUser} 
          rolePermissions={rolePermissions} onSavePermissions={handleSavePermissions}
          onCreateRole={handleCreateRole}
          onDeleteRole={handleDeleteRole}
          {...pageProps} />;
      default:
        return <Dashboard students={students} teachers={teachers} courses={courses} transactions={transactions} classes={classes} rooms={rooms} {...pageProps} />;
    }
  };

  if (loading) {
      return (
          <div className="flex h-screen w-full items-center justify-center bg-secondary dark:bg-gray-900">
              <div className="text-center">
                  <h1 className="text-3xl font-bold text-primary mb-2">EngCenter</h1>
                  <p className="text-gray-600 dark:text-gray-400">Loading Application...</p>
              </div>
          </div>
      );
  }

  if (error) {
    // Although we removed the server check, we leave this here for other potential errors.
    // In a frontend-only setup, this screen is unlikely to appear.
    return <ConnectionErrorScreen />;
  }

  if (!isLoggedIn || !currentUser) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-secondary dark:bg-gray-900 font-sans">
      <Sidebar activePage={activePage} setActivePage={setActivePage} currentUser={currentUser} hasPermission={hasPermission} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header theme={theme} toggleTheme={toggleTheme} currentUser={currentUser} onLogout={handleLogout} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-secondary dark:bg-gray-900 p-6 md:p-8 lg:p-10">
          {renderPage()}
        </main>
      </div>
    </div>
  );
};

export default App;