import React, { useState, useMemo } from 'react';
import { Course, User, Permission } from '../types';
import { PlusIcon, SearchIcon } from '../components/icons';
import Modal from '../components/Modal';
import { useTranslation } from '../lib/i18n';

interface CoursesProps {
    courses: Course[];
    onSaveCourse: (courseData: Omit<Course, 'id'> | Course) => Promise<void>;
    currentUser: User;
    hasPermission: (permission: Permission) => boolean;
}

const Courses: React.FC<CoursesProps> = ({ courses, onSaveCourse, currentUser, hasPermission }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCourse, setEditingCourse] = useState<Course | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const { t } = useTranslation();
    
    const translatedLevel = (level: Course['level']) => t(`levels.${level.toLowerCase()}`);

    const handleOpenAddModal = () => {
        setEditingCourse(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (course: Course) => {
        setEditingCourse(course);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingCourse(null);
    };

    const handleSave = async (formData: Omit<Course, 'id' | 'description'>) => {
        const dataToSave = editingCourse 
            ? { ...editingCourse, ...formData }
            : { ...formData, description: '' };
        await onSaveCourse(dataToSave);
        handleCloseModal();
    };
    
    const filteredCourses = useMemo(() => {
        if (!searchTerm) return courses;
        return courses.filter(course =>
            course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            course.level.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [courses, searchTerm]);


    return (
        <div>
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">{t('courses.title')}</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">{t('courses.description')}</p>
                </div>
                {hasPermission('MANAGE_COURSES') && (
                    <button 
                        onClick={handleOpenAddModal}
                        className="bg-primary text-white font-medium py-2.5 px-5 rounded-lg flex items-center hover:bg-primary-dark transition-colors"
                    >
                        <PlusIcon className="w-5 h-5 mr-2" />
                        {t('courses.addCourse')}
                    </button>
                )}
            </div>

            <div className="mt-8 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                 <div className="flex items-center justify-between mb-4">
                     <div className="relative w-full max-w-sm">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                            <SearchIcon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                        </span>
                        <input
                            type="text"
                            placeholder={t('courses.searchPlaceholder')}
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
                                <th scope="col" className="px-6 py-3">{t('courses.table.courseName')}</th>
                                <th scope="col" className="px-6 py-3">{t('courses.table.level')}</th>
                                <th scope="col" className="px-6 py-3">{t('courses.table.duration')}</th>
                                <th scope="col" className="px-6 py-3">{t('courses.table.fee')}</th>
                                <th scope="col" className="px-6 py-3"><span className="sr-only">{t('courses.table.actions')}</span></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCourses.map(course => (
                                <tr key={course.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                    <th scope="row" className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">{course.name}</th>
                                    <td className="px-6 py-4">{translatedLevel(course.level)}</td>
                                    <td className="px-6 py-4">{course.duration}</td>
                                    <td className="px-6 py-4">${course.fee}</td>
                                    <td className="px-6 py-4 text-right">
                                        {hasPermission('MANAGE_COURSES') && <button onClick={() => handleOpenEditModal(course)} className="font-medium text-primary hover:underline">{t('courses.table.edit')}</button>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <CourseFormModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    onSave={handleSave}
                    course={editingCourse}
                />
            )}
        </div>
    );
};

const CourseFormModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (formData: Omit<Course, 'id' | 'description'>) => Promise<void>;
    course: Course | null;
}> = ({ isOpen, onClose, onSave, course }) => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({
        name: course?.name || '',
        level: course?.level || 'Starter',
        duration: course?.duration || '',
        fee: course?.fee || 0,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { id, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [id]: type === 'number' ? parseFloat(value) : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSave(formData);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={course ? t('courses.modal.editTitle') : t('courses.modal.title')}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('courses.modal.courseName')}</label>
                    <input type="text" id="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                </div>
                 <div>
                    <label htmlFor="level" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('courses.modal.level')}</label>
                    <select id="level" value={formData.level} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm">
                        <option value="Starter">{t('levels.starter')}</option>
                        <option value="Movers">{t('levels.movers')}</option>
                        <option value="Flyers">{t('levels.flyers')}</option>
                        <option value="IELTS">{t('levels.ielts')}</option>
                    </select>
                </div>
                 <div>
                    <label htmlFor="duration" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('courses.modal.duration')}</label>
                    <input type="text" id="duration" value={formData.duration} onChange={handleChange} placeholder={t('courses.modal.durationPlaceholder')} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                </div>
                 <div>
                    <label htmlFor="fee" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('courses.modal.fee')}</label>
                    <input type="number" id="fee" value={formData.fee} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                </div>
                <div className="flex justify-end pt-4 space-x-2">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">{t('courses.modal.cancel')}</button>
                    <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark">
                        {course ? t('courses.modal.saveChanges') : t('courses.modal.addCourse')}
                    </button>
                </div>
            </form>
        </Modal>
    );
};


export default Courses;