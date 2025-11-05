import React, { useState, useMemo } from 'react';
import { Student, Course, Transaction, Class, Grade, PointTransaction, Redemption, Reward, StudentLevel, User, Permission } from '../types';
import { PlusIcon, SearchIcon } from '../components/icons';
import Modal from '../components/Modal';
import { useTranslation } from '../lib/i18n';

interface StudentsProps {
    students: Student[];
    onSaveStudent: (studentData: Omit<Student, 'id'> | Student) => Promise<void>;
    courses: Course[];
    onAddTransaction: (transaction: Omit<Transaction, 'id' | 'date'>) => Promise<void>;
    classes: Class[];
    grades: Grade[];
    onAddPoints: (studentId: string, points: number, reason: string) => Promise<void>;
    pointTransactions: PointTransaction[];
    redemptions: Redemption[];
    rewards: Reward[];
    onRedeemReward: (studentId: string, reward: Reward, reason: string) => Promise<void>;
    studentLevels: StudentLevel[];
    onSaveStudentLevel: (levelData: Omit<StudentLevel, 'id'>) => Promise<void>;
    currentUser: User;
    hasPermission: (permission: Permission) => boolean;
}

const getStatusChip = (status: Student['status']) => {
    switch (status) {
        case 'Active': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
        case 'Inactive': return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
        case 'Pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
    }
}

const getPaymentStatusChip = (status: Student['paymentStatus']) => {
    switch (status) {
        case 'Paid': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300';
        case 'Unpaid': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300';
        case 'Overdue': return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
    }
}

const Students: React.FC<StudentsProps> = (props) => {
    const [activeTab, setActiveTab] = useState<'students' | 'levels'>('students');
    const { t } = useTranslation();
    
    const activeTabClasses = "border-primary text-primary dark:border-primary dark:text-primary";
    const inactiveTabClasses = "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600";

    return (
        <div>
            <div className="flex justify-between items-center">
                 <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">{t('students.title')}</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                         {activeTab === 'students' ? t('students.description') : t('students.levels.description')}
                    </p>
                </div>
            </div>
            <div className="mt-6 border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('students')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'students' ? activeTabClasses : inactiveTabClasses}`}
                    >
                        {t('students.tabs.students')}
                    </button>
                    <button
                        onClick={() => setActiveTab('levels')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'levels' ? activeTabClasses : inactiveTabClasses}`}
                    >
                        {t('students.tabs.levels')}
                    </button>
                </nav>
            </div>
            <div className="mt-8">
                {activeTab === 'students' && <StudentListView {...props} />}
                {activeTab === 'levels' && <StudentLevelsView students={props.students} studentLevels={props.studentLevels} onSaveStudentLevel={props.onSaveStudentLevel} currentUser={props.currentUser} hasPermission={props.hasPermission}/>}
            </div>
        </div>
    )
};

const StudentListView: React.FC<StudentsProps> = ({ students, onSaveStudent, courses, onAddTransaction, classes, grades, onAddPoints, pointTransactions, redemptions, rewards, onRedeemReward, currentUser, hasPermission }) => {
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isPointsModalOpen, setIsPointsModalOpen] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [isRedemptionModalOpen, setIsRedemptionModalOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [receiptDetails, setReceiptDetails] = useState<{ student: Student, course: Course, transaction: Transaction } | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const { t } = useTranslation();
    
    const translatedStatus = (status: Student['status']) => t(`status.${status.toLowerCase()}`);
    const translatedPaymentStatus = (status: Student['paymentStatus']) => t(`status.${status.toLowerCase()}`);

    const handleOpenAddModal = () => {
        setSelectedStudent(null);
        setIsFormModalOpen(true);
    };

    const handleOpenEditModal = (student: Student) => {
        setSelectedStudent(student);
        setIsFormModalOpen(true);
    };

    const handleOpenPointsModal = (student: Student) => {
        setSelectedStudent(student);
        setIsPointsModalOpen(true);
    };

    const handleOpenHistoryModal = (student: Student) => {
        setSelectedStudent(student);
        setIsHistoryModalOpen(true);
    };

    const handleOpenRedemptionModal = (student: Student) => {
        setSelectedStudent(student);
        setIsRedemptionModalOpen(true);
    }
    
    const handleCloseAllModals = () => {
        setIsFormModalOpen(false);
        setIsPointsModalOpen(false);
        setIsHistoryModalOpen(false);
        setIsRedemptionModalOpen(false);
        setSelectedStudent(null);
    };

    const handleSave = async (formData: Omit<Student, 'id' | 'enrolledDate' | 'rewardPoints'>) => {
        // FIX: Add enrolledDate and rewardPoints for new students to satisfy the type.
        // The API will overwrite these values upon creation.
        const dataToSave = selectedStudent
            ? { ...selectedStudent, ...formData }
            : { ...formData, status: 'Pending' as const, paymentStatus: 'Unpaid' as const, enrolledDate: '', rewardPoints: 0 };
        
        await onSaveStudent(dataToSave);
        handleCloseAllModals();
    };
    
    const handleGenerateReceipt = (studentId: string) => {
        const studentToUpdate = students.find(s => s.id === studentId);
        const course = courses.find(c => c.name === studentToUpdate?.course);

        if (studentToUpdate && course) {
             const newTransaction: Transaction = {
                id: `TRN${Date.now()}`,
                date: new Date().toISOString().split('T')[0],
                description: `Tuition Fee - ${studentToUpdate.name} (${studentToUpdate.id})`,
                category: 'Tuition Fee',
                type: 'Income',
                amount: course.fee,
                status: 'Completed',
            };
            setReceiptDetails({ student: studentToUpdate, course, transaction: newTransaction });
        }
    };

    const handleConfirmAndCloseReceipt = async () => {
        if (receiptDetails) {
            const updatedStudentData = { 
                ...receiptDetails.student, 
                status: 'Active' as const, 
                paymentStatus: 'Paid' as const 
            };
            await onSaveStudent(updatedStudentData);
            await onAddTransaction(receiptDetails.transaction);
        }
        setReceiptDetails(null);
    }

    const handleToggleStatus = async (student: Student, newStatus: 'Active' | 'Inactive') => {
        const action = newStatus === 'Active' ? t('students.table.activate').toLowerCase() : t('students.table.inactivate').toLowerCase();
        if (window.confirm(`Are you sure you want to ${action} ${student.name}?`)) {
            await onSaveStudent({ ...student, status: newStatus });
        }
    };
    
    const filteredStudents = useMemo(() => {
        if (!searchTerm) return students;
        return students.filter(student =>
            student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [students, searchTerm]);

    return (
        <div>
             <div className="flex justify-between items-center -mt-20 mb-8">
                 <div></div>
                 {hasPermission('MANAGE_STUDENTS') && (
                    <button 
                        onClick={handleOpenAddModal}
                        className="bg-primary text-white font-medium py-2.5 px-5 rounded-lg flex items-center hover:bg-primary-dark transition-colors"
                    >
                        <PlusIcon className="w-5 h-5 mr-2" />
                        {t('students.addStudent')}
                    </button>
                 )}
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                <div className="flex items-center justify-between mb-4">
                     <div className="relative w-full max-w-sm">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                            <SearchIcon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                        </span>
                        <input
                            type="text"
                            placeholder={t('students.searchPlaceholder')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                        <thead className="text-xs text-gray-700 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th scope="col" className="px-6 py-3">{t('students.table.name')}</th>
                                <th scope="col" className="px-6 py-3">{t('students.table.course')}</th>
                                <th scope="col" className="px-6 py-3">{t('students.table.rewardPoints')}</th>
                                <th scope="col" className="px-6 py-3">{t('students.table.status')}</th>
                                <th scope="col" className="px-6 py-3">{t('students.table.payment')}</th>
                                <th scope="col" className="px-6 py-3 min-w-[460px] text-right">{t('students.table.actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStudents.map(student => (
                                <tr key={student.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                    <th scope="row" className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                                        <div className="flex items-center">
                                            <img className="w-8 h-8 rounded-full mr-3 object-cover" src={student.avatarUrl} alt={student.name} />
                                            <div>
                                                <p>{student.name}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">{student.email}</p>
                                            </div>
                                        </div>
                                    </th>
                                    <td className="px-6 py-4">{student.course}</td>
                                    <td className="px-6 py-4 font-semibold text-primary">{student.rewardPoints}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusChip(student.status)}`}>{translatedStatus(student.status)}</span>
                                    </td>
                                     <td className="px-6 py-4">
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPaymentStatusChip(student.paymentStatus)}`}>{translatedPaymentStatus(student.paymentStatus)}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right space-x-2">
                                        <button
                                            onClick={() => handleOpenRedemptionModal(student)}
                                            className="font-medium text-blue-600 dark:text-blue-500 hover:underline"
                                        >
                                            {t('rewards.redeem.redeemRewards')}
                                        </button>
                                        <button 
                                            onClick={() => handleOpenHistoryModal(student)}
                                            className="font-medium text-purple-600 dark:text-purple-500 hover:underline"
                                        >
                                            {t('students.table.viewHistory')}
                                        </button>
                                        {hasPermission('MANAGE_STUDENT_POINTS') && (
                                            <button 
                                                onClick={() => handleOpenPointsModal(student)}
                                                className="font-medium text-yellow-600 dark:text-yellow-500 hover:underline"
                                            >
                                                {t('students.table.managePoints')}
                                            </button>
                                        )}
                                        {hasPermission('MANAGE_STUDENTS') && student.paymentStatus === 'Unpaid' && student.status === 'Pending' && (
                                            <button 
                                                onClick={() => handleGenerateReceipt(student.id)} 
                                                className="font-medium text-green-600 dark:text-green-500 hover:underline"
                                            >
                                                {t('students.table.confirmPayment')}
                                            </button>
                                        )}
                                        {hasPermission('MANAGE_STUDENTS') && student.status === 'Active' && (
                                            <button
                                                onClick={() => handleToggleStatus(student, 'Inactive')}
                                                className="font-medium text-orange-600 dark:text-orange-500 hover:underline"
                                            >
                                                {t('students.table.inactivate')}
                                            </button>
                                        )}
                                        {hasPermission('MANAGE_STUDENTS') && (student.status === 'Inactive' || (student.status === 'Pending' && student.paymentStatus === 'Paid')) && (
                                            <button
                                                onClick={() => handleToggleStatus(student, 'Active')}
                                                className="font-medium text-green-600 dark:text-green-500 hover:underline"
                                            >
                                                {t('students.table.activate')}
                                            </button>
                                        )}
                                        {hasPermission('MANAGE_STUDENTS') && <button onClick={() => handleOpenEditModal(student)} className="font-medium text-primary hover:underline">{t('students.table.edit')}</button>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            
            {isFormModalOpen && (
                <StudentFormModal 
                    isOpen={isFormModalOpen}
                    onClose={handleCloseAllModals}
                    onSave={handleSave}
                    student={selectedStudent}
                    courses={courses}
                />
            )}
            {isPointsModalOpen && selectedStudent && (
                <ManagePointsModal
                    isOpen={isPointsModalOpen}
                    onClose={handleCloseAllModals}
                    student={selectedStudent}
                    onAddPoints={onAddPoints}
                />
            )}
            {isHistoryModalOpen && selectedStudent && (
                <PointHistoryModal
                    isOpen={isHistoryModalOpen}
                    onClose={handleCloseAllModals}
                    student={selectedStudent}
                    pointTransactions={pointTransactions}
                    redemptions={redemptions}
                    rewards={rewards}
                />
            )}
             {isRedemptionModalOpen && selectedStudent && (
                <RedemptionModal
                    isOpen={isRedemptionModalOpen}
                    onClose={handleCloseAllModals}
                    student={selectedStudent}
                    rewards={rewards}
                    onRedeem={onRedeemReward}
                />
            )}
            {receiptDetails && (
                <ReceiptModal
                    isOpen={!!receiptDetails}
                    onClose={() => setReceiptDetails(null)}
                    onConfirm={handleConfirmAndCloseReceipt}
                    details={receiptDetails}
                />
            )}
        </div>
    );
};

const StudentLevelsView: React.FC<Pick<StudentsProps, 'students' | 'studentLevels' | 'onSaveStudentLevel' | 'currentUser' | 'hasPermission'>> = ({ students, studentLevels, onSaveStudentLevel, currentUser, hasPermission }) => {
    const { t } = useTranslation();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    
    const getLatestLevel = (studentId: string): StudentLevel | null => {
        const levelsForStudent = studentLevels
            .filter(sl => sl.studentId === studentId)
            .sort((a, b) => new Date(b.assessmentDate).getTime() - new Date(a.assessmentDate).getTime());
        return levelsForStudent.length > 0 ? levelsForStudent[0] : null;
    }

    const handleOpenModal = (student: Student) => {
        setSelectedStudent(student);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setSelectedStudent(null);
        setIsModalOpen(false);
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
             <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th scope="col" className="px-6 py-3">{t('students.table.name')}</th>
                            <th scope="col" className="px-6 py-3">{t('students.levels.table.currentLevel')}</th>
                            <th scope="col" className="px-6 py-3">{t('students.levels.table.lastAssessed')}</th>
                            <th scope="col" className="px-6 py-3 text-right">{t('students.table.actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {students.map(student => {
                            const latestLevel = getLatestLevel(student.id);
                            return (
                                <tr key={student.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                     <th scope="row" className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                                        <div className="flex items-center">
                                            <img className="w-8 h-8 rounded-full mr-3 object-cover" src={student.avatarUrl} alt={student.name} />
                                            <p>{student.name}</p>
                                        </div>
                                    </th>
                                    <td className="px-6 py-4 font-medium">{latestLevel ? t(`levels.${latestLevel.level.toLowerCase()}`) : 'N/A'}</td>
                                    <td className="px-6 py-4">{latestLevel ? latestLevel.assessmentDate : 'N/A'}</td>
                                    <td className="px-6 py-4 text-right">
                                        {hasPermission('MANAGE_STUDENT_LEVELS') && (
                                            <button onClick={() => handleOpenModal(student)} className="font-medium text-primary hover:underline">
                                                {t('students.levels.table.manageLevels')}
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
            {isModalOpen && selectedStudent && (
                <ManageStudentLevelsModal 
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    student={selectedStudent}
                    studentLevels={studentLevels}
                    onSaveStudentLevel={onSaveStudentLevel}
                />
            )}
        </div>
    );
};

const ManageStudentLevelsModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    student: Student;
    studentLevels: StudentLevel[];
    onSaveStudentLevel: (levelData: Omit<StudentLevel, 'id'>) => Promise<void>;
}> = ({ isOpen, onClose, student, studentLevels, onSaveStudentLevel }) => {
    const { t } = useTranslation();
    const [level, setLevel] = useState<StudentLevel['level']>('Starter');
    const [assessmentDate, setAssessmentDate] = useState(new Date().toISOString().split('T')[0]);
    const [notes, setNotes] = useState('');

    const levelHistory = useMemo(() => {
        return studentLevels
            .filter(sl => sl.studentId === student.id)
            .sort((a, b) => new Date(b.assessmentDate).getTime() - new Date(a.assessmentDate).getTime());
    }, [studentLevels, student.id]);
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSaveStudentLevel({
            studentId: student.id,
            level,
            assessmentDate,
            notes
        });
        // Reset form
        setLevel('Starter');
        setAssessmentDate(new Date().toISOString().split('T')[0]);
        setNotes('');
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('students.levels.modal.title', { name: student.name })}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* History Section */}
                <div>
                    <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">{t('students.levels.modal.history')}</h4>
                    <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                         {levelHistory.length > 0 ? levelHistory.map(sl => (
                             <div key={sl.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                                 <div className="flex justify-between items-center">
                                     <p className="font-semibold text-primary">{t(`levels.${sl.level.toLowerCase()}`)}</p>
                                     <p className="text-xs text-gray-500 dark:text-gray-400">{sl.assessmentDate}</p>
                                 </div>
                                 {sl.notes && <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 italic">"{sl.notes}"</p>}
                             </div>
                         )) : <p className="text-gray-500 dark:text-gray-400">{t('students.levels.modal.noHistory')}</p>}
                    </div>
                </div>

                {/* Form Section */}
                 <div>
                     <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">{t('students.levels.modal.addAssessment')}</h4>
                     <form onSubmit={handleSubmit} className="space-y-4 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-md">
                        <div>
                             <label htmlFor="level" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('students.levels.modal.level')}</label>
                             <select id="level" value={level} onChange={e => setLevel(e.target.value as StudentLevel['level'])} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm">
                                <option value="Starter">{t('levels.starter')}</option>
                                <option value="Movers">{t('levels.movers')}</option>
                                <option value="Flyers">{t('levels.flyers')}</option>
                                <option value="IELTS">{t('levels.ielts')}</option>
                            </select>
                        </div>
                         <div>
                            <label htmlFor="assessmentDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('students.levels.modal.date')}</label>
                            <input type="date" id="assessmentDate" value={assessmentDate} onChange={e => setAssessmentDate(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm color-scheme-light dark:color-scheme-dark" />
                        </div>
                         <div>
                            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('students.levels.modal.notes')}</label>
                            <textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"></textarea>
                        </div>
                        <div className="text-right">
                             <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark">
                                {t('students.levels.modal.saveLevel')}
                            </button>
                        </div>
                     </form>
                </div>
            </div>
            <div className="flex justify-end pt-4 mt-4 border-t dark:border-gray-700">
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">{t('students.modal.cancel')}</button>
            </div>
        </Modal>
    );
};

// Sub-component for the Modal Form
const StudentFormModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (formData: Omit<Student, 'id' | 'enrolledDate' | 'rewardPoints'>) => Promise<void>;
    student: Student | null;
    courses: Course[];
}> = ({ isOpen, onClose, onSave, student, courses }) => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({
        name: student?.name || '',
        email: student?.email || '',
        phone: student?.phone || '',
        course: student?.course || (courses.length > 0 ? courses[0].name : ''),
        status: student?.status || 'Pending',
        paymentStatus: student?.paymentStatus || 'Unpaid',
        dob: student?.dob || '',
        avatarUrl: student?.avatarUrl || 'https://st3.depositphotos.com/6672868/13701/v/450/depositphotos_137014128-stock-illustration-user-profile-icon.jpg',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };
    
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, avatarUrl: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSave(formData as Omit<Student, 'id' | 'enrolledDate' | 'rewardPoints'>);
    };
    
    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title={student ? t('students.modal.editTitle') : t('students.modal.title')}
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('students.modal.profilePicture')}</label>
                    <div className="mt-2 flex items-center space-x-4">
                        <img
                            src={formData.avatarUrl}
                            alt="Avatar"
                            className="w-16 h-16 rounded-full object-cover"
                        />
                        <label htmlFor="avatar-upload" className="cursor-pointer rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 py-2 px-3 text-sm font-medium leading-4 text-gray-700 dark:text-gray-300 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                            <span>{t('students.modal.changePhoto')}</span>
                            <input id="avatar-upload" name="avatar-upload" type="file" accept="image/*" className="sr-only" onChange={handleImageChange} />
                        </label>
                    </div>
                </div>
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('students.modal.fullName')}</label>
                    <input type="text" id="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                </div>
                 <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('students.modal.emailAddress')}</label>
                    <input type="email" id="email" value={formData.email} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                </div>
                 <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('students.modal.phoneNumber')}</label>
                    <input type="tel" id="phone" value={formData.phone} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                </div>
                <div>
                    <label htmlFor="course" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('students.modal.course')}</label>
                    <select id="course" value={formData.course} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm">
                        {courses.map(c => <option key={c.id}>{c.name}</option>)}
                    </select>
                </div>
                <div className="flex justify-end pt-4 space-x-2">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">{t('students.modal.cancel')}</button>
                    <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark">
                        {student ? t('students.modal.saveChanges') : t('students.modal.addStudent')}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

// Sub-component for Managing Points
const ManagePointsModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    student: Student;
    onAddPoints: (studentId: string, points: number, reason: string) => Promise<void>;
}> = ({ isOpen, onClose, student, onAddPoints }) => {
    const { t } = useTranslation();
    const [points, setPoints] = useState(0);
    const [reason, setReason] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (points !== 0 && reason.trim()) {
            await onAddPoints(student.id, points, reason);
            onClose();
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('rewards.managePoints.title', { name: student.name })}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="text-center mb-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('rewards.managePoints.currentPoints')}</p>
                    <p className="text-4xl font-bold text-primary">{student.rewardPoints}</p>
                </div>
                <div>
                    <label htmlFor="points" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('rewards.managePoints.pointsToAdd')}</label>
                    <input 
                        type="number" 
                        id="points" 
                        value={points} 
                        onChange={(e) => setPoints(parseInt(e.target.value, 10) || 0)} 
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" 
                    />
                </div>
                <div>
                    <label htmlFor="reason" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('rewards.managePoints.reason')}</label>
                    <textarea 
                        id="reason" 
                        value={reason} 
                        onChange={(e) => setReason(e.target.value)} 
                        required 
                        rows={3}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    ></textarea>
                </div>
                <div className="flex justify-end pt-4 space-x-2">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">{t('students.modal.cancel')}</button>
                    <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark">
                        {t('rewards.managePoints.applyPoints')}
                    </button>
                </div>
            </form>
        </Modal>
    )
};

const PointHistoryModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    student: Student;
    pointTransactions: PointTransaction[];
    redemptions: Redemption[];
    rewards: Reward[];
}> = ({ isOpen, onClose, student, pointTransactions, redemptions, rewards }) => {
    const { t } = useTranslation();
    const studentTransactions = useMemo(() => {
        return pointTransactions.filter(pt => pt.studentId === student.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [pointTransactions, student.id]);

    const studentRedemptions = useMemo(() => {
        return redemptions.filter(r => r.studentId === student.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [redemptions, student.id]);

    const getRewardName = (rewardId: string) => rewards.find(r => r.id === rewardId)?.name || 'Unknown Reward';

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('rewards.history.title', { name: student.name })}>
            <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
                <div>
                    <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">{t('rewards.history.pointsHistory')}</h4>
                    {studentTransactions.length > 0 ? (
                        <ul className="divide-y dark:divide-gray-700">
                            {studentTransactions.map(pt => (
                                <li key={pt.id} className="py-3 flex justify-between items-center">
                                    <div>
                                        <p className="font-medium text-gray-800 dark:text-gray-200">{pt.reason}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{pt.date}</p>
                                    </div>
                                    <span className={`font-bold text-lg ${pt.points > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                        {pt.points > 0 ? `+${pt.points}` : pt.points}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    ) : <p className="text-gray-500 dark:text-gray-400">{t('rewards.history.noTransactions')}</p>}
                </div>
                 <div>
                    <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">{t('rewards.history.redemptionHistory')}</h4>
                    {studentRedemptions.length > 0 ? (
                         <ul className="divide-y dark:divide-gray-700">
                            {studentRedemptions.map(r => (
                                <li key={r.id} className="py-3 flex justify-between items-center">
                                    <div>
                                        <p className="font-medium text-gray-800 dark:text-gray-200">{getRewardName(r.rewardId)}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{r.date}</p>
                                    </div>
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full`}>{t(`status.${r.status.toLowerCase()}`)}</span>
                                </li>
                            ))}
                        </ul>
                    ) : <p className="text-gray-500 dark:text-gray-400">{t('rewards.history.noRedemptions')}</p>}
                </div>
            </div>
             <div className="flex justify-end pt-4 mt-4 border-t dark:border-gray-700">
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">{t('students.modal.cancel')}</button>
            </div>
        </Modal>
    )
};

const RedemptionModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    student: Student;
    rewards: Reward[];
    onRedeem: (studentId: string, reward: Reward, reason: string) => Promise<void>;
}> = ({ isOpen, onClose, student, rewards, onRedeem }) => {
    const { t } = useTranslation();

    const handleRedeemClick = async (reward: Reward) => {
        const reason = t('rewards.reasons.redeemed', { rewardName: reward.name });
        await onRedeem(student.id, reward, reason);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('rewards.redeem.title', { name: student.name })}>
            <div className="mb-4 text-center">
                 <p className="text-sm text-gray-500 dark:text-gray-400">{t('rewards.redeem.currentPoints')}</p>
                 <p className="text-4xl font-bold text-primary">{student.rewardPoints}</p>
            </div>
            <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-2">
                 <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">{t('rewards.redeem.availableGifts')}</h4>
                 {rewards.map(reward => {
                    const hasEnoughPoints = student.rewardPoints >= reward.points;
                    const inStock = reward.stock > 0;
                    const canRedeem = hasEnoughPoints && inStock;

                    let disabledReason = '';
                    if (!hasEnoughPoints) disabledReason = t('rewards.redeem.notEnoughPoints');
                    else if (!inStock) disabledReason = t('rewards.redeem.outOfStock');

                    return (
                        <div key={reward.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <div className="flex items-center">
                                <img src={reward.imageUrl} alt={reward.name} className="w-12 h-12 rounded-md mr-4 object-cover"/>
                                <div>
                                    <p className="font-semibold text-gray-800 dark:text-gray-200">{reward.name}</p>
                                    <p className="text-sm text-primary font-medium">{reward.points} {t('rewards.table.points')}</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => handleRedeemClick(reward)}
                                disabled={!canRedeem}
                                title={disabledReason}
                                className="bg-primary text-white font-medium py-2 px-4 rounded-lg text-sm hover:bg-primary-dark transition-colors disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
                            >
                                {t('rewards.redeem.redeem')}
                            </button>
                        </div>
                    )
                 })}
            </div>
        </Modal>
    );
};


// Sub-component for the Receipt Modal
const ReceiptModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void>;
    details: { student: Student, course: Course, transaction: Transaction };
}> = ({ isOpen, onClose, onConfirm, details }) => {
    const { t } = useTranslation();
    const { student, course, transaction } = details;

    const handlePrint = () => {
        window.print();
    };

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title={t('finance.receipt.title')}
        >
            <div>
                <div className="p-6 border-b dark:border-gray-700 printable-area">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-2xl font-bold text-primary">EngCenter</h2>
                            <p className="text-gray-500 dark:text-gray-400">123 English Lane, Language City</p>
                        </div>
                        <div className="text-right">
                            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 uppercase">{t('finance.receipt.title')}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">#{transaction.id}</p>
                        </div>
                    </div>
                    <div className="mt-8 grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">{t('finance.receipt.billedTo')}</p>
                            <p className="font-medium text-gray-800 dark:text-gray-200">{student.name}</p>
                            <p className="text-gray-600 dark:text-gray-300">{student.email}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">{t('finance.receipt.paymentDate')}</p>
                            <p className="font-medium text-gray-800 dark:text-gray-200">{transaction.date}</p>
                        </div>
                    </div>
                    <div className="mt-6">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-gray-700">
                                    <th className="p-3 text-sm font-semibold text-gray-600 dark:text-gray-300">{t('finance.receipt.description')}</th>
                                    <th className="p-3 text-sm font-semibold text-gray-600 dark:text-gray-300 text-right">{t('finance.receipt.amount')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-b dark:border-gray-700">
                                    <td className="p-3 text-gray-700 dark:text-gray-200">
                                        {t('finance.receipt.tuitionFor')} {course.name}
                                    </td>
                                    <td className="p-3 text-gray-700 dark:text-gray-200 text-right">${course.fee.toLocaleString()}</td>
                                </tr>
                            </tbody>
                            <tfoot>
                                <tr>
                                    <th className="p-3 text-right font-semibold text-gray-800 dark:text-gray-200">{t('finance.receipt.total')}</th>
                                    <th className="p-3 text-right font-bold text-lg text-gray-900 dark:text-white">${course.fee.toLocaleString()}</th>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                    <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
                        <p>{t('finance.receipt.thankYou')}</p>
                    </div>
                </div>
                <div className="flex justify-end pt-4 mt-4 border-t dark:border-gray-700 space-x-2 no-print">
                    <button type="button" onClick={handlePrint} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">{t('finance.receipt.print')}</button>
                    <button type="button" onClick={onConfirm} className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark">
                        {t('finance.receipt.confirmAndClose')}
                    </button>
                </div>
            </div>
        </Modal>
    );
};


export default Students;