import React, { useState, useMemo } from 'react';
import { Reward, Redemption, Student, Permission } from '../types';
import { PlusIcon } from '../components/icons';
import Modal from '../components/Modal';
import { useTranslation } from '../lib/i18n';

interface RewardsProps {
    rewards: Reward[];
    onSaveReward: (rewardData: Omit<Reward, 'id'> | Reward) => Promise<void>;
    redemptions: Redemption[];
    onUpdateRedemption: (redemptionId: string, status: 'Approved' | 'Rejected') => Promise<void>;
    students: Student[];
    hasPermission: (permission: Permission) => boolean;
}

type RewardsViewMode = 'catalog' | 'requests';

const Rewards: React.FC<RewardsProps> = (props) => {
    const { t } = useTranslation();
    const [viewMode, setViewMode] = useState<RewardsViewMode>('catalog');

    const activeTabClasses = "border-primary text-primary dark:border-primary dark:text-primary";
    const inactiveTabClasses = "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600";

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">{t('rewards.title')}</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">{t('rewards.description')}</p>

            <div className="mt-6 border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button
                        onClick={() => setViewMode('catalog')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${viewMode === 'catalog' ? activeTabClasses : inactiveTabClasses}`}
                    >
                        {t('rewards.giftCatalog')}
                    </button>
                    <button
                        onClick={() => setViewMode('requests')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${viewMode === 'requests' ? activeTabClasses : inactiveTabClasses}`}
                    >
                        {t('rewards.redemptionRequests')}
                    </button>
                </nav>
            </div>

            {viewMode === 'catalog' && <GiftCatalogView rewards={props.rewards} onSaveReward={props.onSaveReward} hasPermission={props.hasPermission} />}
            {viewMode === 'requests' && <RedemptionRequestsView {...props} />}
        </div>
    );
};

// Gift Catalog Component
const GiftCatalogView: React.FC<Pick<RewardsProps, 'rewards' | 'onSaveReward' | 'hasPermission'>> = ({ rewards, onSaveReward, hasPermission }) => {
    const { t } = useTranslation();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingReward, setEditingReward] = useState<Reward | null>(null);

    const handleOpenAddModal = () => {
        setEditingReward(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (reward: Reward) => {
        setEditingReward(reward);
        setIsModalOpen(true);
    };
    
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingReward(null);
    };

    const handleSave = async (formData: Omit<Reward, 'id'>) => {
        const dataToSave = editingReward ? { ...editingReward, ...formData } : formData;
        await onSaveReward(dataToSave);
        handleCloseModal();
    };

    return (
        <div className="mt-8 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
            <div className="flex justify-end mb-4">
                {hasPermission('MANAGE_REWARDS') && (
                    <button 
                        onClick={handleOpenAddModal}
                        className="bg-primary text-white font-medium py-2.5 px-5 rounded-lg flex items-center hover:bg-primary-dark transition-colors"
                    >
                        <PlusIcon className="w-5 h-5 mr-2" />
                        {t('rewards.addGift')}
                    </button>
                )}
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th scope="col" className="px-6 py-3">{t('rewards.table.gift')}</th>
                            <th scope="col" className="px-6 py-3">{t('rewards.table.points')}</th>
                            <th scope="col" className="px-6 py-3">{t('rewards.table.stock')}</th>
                            <th scope="col" className="px-6 py-3 text-right">{t('rewards.table.actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rewards.map(reward => (
                             <tr key={reward.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                    <div className="flex items-center">
                                        <img src={reward.imageUrl} alt={reward.name} className="w-10 h-10 rounded-md mr-4 object-cover"/>
                                        {reward.name}
                                    </div>
                                </td>
                                <td className="px-6 py-4 font-semibold text-primary">{reward.points}</td>
                                <td className="px-6 py-4">{reward.stock}</td>
                                <td className="px-6 py-4 text-right">
                                    {hasPermission('MANAGE_REWARDS') && <button onClick={() => handleOpenEditModal(reward)} className="font-medium text-primary hover:underline">{t('students.table.edit')}</button>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {isModalOpen && (
                <GiftFormModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    onSave={handleSave}
                    reward={editingReward}
                />
            )}
        </div>
    );
};

// Redemption Requests Component
const RedemptionRequestsView: React.FC<RewardsProps> = ({ redemptions, onUpdateRedemption, students, rewards, hasPermission }) => {
    const { t } = useTranslation();

    const getStudentName = (studentId: string) => students.find(s => s.id === studentId)?.name || 'Unknown';
    const getRewardName = (rewardId: string) => rewards.find(r => r.id === rewardId)?.name || 'Unknown';

    const handleUpdateRequest = async (redemptionId: string, status: 'Approved' | 'Rejected') => {
        await onUpdateRedemption(redemptionId, status);
    };
    
    const getStatusChip = (status: Redemption['status']) => {
        switch (status) {
            case 'Approved': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
            case 'Rejected': return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
            case 'Pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
        }
    }

    return (
         <div className="mt-8 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
             <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th scope="col" className="px-6 py-3">{t('rewards.table.student')}</th>
                            <th scope="col" className="px-6 py-3">{t('rewards.table.gift')}</th>
                            <th scope="col" className="px-6 py-3">{t('rewards.table.date')}</th>
                            <th scope="col" className="px-6 py-3">{t('rewards.table.status')}</th>
                            <th scope="col" className="px-6 py-3 text-right">{t('rewards.table.actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                         {redemptions.map(req => (
                             <tr key={req.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{getStudentName(req.studentId)}</td>
                                <td className="px-6 py-4">{getRewardName(req.rewardId)}</td>
                                <td className="px-6 py-4">{req.date}</td>
                                <td className="px-6 py-4">
                                     <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusChip(req.status)}`}>{t(`status.${req.status.toLowerCase()}`)}</span>
                                </td>
                                <td className="px-6 py-4 text-right space-x-2">
                                    {req.status === 'Pending' && hasPermission('APPROVE_REDEMPTIONS') && (
                                        <>
                                            <button onClick={() => handleUpdateRequest(req.id, 'Approved')} className="font-medium text-green-600 dark:text-green-500 hover:underline">{t('status.approved')}</button>
                                            <button onClick={() => handleUpdateRequest(req.id, 'Rejected')} className="font-medium text-red-600 dark:text-red-500 hover:underline">{t('status.rejected')}</button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
         </div>
    );
};

// Gift Form Modal
const GiftFormModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (formData: Omit<Reward, 'id'>) => Promise<void>;
    reward: Reward | null;
}> = ({ isOpen, onClose, onSave, reward }) => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({
        name: reward?.name || '',
        imageUrl: reward?.imageUrl || '',
        points: reward?.points || 0,
        stock: reward?.stock || 0,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value, type } = e.target;
        setFormData(prev => ({ 
            ...prev, 
            [id]: type === 'number' ? parseInt(value, 10) || 0 : value 
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSave(formData);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={reward ? t('rewards.modal.editTitle') : t('rewards.modal.title')}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('rewards.modal.giftName')}</label>
                    <input type="text" id="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                </div>
                <div>
                    <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('rewards.modal.imageUrl')}</label>
                    <input type="text" id="imageUrl" value={formData.imageUrl} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                </div>
                 <div>
                    <label htmlFor="points" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('rewards.modal.pointsRequired')}</label>
                    <input type="number" id="points" value={formData.points} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                </div>
                 <div>
                    <label htmlFor="stock" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('rewards.modal.stockQuantity')}</label>
                    <input type="number" id="stock" value={formData.stock} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                </div>
                <div className="flex justify-end pt-4 space-x-2">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">{t('students.modal.cancel')}</button>
                    <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark">
                        {reward ? t('rewards.modal.saveChanges') : t('rewards.modal.addGift')}
                    </button>
                </div>
            </form>
        </Modal>
    );
};


export default Rewards;
