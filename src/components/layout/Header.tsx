import { Link, useLocation } from "react-router-dom";
import { Icon } from "../ui/Icon";

const NAV_ITEMS = [
  { path: "/", label: "Project Explorer", icon: "folder_open" },
  { path: "/editor", label: "Editor", icon: "edit" },
];

export function Header() {
  const location = useLocation();

  return (
    <header className="flex items-center justify-between h-14 px-5 border-b border-[#3c3c3c] bg-[#252526] z-50 shrink-0">
      <div className="flex items-center gap-8">
        <Link to="/" className="flex items-center gap-2 no-underline">
          <img src="/icon.svg" alt="RotaGuide" className="size-7" />
          <h2 className="text-white text-lg font-bold tracking-tight">RotaGuide</h2>
        </Link>

        <nav className="flex items-center gap-6">
          {NAV_ITEMS.map((item) => {
            const isActive = item.path === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`text-sm font-medium transition-colors no-underline pb-0.5 ${
                  isActive
                    ? "text-[#ec5b13] font-bold border-b-2 border-[#ec5b13]"
                    : "text-slate-400 hover:text-[#ec5b13]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex items-center gap-3">
        <a
          href="https://github.com/EBPkobli/rotaguide-spotlight-editor"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors no-underline"
        >
          <Icon name="code" className="text-sm" /> GitHub
        </a>
        <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
          <Icon name="favorite" className="text-sm" /> Donate
        </button>
      </div>
    </header>
  );
}
