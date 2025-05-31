import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Menu, Settings, LogOut, User } from 'lucide-react';

interface HeaderProps {
  onMenuClick: () => void;
  onAccessibilityClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick, onAccessibilityClick }) => {
  const { user, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <button
              type="button"
              className="text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 md:hidden"
              onClick={onMenuClick}
            >
              <span className="sr-only">Open sidebar</span>
              <Menu className="h-6 w-6" aria-hidden="true" />
            </button>
            <div className="flex-shrink-0 flex items-center ml-4 md:ml-0">
              <h1 className="text-xl font-bold text-indigo-600 dark:text-indigo-400">NeuroBridge</h1>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button
              type="button"
              onClick={onAccessibilityClick}
              className="rounded-full p-2 text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <span className="sr-only">Accessibility Settings</span>
              <Settings className="h-6 w-6" aria-hidden="true" />
            </button>

            <div className="relative">
              <button
                type="button"
                className="flex items-center max-w-xs rounded-full bg-gray-100 dark:bg-gray-700 p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
              >
                <span className="sr-only">Open user menu</span>
                <User className="h-6 w-6 text-gray-500 dark:text-gray-300" />
              </button>

              {userMenuOpen && (
                <div 
                  className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none z-10"
                >
                  <div className="py-1 border-b border-gray-200 dark:border-gray-700">
                    <div className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200">
                      <div className="font-medium">{user?.name}</div>
                      <div className="text-gray-500 dark:text-gray-400 capitalize">{user?.role}</div>
                    </div>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={logout}
                      className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;