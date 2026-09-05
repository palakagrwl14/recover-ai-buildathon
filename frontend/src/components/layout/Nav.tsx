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
      <div className="w-full flex items-center justify-between gap-4 relative">
        {/* Left: Brand / Logo */}
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-full bg-slate-900 text-amber-300 flex items-center justify-center font-bold text-sm shadow-xs font-asar shrink-0">
            ब
          </div>
          <div className="flex flex-col justify-center">
            <span className="font-asar text-2xl font-bold tracking-tight text-slate-900 leading-none">
              बरकत
            </span>
            <span className="text-[10px] font-medium text-slate-500 tracking-tight leading-tight mt-0.5 whitespace-nowrap">
              Failed Payments · Revenue Recovery
            </span>
          </div>
        </div>

        {/* Center: Page Navigation Pills Container */}
        <nav className="flex items-center gap-1 bg-white/65 backdrop-blur-md p-1 rounded-full border border-white/70 shadow-[0_4px_20px_rgba(0,0,0,0.02)] absolute left-1/2 -translate-x-1/2">
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
      </div>
    </header>
  );
}

export default Nav;
