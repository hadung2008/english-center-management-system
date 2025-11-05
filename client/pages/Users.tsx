import React, { useState, useMemo } from 'react';
import { User, UserRole, Permission, ALL_PERMISSIONS } from '../types';
import { PlusIcon, SearchIcon } from '../components/icons';
import Modal from '../components/Modal';
import { useTranslation } from '../lib/i18n';

interface UsersProps {
    users: User[];
    onSaveUser: (userData: Omit<User, 'id'> | User) => Promise<void>;
    currentUser: User;
    rolePermissions: Record<UserRole, Permission[]>;
    onSavePermissions: (role: UserRole, permissions: Permission[]) => Promise<void>;
    hasPermission: (permission: Permission) => boolean;
    onCreateRole: (roleName: string) => Promise<void>;
    onDeleteRole: (roleName: string) => Promise<void>;
}

type UsersPageTab = 'users' | 'roles';

const Users: React.FC<UsersProps> = (props) => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<UsersPageTab>('users');
    const { hasPermission } = props;

    if (!hasPermission('VIEW_USERS')) {
        return (
            <div className="text-center text-red-500">
                You do not have permission to access this page.
            </div>
        );
    }
    
    const activeTabClasses = "border-primary text-primary dark:border-primary dark:text-primary";
    const inactiveTabClasses = "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600";

    return (
        <div>
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">{t('users.title')}</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">{t('users.description')}</p>
                </div>
            </div>
             <div className="mt-6 border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'users' ? activeTabClasses : inactiveTabClasses}`}
                    >
                        {t('users.tabs.users')}
                    </button>
                    {hasPermission('MANAGE_ROLES') && (
                        <button
                            onClick={() => setActiveTab('roles')}
                            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'roles' ? activeTabClasses : inactiveTabClasses}`}
                        >
                            {t('users.tabs.roles')}
                        </button>
                    )}
                </nav>
            </div>
            <div className="mt-8">
                 {activeTab === 'users' && <UserListView {...props} />}
                 {activeTab === 'roles' && hasPermission('MANAGE_ROLES') && <RoleManagementView {...props} />}
            </div>
        </div>
    );
}

const UserListView: React.FC<UsersProps> = ({ users, onSaveUser, hasPermission, rolePermissions }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const { t } = useTranslation();

    const handleOpenAddModal = () => {
        setEditingUser(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (user: User) => {
        setEditingUser(user);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingUser(null);
    };

    const handleSave = async (formData: Omit<User, 'id'>) => {
        const dataToSave = editingUser ? { ...editingUser, ...formData } : formData;
        await onSaveUser(dataToSave);
        handleCloseModal();
    };

    const filteredUsers = useMemo(() => {
        if (!searchTerm) return users;
        return users.filter(user =>
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [users, searchTerm]);


    return (
        <div>
            <div className="flex justify-between items-center -mt-20 mb-8">
                 <div></div>
                 {hasPermission('MANAGE_USERS') && (
                    <button 
                        onClick={handleOpenAddModal}
                        className="bg-primary text-white font-medium py-2.5 px-5 rounded-lg flex items-center hover:bg-primary-dark transition-colors"
                    >
                        <PlusIcon className="w-5 h-5 mr-2" />
                        {t('users.addUser')}
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
                            placeholder={t('users.searchPlaceholder')}
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
                                <th scope="col" className="px-6 py-3">{t('users.table.name')}</th>
                                <th scope="col" className="px-6 py-3">{t('users.table.role')}</th>
                                <th scope="col" className="px-6 py-3"><span className="sr-only">{t('users.table.actions')}</span></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map(user => (
                                <tr key={user.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                    <th scope="row" className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                                        <div className="flex items-center">
                                            <img className="w-8 h-8 rounded-full mr-3 object-cover" src={user.avatarUrl} alt={user.name} />
                                            <div>
                                                <p>{user.name}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                                            </div>
                                        </div>
                                    </th>
                                    <td className="px-6 py-4">{user.role}</td>
                                    <td className="px-6 py-4 text-right">
                                        {hasPermission('MANAGE_USERS') && (
                                            <button onClick={() => handleOpenEditModal(user)} className="font-medium text-primary hover:underline">{t('users.table.edit')}</button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            {isModalOpen && (
                <UserFormModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    onSave={handleSave}
                    user={editingUser}
                    roles={Object.keys(rolePermissions)}
                />
            )}
        </div>
    );
};

const RoleManagementView: React.FC<UsersProps> = ({ users, rolePermissions, onSavePermissions, onCreateRole, onDeleteRole }) => {
    const { t } = useTranslation();
    const [isPermsModalOpen, setIsPermsModalOpen] = useState(false);
    const [isAddRoleModalOpen, setIsAddRoleModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<UserRole | null>(null);

    const handleOpenPermsModal = (role: UserRole) => {
        setEditingRole(role);
        setIsPermsModalOpen(true);
    };

    const handleCloseAllModals = () => {
        setEditingRole(null);
        setIsPermsModalOpen(false);
        setIsAddRoleModalOpen(false);
    };

    const handleSavePerms = async (role: UserRole, permissions: Permission[]) => {
        await onSavePermissions(role, permissions);
        handleCloseAllModals();
    };

    const handleCreateRole = async (roleName: string) => {
        await onCreateRole(roleName);
        handleCloseAllModals();
    };
    
    const handleDeleteRole = async (roleName: string) => {
        if (window.confirm(t('users.modal.deleteRoleConfirm', { role: roleName }))) {
            try {
                await onDeleteRole(roleName);
            } catch (error) {
                alert((error as Error).message);
            }
        }
    };

    const roles = Object.keys(rolePermissions) as UserRole[];

    const countUsersByRole = (role: UserRole) => {
        return users.filter(u => u.role === role).length;
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
            <div className="flex justify-end mb-4">
                <button
                    onClick={() => setIsAddRoleModalOpen(true)}
                    className="bg-primary text-white font-medium py-2 px-4 rounded-lg flex items-center hover:bg-primary-dark transition-colors"
                >
                    <PlusIcon className="w-5 h-5 mr-2" />
                    {t('users.addRole')}
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th scope="col" className="px-6 py-3">{t('users.table.role')}</th>
                            <th scope="col" className="px-6 py-3">{t('users.tabs.users')}</th>
                            <th scope="col" className="px-6 py-3 text-right">{t('users.table.actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {roles.map(role => (
                            <tr key={role} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{role}</td>
                                <td className="px-6 py-4">{countUsersByRole(role)}</td>
                                <td className="px-6 py-4 text-right space-x-4">
                                    <button onClick={() => handleOpenPermsModal(role)} className="font-medium text-primary hover:underline">
                                        {t('users.table.editPermissions')}
                                    </button>
                                    {role !== 'Admin' && (
                                        <button onClick={() => handleDeleteRole(role)} className="font-medium text-red-600 dark:text-red-500 hover:underline">
                                            Delete
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {isPermsModalOpen && editingRole && (
                <PermissionsModal
                    isOpen={isPermsModalOpen}
                    onClose={handleCloseAllModals}
                    onSave={handleSavePerms}
                    role={editingRole}
                    currentPermissions={rolePermissions[editingRole] || []}
                />
            )}
            {isAddRoleModalOpen && (
                <AddRoleModal 
                    isOpen={isAddRoleModalOpen}
                    onClose={handleCloseAllModals}
                    onCreate={handleCreateRole}
                />
            )}
        </div>
    );
};

const UserFormModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (formData: Omit<User, 'id'>) => Promise<void>;
    user: User | null;
    roles: string[];
}> = ({ isOpen, onClose, onSave, user, roles }) => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        avatarUrl: user?.avatarUrl || 'https://st3.depositphotos.com/6672868/13701/v/450/depositphotos_137014128-stock-illustration-user-profile-icon.jpg',
        role: user?.role || 'Staff',
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
        await onSave(formData as Omit<User, 'id'>);
    };

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title={user ? t('users.modal.editTitle') : t('users.modal.title')}
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
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('users.modal.fullName')}</label>
                    <input type="text" id="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                </div>
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('users.modal.emailAddress')}</label>
                    <input type="email" id="email" value={formData.email} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                </div>
                <div>
                    <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('users.modal.role')}</label>
                    <select id="role" value={formData.role} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm">
                        {roles.map(role => (
                            <option key={role} value={role}>{role}</option>
                        ))}
                    </select>
                </div>
                <div className="flex justify-end pt-4 space-x-2">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">{t('students.modal.cancel')}</button>
                    <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark">
                        {user ? t('users.modal.saveChanges') : t('users.modal.addUser')}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

const AddRoleModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onCreate: (roleName: string) => Promise<void>;
}> = ({ isOpen, onClose, onCreate }) => {
    const { t } = useTranslation();
    const [roleName, setRoleName] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (roleName.trim()) {
            await onCreate(roleName.trim());
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('users.modal.addRoleTitle')}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="roleName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('users.modal.roleName')}</label>
                    <input
                        type="text"
                        id="roleName"
                        value={roleName}
                        onChange={(e) => setRoleName(e.target.value)}
                        required
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                        placeholder={t('users.modal.roleNamePlaceholder')}
                    />
                </div>
                <div className="flex justify-end pt-4 space-x-2">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">{t('students.modal.cancel')}</button>
                    <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark">
                        {t('users.addRole')}
                    </button>
                </div>
            </form>
        </Modal>
    );
};


const PermissionsModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (role: UserRole, permissions: Permission[]) => Promise<void>;
    role: UserRole;
    currentPermissions: Permission[];
}> = ({ isOpen, onClose, onSave, role, currentPermissions }) => {
    const { t } = useTranslation();
    const [selectedPermissions, setSelectedPermissions] = useState<Permission[]>(currentPermissions);

    const handleCheckboxChange = (permission: Permission, isChecked: boolean) => {
        if (isChecked) {
            setSelectedPermissions(prev => [...prev, permission]);
        } else {
            setSelectedPermissions(prev => prev.filter(p => p !== permission));
        }
    };

    const handleSubmit = async () => {
        await onSave(role, selectedPermissions);
    };
    
    const isEditingAdmin = role === 'Admin';

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('users.permissionsModal.title', { role })}>
            {isEditingAdmin ? (
                <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/50 rounded-md text-yellow-800 dark:text-yellow-300">
                    {t('users.permissionsModal.adminWarning')}
                </div>
            ) : (
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                    {Object.entries(ALL_PERMISSIONS).map(([category, permissions]) => (
                        <div key={category}>
                            <h4 className="font-semibold text-gray-800 dark:text-gray-200 capitalize border-b dark:border-gray-600 pb-1 mb-2">
                                {t(`permissions.categories.${category}`)}
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {permissions.map(permission => (
                                    <label key={permission} className="flex items-center space-x-3">
                                        <input
                                            type="checkbox"
                                            checked={selectedPermissions.includes(permission)}
                                            onChange={(e) => handleCheckboxChange(permission, e.target.checked)}
                                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                        />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">{t(`permissions.${permission}`)}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
            <div className="flex justify-end pt-4 mt-4 border-t dark:border-gray-700 space-x-2">
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">
                    {t('students.modal.cancel')}
                </button>
                {!isEditingAdmin && (
                    <button type="button" onClick={handleSubmit} className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark">
                        {t('students.modal.saveChanges')}
                    </button>
                )}
            </div>
        </Modal>
    );
};

export default Users;