import React, { useState, useMemo, useEffect } from 'react';
import { Class, Student, AttendanceRecord, AttendanceStatus, Grade, Room, User, Teacher, Permission } from '../types';
import { PlusIcon, SearchIcon } from '../components/icons';
import Modal from '../components/Modal';
import { useTranslation } from '../lib/i18n';

interface ClassesProps {
    classes: Class[];
    onSaveClass: (classData: Omit<Class, 'id'> | Class) => Promise<void>;
    students: Student[];
    attendanceRecords: AttendanceRecord[];
    onSaveAttendance: (classId: string, date: string, attendance: Record<string, AttendanceStatus>) => Promise<void>;
    grades: Grade[];
    onSaveGrades: (classId: string, gradesToSave: Omit<Grade, 'id' | 'date' | 'maxScore'>[]) => Promise<Grade[]>;
    onAddPoints: (studentId: string, points: number, reason: string) => Promise<void>;
    rooms: Room[];
    onSaveRoom: (roomData: Omit<Room, 'id'> | Room) => Promise<void>;
    currentUser: User;
    teachers: Teacher[];
    hasPermission: (permission: Permission) => boolean;
}

type ClassDetailViewMode = 'attendance' | 'report' | 'grading';
type ClassesViewMode = 'list' | 'details';
type ClassesPageTab = 'classes' | 'rooms';

const Classes: React.FC<ClassesProps> = (props) => {
    const [viewMode, setViewMode] = useState<ClassesViewMode>('list');
    const [activeTab, setActiveTab] = useState<ClassesPageTab>('classes');
    const [selectedClass, setSelectedClass] = useState<Class | null>(null);
    const { t } = useTranslation();

    const handleSelectClass = (cls: Class) => {
        setSelectedClass(cls);
        setViewMode('details');
    };

    const handleBackToList = () => {
        setSelectedClass(null);
        setViewMode('list');
    }

    const activeTabClasses = "border-primary text-primary dark:border-primary dark:text-primary";
    const inactiveTabClasses = "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600";
    
    return (
        <div>
            {viewMode === 'list' && (
                <>
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">{t('classes.title')}</h1>
                            <p className="text-gray-500 dark:text-gray-400 mt-1">{t('classes.description')}</p>
                        </div>
                    </div>
                     <div className="mt-6 border-b border-gray-200 dark:border-gray-700">
                        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                            <button
                                onClick={() => setActiveTab('classes')}
                                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'classes' ? activeTabClasses : inactiveTabClasses}`}
                            >
                                {t('classes.tabs.classes')}
                            </button>
                            {props.hasPermission('MANAGE_ROOMS') && (
                                <button
                                    onClick={() => setActiveTab('rooms')}
                                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'rooms' ? activeTabClasses : inactiveTabClasses}`}
                                >
                                    {t('classes.tabs.rooms')}
                                </button>
                            )}
                        </nav>
                    </div>
                </>
            )}

            {viewMode === 'details' && selectedClass && (
                 <ClassDetailsView 
                    classData={selectedClass} 
                    onBack={handleBackToList} 
                    {...props} 
                />
            )}
            {viewMode === 'list' && activeTab === 'classes' && (
                 <ClassListView onSelectClass={handleSelectClass} {...props} />
            )}
             {viewMode === 'list' && activeTab === 'rooms' && (
                 <RoomsListView rooms={props.rooms} onSaveRoom={props.onSaveRoom} currentUser={props.currentUser} hasPermission={props.hasPermission}/>
            )}
        </div>
    );
};

const RoomsListView: React.FC<Pick<ClassesProps, 'rooms' | 'onSaveRoom' | 'currentUser' | 'hasPermission'>> = ({ rooms, onSaveRoom, currentUser, hasPermission }) => {
    const { t } = useTranslation();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRoom, setEditingRoom] = useState<Room | null>(null);
    
    const handleOpenAddModal = () => {
        setEditingRoom(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (room: Room) => {
        setEditingRoom(room);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingRoom(null);
    };
    
    const handleSave = async (formData: Omit<Room, 'id'>) => {
        const dataToSave = editingRoom ? { ...editingRoom, ...formData } : formData;
        await onSaveRoom(dataToSave);
        handleCloseModal();
    };

    return (
        <div className="mt-8 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
             <div className="flex justify-between items-center mb-4">
                <div>
                     <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">{t('classes.rooms.title')}</h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{t('classes.rooms.description')}</p>
                </div>
                {hasPermission('MANAGE_ROOMS') && (
                    <button 
                        onClick={handleOpenAddModal}
                        className="bg-primary text-white font-medium py-2.5 px-5 rounded-lg flex items-center hover:bg-primary-dark transition-colors"
                    >
                        <PlusIcon className="w-5 h-5 mr-2" />
                        {t('classes.rooms.addRoom')}
                    </button>
                )}
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th scope="col" className="px-6 py-3">{t('classes.rooms.table.name')}</th>
                            <th scope="col" className="px-6 py-3">{t('classes.rooms.table.capacity')}</th>
                            <th scope="col" className="px-6 py-3 text-right">{t('classes.table.actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rooms.map(room => (
                            <tr key={room.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{room.name}</td>
                                <td className="px-6 py-4">{room.capacity}</td>
                                <td className="px-6 py-4 text-right">
                                    {hasPermission('MANAGE_ROOMS') && (
                                        <button onClick={() => handleOpenEditModal(room)} className="font-medium text-primary hover:underline">{t('students.table.edit')}</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {isModalOpen && (
                <RoomFormModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    onSave={handleSave}
                    room={editingRoom}
                />
            )}
        </div>
    );
}

// Main List View Component
const ClassListView: React.FC<Omit<ClassesProps, 'students' | 'attendanceRecords' | 'onSaveAttendance' | 'grades' | 'onSaveGrades' | 'onAddPoints' | 'onSaveRoom'> & { onSelectClass: (cls: Class) => void; }> = ({ classes, onSaveClass, onSelectClass, rooms, currentUser, teachers, hasPermission }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingClass, setEditingClass] = useState<Class | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const { t } = useTranslation();

    const handleOpenAddModal = () => {
        setEditingClass(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (cls: Class) => {
        setEditingClass(cls);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingClass(null);
    };

    const handleSave = async (formData: Omit<Class, 'id'>) => {
        const dataToSave = editingClass ? { ...editingClass, ...formData } : formData;
        await onSaveClass(dataToSave);
        handleCloseModal();
    };
    
    const getRoomName = (roomId: string) => rooms.find(r => r.id === roomId)?.name || 'N/A';

    const filteredClasses = useMemo(() => {
        let displayClasses = classes;

        if (currentUser.role === 'Teacher') {
            const teacherProfile = teachers.find(t => t.id === currentUser.profileId);
            if(teacherProfile) {
                displayClasses = classes.filter(cls => cls.teacher === teacherProfile.name);
            } else {
                displayClasses = []; // Teacher user not linked to a teacher profile
            }
        }

        if (!searchTerm) return displayClasses;
        return displayClasses.filter(cls =>
            cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            cls.teacher.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [classes, searchTerm, currentUser, teachers]);

    return (
        <div className="mt-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                <div className="flex items-center justify-between mb-4">
                     <div className="relative w-full max-w-sm">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                            <SearchIcon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                        </span>
                        <input
                            type="text"
                            placeholder={t('classes.searchPlaceholder')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                        />
                    </div>
                    {hasPermission('MANAGE_CLASSES') && (
                        <button 
                            onClick={handleOpenAddModal}
                            className="bg-primary text-white font-medium py-2.5 px-5 rounded-lg flex items-center hover:bg-primary-dark transition-colors"
                        >
                            <PlusIcon className="w-5 h-5 mr-2" />
                            {t('classes.addClass')}
                        </button>
                    )}
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                        <thead className="text-xs text-gray-700 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th scope="col" className="px-6 py-3">{t('classes.table.className')}</th>
                                <th scope="col" className="px-6 py-3">{t('classes.table.course')}</th>
                                <th scope="col" className="px-6 py-3">{t('classes.table.teacher')}</th>
                                <th scope="col" className="px-6 py-3">{t('classes.table.room')}</th>
                                <th scope="col" className="px-6 py-3">{t('classes.table.schedule')}</th>
                                <th scope="col" className="px-6 py-3">{t('classes.table.enrollment')}</th>
                                <th scope="col" className="px-6 py-3 text-right">{t('classes.table.actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredClasses.map(cls => (
                                <tr key={cls.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                    <th scope="row" className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">{cls.name}</th>
                                    <td className="px-6 py-4">{cls.course}</td>
                                    <td className="px-6 py-4">{cls.teacher}</td>
                                    <td className="px-6 py-4">{getRoomName(cls.roomId)}</td>
                                    <td className="px-6 py-4">{cls.schedule}</td>
                                    <td className="px-6 py-4">{cls.studentIds.length} / {cls.capacity}</td>
                                    <td className="px-6 py-4 text-right space-x-2">
                                        {hasPermission('MANAGE_CLASSES') && <button onClick={() => handleOpenEditModal(cls)} className="font-medium text-blue-600 dark:text-blue-500 hover:underline">{t('students.table.edit')}</button>}
                                        <button onClick={() => onSelectClass(cls)} className="font-medium text-primary hover:underline">{t('classes.table.view')}</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            
            {isModalOpen && (
                <ClassFormModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    onSave={handleSave}
                    classData={editingClass}
                    rooms={rooms}
                />
            )}
        </div>
    );
};

// Class Details Container View
const ClassDetailsView: React.FC<ClassesProps & { classData: Class, onBack: () => void }> = ({ classData, onBack, students, attendanceRecords, onSaveAttendance, grades, onSaveGrades, onAddPoints, rooms, hasPermission }) => {
    const { t } = useTranslation();
    const [viewMode, setViewMode] = useState<ClassDetailViewMode>('grading');

    const enrolledStudents = useMemo(() => {
        return students.filter(s => classData.studentIds.includes(s.id));
    }, [students, classData]);
    
    const roomName = useMemo(() => rooms.find(r => r.id === classData.roomId)?.name || 'N/A', [rooms, classData.roomId]);

    const activeTabClasses = "border-primary text-primary dark:border-primary dark:text-primary";
    const inactiveTabClasses = "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600";
    
    return (
        <div>
            <div>
                <button onClick={onBack} className="text-primary mb-4 hover:underline">&larr; {t('classes.details.backToList')}</button>
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">{classData.name}</h1>
                <div className="flex items-center space-x-4 text-gray-500 dark:text-gray-400 mt-1">
                    <span>{t('classes.details.teacher')}: {classData.teacher}</span>
                    <span className="text-gray-300 dark:text-gray-600">|</span>
                    <span>{t('classes.table.room')}: {roomName}</span>
                </div>
                <p className="text-gray-500 dark:text-gray-400 mt-2">{t('classes.details.title')}</p>
            </div>

            <div className="mt-6 border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    {hasPermission('MANAGE_GRADES') && (
                        <button
                            onClick={() => setViewMode('grading')}
                            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${viewMode === 'grading' ? activeTabClasses : inactiveTabClasses}`}
                        >
                            {t('classes.details.grading')}
                        </button>
                    )}
                    {hasPermission('TAKE_ATTENDANCE') && (
                        <button
                            onClick={() => setViewMode('attendance')}
                            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${viewMode === 'attendance' ? activeTabClasses : inactiveTabClasses}`}
                        >
                            {t('classes.details.takeAttendance')}
                        </button>
                    )}
                    <button
                        onClick={() => setViewMode('report')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${viewMode === 'report' ? activeTabClasses : inactiveTabClasses}`}
                    >
                        {t('classes.details.attendanceReport')}
                    </button>
                </nav>
            </div>
            
            {viewMode === 'grading' && hasPermission('MANAGE_GRADES') && (
                <GradingView
                    classData={classData}
                    enrolledStudents={enrolledStudents}
                    grades={grades}
                    onSaveGrades={onSaveGrades}
                    onAddPoints={onAddPoints}
                />
            )}
            {viewMode === 'attendance' && hasPermission('TAKE_ATTENDANCE') && (
                <TakeAttendanceView
                    classData={classData}
                    enrolledStudents={enrolledStudents}
                    attendanceRecords={attendanceRecords}
                    onSaveAttendance={onSaveAttendance}
                />
            )}
            {viewMode === 'report' && (
                <AttendanceReportView
                    classData={classData}
                    enrolledStudents={enrolledStudents}
                    attendanceRecords={attendanceRecords}
                />
            )}
        </div>
    );
};

const GradingView: React.FC<{
    classData: Class;
    enrolledStudents: Student[];
    grades: Grade[];
    onSaveGrades: (classId: string, gradesToSave: Omit<Grade, 'id' | 'date' | 'maxScore'>[]) => Promise<Grade[]>;
    onAddPoints: (studentId: string, points: number, reason: string) => Promise<void>;
}> = ({ classData, enrolledStudents, grades, onSaveGrades, onAddPoints }) => {
    const { t } = useTranslation();
    const [assessments, setAssessments] = useState<string[]>([]);
    const [newAssessmentName, setNewAssessmentName] = useState('');
    const [localGrades, setLocalGrades] = useState<Record<string, Record<string, number | string>>>({}); // { studentId: { assessmentName: score } }
    const [showConfirmation, setShowConfirmation] = useState('');

    useEffect(() => {
        const classGrades = grades.filter(g => g.classId === classData.id);
        const assessmentSet = new Set(classGrades.map(g => g.assessmentName));
        setAssessments(Array.from(assessmentSet).length > 0 ? Array.from(assessmentSet) : ['Mid-term', 'Final']);

        const gradesMap: Record<string, Record<string, number>> = {};
        enrolledStudents.forEach(student => {
            gradesMap[student.id] = {};
            classGrades.filter(g => g.studentId === student.id).forEach(grade => {
                gradesMap[student.id][grade.assessmentName] = grade.score;
            });
        });
        setLocalGrades(gradesMap);
    }, [grades, classData.id, enrolledStudents]);

    const handleAddAssessment = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && newAssessmentName.trim() && !assessments.includes(newAssessmentName.trim())) {
            setAssessments(prev => [...prev, newAssessmentName.trim()]);
            setNewAssessmentName('');
        }
    };

    const handleGradeChange = (studentId: string, assessmentName: string, score: string) => {
        const newScore = score === '' ? '' : Math.max(0, Math.min(100, Number(score)));
        setLocalGrades(prev => ({
            ...prev,
            [studentId]: {
                ...prev[studentId],
                [assessmentName]: newScore,
            },
        }));
    };

    const handleSave = async (notify: boolean) => {
        const gradesToSave: Omit<Grade, 'id' | 'date' | 'maxScore'>[] = [];
        
        Object.entries(localGrades).forEach(([studentId, studentAssessments]) => {
            Object.entries(studentAssessments).forEach(([assessmentName, score]) => {
                if (typeof score === 'number') {
                     gradesToSave.push({ classId: classData.id, studentId, assessmentName, score });
                }
            });
        });

        const savedGrades = await onSaveGrades(classData.id, gradesToSave);

        // Award points for high scores on newly saved/updated grades
        for (const savedGrade of savedGrades) {
            const existingGradeBeforeSave = grades.find(g => g.id === savedGrade.id);
            if (savedGrade.score >= 95 && (!existingGradeBeforeSave || existingGradeBeforeSave.score < 95)) {
                await onAddPoints(savedGrade.studentId, 10, t('rewards.reasons.highScore', { assessment: savedGrade.assessmentName }));
            }
        }
        
        const message = notify ? t('classes.details.gradesPublished') : t('classes.details.gradesSaved');
        setShowConfirmation(message);
        setTimeout(() => setShowConfirmation(''), 3000);
    };

    const calculateAverage = (studentId: string) => {
        const studentScores = localGrades[studentId] ? Object.values(localGrades[studentId]) : [];
        const validScores = studentScores.map(Number).filter(s => !isNaN(s) && s >= 0);
        if (validScores.length === 0) return 'N/A';
        const avg = validScores.reduce((acc, score) => acc + score, 0) / validScores.length;
        return avg.toFixed(1);
    }
    
    return (
        <div className="mt-8 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-4">{t('classes.details.enterGrades')}</h2>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-4 py-3 sticky left-0 bg-gray-50 dark:bg-gray-700 z-10 min-w-[200px]">{t('students.table.name')}</th>
                            {assessments.map(name => (
                                <th key={name} className="px-4 py-3 text-center min-w-[120px]">{name}</th>
                            ))}
                            <th className="px-4 py-3 min-w-[150px]">
                                <input 
                                    type="text" 
                                    placeholder={t('classes.details.newAssessment')}
                                    value={newAssessmentName}
                                    onChange={(e) => setNewAssessmentName(e.target.value)}
                                    onKeyDown={handleAddAssessment}
                                    className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                            </th>
                            <th className="px-4 py-3 text-center">{t('classes.details.average')}</th>
                        </tr>
                    </thead>
                    <tbody>
                         {enrolledStudents.map(student => (
                            <tr key={student.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                <td className="px-4 py-2 font-medium text-gray-900 dark:text-white sticky left-0 bg-white dark:bg-gray-800 z-10">{student.name}</td>
                                {assessments.map(name => (
                                    <td key={name} className="px-4 py-2 text-center">
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={localGrades[student.id]?.[name] ?? ''}
                                            onChange={(e) => handleGradeChange(student.id, name, e.target.value)}
                                            className="w-20 text-center px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-primary"
                                        />
                                    </td>
                                ))}
                                <td></td>
                                <td className="px-4 py-2 text-center font-bold text-gray-800 dark:text-gray-200">{calculateAverage(student.id)}</td>
                            </tr>
                         ))}
                    </tbody>
                </table>
            </div>
             <div className="flex justify-end items-center mt-6 space-x-4">
                {showConfirmation && (
                    <span className="text-green-600 dark:text-green-400 text-sm font-medium transition-opacity duration-300 opacity-100">
                        {showConfirmation}
                    </span>
                )}
                 <button 
                    onClick={() => handleSave(false)}
                    className="bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200 font-medium py-2.5 px-5 rounded-lg flex items-center hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                >
                    {t('classes.details.saveGrades')}
                </button>
                <button 
                    onClick={() => handleSave(true)}
                    className="bg-primary text-white font-medium py-2.5 px-5 rounded-lg flex items-center hover:bg-primary-dark transition-colors"
                >
                    {t('classes.details.publishAndNotify')}
                </button>
             </div>
        </div>
    )
}


const TakeAttendanceView: React.FC<{
    classData: Class;
    enrolledStudents: Student[];
    attendanceRecords: AttendanceRecord[];
    onSaveAttendance: (classId: string, date: string, attendance: Record<string, AttendanceStatus>) => Promise<void>;
}> = ({ classData, enrolledStudents, attendanceRecords, onSaveAttendance }) => {
    const { t } = useTranslation();
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [dailyAttendance, setDailyAttendance] = useState<Record<string, AttendanceStatus>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);

    useEffect(() => {
        const recordsForDate = attendanceRecords.filter(r => r.classId === classData.id && r.date === selectedDate);
        const existingAttendance = Object.fromEntries(recordsForDate.map(r => [r.studentId, r.status]));
        
        const newDailyAttendance: Record<string, AttendanceStatus> = {};
        for (const student of enrolledStudents) {
            newDailyAttendance[student.id] = existingAttendance[student.id] || 'Present';
        }
        
        setDailyAttendance(newDailyAttendance);
    }, [selectedDate, classData.id, attendanceRecords, enrolledStudents]);
    
    const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
        setDailyAttendance(prev => ({ ...prev, [studentId]: status }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        await onSaveAttendance(classData.id, selectedDate, dailyAttendance);
        
        setShowConfirmation(true);
        setIsSaving(false);
        setTimeout(() => {
            setShowConfirmation(false);
        }, 3000);
    };
    
    const attendanceStatuses: AttendanceStatus[] = ['Present', 'Absent', 'Late'];
    
    return (
        <div className="mt-8 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">{t('classes.details.enrolledStudents')} ({enrolledStudents.length})</h2>
                <div className="flex items-center space-x-4">
                    <label htmlFor="attendance-date" className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('classes.details.selectDate')}:</label>
                    <input 
                        type="date" 
                        id="attendance-date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm color-scheme-light dark:color-scheme-dark"
                    />
                </div>
            </div>
             <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th scope="col" className="px-6 py-3">{t('students.table.name')}</th>
                            <th scope="col" className="px-6 py-3">{t('classes.details.attendanceStatus')}</th>
                        </tr>
                    </thead>
                    <tbody>
                         {enrolledStudents.map(student => (
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
                                <td className="px-6 py-4">
                                    <div className="flex items-center space-x-2">
                                        {attendanceStatuses.map(status => (
                                            <button 
                                                key={status}
                                                onClick={() => handleStatusChange(student.id, status)}
                                                className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                                                    dailyAttendance[student.id] === status 
                                                    ? 'bg-primary text-white' 
                                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                                                }`}
                                            >
                                                {t(`status.${status.toLowerCase()}`)}
                                            </button>
                                        ))}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
             </div>
             <div className="flex justify-end items-center mt-6 space-x-4">
                {showConfirmation && (
                    <span className="text-green-600 dark:text-green-400 text-sm font-medium transition-opacity duration-300 opacity-100">
                        {t('classes.details.attendanceSaved')}
                    </span>
                )}
                <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-primary text-white font-medium py-2.5 px-5 rounded-lg flex items-center hover:bg-primary-dark transition-colors disabled:opacity-50"
                >
                    {isSaving ? 'Saving...' : t('classes.details.saveAttendance')}
                </button>
             </div>
        </div>
    );
};

const AttendanceReportView: React.FC<{ 
    classData: Class; 
    enrolledStudents: Student[];
    attendanceRecords: AttendanceRecord[];
}> = ({ classData, enrolledStudents, attendanceRecords }) => {
    const { t, language } = useTranslation();
    const [displayDate, setDisplayDate] = useState(new Date());

    const recordsForMonth = useMemo(() => {
        return attendanceRecords.filter(r => {
            const recordDate = new Date(r.date);
            return r.classId === classData.id &&
                   recordDate.getFullYear() === displayDate.getFullYear() &&
                   recordDate.getMonth() === displayDate.getMonth();
        });
    }, [attendanceRecords, classData.id, displayDate]);

    const attendanceMap = useMemo(() => {
        const map = new Map<string, Map<number, AttendanceStatus>>();
        for (const student of enrolledStudents) {
            map.set(student.id, new Map());
        }
        for (const record of recordsForMonth) {
            const day = new Date(record.date).getDate();
            const studentMap = map.get(record.studentId);
            if (studentMap) {
                studentMap.set(day, record.status);
            }
        }
        return map;
    }, [recordsForMonth, enrolledStudents]);

    const daysInMonth = new Date(displayDate.getFullYear(), displayDate.getMonth() + 1, 0).getDate();
    const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    const getStatusIndicator = (status: AttendanceStatus | undefined) => {
        let bgColor = 'bg-gray-200 dark:bg-gray-600';
        let title = t('classes.details.noRecord');
        if (status === 'Present') {
            bgColor = 'bg-green-500';
            title = t('status.present');
        } else if (status === 'Absent') {
            bgColor = 'bg-red-500';
            title = t('status.absent');
        } else if (status === 'Late') {
            bgColor = 'bg-yellow-500';
            title = t('status.late');
        }
        return <div className={`w-5 h-5 rounded-full mx-auto ${bgColor}`} title={title}></div>;
    };

    const calculateSummary = (studentId: string) => {
        const studentRecords = recordsForMonth.filter(r => r.studentId === studentId);
        const present = studentRecords.filter(r => r.status === 'Present').length;
        const absent = studentRecords.filter(r => r.status === 'Absent').length;
        const late = studentRecords.filter(r => r.status === 'Late').length;

        return (
            <div className="text-xs space-x-2 text-gray-600 dark:text-gray-300 font-medium">
                <span className="inline-block" title={t('status.present')}><span className="text-green-500">{t('classes.details.presentShort')}:</span> {present}</span>
                <span className="inline-block" title={t('status.absent')}><span className="text-red-500">{t('classes.details.absentShort')}:</span> {absent}</span>
                <span className="inline-block" title={t('status.late')}><span className="text-yellow-500">{t('classes.details.lateShort')}:</span> {late}</span>
            </div>
        );
    };

    const changeMonth = (delta: number) => {
        setDisplayDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(newDate.getMonth() + delta);
            return newDate;
        });
    };

    return (
        <div className="mt-8 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">{t('classes.details.attendanceReport')}</h2>
                <div className="flex items-center space-x-2">
                    <button onClick={() => changeMonth(-1)} className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">&lt;</button>
                    <span className="font-medium text-gray-800 dark:text-gray-200 w-32 text-center">
                        {displayDate.toLocaleString(language, { month: 'long', year: 'numeric' })}
                    </span>
                    <button onClick={() => changeMonth(1)} className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">&gt;</button>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400 border-collapse">
                    <thead className="text-xs text-gray-700 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-4 py-3 sticky left-0 bg-gray-50 dark:bg-gray-700 z-10 w-48">{t('students.table.name')}</th>
                            {daysArray.map(day => (
                                <th key={day} className="px-2 py-3 text-center w-8">{day}</th>
                            ))}
                             <th className="px-4 py-3 text-center min-w-[150px]">{t('classes.details.summary')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {enrolledStudents.map(student => (
                            <tr key={student.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                <td className="px-4 py-2 font-medium text-gray-900 dark:text-white sticky left-0 bg-white dark:bg-gray-800 z-10 w-48">{student.name}</td>
                                {daysArray.map(day => (
                                    <td key={day} className="px-2 py-2 text-center w-8">
                                        {getStatusIndicator(attendanceMap.get(student.id)?.get(day))}
                                    </td>
                                ))}
                                <td className="px-4 py-2 text-center min-w-[150px]">
                                    {calculateSummary(student.id)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};


const ClassFormModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (formData: Omit<Class, 'id'>) => Promise<void>;
    classData: Class | null;
    rooms: Room[];
}> = ({ isOpen, onClose, onSave, classData, rooms }) => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({
        name: classData?.name || '',
        course: classData?.course || 'IELTS Preparation',
        teacher: classData?.teacher || 'Alice Wonder',
        schedule: classData?.schedule || '',
        studentIds: classData?.studentIds || [],
        capacity: classData?.capacity || 10,
        roomId: classData?.roomId || (rooms.length > 0 ? rooms[0].id : ''),
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { id, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [id]: type === 'number' ? parseInt(value, 10) : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSave(formData);
    };
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={classData ? t('classes.modal.editTitle') : t('classes.modal.title')}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('classes.modal.className')}</label>
                    <input type="text" id="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                </div>
                <div>
                    <label htmlFor="course" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('classes.modal.course')}</label>
                    <select id="course" value={formData.course} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm">
                        <option>IELTS Preparation</option>
                        <option>Cambridge Flyers</option>
                        <option>Cambridge Movers</option>
                        <option>English for Beginners</option>
                    </select>
                </div>
                 <div>
                    <label htmlFor="teacher" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('classes.modal.teacher')}</label>
                    <select id="teacher" value={formData.teacher} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm">
                        <option>Alice Wonder</option>
                        <option>Bob Builder</option>
                        <option>Charlie Chocolate</option>
                    </select>
                </div>
                 <div>
                    <label htmlFor="roomId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('classes.modal.room')}</label>
                    <select id="roomId" value={formData.roomId} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm">
                        {rooms.map(room => (
                            <option key={room.id} value={room.id}>{room.name}</option>
                        ))}
                    </select>
                </div>
                 <div>
                    <label htmlFor="schedule" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('classes.modal.schedule')}</label>
                    <input type="text" id="schedule" value={formData.schedule} onChange={handleChange} placeholder={t('classes.modal.schedulePlaceholder')} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                </div>
                <div>
                    <label htmlFor="capacity" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('classes.table.enrollment')}</label>
                    <input type="number" id="capacity" value={formData.capacity} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                </div>
                <div className="flex justify-end pt-4 space-x-2">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">{t('classes.modal.cancel')}</button>
                    <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark">
                         {classData ? t('classes.modal.saveChanges') : t('classes.modal.addClass')}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

const RoomFormModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (formData: Omit<Room, 'id'>) => Promise<void>;
    room: Room | null;
}> = ({ isOpen, onClose, onSave, room }) => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({
        name: room?.name || '',
        capacity: room?.capacity || 10,
    });
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [id]: type === 'number' ? parseInt(value, 10) : value
        }));
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSave(formData);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={room ? t('classes.rooms.modal.editTitle') : t('classes.rooms.modal.title')}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('classes.rooms.modal.roomName')}</label>
                    <input type="text" id="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                </div>
                <div>
                    <label htmlFor="capacity" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('classes.rooms.modal.capacity')}</label>
                    <input type="number" id="capacity" value={formData.capacity} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                </div>
                <div className="flex justify-end pt-4 space-x-2">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">{t('classes.modal.cancel')}</button>
                    <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark">
                         {room ? t('classes.modal.saveChanges') : t('classes.rooms.addRoom')}
                    </button>
                </div>
            </form>
        </Modal>
    )
}

export default Classes;