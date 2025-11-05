import React from 'react';
import type { Page } from '../App';
import { DashboardIcon, StudentsIcon, TeachersIcon, ClassesIcon, CoursesIcon, FinanceIcon, ReportsIcon, GiftIcon, UsersIcon } from './icons';
import { useTranslation } from '../lib/i18n';
import { User, Permission } from '../types';

interface SidebarProps {
  activePage: Page;
  setActivePage: (page: Page) => void;
  currentUser: User;
  hasPermission: (permission: Permission) => boolean;
}

const NavItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => {
  return (
    <li
      onClick={onClick}
      className={`flex items-center p-3 my-1 rounded-lg cursor-pointer transition-colors duration-200 ${
        isActive ? 'bg-primary text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-primary-dark/10 hover:text-primary dark:hover:bg-gray-700 dark:hover:text-white'
      }`}
    >
      {icon}
      <span className="ml-4 font-medium">{label}</span>
    </li>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ activePage, setActivePage, currentUser, hasPermission }) => {
  const { t } = useTranslation();

  const navItems: { icon: React.ReactNode; labelKey: string; page: Page; requiredPermission: Permission }[] = [
    { icon: <DashboardIcon className="w-6 h-6" />, labelKey: 'sidebar.dashboard', page: 'Dashboard', requiredPermission: 'VIEW_STUDENTS' }, // Example, maybe dashboard is always visible
    { icon: <StudentsIcon className="w-6 h-6" />, labelKey: 'sidebar.students', page: 'Students', requiredPermission: 'VIEW_STUDENTS' },
    { icon: <TeachersIcon className="w-6 h-6" />, labelKey: 'sidebar.teachers', page: 'Teachers', requiredPermission: 'VIEW_TEACHERS' },
    { icon: <ClassesIcon className="w-6 h-6" />, labelKey: 'sidebar.classes', page: 'Classes', requiredPermission: 'VIEW_CLASSES' },
    { icon: <CoursesIcon className="w-6 h-6" />, labelKey: 'sidebar.courses', page: 'Courses', requiredPermission: 'VIEW_COURSES' },
    { icon: <FinanceIcon className="w-6 h-6" />, labelKey: 'sidebar.finance', page: 'Finance', requiredPermission: 'VIEW_FINANCE' },
    { icon: <GiftIcon className="w-6 h-6" />, labelKey: 'sidebar.rewards', page: 'Rewards', requiredPermission: 'VIEW_REWARDS' },
    { icon: <ReportsIcon className="w-6 h-6" />, labelKey: 'sidebar.reports', page: 'Reports', requiredPermission: 'VIEW_REPORTS' },
    { icon: <UsersIcon className="w-6 h-6" />, labelKey: 'sidebar.users', page: 'Users', requiredPermission: 'VIEW_USERS' },
  ];

  const visibleNavItems = navItems.filter(item => {
    // A student should only see their own profile info under Students/Classes
    if (currentUser.role === 'Student') {
        return (item.page === 'Students' && hasPermission('VIEW_OWN_GRADES')) ||
               (item.page === 'Classes' && hasPermission('VIEW_OWN_CLASSES'));
    }
    return hasPermission(item.requiredPermission)
  });

  return (
    <aside className="w-64 bg-white dark:bg-gray-800 flex-shrink-0 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      <div className="h-20 flex items-center justify-center border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-2xl font-bold text-primary">EngCenter</h1>
      </div>
      <nav className="flex-1 px-4 py-6">
        <ul>
          {visibleNavItems.map((item) => (
            <NavItem
              key={item.page}
              icon={item.icon}
              label={t(item.labelKey)}
              isActive={activePage === item.page}
              onClick={() => setActivePage(item.page)}
            />
          ))}
        </ul>
      </nav>
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="bg-secondary dark:bg-gray-700/50 p-4 rounded-lg text-center">
            <h4 className="font-semibold text-gray-700 dark:text-gray-200">{t('sidebar.upgradePlan')}</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('sidebar.getMoreFeatures')}</p>
            <button className="mt-4 w-full bg-primary text-white py-2 rounded-lg hover:bg-primary-dark transition-colors">
                {t('sidebar.upgrade')}
            </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;