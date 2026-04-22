import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Badge } from "@/components/ui/badge";
import { useAuth } from '@/contexts/AuthContext';
import { useFlows } from '@/contexts/FlowContext';
import { Menu, X, ChevronDown, Shield, BarChart3, User, Lock, LogOut } from "lucide-react";

const themeStyles: Record<string, string> = {
  cognicare: 'bg-white/95 border-red-200/30 backdrop-blur-xl shadow-xl',
  cognisupport: 'bg-white/95 border-blue-200/30 backdrop-blur-xl shadow-xl',
  cogniinsure: 'bg-white/95 border-indigo-200/30 backdrop-blur-xl shadow-xl',
  cognifinance: 'bg-white/95 border-orange-200/30 backdrop-blur-xl shadow-xl',
  cognihome: 'bg-white/95 border-orange-200/30 backdrop-blur-xl shadow-xl',
  solaraairlines: 'bg-white/95 border-sky-200/30 backdrop-blur-xl shadow-xl',
  default: 'bg-white/95 border-slate-200/30 backdrop-blur-xl shadow-xl'
};

interface NavigationProps {
  theme?: string;
}

const Navigation = ({ theme = 'default' }: NavigationProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, isAdmin, hasRole, signOut } = useAuth();
  const { getVisibleFlows } = useFlows();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const visibleFlows = getVisibleFlows();

  const handleLogout = async () => {
    setIsProfileMenuOpen(false);
    await signOut();
    navigate('/login', { replace: true });
  };

  // Close profile menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const demoItems = visibleFlows.map((flow) => ({
    path: flow.path,
    label: flow.name,
    desc: flow.description.length > 60 ? `${flow.description.substring(0, 60)}...` : flow.description,
    comingSoon: flow.coming_soon,
  }));

  const themeStyle = themeStyles[theme] || themeStyles.default;
  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'User';
  const avatarInitial = displayName.charAt(0).toUpperCase();

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 border-b-2 ${themeStyle}`}>
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-24">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-4 group">
            <div className="relative bg-gradient-to-br from-blue-600 to-purple-700 rounded-2xl px-3 py-2 shadow-xl group-hover:scale-105 transition-all duration-300">
              <img
                src="/NiCE_Cognigy_white.png"
                alt="NiCE | COGNiGY"
                className="h-8 w-auto"
              />
            </div>
            <div>
              <span className="text-2xl font-black text-slate-900 tracking-tight">AI Specialist Hub</span>
              <p className="text-xs text-slate-500 font-medium">Built for What's Next</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              className={`text-sm font-bold transition-all duration-300 hover:text-blue-600 px-6 py-3 rounded-2xl hover:bg-blue-50/80 backdrop-blur-sm hover:scale-105 ${
                location.pathname === '/'
                  ? "text-blue-600 bg-blue-50/80 shadow-lg"
                  : "text-slate-700"
              }`}
            >
              Specialist Hub
            </Link>

            {/* Demos Dropdown */}
            <div className="relative">
              <button
                className={`flex items-center text-sm font-bold transition-all duration-300 hover:text-blue-600 px-6 py-3 rounded-2xl hover:bg-blue-50/80 backdrop-blur-sm hover:scale-105 ${
                  demoItems.some((d) => location.pathname === d.path)
                    ? "text-blue-600 bg-blue-50/80 shadow-lg"
                    : "text-slate-700"
                }`}
                onClick={() => setIsDropdownOpen((open) => !open)}
                onBlur={() => setTimeout(() => setIsDropdownOpen(false), 150)}
              >
                AI Specialists <ChevronDown className="ml-2 w-4 h-4 transition-transform duration-200" />
              </button>

              {isDropdownOpen && (
                <div className="absolute left-0 mt-3 w-80 rounded-3xl bg-white/95 backdrop-blur-xl shadow-2xl border-2 border-slate-200/50 py-4 z-50">
                  {demoItems.map((item) => {
                    if (item.comingSoon) {
                      return (
                        <div
                          key={item.path}
                          className="block px-8 py-3 rounded-2xl mx-2 opacity-90 cursor-not-allowed relative overflow-hidden hover:opacity-100 transition-all duration-300"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10" />
                          <div className="absolute inset-0 border border-dashed border-blue-300/30 rounded-2xl" />
                          <div className="relative flex items-center gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-sm text-slate-700">{item.label}</div>
                              <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">{item.desc}</div>
                            </div>
                            <Badge className="bg-blue-500 text-white border-0 text-xs font-medium px-2 py-1 rounded-md flex-shrink-0">
                              Coming Soon
                            </Badge>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`block px-8 py-4 transition-all duration-300 hover:bg-blue-50/80 hover:text-blue-600 rounded-2xl mx-2 hover:scale-105 ${
                          location.pathname === item.path
                            ? "text-blue-600 bg-blue-50/80 shadow-lg"
                            : "text-slate-700"
                        }`}
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        <div className="font-bold text-base">{item.label}</div>
                        <div className="text-xs text-slate-500 mt-1 font-medium">{item.desc}</div>
                      </Link>
                    );
                  })}
                </div>
            )}
            </div>

            {isAdmin && (
              <Link to="/admin">
                <Button variant="outline" className="rounded-2xl border-2 hover:scale-105 transition-all duration-200 shadow-lg relative">
                  <Shield className="w-4 h-4 mr-2" />
                  Admin
                </Button>
              </Link>
            )}
            {(isAdmin || hasRole('sales-manager')) && (
              <Link to="/reports">
                <Button variant="outline" className="rounded-2xl border-2 hover:scale-105 transition-all duration-200 shadow-lg relative">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Reports
                </Button>
              </Link>
            )}
            {user && (
              <Link to="/token-analyzer">
                <Button variant="outline" className="rounded-2xl border-2 hover:scale-105 transition-all duration-200 shadow-lg relative">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Token Analyzer
                </Button>
              </Link>
            )}

            {/* User Avatar Dropdown - far right */}
            {user && (
              <div className="relative ml-auto" ref={profileMenuRef}>
                <button
                  onClick={() => setIsProfileMenuOpen((o) => !o)}
                  className="flex items-center gap-2 px-3 py-2 rounded-2xl hover:bg-slate-100/80 transition-all duration-200 hover:scale-105"
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                    <span className="text-sm font-black text-white">{avatarInitial}</span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-500" />
                </button>

                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-3 w-56 rounded-3xl bg-white/95 backdrop-blur-xl shadow-2xl border-2 border-slate-200/50 py-2 z-50">
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="font-bold text-sm text-slate-900 truncate">{displayName}</p>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    </div>
                    <Link
                      to="/profile"
                      onClick={() => setIsProfileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-blue-50/80 hover:text-blue-600 transition-all duration-200 mx-1 rounded-2xl mt-1"
                    >
                      <User className="w-4 h-4" /> My Profile
                    </Link>
                    <Link
                      to="/profile"
                      onClick={() => setIsProfileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-blue-50/80 hover:text-blue-600 transition-all duration-200 mx-1 rounded-2xl"
                    >
                      <Lock className="w-4 h-4" /> Change Password
                    </Link>
                    <div className="border-t border-slate-100 mt-1 pt-1">
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50/80 transition-all duration-200 mx-1 rounded-2xl w-[calc(100%-8px)]"
                      >
                        <LogOut className="w-4 h-4" /> Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-3 rounded-2xl hover:bg-slate-100/80 text-slate-700 backdrop-blur-sm border border-slate-200/50 hover:scale-105 transition-all duration-200 shadow-lg"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-8 border-t-2 border-slate-200/50 bg-white/95 backdrop-blur-xl rounded-b-3xl">
            <Link
              to="/"
              className={`block py-4 px-6 text-base font-bold transition-all duration-300 hover:text-blue-600 rounded-2xl hover:bg-blue-50/80 mx-2 ${
                location.pathname === '/' ? "text-blue-600 bg-blue-50/80 shadow-lg" : "text-slate-700"
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              Specialist Hub
            </Link>

            <div className="mt-6 pt-6 border-t border-slate-200/50">
              <span className="block text-xs font-bold text-slate-500 mb-4 px-6 uppercase tracking-wider">AI Specialists</span>
              {demoItems.map((item) => {
                if (item.comingSoon) {
                  return (
                    <div
                      key={item.path}
                      className="block py-3 px-6 rounded-2xl mx-2 opacity-90 cursor-not-allowed relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10" />
                      <div className="relative flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-sm text-slate-700">{item.label}</div>
                          <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">{item.desc}</div>
                        </div>
                        <Badge className="bg-blue-500 text-white border-0 text-xs font-medium px-2 py-1 rounded-md flex-shrink-0">
                          Coming Soon
                        </Badge>
                      </div>
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`block py-4 px-6 rounded-2xl transition-all duration-300 hover:bg-blue-50/80 hover:text-blue-600 mx-2 ${
                      location.pathname === item.path ? "text-blue-600 bg-blue-50/80 shadow-lg" : "text-slate-700"
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <div className="font-bold text-base">{item.label}</div>
                    <div className="text-xs text-slate-500 mt-1 font-medium">{item.desc}</div>
                  </Link>
                );
              })}
            </div>

            {user && (
              <div className="mt-6 pt-6 border-t border-slate-200/50 px-6 space-y-2">
                <div className="flex items-center gap-3 px-2 py-2 mb-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                    <span className="text-sm font-black text-white">{avatarInitial}</span>
                  </div>
                  <div>
                    <p className="font-bold text-sm text-slate-900">{displayName}</p>
                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                  </div>
                </div>
                <Link to="/profile" onClick={() => setIsMenuOpen(false)}>
                  <Button variant="outline" className="w-full rounded-2xl justify-start">
                    <User className="w-4 h-4 mr-2" /> My Profile
                  </Button>
                </Link>
                {isAdmin && (
                  <Link to="/admin" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="outline" className="w-full rounded-2xl justify-start">
                      <Shield className="w-4 h-4 mr-2" /> Admin
                    </Button>
                  </Link>
                )}
                {(isAdmin || hasRole('sales-manager')) && (
                  <Link to="/reports" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="outline" className="w-full rounded-2xl justify-start">
                      <BarChart3 className="w-4 h-4 mr-2" /> Reports
                    </Button>
                  </Link>
                )}
                <Button variant="destructive" className="w-full rounded-2xl justify-start" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" /> Logout
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
