import { NavLink } from 'react-router-dom';

export function Nav() {
  const navItems = [
    { to: '/', label: 'Dashboard', end: true },
    { to: '/cases', label: 'Cases' },
    { to: '/policy', label: 'Policy' },
    { to: '/history', label: 'History' },
    { to: '/about', label: 'About' },
  ];

  return (
    <header className="w-full px-6 pt-6 pb-2">
      <div className="w-full flex items-center justify-between gap-4 bg-white/65 backdrop-blur-md rounded-full px-6 py-3 border border-white/70 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
        {/* Brand / Logo Badge */}
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-sm">
            R
          </div>
          <span className="font-bold tracking-tight text-slate-900 text-base">
            Recover<span className="text-slate-400 font-normal">AI</span>
          </span>
        </div>

        {/* Navigation Tabs (Match Reference Crextio Pill Navigation) */}
        <nav className="flex items-center gap-1 bg-white/40 p-1 rounded-full border border-slate-200/40">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `text-xs font-semibold px-4 py-1.5 rounded-full transition-all duration-200 ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Right Status Indicator */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Engine Online
          </span>
        </div>
      </div>
    </header>
  );
}

export default Nav;
