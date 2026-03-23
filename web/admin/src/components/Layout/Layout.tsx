import { Outlet, NavLink } from 'react-router-dom'

const navItems = [
  { path: '/', label: '数据概览', icon: '📊' },
  { path: '/characters', label: '角色管理', icon: '🎮' },
  { path: '/users', label: '用户管理', icon: '👥' },
  { path: '/events', label: '事件管理', icon: '📢' },
  { path: '/mining', label: '挖矿监控', icon: '⛏️' },
  { path: '/config', label: '系统配置', icon: '⚙️' },
]

export function Layout() {
  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white/80 backdrop-blur-sm border-r-2 border-primary/20 flex flex-col">
        {/* Logo */}
        <div className="p-4 border-b-2 border-primary/20">
          <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            ✨ 偶气满满
          </h1>
          <p className="text-xs text-foreground/50">管理后台</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-cute mb-2 transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-primary/10 to-accent/10 text-primary font-medium shadow-cute'
                    : 'text-foreground/60 hover:bg-primary/5 hover:text-foreground'
                }`
              }
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t-2 border-primary/20 text-xs text-foreground/40 text-center">
          <p>✨ v1.0.0 ✨</p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 bg-white/80 backdrop-blur-sm border-b-2 border-primary/20 flex items-center justify-between px-6">
          <div className="text-foreground/60">
            👋 欢迎回来，管理员
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-foreground/60">admin@o7m2.com</span>
            <button className="btn-primary text-sm py-2 px-4">
              退出 ✌️
            </button>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 p-6 overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
