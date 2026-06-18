import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Wallet, Sun, Moon, User } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { settings, saveSetting, currentProfile, switchProfile } = useFinance();
  const location = useLocation();

  const isDark = settings.darkMode === 'true';

  // Detect scroll for blur effect
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleProfileChange = (e) => {
    switchProfile(e.target.value);
  };

  const toggleTheme = () => {
    saveSetting('darkMode', isDark ? 'false' : 'true');
  };

  const navLinks = [
    { name: 'Dashboard', path: '/' },
    { name: 'Add Transaction', path: '/add' },
    { name: 'Import Receipt', path: '/import' },
    { name: 'Insights', path: '/insights' },
    { name: 'Rules', path: '/rules' },
    { name: 'Settings', path: '/settings' },
  ];

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'glass shadow-lg' : 'glass shadow-none'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex flex-shrink-0 items-center gap-2 group">
              <div className="p-1.5 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Wallet className="h-6 w-6 text-primary" />
              </div>
              <span className="font-bold text-xl tracking-tight text-gradient">FinTrack AI</span>
            </Link>
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`relative px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive 
                      ? 'text-primary' 
                      : 'text-foreground/70 hover:text-foreground hover:bg-muted/60'
                  }`}
                >
                  {link.name}
                  {isActive && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-primary rounded-full" />
                  )}
                </Link>
              );
            })}
            
            <div className="flex items-center ml-4 gap-2 border-l border-border/50 pl-4">
              <div className="p-1.5 rounded-lg bg-muted">
                <User className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
              <select 
                value={currentProfile}
                onChange={handleProfileChange}
                className="bg-transparent text-foreground border-none text-sm py-1 font-medium focus:ring-0 outline-none cursor-pointer"
              >
                <option value="person1">Person 1</option>
                <option value="person2">Person 2</option>
                <option value="person3">Person 3</option>
              </select>
            </div>
            
            <button
              onClick={toggleTheme}
              className="ml-2 p-2.5 rounded-xl hover:bg-muted transition-all duration-200 group"
              aria-label="Toggle Dark Mode"
            >
              {isDark 
                ? <Sun className="h-4 w-4 text-yellow-500 group-hover:rotate-45 transition-transform duration-300" /> 
                : <Moon className="h-4 w-4 text-slate-600 group-hover:-rotate-12 transition-transform duration-300" />
              }
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl hover:bg-muted transition-colors"
            >
              {isDark ? <Sun className="h-5 w-5 text-yellow-500" /> : <Moon className="h-5 w-5 text-slate-700" />}
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-xl text-foreground hover:bg-muted focus:outline-none transition-colors"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden glass border-t border-border/50 absolute w-full left-0 shadow-xl animate-slide-down">
          <div className="px-3 pt-3 pb-4 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={`block px-4 py-2.5 rounded-xl text-base font-medium transition-all ${
                  location.pathname === link.path
                    ? 'bg-primary/10 text-primary'
                    : 'text-foreground/80 hover:bg-muted hover:text-foreground'
                }`}
              >
                {link.name}
              </Link>
            ))}
            <div className="flex items-center gap-2 px-4 py-3 border-t border-border/50 mt-2">
              <User className="w-5 h-5 text-muted-foreground" />
              <select 
                value={currentProfile}
                onChange={(e) => { handleProfileChange(e); setIsOpen(false); }}
                className="bg-background text-foreground border border-border rounded-xl text-base py-1.5 px-3 w-full focus:ring-1 focus:ring-primary outline-none"
              >
                <option value="person1">Person 1</option>
                <option value="person2">Person 2</option>
                <option value="person3">Person 3</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
