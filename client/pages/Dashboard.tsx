// @ts-nocheck
import React, { useMemo } from 'react';
import { StudentsIcon, TeachersIcon, CoursesIcon, FinanceIcon } from '../components/icons';
import { useTranslation } from '../lib/i18n';
import { Student, Teacher, Course, Transaction, Class, Room, User } from '../types';

interface DashboardProps {
    students: Student[];
    teachers: Teacher[];
    courses: Course[];
    transactions: Transaction[];
    classes: Class[];
    rooms: Room[];
    currentUser: User;
}

const StatCard: React.FC<{ icon: React.ReactNode; title: string; value: string; change: string; changeType: 'increase' | 'decrease' | 'neutral' }> = ({ icon, title, value, change, changeType }) => {
    const changeColor = {
        increase: 'text-green-500',
        decrease: 'text-red-500',
        neutral: 'text-gray-500 dark:text-gray-400'
    };
    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm flex items-center">
            <div className="bg-primary/10 p-4 rounded-full">
                {icon}
            </div>
            <div className="ml-4">
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">{title}</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">{value}</p>
                <p className={`text-xs ${changeColor[changeType]}`}>{change}</p>
            </div>
        </div>
    );
};

const Dashboard: React.FC<DashboardProps> = ({ students, teachers, courses, transactions, classes, rooms, currentUser }) => {
  const { t } = useTranslation();
  const { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } = window.Recharts || {};

  const stats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
    const yearForLastMonth = lastMonth === 11 ? currentYear - 1 : currentYear;
    
    const formatChange = (change: number, unit: '%' | 'abs' = '%') => {
      if (!isFinite(change) || isNaN(change)) change = 0;
      const prefix = change > 0 ? '+' : '';
      const value = unit === '%' ? `${change.toFixed(0)}%` : change;
      return `${prefix}${value} ${t('dashboard.fromLastMonth')}`;
    };

    // Revenue
    const revenueCurrentMonth = transactions
        .filter(transaction => {
            const tDate = new Date(transaction.date);
            return transaction.type === 'Income' && transaction.status === 'Completed' && tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear;
        })
        .reduce((sum, transaction) => sum + transaction.amount, 0);

    const revenueLastMonth = transactions
        .filter(transaction => {
            const tDate = new Date(transaction.date);
            return transaction.type === 'Income' && transaction.status === 'Completed' && tDate.getMonth() === lastMonth && tDate.getFullYear() === yearForLastMonth;
        })
        .reduce((sum, transaction) => sum + transaction.amount, 0);

    const revenueChange = revenueLastMonth > 0 ? ((revenueCurrentMonth - revenueLastMonth) / revenueLastMonth) * 100 : revenueCurrentMonth > 0 ? 100 : 0;

    // Students
    const studentsCurrentMonth = students.filter(s => {
        const sDate = new Date(s.enrolledDate);
        return sDate.getMonth() === currentMonth && sDate.getFullYear() === currentYear;
    }).length;

    const studentsLastMonth = students.filter(s => {
        const sDate = new Date(s.enrolledDate);
        return sDate.getMonth() === lastMonth && sDate.getFullYear() === yearForLastMonth;
    }).length;
    
    const studentChange = studentsLastMonth > 0 ? ((studentsCurrentMonth - studentsLastMonth) / studentsLastMonth) * 100 : studentsCurrentMonth > 0 ? 100 : 0;
    
    // Teachers
    const teachersCurrentMonth = teachers.filter(teacher => {
        const sDate = new Date(teacher.startDate);
        return sDate.getMonth() === currentMonth && sDate.getFullYear() === currentYear;
    }).length;

    const teachersLastMonth = teachers.filter(teacher => {
        const sDate = new Date(teacher.startDate);
        return sDate.getMonth() === lastMonth && sDate.getFullYear() === yearForLastMonth;
    }).length;

    const teacherChange = teachersCurrentMonth - teachersLastMonth;

    return {
        totalStudents: students.length,
        studentChange,
        studentChangeString: formatChange(studentChange),
        activeTeachers: teachers.length,
        teacherChange,
        teacherChangeString: formatChange(teacherChange, 'abs'),
        coursesOffered: courses.length,
        monthlyRevenue: revenueCurrentMonth,
        revenueChange,
        revenueChangeString: formatChange(revenueChange)
    };
  }, [students, teachers, courses, transactions, t]);

  const enrollmentData = useMemo(() => {
    const months = [...Array(6)].map((_, i) => {
        const d = new Date();
        d.setDate(1);
        d.setMonth(d.getMonth() - i);
        return d;
    }).reverse();

    return months.map(month => {
        const monthName = month.toLocaleString('default', { month: 'short' });
        const count = students.filter(s => {
            const enrolledDate = new Date(s.enrolledDate);
            return enrolledDate.getFullYear() === month.getFullYear() && enrolledDate.getMonth() === month.getMonth();
        }).length;
        return { name: monthName, students: count };
    });
  }, [students]);

  const upcomingClasses = useMemo(() => classes.slice(0, 3), [classes]);
  const getRoomName = (roomId: string) => rooms.find(r => r.id === roomId)?.name || 'N/A';

  const renderChart = () => {
    if (!ResponsiveContainer || !AreaChart) {
      return (
        <div className="h-80 flex items-center justify-center">
          <p className="text-gray-500 dark:text-gray-400">{t('dashboard.chartLoading')}</p>
        </div>
      );
    }
    return (
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={enrollmentData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                    <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0052cc" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#0052cc" stopOpacity={0}/>
                    </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.2} />
                <Tooltip 
                    wrapperClassName="!bg-white dark:!bg-gray-700 !border-gray-200 dark:!border-gray-600 !rounded-lg !shadow-lg" 
                    contentStyle={{ backgroundColor: 'transparent', border: 'none' }}
                    labelStyle={{ color: '#6b7280' }}
                    itemStyle={{ color: '#1f2937' }}
                />
                <Area type="monotone" dataKey="students" stroke="#0052cc" fillOpacity={1} fill="url(#colorStudents)" />
            </AreaChart>
        </ResponsiveContainer>
    );
  }

  return (
    <div>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">{t('dashboard.title')}</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">{t('dashboard.welcome')}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
            <StatCard 
                icon={<StudentsIcon className="w-6 h-6 text-primary"/>} 
                title={t('dashboard.totalStudents')} 
                value={stats.totalStudents.toLocaleString()} 
                change={stats.studentChangeString} 
                changeType={stats.studentChange >= 0 ? 'increase' : 'decrease'}
            />
            <StatCard 
                icon={<TeachersIcon className="w-6 h-6 text-primary"/>} 
                title={t('dashboard.activeTeachers')} 
                value={stats.activeTeachers.toLocaleString()} 
                change={stats.teacherChangeString} 
                changeType={stats.teacherChange > 0 ? 'increase' : stats.teacherChange < 0 ? 'decrease' : 'neutral'}
            />
            <StatCard 
                icon={<CoursesIcon className="w-6 h-6 text-primary"/>} 
                title={t('dashboard.coursesOffered')} 
                value={stats.coursesOffered.toLocaleString()} 
                change=""
                changeType="neutral"
            />
            <StatCard 
                icon={<FinanceIcon className="w-6 h-6 text-primary"/>} 
                title={t('dashboard.monthlyRevenue')} 
                value={`$${stats.monthlyRevenue.toLocaleString()}`} 
                change={stats.revenueChangeString} 
                changeType={stats.revenueChange >= 0 ? 'increase' : 'decrease'}
            />
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                 <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">{t('dashboard.studentEnrollment')}</h2>
                 <p className="text-gray-500 dark:text-gray-400 text-sm">{t('dashboard.last6Months')}</p>
                 <div className="mt-4 h-80">
                    {renderChart()}
                 </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">{t('dashboard.upcomingClasses')}</h2>
                 <ul className="mt-4 space-y-4">
                    {upcomingClasses.map(cls => (
                         <li key={cls.id} className="flex justify-between items-center">
                            <div>
                                <p className="font-semibold text-gray-800 dark:text-gray-200">{cls.name}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{cls.teacher} - {cls.schedule}</p>
                            </div>
                            <span className="text-sm font-medium text-primary">{getRoomName(cls.roomId)}</span>
                        </li>
                    ))}
                    {upcomingClasses.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">No upcoming classes.</p>}
                 </ul>
            </div>
        </div>
    </div>
  );
};

export default Dashboard;