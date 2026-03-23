import { Outlet, NavLink } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Users, 
  Star, 
  Calendar, 
  Settings,
  Pickaxe
} from 'lucide-react'

const navItems = [
  { path: '/', label: '数据概览', icon: LayoutDashboard },
  { path: '/characters', label: '角色管理', icon: Star },
  { path: '/users', label: '用户管理', icon: Users },
  { path: '/events', label: '事件管理', icon: Calendar },
  { path: '/mining', label: '挖矿监控', icon: Pickaxe },
  { path: '/config', label: '系统配置', icon: Settings },
]

export function Layout() {
  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border flex flex-col">
        {/* Logo */}
        <div className="p-4 border-b border-border">
          <h1 className="text-xl font-bold text-primary">偶气满满</h1>
          <p className="text-xs text-foreground/50">管理后台</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded mb-1 transition-colors ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-foreground/70 hover:bg-card hover:text-foreground'
                }`
              }
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border text-xs text-foreground/50">
          <p>v1.0.0</p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-14 border-b border-border flex items-center justify-between px-4">
          <div className="text-sm text-foreground/50">
            欢迎回来，管理员
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm">admin@o7m2.com</span>
            <button className="px-3 py-1 bg-card rounded text-sm hover:bg-card/80">
              退出
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
