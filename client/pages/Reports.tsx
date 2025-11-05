// @ts-nocheck
import React, { useState, useMemo } from 'react';
import { useTranslation } from '../lib/i18n';
import { User, Permission, Student, Teacher, Class, Course, Transaction, AttendanceRecord, Grade, Reward, Redemption, PointTransaction } from '../types';
import Modal from '../components/Modal';
import { SearchIcon } from '../components/icons';

// Define a more comprehensive props type
interface ReportsProps {
  currentUser: User;
  hasPermission: (permission: Permission) => boolean;
  students: Student[];
  teachers: Teacher[];
  classes: Class[];
  courses: Course[];
  transactions: Transaction[];
  attendanceRecords: AttendanceRecord[];
  grades: Grade[];
  rewards: Reward[];
  redemptions: Redemption[];
  pointTransactions: PointTransaction[];
}
type ReportTab = 'students' | 'classes' | 'finance' | 'teachers' | 'rewards';


const Reports: React.FC<ReportsProps> = (props) => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<ReportTab>('finance');

    const activeTabClasses = "border-primary text-primary dark:border-primary dark:text-primary";
    const inactiveTabClasses = "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600";
    
    const tabs: { key: ReportTab, label: string }[] = [
        { key: 'students', label: t('reports.tabs.students') },
        { key: 'classes', label: t('reports.tabs.classes') },
        { key: 'finance', label: t('reports.tabs.finance') },
        { key: 'teachers', label: t('reports.tabs.teachers') },
        { key: 'rewards', label: t('reports.tabs.rewards') },
    ];

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">{t('reports.title')}</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">{t('reports.description')}</p>
            
             <div className="mt-6 border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    {tabs.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === tab.key ? activeTabClasses : inactiveTabClasses}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>
            
            <div className="mt-8">
                {activeTab === 'students' && <StudentReportsView {...props} />}
                {activeTab === 'classes' && <ClassReportsView {...props} />}
                {activeTab === 'finance' && <FinancialReportsView {...props} />}
                {activeTab === 'teachers' && <TeacherReportsView {...props} />}
                {activeTab === 'rewards' && <RewardReportsView {...props} />}
            </div>
        </div>
    );
};

// Reusable Drill-down List View
const DrillDownListView: React.FC<{
    title: string;
    items: any[];
    onSelectItem: (item: any) => void;
    searchPlaceholder: string;
    renderItem: (item: any) => React.ReactNode;
}> = ({ title, items, onSelectItem, searchPlaceholder, renderItem }) => {
    const [searchTerm, setSearchTerm] = useState('');
    
    const filteredItems = useMemo(() => {
        if (!searchTerm) return items;
        return items.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [items, searchTerm]);

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">{title}</h2>
                <div className="relative w-full max-w-sm">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                        <SearchIcon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    </span>
                    <input
                        type="text"
                        placeholder={searchPlaceholder}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                    />
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    {renderItem(filteredItems)}
                </table>
            </div>
        </div>
    );
}

// --- Student Reports ---
const StudentReportsView: React.FC<ReportsProps> = (props) => {
    const { t } = useTranslation();
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

    return (
        <div>
            <DrillDownListView
                title={t('reports.tabs.students')}
                items={props.students}
                onSelectItem={setSelectedStudent}
                searchPlaceholder={t('reports.search')}
                renderItem={(items: Student[]) => (
                    <>
                        <thead className="text-xs text-gray-700 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-6 py-3">{t('students.table.name')}</th>
                                <th className="px-6 py-3">{t('students.table.course')}</th>
                                <th className="px-6 py-3">{t('students.table.status')}</th>
                                <th className="px-6 py-3 text-right">{t('students.table.actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map(student => (
                                <tr key={student.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{student.name}</td>
                                    <td className="px-6 py-4">{student.course}</td>
                                    <td className="px-6 py-4">{t(`status.${student.status.toLowerCase()}`)}</td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={() => setSelectedStudent(student)} className="font-medium text-primary hover:underline">{t('reports.viewReport')}</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </>
                )}
            />
            {selectedStudent && <StudentReportModal student={selectedStudent} onClose={() => setSelectedStudent(null)} {...props} />}
        </div>
    );
}

const StudentReportModal: React.FC<ReportsProps & { student: Student, onClose: () => void }> = ({ student, onClose, ...props }) => {
    const { t } = useTranslation();
    const studentData = useMemo(() => {
        const studentClasses = props.classes.filter(c => c.studentIds.includes(student.id));
        const studentGrades = props.grades.filter(g => g.studentId === student.id);
        const studentAttendance = props.attendanceRecords.filter(ar => ar.studentId === student.id);
        
        const avgScore = studentGrades.length ? studentGrades.reduce((sum, g) => sum + g.score, 0) / studentGrades.length : 0;
        
        const attendanceRate = studentAttendance.length ? 
            (studentAttendance.filter(a => a.status === 'Present' || a.status === 'Late').length / studentAttendance.length) * 100 
            : 0;

        return { studentClasses, studentGrades, studentAttendance, avgScore, attendanceRate };
    }, [student.id, props.classes, props.grades, props.attendanceRecords]);

    return (
        <Modal isOpen={true} onClose={onClose} title={t('reports.student.title', { name: student.name })} size="4xl">
            <div className="space-y-6 max-h-[70vh] overflow-y-auto p-2">
                {/* General Info */}
                <ReportSection title={t('reports.student.generalInfo')}>
                    <InfoGrid>
                        <InfoItem label={t('reports.student.id')} value={student.id} />
                        <InfoItem label={t('students.table.status')} value={t(`status.${student.status.toLowerCase()}`)} />
                        <InfoItem label={t('reports.student.dob')} value={student.dob} />
                        <InfoItem label={t('reports.student.currentCourse')} value={student.course} />
                    </InfoGrid>
                </ReportSection>

                {/* Academic History */}
                 <ReportSection title={t('reports.student.academicHistory')}>
                    {studentData.studentClasses.length > 0 ? (
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-700 text-left text-xs uppercase text-gray-600 dark:text-gray-400">
                                <tr>
                                    <th className="p-2 font-semibold">{t('reports.student.course')}</th>
                                    <th className="p-2 font-semibold">{t('classes.details.average')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {studentData.studentClasses.map(cls => {
                                    const classGrades = studentData.studentGrades.filter(g => g.classId === cls.id);
                                    const classAvg = classGrades.length ? (classGrades.reduce((s, g) => s + g.score, 0) / classGrades.length).toFixed(1) : 'N/A';
                                    return (
                                        <tr key={cls.id} className="border-b dark:border-gray-700">
                                            <td className="p-2 text-gray-800 dark:text-gray-200">{cls.name}</td>
                                            <td className="p-2 text-gray-800 dark:text-gray-200">{classAvg}</td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    ) : (
                        <div className="text-center p-4 text-gray-500 dark:text-gray-400">
                            {t('reports.student.noHistory')}
                        </div>
                    )}
                </ReportSection>
                
                {/* Payment & Rewards */}
                <div className="grid grid-cols-2 gap-6">
                    <ReportSection title={t('reports.student.paymentInfo')}>
                        <InfoGrid>
                            <InfoItem label={t('reports.student.outstandingBalance')} value={`$${(props.courses.find(c => c.name === student.course)?.fee || 0).toLocaleString()}`} />
                        </InfoGrid>
                    </ReportSection>
                    <ReportSection title={t('reports.student.rewardPoints')}>
                         <InfoGrid>
                            <InfoItem label={t('reports.student.totalPoints')} value={student.rewardPoints.toString()} />
                        </InfoGrid>
                    </ReportSection>
                </div>
            </div>
        </Modal>
    )
}


// --- Class Reports ---
const ClassReportsView: React.FC<ReportsProps> = (props) => {
    const { t } = useTranslation();
    const [selectedClass, setSelectedClass] = useState<Class | null>(null);

    return (
        <div>
            <DrillDownListView
                title={t('reports.tabs.classes')}
                items={props.classes}
                onSelectItem={setSelectedClass}
                searchPlaceholder={t('reports.search')}
                renderItem={(items: Class[]) => (
                    <>
                        <thead className="text-xs text-gray-700 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-700">
                           <tr>
                                <th className="px-6 py-3">{t('classes.table.className')}</th>
                                <th className="px-6 py-3">{t('classes.table.teacher')}</th>
                                <th className="px-6 py-3">{t('classes.table.enrollment')}</th>
                                <th className="px-6 py-3 text-right">{t('students.table.actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map(cls => (
                                <tr key={cls.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{cls.name}</td>
                                    <td className="px-6 py-4">{cls.teacher}</td>
                                    <td className="px-6 py-4">{cls.studentIds.length} / {cls.capacity}</td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={() => setSelectedClass(cls)} className="font-medium text-primary hover:underline">{t('reports.viewReport')}</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </>
                )}
            />
            {selectedClass && <ClassReportModal classData={selectedClass} onClose={() => setSelectedClass(null)} {...props} />}
        </div>
    );
};

const ClassReportModal: React.FC<ReportsProps & { classData: Class, onClose: () => void }> = ({ classData, onClose, ...props }) => {
    const { t } = useTranslation();
    
    const classStats = useMemo(() => {
        const enrolledStudents = props.students.filter(s => classData.studentIds.includes(s.id));
        const classGrades = props.grades.filter(g => g.classId === classData.id);
        const classAttendance = props.attendanceRecords.filter(ar => ar.classId === classData.id);
        
        const avgScore = classGrades.length ? classGrades.reduce((sum, g) => sum + g.score, 0) / classGrades.length : 0;
        
        const uniqueAttendanceDays = new Set(classAttendance.map(a => a.date)).size;
        const totalPossibleAttendances = enrolledStudents.length * uniqueAttendanceDays;
        const actualAttendances = classAttendance.filter(a => a.status !== 'Absent').length;
        const avgAttendance = totalPossibleAttendances > 0 ? (actualAttendances / totalPossibleAttendances) * 100 : 0;
        
        const studentsWithStats = enrolledStudents.map(s => {
            const grades = classGrades.filter(g => g.studentId === s.id);
            const score = grades.length ? grades.reduce((sum, g) => sum + g.score, 0) / grades.length : 0;
            const attendance = classAttendance.filter(a => a.studentId === s.id);
            const attRate = attendance.length ? (attendance.filter(a => a.status !== 'Absent').length / attendance.length) * 100 : 0;
            return { ...s, score, attRate };
        });

        const topByScore = [...studentsWithStats].sort((a, b) => b.score - a.score).slice(0, 3);
        const topByAttendance = [...studentsWithStats].sort((a, b) => b.attRate - a.attRate).slice(0, 3);

        return { avgScore, avgAttendance, topByScore, topByAttendance };

    }, [classData.id, props.students, props.grades, props.attendanceRecords]);

    return (
        <Modal isOpen={true} onClose={onClose} title={t('reports.class.title', { name: classData.name })} size="4xl">
            <div className="space-y-6 max-h-[70vh] overflow-y-auto p-2">
                <div className="grid grid-cols-2 gap-6">
                    <ReportSection title={t('reports.class.classInfo')}>
                         <InfoGrid>
                            <InfoItem label={t('reports.class.teacher')} value={classData.teacher} />
                            <InfoItem label={t('reports.class.enrollment')} value={`${classData.studentIds.length} / ${classData.capacity}`} />
                        </InfoGrid>
                    </ReportSection>
                     <ReportSection title={t('reports.class.classAverages')}>
                         <InfoGrid>
                            <InfoItem label={t('reports.class.avgAttendance')} value={`${classStats.avgAttendance.toFixed(0)}%`} />
                            <InfoItem label={t('reports.class.avgScore')} value={classStats.avgScore.toFixed(1)} />
                        </InfoGrid>
                    </ReportSection>
                </div>
                <ReportSection title={t('reports.class.studentRanking')}>
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                             <h4 className="font-semibold mb-2 text-gray-800 dark:text-gray-200">{t('reports.class.topStudentsByScore')}</h4>
                             <ul className="space-y-1">
                                {classStats.topByScore.map(s => <li key={s.id} className="flex justify-between text-gray-700 dark:text-gray-300"><span className="text-gray-800 dark:text-gray-200">{s.name}</span> <b className="font-semibold text-gray-800 dark:text-gray-100">{s.score.toFixed(1)}</b></li>)}
                             </ul>
                        </div>
                         <div>
                             <h4 className="font-semibold mb-2 text-gray-800 dark:text-gray-200">{t('reports.class.topStudentsByAttendance')}</h4>
                             <ul className="space-y-1">
                                {classStats.topByAttendance.map(s => <li key={s.id} className="flex justify-between text-gray-700 dark:text-gray-300"><span className="text-gray-800 dark:text-gray-200">{s.name}</span> <b className="font-semibold text-gray-800 dark:text-gray-100">{s.attRate.toFixed(0)}%</b></li>)}
                             </ul>
                        </div>
                    </div>
                </ReportSection>
            </div>
        </Modal>
    );
}

// --- Teacher Reports ---
const TeacherReportsView: React.FC<ReportsProps> = (props) => {
    const { t } = useTranslation();
    const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);

     return (
        <div>
            <DrillDownListView
                title={t('reports.tabs.teachers')}
                items={props.teachers}
                onSelectItem={setSelectedTeacher}
                searchPlaceholder={t('reports.search')}
                renderItem={(items: Teacher[]) => (
                    <>
                        <thead className="text-xs text-gray-700 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-700">
                           <tr>
                                <th className="px-6 py-3">{t('teachers.table.name')}</th>
                                <th className="px-6 py-3">{t('teachers.table.specialization')}</th>
                                <th className="px-6 py-3">{t('teachers.table.contract')}</th>
                                <th className="px-6 py-3 text-right">{t('students.table.actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map(teacher => (
                                <tr key={teacher.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{teacher.name}</td>
                                    <td className="px-6 py-4">{teacher.specialization}</td>
                                    <td className="px-6 py-4">{t(`status.${teacher.contractType === 'Full-time' ? 'fullTime' : 'partTime'}`)}</td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={() => setSelectedTeacher(teacher)} className="font-medium text-primary hover:underline">{t('reports.viewReport')}</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </>
                )}
            />
            {selectedTeacher && <TeacherReportModal teacher={selectedTeacher} onClose={() => setSelectedTeacher(null)} {...props} />}
        </div>
    );
}

const TeacherReportModal: React.FC<ReportsProps & { teacher: Teacher, onClose: () => void }> = ({ teacher, onClose, ...props }) => {
    const { t } = useTranslation();
    const teacherData = useMemo(() => {
        const classesTaught = props.classes.filter(c => c.teacher === teacher.name);
        // Mock data for now
        const avgRating = 4.8; 
        const totalEarnings = classesTaught.length * teacher.payRate * 16; // 16 sessions approx per month
        return { classesTaught, avgRating, totalEarnings };
    }, [teacher.name, props.classes, teacher.payRate]);

    return (
        <Modal isOpen={true} onClose={onClose} title={t('reports.teacher.title', { name: teacher.name })} size="4xl">
             <div className="space-y-6 max-h-[70vh] overflow-y-auto p-2">
                <ReportSection title={t('reports.teacher.personalInfo')}>
                     <InfoGrid>
                        <InfoItem label={t('reports.teacher.qualification')} value={teacher.specialization} />
                        <InfoItem label={t('teachers.table.contract')} value={t(`status.${teacher.contractType === 'Full-time' ? 'fullTime' : 'partTime'}`)} />
                    </InfoGrid>
                </ReportSection>
                <ReportSection title={t('reports.teacher.teachingLoad')}>
                     <InfoGrid>
                        <InfoItem label={t('reports.teacher.classesTaught')} value={teacherData.classesTaught.length.toString()} />
                        <InfoItem label={t('reports.teacher.totalHours')} value={`${teacherData.classesTaught.length * 8}h / month`} />
                    </InfoGrid>
                </ReportSection>
                 <div className="grid grid-cols-2 gap-6">
                    <ReportSection title={t('reports.teacher.studentFeedback')}>
                         <InfoGrid>
                             <InfoItem label={t('reports.teacher.avgRating')} value={`${teacherData.avgRating} / 5.0 ★`} />
                         </InfoGrid>
                    </ReportSection>
                    <ReportSection title={t('reports.teacher.income')}>
                         <InfoGrid>
                             <InfoItem label={t('reports.teacher.totalEarnings')} value={`$${teacherData.totalEarnings.toLocaleString()}`} />
                         </InfoGrid>
                    </ReportSection>
                </div>
            </div>
        </Modal>
    );
};

const KPI_Card: React.FC<{ title: string; value: string; color: string; }> = ({ title, value, color }) => (
    <div className={`p-4 rounded-lg bg-${color}-50 dark:bg-${color}-900/50`}>
        <h4 className={`font-semibold text-sm text-${color}-700 dark:text-${color}-300`}>{title}</h4>
        <p className={`text-3xl font-bold text-${color}-600 dark:text-${color}-400`}>{value}</p>
    </div>
);

// --- Financial Reports ---
const FinancialReportsView: React.FC<ReportsProps> = ({ transactions, students, courses }) => {
    const { t } = useTranslation();

    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setMonth(d.getMonth() - 6);
        return d.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

    const reportData = useMemo(() => {
        const filteredTransactions = transactions.filter(t => t.date >= startDate && t.date <= endDate && t.status === 'Completed');

        const totalRevenue = filteredTransactions.filter(t => t.type === 'Income').reduce((s, t) => s + t.amount, 0);
        const teacherSalaries = filteredTransactions.filter(t => t.type === 'Expense' && t.category === 'Salary').reduce((s, t) => s + t.amount, 0);
        const operationalCosts = filteredTransactions.filter(t => t.type === 'Expense' && t.category !== 'Salary').reduce((s, t) => s + t.amount, 0);
        const totalExpenses = teacherSalaries + operationalCosts;
        const netProfit = totalRevenue - totalExpenses;

        const studentsInDebt = students.filter(s => ['Unpaid', 'Overdue'].includes(s.paymentStatus));
        const debtDetails = studentsInDebt.map(student => {
            const course = courses.find(c => c.name === student.course);
            return {
                studentName: student.name,
                courseName: student.course,
                amountDue: course?.fee || 0,
            };
        });
        const totalDebt = debtDetails.reduce((sum, item) => sum + item.amountDue, 0);
        
        const monthlyData = {};
        filteredTransactions.forEach(t => {
            const month = new Date(t.date).toISOString().slice(0, 7);
            if (!monthlyData[month]) {
                monthlyData[month] = { income: 0, expenses: 0 };
            }
            if (t.type === 'Income') monthlyData[month].income += t.amount;
            else monthlyData[month].expenses += t.amount;
        });

        const chartData = Object.keys(monthlyData).sort().map(month => ({
            name: new Date(month + '-02').toLocaleString('default', { month: 'short', year: '2-digit'}),
            [t('finance.types.income')]: monthlyData[month].income,
            [t('finance.types.expense')]: monthlyData[month].expenses,
        }));

        return {
            totalRevenue, teacherSalaries, operationalCosts, netProfit, totalDebt,
            debtDetails, chartData
        };
    }, [transactions, students, courses, startDate, endDate, t]);
    
    return (
        <div className="space-y-6">
             <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <div/>
                    <div className="flex items-center space-x-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('reports.finance.dateRange')}:</label>
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="py-1 px-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200 color-scheme-light dark:color-scheme-dark" />
                        <span className="text-gray-700 dark:text-gray-300">-</span>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="py-1 px-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200 color-scheme-light dark:color-scheme-dark" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
                    <KPI_Card title={t('reports.finance.totalRevenue')} value={`$${reportData.totalRevenue.toLocaleString()}`} color="green" />
                    <KPI_Card title={t('reports.finance.teacherSalaries')} value={`$${reportData.teacherSalaries.toLocaleString()}`} color="red" />
                    <KPI_Card title={t('reports.finance.operationalCosts')} value={`$${reportData.operationalCosts.toLocaleString()}`} color="orange" />
                    <KPI_Card title={t('reports.finance.netProfit')} value={`$${reportData.netProfit.toLocaleString()}`} color="blue" />
                    <KPI_Card title={t('reports.finance.totalDebt')} value={`$${reportData.totalDebt.toLocaleString()}`} color="yellow" />
                </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <ReportSection title={t('reports.finance.cashFlowChart')}>
                        <div className="h-80">
                            <CashFlowChart data={reportData.chartData} t={t} />
                        </div>
                    </ReportSection>
                </div>
                 <div>
                    <ReportSection title={t('reports.finance.outstandingDebtList')}>
                        <div className="max-h-80 overflow-y-auto">
                            <table className="w-full text-sm">
                                <thead className="text-xs text-gray-700 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-700">
                                    <tr className="border-b dark:border-gray-700">
                                        <th className="py-2 text-left font-semibold">{t('rewards.student')}</th>
                                        <th className="py-2 text-right font-semibold">{t('reports.finance.amountDue')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData.debtDetails.map((item, index) => (
                                        <tr key={index} className="border-b dark:border-gray-700 last:border-b-0">
                                            <td className="py-1 text-gray-800 dark:text-gray-200">{item.studentName}</td>
                                            <td className="py-1 text-right font-bold text-gray-800 dark:text-gray-200">${item.amountDue.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                    {reportData.debtDetails.length === 0 && <tr><td colSpan={2} className="text-center p-4 text-gray-500">No outstanding debt.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </ReportSection>
                 </div>
            </div>
        </div>
    );
};

const CashFlowChart: React.FC<{ data: any[], t: (key: string) => string }> = ({ data, t }) => {
    const { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } = window.Recharts || {};

    if (!ResponsiveContainer || !BarChart) {
        return <div className="flex items-center justify-center h-full"><p className="text-gray-500">{t('dashboard.chartLoading')}</p></div>;
    }

    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.2} />
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value/1000}k`} />
                <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                <Legend />
                <Bar dataKey={t('finance.types.income')} fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey={t('finance.types.expense')} fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    );
};

// --- Reward Reports ---
const RewardReportsView: React.FC<ReportsProps> = ({ pointTransactions, redemptions, rewards, students }) => {
    const { t } = useTranslation();
    const rewardStats = useMemo(() => {
        const totalIssued = pointTransactions.filter(p => p.points > 0).reduce((s, p) => s + p.points, 0);
        const totalRedeemed = Math.abs(pointTransactions.filter(p => p.points < 0).reduce((s, p) => s + p.points, 0));
        const redemptionRate = students.length > 0 ? (new Set(redemptions.map(r => r.studentId)).size / students.length) * 100 : 0;
        
        const giftCounts = redemptions.reduce((acc, r) => {
            acc[r.rewardId] = (acc[r.rewardId] || 0) + 1;
            return acc;
        }, {});
        const topGifts = Object.entries(giftCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([rewardId, count]) => ({
                name: rewards.find(r => r.id === rewardId)?.name || 'Unknown',
                count
            }));

        const userRedemptions = redemptions.reduce((acc, r) => {
            acc[r.studentId] = (acc[r.studentId] || 0) + 1;
            return acc;
        }, {});
        const topRedeemers = Object.entries(userRedemptions)
            .sort((a,b) => b[1] - a[1])
            .slice(0,5)
            .map(([studentId, count]) => ({
                name: students.find(s => s.id === studentId)?.name || 'Unknown',
                count
            }));

        return { totalIssued, totalRedeemed, redemptionRate, topGifts, topRedeemers };
    }, [pointTransactions, redemptions, rewards, students]);

    return (
        <div className="space-y-6">
            <ReportSection title={t('reports.rewards.kpis')}>
                 <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/50 rounded-lg"><h4 className="font-semibold text-blue-700 dark:text-blue-300">{t('reports.rewards.totalIssued')}</h4><p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{rewardStats.totalIssued.toLocaleString()}</p></div>
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/50 rounded-lg"><h4 className="font-semibold text-yellow-700 dark:text-yellow-300">{t('reports.rewards.totalRedeemed')}</h4><p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{rewardStats.totalRedeemed.toLocaleString()}</p></div>
                    <div className="p-4 bg-indigo-50 dark:bg-indigo-900/50 rounded-lg"><h4 className="font-semibold text-indigo-700 dark:text-indigo-300">{t('reports.rewards.redemptionRate')}</h4><p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{rewardStats.redemptionRate.toFixed(1)}%</p></div>
                </div>
            </ReportSection>
            <div className="grid grid-cols-2 gap-6">
                <ReportSection title={t('reports.rewards.topRedeemedGifts')}>
                    <RankingList items={rewardStats.topGifts} t={t} labelKey="gift" valueKey="redemptions" />
                </ReportSection>
                <ReportSection title={t('reports.rewards.topRedeemers')}>
                    <RankingList items={rewardStats.topRedeemers} t={t} labelKey="student" valueKey="redemptions" />
                </ReportSection>
            </div>
        </div>
    );
};


// --- Reusable Report UI Components ---
const ReportSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
        <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-4">{title}</h3>
        {children}
    </div>
);
const InfoGrid: React.FC<{ children: React.ReactNode }> = ({ children }) => <div className="grid grid-cols-2 gap-4">{children}</div>;
const InfoItem: React.FC<{ label: string, value: string }> = ({ label, value }) => (
    <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        <p className="font-semibold text-gray-800 dark:text-gray-200">{value}</p>
    </div>
);
const RankingList: React.FC<{ items: {name: string, count: number}[], t, labelKey: string, valueKey: string }> = ({ items, t, labelKey, valueKey }) => (
    <table className="w-full text-sm">
        <thead>
            <tr className="border-b dark:border-gray-700">
                <th className="py-2 text-left font-semibold text-gray-600 dark:text-gray-400">{t(`reports.rewards.${labelKey}`)}</th>
                <th className="py-2 text-right font-semibold text-gray-600 dark:text-gray-400">{t(`reports.rewards.${valueKey}`)}</th>
            </tr>
        </thead>
        <tbody>
            {items.map((item, index) => (
                <tr key={index}>
                    <td className="py-1 text-gray-800 dark:text-gray-200">{item.name}</td>
                    <td className="py-1 text-right font-bold text-gray-800 dark:text-gray-200">{item.count}</td>
                </tr>
            ))}
        </tbody>
    </table>
);

export default Reports;