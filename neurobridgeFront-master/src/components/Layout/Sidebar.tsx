import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { X, Home, Calendar, MessageSquare, Users, BookOpen, BarChart, School } from 'lucide-react';
import { UserRole } from '../../context/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  userRole?: UserRole;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen, userRole }) => {
  const location = useLocation();
    const navigation = {
    teacher: [
      { name: 'Dashboard', href: '/teacher/dashboard', icon: Home },
      { name: 'My Classrooms', href: '/teacher/classrooms', icon: School },
      { name: 'Students', href: '/teacher/students', icon: Users },
      { name: 'Syllabus', href: '/teacher/syllabus', icon: BookOpen },
      { name: 'Scheduler', href: '/teacher/scheduler', icon: Calendar },
      { name: 'Performance', href: '/teacher/performance', icon: BarChart },
      { name: 'Chatbot', href: '/teacher/chatbot', icon: MessageSquare },
    ],
    student: [
      { name: 'Dashboard', href: '/student/dashboard', icon: Home },
      { name: 'My Classrooms', href: '/student/classrooms', icon: School },
      { name: 'My Learning', href: '/student/learning', icon: BookOpen },
      { name: 'Scheduler', href: '/student/scheduler', icon: Calendar },
      { name: 'My Progress', href: '/student/progress', icon: BarChart },
      { name: 'Chatbot', href: '/student/chatbot', icon: MessageSquare },
    ]
  };

  const activeNavigation = userRole === 'teacher' ? navigation.teacher : navigation.student;

  return (
    <>
      {/* Mobile sidebar overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 md:hidden" 
          onClick={() => setIsOpen(false)}
        >
          <div className="absolute inset-0 bg-gray-600 bg-opacity-75" aria-hidden="true"></div>
        </div>
      )}

      {/* Sidebar for mobile */}
      <div 
        className={`fixed inset-y-0 left-0 flex flex-col z-40 w-64 bg-indigo-700 transition-transform transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 md:static md:h-screen`}
      >
        <div className="flex items-center justify-between h-16 px-4 bg-indigo-800">
          <div className="flex items-center">
            <span className="text-xl font-bold text-white">NeuroBridge</span>
          </div>
          <button
            type="button"
            className="h-10 w-10 rounded-full flex items-center justify-center text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-white md:hidden"
            onClick={() => setIsOpen(false)}
          >
            <span className="sr-only">Close sidebar</span>
            <X className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>
        
        <div className="flex-1 flex flex-col overflow-y-auto">
          <nav className="flex-1 px-2 py-4 space-y-1">
            {activeNavigation.map((item) => {
              const isActive = location.pathname === item.href || location.pathname.startsWith(`${item.href}/`);
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-2 py-2 text-sm font-medium rounded-md group ${
                    isActive
                      ? 'bg-indigo-800 text-white'
                      : 'text-indigo-100 hover:bg-indigo-600'
                  }`}
                >
                  <item.icon 
                    className={`mr-3 h-6 w-6 ${
                      isActive ? 'text-white' : 'text-indigo-300 group-hover:text-white'
                    }`} 
                    aria-hidden="true" 
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </>
  );
};

export default Sidebar;