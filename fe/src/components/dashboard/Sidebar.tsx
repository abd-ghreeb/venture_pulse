import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Rocket, Users2, Settings, ChevronLeft, ChevronRight, Zap, LogOut, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import apiClient from '@/lib/apiClient';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Ventures', href: '/ventures', icon: Rocket },
  { name: 'Pods', href: '/pods', icon: Users2 },
  { name: 'Settings', href: '/settings', icon: Settings },
];

const Sidebar = ({ className }: { className?: string }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false); // Toggle for mobile
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setCollapsed(true);
      } else {
        setCollapsed(false);
        setMobileOpen(false); // Close mobile menu if window is resized to desktop
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    apiClient.logout();
    navigate('/auth');
  };

  const SidebarContent = (
    <>
      {/* Logo Section - Now clickable on mobile to close */}
      <div className="p-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setMobileOpen(!mobileOpen)}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center glow">
            <Zap className="w-5 h-5 text-primary-foreground" />
          </div>
          {(!collapsed || mobileOpen) && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h1 className="font-semibold text-foreground text-lg leading-tight">Venture Pulse</h1>
              <p className="text-xs text-muted-foreground">Utopia Studio</p>
            </motion.div>
          )}
        </div>
        {mobileOpen && (
          <button onClick={() => setMobileOpen(false)} className="lg:hidden">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        )}
      </div>

      <nav className="flex-1 px-3 py-4">
        <ul className="space-y-1">
          {navigation.map((item) => (
            <li key={item.name}>
              <NavLink
                to={item.href}
                onClick={() => setMobileOpen(false)} // Close on navigate
                className={({ isActive }) => cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                  isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                )}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {(!collapsed || mobileOpen) && <span className="font-medium">{item.name}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-3 border-t border-sidebar-border">
        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all">
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {(!collapsed || mobileOpen) && <span className="font-medium">Logout</span>}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Toggle Button (Logo/Menu) - Only visible on small screens when sidebar is hidden */}
      <div className="lg:hidden fixed top-4 left-4 z-[60]">
        <button 
          onClick={() => setMobileOpen(true)}
          className="p-2 bg-background border border-border rounded-lg shadow-sm"
        >
          <Menu className="w-6 h-6 text-foreground" />
        </button>
      </div>

      {/* Desktop Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 80 : 260 }}
        className={cn(
          "hidden lg:flex h-screen bg-sidebar border-r border-sidebar-border flex-col relative flex-shrink-0 z-50",
          className
        )}
      >
        {SidebarContent}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-8 w-6 h-6 rounded-full bg-secondary border border-border flex items-center justify-center hover:bg-accent transition-colors"
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </motion.aside>

      {/* Mobile Overlay Sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70] lg:hidden"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              className="fixed inset-y-0 left-0 w-[280px] bg-sidebar border-r border-sidebar-border z-[80] flex flex-col lg:hidden shadow-2xl"
            >
              {SidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;