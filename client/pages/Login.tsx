import React, { useState } from 'react';
import { useTranslation } from '../lib/i18n';
import { User } from '../types';
import { MailIcon, LockClosedIcon, EyeIcon, EyeOffIcon } from '../components/icons';

interface LoginPageProps {
    onLogin: (email: string, password?: string) => Promise<User | null>; // Password optional for mock
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
    const { t } = useTranslation();
    const [email, setEmail] = useState('admin@example.com');
    const [password, setPassword] = useState('password123');
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const user = await onLogin(email, password);
        if (!user) {
            setError(t('login.errorMessage'));
        }
    };

    return (
        <div className="min-h-screen bg-secondary dark:bg-gray-900 flex">
            {/* Left branding side */}
            <div className="hidden lg:flex w-1/2 items-center justify-center bg-gradient-to-br from-primary to-blue-700 p-12 text-white relative overflow-hidden">
                <div className="w-full max-w-md z-10">
                    <h1 className="text-4xl font-bold mb-4">EngCenter</h1>
                    <h2 className="text-6xl font-extrabold leading-tight tracking-tight">
                        {t('login.title')}
                    </h2>
                    <p className="mt-6 text-lg opacity-80">
                        {t('login.subtitle')}
                    </p>
                </div>
                {/* Decorative shapes */}
                <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full -translate-x-1/4 -translate-y-1/4"></div>
                <div className="absolute bottom-0 right-0 w-80 h-80 bg-white/10 rounded-full translate-x-1/4 translate-y-1/4"></div>
            </div>

            {/* Right form side */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12">
                <div className="w-full max-w-md">
                    <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-2 lg:hidden">
                        {t('login.title')}
                    </h2>
                     <p className="text-gray-600 dark:text-gray-400 mb-8">
                        Please sign in to continue.
                    </p>

                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-6" role="alert">
                            <span className="block sm:inline">{error}</span>
                        </div>
                    )}
                    
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                {t('login.email')}
                            </label>
                            <div className="mt-1 relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                    <MailIcon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                                </span>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
                                    placeholder="you@example.com"
                                />
                            </div>
                        </div>
                         <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                {t('login.password')}
                            </label>
                            <div className="mt-1 relative">
                                 <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                    <LockClosedIcon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                                </span>
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                >
                                    {showPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded" />
                                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                                    {t('login.rememberMe')}
                                </label>
                            </div>
                            <div className="text-sm">
                                <a href="#" className="font-medium text-primary hover:text-primary-dark">
                                    {t('login.forgotPassword')}
                                </a>
                            </div>
                        </div>
                        <div>
                            <button
                                type="submit"
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-transform transform hover:scale-105"
                            >
                                {t('login.loginButton')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
