import { NavLink } from "react-router-dom";

const BottomBar = () => {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 glass-panel-dark border-t border-white/20">
      <div className="h-16 w-full mx-auto px-6 flex items-center justify-center gap-1">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex py-3 px-6 min-w-[120px] items-center justify-center rounded-lg font-medium text-sm transition-all duration-200 ${
              isActive
                ? "bg-white/20 text-white border border-white/30"
                : "text-white/70 hover:text-white hover:bg-white/10 border border-transparent"
            }`
          }
          end
        >
          <span className="uppercase tracking-wider">Dashboard</span>
        </NavLink>

        <NavLink
          to="/impact-simulation"
          className={({ isActive }) =>
            `flex py-3 px-6 min-w-[120px] items-center justify-center rounded-lg font-medium text-sm transition-all duration-200 ${
              isActive
                ? "bg-white/20 text-white border border-white/30"
                : "text-white/70 hover:text-white hover:bg-white/10 border border-transparent"
            }`
          }
        >
          <span className="uppercase tracking-wider">Impact Sim</span>
        </NavLink>
        <NavLink
          to="/asteroid-sim"
          className={({ isActive }) =>
            `flex py-3 px-6 min-w-[120px] items-center justify-center rounded-lg font-medium text-sm transition-all duration-200 ${
              isActive
                ? "bg-white/20 text-white border border-white/30"
                : "text-white/70 hover:text-white hover:bg-white/10 border border-transparent"
            }`
          }
        >
          <span className="uppercase tracking-wider">Asteroid Sim</span>
        </NavLink>

      </div>
    </nav>
  );
};

export default BottomBar;
