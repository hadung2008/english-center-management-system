// @ts-nocheck
import React, { useState, useMemo, useEffect } from 'react';
import { Transaction, Teacher, Class, AttendanceRecord, User, Permission } from '../types';
import { PlusIcon, SearchIcon, FinanceIcon } from '../components/icons';
import Modal from '../components/Modal';
import { useTranslation } from '../lib/i18n';

interface FinanceProps {
    transactions: Transaction[];
    onSaveTransaction: (transactionData: Omit<Transaction, 'id'> | Transaction) => Promise<void>;
    onAddTransaction: (transaction: Omit<Transaction, 'id' | 'date'>) => Promise<void>;
    teachers: Teacher[];
    classes: Class[];
    attendanceRecords: AttendanceRecord[];
    currentUser: User;
    hasPermission: (permission: Permission) => boolean;
}

type FinancePageTab = 'transactions' | 'payroll' | 'report';

const StatCard: React.FC<{ icon: React.ReactNode; title: string; value: string; }> = ({ icon, title, value }) => {
    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm flex items-center">
            <div className="bg-primary/10 p-4 rounded-full">
                {icon}
            </div>
            <div className="ml-4">
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">{title}</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">{value}</p>
            </div>
        </div>
    );
};


const Finance: React.FC<FinanceProps> = (props) => {
    const [activeTab, setActiveTab] = useState<FinancePageTab>('transactions');
    const { t } = useTranslation();

    const activeTabClasses = "border-primary text-primary dark:border-primary dark:text-primary";
    const inactiveTabClasses = "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600";
    
    const stats = useMemo(() => {
        const totalRevenue = props.transactions
            .filter(transaction => transaction.type === 'Income' && transaction.status === 'Completed')
            .reduce((sum, transaction) => sum + transaction.amount, 0);
        const totalExpenses = props.transactions
            .filter(transaction => transaction.type === 'Expense' && transaction.status === 'Completed')
            .reduce((sum, transaction) => sum + transaction.amount, 0);
        const outstandingDebt = props.transactions
            .filter(transaction => transaction.type === 'Income' && transaction.status !== 'Completed')
            .reduce((sum, transaction) => sum + transaction.amount, 0);
        return {
            totalRevenue,
            totalExpenses,
            netProfit: totalRevenue - totalExpenses,
            outstandingDebt,
        };
    }, [props.transactions]);

    if (!props.hasPermission('VIEW_FINANCE')) {
        return <div className="text-center text-red-500">You do not have permission to access this page.</div>;
    }

    return (
        <div>
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">{t('finance.title')}</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">{t('finance.description')}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
                <StatCard icon={<FinanceIcon className="w-6 h-6 text-green-500" />} title={t('finance.totalRevenue')} value={`$${stats.totalRevenue.toLocaleString()}`} />
                <StatCard icon={<FinanceIcon className="w-6 h-6 text-red-500" />} title={t('finance.totalExpenses')} value={`$${stats.totalExpenses.toLocaleString()}`} />
                <StatCard icon={<FinanceIcon className="w-6 h-6 text-primary" />} title={t('finance.netProfit')} value={`$${stats.netProfit.toLocaleString()}`} />
                <StatCard icon={<FinanceIcon className="w-6 h-6 text-yellow-500" />} title={t('finance.outstandingDebt')} value={`$${stats.outstandingDebt.toLocaleString()}`} />
            </div>

            <div className="mt-6 border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    {props.hasPermission('MANAGE_TRANSACTIONS') && (
                         <button
                            onClick={() => setActiveTab('transactions')}
                            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'transactions' ? activeTabClasses : inactiveTabClasses}`}
                        >
                            Transactions
                        </button>
                    )}
                    {props.hasPermission('MANAGE_PAYROLL') && (
                        <button
                            onClick={() => setActiveTab('payroll')}
                            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'payroll' ? activeTabClasses : inactiveTabClasses}`}
                        >
                            {t('finance.calculatePayroll')}
                        </button>
                    )}
                    <button
                        onClick={() => setActiveTab('report')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'report' ? activeTabClasses : inactiveTabClasses}`}
                    >
                        {t('finance.generateReport')}
                    </button>
                </nav>
            </div>

            <div className="mt-8">
                {activeTab === 'transactions' && props.hasPermission('MANAGE_TRANSACTIONS') && <TransactionListView {...props} />}
                {activeTab === 'payroll' && props.hasPermission('MANAGE_PAYROLL') && <PayrollView {...props} />}
                {activeTab === 'report' && <FinancialReportView {...props} />}
            </div>
        </div>
    );
};

const TransactionListView: React.FC<FinanceProps> = ({ transactions, onSaveTransaction }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const { t } = useTranslation();

    const handleOpenAddModal = () => {
        setEditingTransaction(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (transaction: Transaction) => {
        setEditingTransaction(transaction);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingTransaction(null);
    };

    const handleSave = async (formData: Omit<Transaction, 'id' | 'date'>) => {
        const dataToSave = editingTransaction ? { ...editingTransaction, ...formData } : formData;
        await onSaveTransaction(dataToSave);
        handleCloseModal();
    };

    const filteredTransactions = useMemo(() => {
        return transactions.filter(transaction =>
            transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            transaction.category.toLowerCase().includes(searchTerm.toLowerCase())
        ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [transactions, searchTerm]);

    const getStatusChip = (status) => {
        switch (status) {
            case 'Completed': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
            case 'Pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
            case 'Failed': return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
        }
    };
    
    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
             <div className="flex items-center justify-between mb-4">
                <div className="relative w-full max-w-sm">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                        <SearchIcon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    </span>
                    <input type="text" placeholder={t('finance.searchPlaceholder')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors" />
                </div>
                <button onClick={handleOpenAddModal} className="bg-primary text-white font-medium py-2.5 px-5 rounded-lg flex items-center hover:bg-primary-dark transition-colors">
                    <PlusIcon className="w-5 h-5 mr-2" />
                    {t('finance.addTransaction')}
                </button>
            </div>
             <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th scope="col" className="px-6 py-3">{t('finance.table.date')}</th>
                            <th scope="col" className="px-6 py-3">{t('finance.table.description')}</th>
                            <th scope="col" className="px-6 py-3">{t('finance.table.category')}</th>
                            <th scope="col" className="px-6 py-3 text-right">{t('finance.table.amount')}</th>
                            <th scope="col" className="px-6 py-3">{t('finance.table.status')}</th>
                            <th scope="col" className="px-6 py-3 text-right">{t('finance.table.actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredTransactions.map(transaction => (
                            <tr key={transaction.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                <td className="px-6 py-4">{transaction.date}</td>
                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{transaction.description}</td>
                                <td className="px-6 py-4">{transaction.category}</td>
                                <td className={`px-6 py-4 text-right font-semibold ${transaction.type === 'Income' ? 'text-green-600' : 'text-red-600'}`}>
                                    {transaction.type === 'Income' ? '+' : '-'}${transaction.amount.toLocaleString()}
                                </td>
                                <td className="px-6 py-4"><span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusChip(transaction.status)}`}>{transaction.status}</span></td>
                                <td className="px-6 py-4 text-right">
                                    <button onClick={() => handleOpenEditModal(transaction)} className="font-medium text-primary hover:underline">{t('finance.table.edit')}</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {isModalOpen && <TransactionFormModal isOpen={isModalOpen} onClose={handleCloseModal} onSave={handleSave} transaction={editingTransaction} />}
        </div>
    );
}

const PayrollView: React.FC<FinanceProps> = ({ teachers, classes, onAddTransaction }) => {
    const { t } = useTranslation();
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [paidTeachers, setPaidTeachers] = useState<Record<string, boolean>>({});

    const payrollData = useMemo(() => {
        const [year, month] = selectedMonth.split('-').map(Number);
        const daysInMonth = new Date(year, month, 0).getDate();
        
        return teachers.map(teacher => {
            const teacherClasses = classes.filter(c => c.teacher === teacher.name);
            let sessions = 0;
            teacherClasses.forEach(c => {
                const days = c.schedule.match(/Mon|Tue|Wed|Thu|Fri|Sat|Sun/g) || [];
                sessions += days.length * 4; // Approx 4 weeks in a month
            });
            const totalSalary = sessions * teacher.payRate;
            return {
                ...teacher,
                sessions,
                totalSalary,
            };
        });
    }, [teachers, classes, selectedMonth]);

    const handleMarkAsPaid = async (teacherId: string, name: string, salary: number) => {
        await onAddTransaction({
            description: `Salary - ${name} (${teacherId}) - ${selectedMonth}`,
            category: 'Salary',
            type: 'Expense',
            amount: salary,
            status: 'Completed',
        });
        setPaidTeachers(prev => ({ ...prev, [`${teacherId}-${selectedMonth}`]: true }));
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">{t('finance.payroll.title')}</h2>
                <div>
                    <label className="text-sm font-medium mr-2 text-gray-700 dark:text-gray-300">{t('finance.payroll.selectMonth')}</label>
                    <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3">{t('finance.payroll.teacher')}</th>
                            <th className="px-6 py-3">{t('finance.payroll.sessions')}</th>
                            <th className="px-6 py-3">{t('finance.payroll.payRate')}</th>
                            <th className="px-6 py-3">{t('finance.payroll.totalSalary')}</th>
                            <th className="px-6 py-3 text-right">{t('finance.payroll.status')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {payrollData.map(teacher => (
                            <tr key={teacher.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{teacher.name}</td>
                                <td className="px-6 py-4">{teacher.sessions}</td>
                                <td className="px-6 py-4">${teacher.payRate}/session</td>
                                <td className="px-6 py-4 font-bold">${teacher.totalSalary.toLocaleString()}</td>
                                <td className="px-6 py-4 text-right">
                                    {paidTeachers[`${teacher.id}-${selectedMonth}`] ? 
                                        (<span className="text-green-500 font-semibold">Paid</span>) :
                                        (<button onClick={() => handleMarkAsPaid(teacher.id, teacher.name, teacher.totalSalary)} className="font-medium text-primary hover:underline">{t('finance.payroll.markAsPaid')}</button>)
                                    }
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const FinancialReportView: React.FC<FinanceProps> = ({ transactions }) => {
    const { t } = useTranslation();
    const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10));
    const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));

    const reportData = useMemo(() => {
        const filtered = transactions.filter(transaction => transaction.date >= startDate && transaction.date <= endDate && transaction.status === 'Completed');
        const income = filtered.filter(transaction => transaction.type === 'Income').reduce((sum, transaction) => sum + transaction.amount, 0);
        const expenses = filtered.filter(transaction => transaction.type === 'Expense').reduce((sum, transaction) => sum + transaction.amount, 0);
        return {
            transactions: filtered,
            income,
            expenses,
            net: income - expenses,
        };
    }, [transactions, startDate, endDate]);

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
             <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">{t('finance.report.title')}</h2>
                <div className="flex items-center space-x-2">
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm color-scheme-light dark:color-scheme-dark" />
                    <span className="text-gray-700 dark:text-gray-300">to</span>
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm color-scheme-light dark:color-scheme-dark" />
                </div>
            </div>
            <p className="text-sm text-gray-500 mb-6">{t('finance.report.period', { startDate, endDate })}</p>
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-green-50 dark:bg-green-900/50 rounded-lg"><h4 className="font-semibold text-green-700 dark:text-green-300">{t('finance.report.totalIncome')}</h4><p className="text-2xl font-bold text-green-600 dark:text-green-400">${reportData.income.toLocaleString()}</p></div>
                <div className="p-4 bg-red-50 dark:bg-red-900/50 rounded-lg"><h4 className="font-semibold text-red-700 dark:text-red-300">{t('finance.report.totalExpenses')}</h4><p className="text-2xl font-bold text-red-600 dark:text-red-400">${reportData.expenses.toLocaleString()}</p></div>
                <div className="p-4 bg-blue-50 dark:bg-blue-900/50 rounded-lg"><h4 className="font-semibold text-blue-700 dark:text-blue-300">{t('finance.report.netProfit')}</h4><p className="text-2xl font-bold text-blue-600 dark:text-blue-400">${reportData.net.toLocaleString()}</p></div>
            </div>
            <h3 className="font-semibold mb-2 text-gray-800 dark:text-gray-200">{t('finance.report.transactions')}</h3>
            {reportData.transactions.length > 0 ? (
                <ul className="divide-y dark:divide-gray-700 max-h-96 overflow-y-auto">
                    {reportData.transactions.map(transaction => (
                        <li key={transaction.id} className="py-2 flex justify-between">
                            <div><span className="font-medium text-gray-800 dark:text-gray-200">{transaction.description}</span><span className="text-sm text-gray-500 ml-2">({transaction.date})</span></div>
                            <span className={`font-semibold ${transaction.type === 'Income' ? 'text-green-600' : 'text-red-600'}`}>${transaction.amount.toLocaleString()}</span>
                        </li>
                    ))}
                </ul>
            ) : <p className="text-gray-500">{t('finance.report.noData')}</p>}
        </div>
    );
};

const TransactionFormModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (formData: Omit<Transaction, 'id' | 'date'>) => Promise<void>;
    transaction: Transaction | null;
}> = ({ isOpen, onClose, onSave, transaction }) => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({
        description: transaction?.description || '',
        category: transaction?.category || 'Other',
        type: transaction?.type || 'Expense',
        amount: transaction?.amount || 0,
        status: transaction?.status || 'Completed',
    });

    const handleChange = (e) => {
        const { id, value, type } = e.target;
        setFormData(prev => ({ ...prev, [id]: type === 'number' ? parseFloat(value) : value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        await onSave(formData);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={transaction ? t('finance.modal.editTitle') : t('finance.modal.title')}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('finance.modal.description')}</label>
                    <input type="text" id="description" value={formData.description} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('finance.modal.type')}</label>
                        <select id="type" value={formData.type} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm">
                            <option value="Income">{t('finance.types.income')}</option>
                            <option value="Expense">{t('finance.types.expense')}</option>
                        </select>
                    </div>
                     <div>
                        <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('finance.modal.category')}</label>
                        <select id="category" value={formData.category} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm">
                            <option value="Tuition Fee">{t('finance.categories.tuitionFee')}</option>
                            <option value="Salary">{t('finance.categories.salary')}</option>
                            <option value="Operational Cost">{t('finance.categories.operationalCost')}</option>
                            <option value="Other">{t('finance.categories.other')}</option>
                        </select>
                    </div>
                </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('finance.modal.amount')}</label>
                        <input type="number" id="amount" value={formData.amount} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                    </div>
                    <div>
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('finance.modal.status')}</label>
                        <select id="status" value={formData.status} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm">
                            <option value="Completed">{t('status.completed')}</option>
                            <option value="Pending">{t('status.pending')}</option>
                            <option value="Failed">{t('status.failed')}</option>
                        </select>
                    </div>
                </div>
                 <div className="flex justify-end pt-4 space-x-2">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">{t('finance.modal.cancel')}</button>
                    <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark">
                        {transaction ? t('finance.modal.saveChanges') : t('finance.modal.addTransaction')}
                    </button>
                </div>
            </form>
        </Modal>
    )
}

export default Finance;