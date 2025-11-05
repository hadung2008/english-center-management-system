import React, { useState, useMemo } from 'react';
import { Teacher, User, Permission } from '../types';
import { PlusIcon, SearchIcon } from '../components/icons';
import Modal from '../components/Modal';
import { useTranslation } from '../lib/i18n';

interface TeachersProps {
    teachers: Teacher[];
    onSaveTeacher: (teacherData: Omit<Teacher, 'id'> | Teacher) => Promise<void>;
    currentUser: User;
    hasPermission: (permission: Permission) => boolean;
}

const Teachers: React.FC<TeachersProps> = ({ teachers, onSaveTeacher, currentUser, hasPermission }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const { t } = useTranslation();
    
    const translatedContractType = (type: Teacher['contractType']) => {
        if (type === 'Full-time') return t('status.fullTime');
        if (type === 'Part-time') return t('status.partTime');
        return type;
    }
    
    const handleOpenAddModal = () => {
        setEditingTeacher(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (teacher: Teacher) => {
        setEditingTeacher(teacher);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingTeacher(null);
    };

    const handleSave = async (formData: Omit<Teacher, 'id' | 'startDate'>) => {
        // FIX: Add startDate for new teachers to satisfy the type.
        // The API will overwrite this value upon creation.
        const dataToSave = editingTeacher ? { ...editingTeacher, ...formData } : { ...formData, startDate: '' };
        await onSaveTeacher(dataToSave);
        handleCloseModal();
    };

    const filteredTeachers = useMemo(() => {
        if (!searchTerm) return teachers;
        return teachers.filter(teacher =>
            teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            teacher.specialization.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [teachers, searchTerm]);


    return (
        <div>
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">{t('teachers.title')}</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">{t('teachers.description')}</p>
                </div>
                {hasPermission('MANAGE_TEACHERS') && (
                    <button 
                        onClick={handleOpenAddModal}
                        className="bg-primary text-white font-medium py-2.5 px-5 rounded-lg flex items-center hover:bg-primary-dark transition-colors"
                    >
                        <PlusIcon className="w-5 h-5 mr-2" />
                        {t('teachers.addTeacher')}
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
                            placeholder={t('teachers.searchPlaceholder')}
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
                                <th scope="col" className="px-6 py-3">{t('teachers.table.name')}</th>
                                <th scope="col" className="px-6 py-3">{t('teachers.table.specialization')}</th>
                                <th scope="col" className="px-6 py-3">{t('teachers.table.contract')}</th>
                                <th scope="col" className="px-6 py-3">{t('teachers.table.startDate')}</th>
                                <th scope="col" className="px-6 py-3">{t('teachers.table.contact')}</th>
                                <th scope="col" className="px-6 py-3"><span className="sr-only">{t('teachers.table.actions')}</span></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTeachers.map(teacher => (
                                <tr key={teacher.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                    <th scope="row" className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                                        <div className="flex items-center">
                                            <img className="w-8 h-8 rounded-full mr-3 object-cover" src={teacher.avatarUrl} alt={teacher.name} />
                                            <div>
                                                <p>{teacher.name}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">{teacher.email}</p>
                                            </div>
                                        </div>
                                    </th>
                                    <td className="px-6 py-4">{teacher.specialization}</td>
                                    <td className="px-6 py-4">{translatedContractType(teacher.contractType)}</td>
                                    <td className="px-6 py-4">{teacher.startDate}</td>
                                    <td className="px-6 py-4">{teacher.phone}</td>
                                    <td className="px-6 py-4 text-right">
                                        {hasPermission('MANAGE_TEACHERS') && <button onClick={() => handleOpenEditModal(teacher)} className="font-medium text-primary hover:underline">{t('teachers.table.edit')}</button>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            
            {isModalOpen && (
                <TeacherFormModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    onSave={handleSave}
                    teacher={editingTeacher}
                />
            )}
        </div>
    );
}

// Sub-component for the Modal Form
const TeacherFormModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (formData: Omit<Teacher, 'id' | 'startDate'>) => Promise<void>;
    teacher: Teacher | null;
}> = ({ isOpen, onClose, onSave, teacher }) => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({
        name: teacher?.name || '',
        email: teacher?.email || '',
        phone: teacher?.phone || '',
        specialization: teacher?.specialization || '',
        contractType: teacher?.contractType || 'Full-time',
        avatarUrl: teacher?.avatarUrl || 'https://st3.depositphotos.com/6672868/13701/v/450/depositphotos_137014128-stock-illustration-user-profile-icon.jpg',
        payRate: teacher?.payRate || 0,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { id, value, type } = e.target;
        setFormData(prev => ({ ...prev, [id]: type === 'number' ? Number(value) : value }));
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
        await onSave(formData as Omit<Teacher, 'id' | 'startDate'>);
    };

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title={teacher ? t('teachers.modal.editTitle') : t('teachers.modal.title')}
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
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('teachers.modal.fullName')}</label>
                    <input type="text" id="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                </div>
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('teachers.modal.emailAddress')}</label>
                    <input type="email" id="email" value={formData.email} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                </div>
                <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('teachers.modal.phoneNumber')}</label>
                    <input type="tel" id="phone" value={formData.phone} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                </div>
                <div>
                    <label htmlFor="specialization" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('teachers.modal.specialization')}</label>
                    <input type="text" id="specialization" value={formData.specialization} onChange={handleChange} placeholder={t('teachers.modal.specializationPlaceholder')} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                </div>
                <div>
                    <label htmlFor="contractType" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('teachers.modal.contractType')}</label>
                    <select id="contractType" value={formData.contractType} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm">
                        <option value="Full-time">{t('status.fullTime')}</option>
                        <option value="Part-time">{t('status.partTime')}</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="payRate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Pay Rate ($/session)</label>
                    <input type="number" id="payRate" value={formData.payRate} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                </div>
                <div className="flex justify-end pt-4 space-x-2">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">{t('teachers.modal.cancel')}</button>
                    <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark">
                        {teacher ? t('teachers.modal.saveChanges') : t('teachers.modal.addTeacher')}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default Teachers;