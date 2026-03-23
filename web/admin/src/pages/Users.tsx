import { useState } from 'react'
import { Ban, CheckCircle } from 'lucide-react'

interface User {
  id: string
  username: string
  email: string
  balance: number
  status: string
  createdAt: string
}

export function Users() {
  const [users] = useState<User[]>([
    { id: '1', username: 'user001', email: 'user001@example.com', balance: 5000, status: 'active', createdAt: '2024-01-15' },
    { id: '2', username: 'user002', email: 'user002@example.com', balance: 3200, status: 'active', createdAt: '2024-01-16' },
    { id: '3', username: 'user003', email: 'user003@example.com', balance: 0, status: 'banned', createdAt: '2024-01-17' },
    { id: '4', username: 'user004', email: 'user004@example.com', balance: 8500, status: 'active', createdAt: '2024-01-18' },
  ])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">用户管理</h1>
      </div>

      {/* Search */}
      <div className="flex gap-4 mb-4">
        <input
          type="text"
          placeholder="搜索用户名或邮箱..."
          className="flex-1 max-w-md px-3 py-2 bg-card border border-border rounded text-sm"
        />
        <select className="px-3 py-2 bg-card border border-border rounded text-sm">
          <option value="">全部状态</option>
          <option value="active">正常</option>
          <option value="banned">已封禁</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-background">
            <tr>
              <th className="px-4 py-3 text-left">用户名</th>
              <th className="px-4 py-3 text-left">邮箱</th>
              <th className="px-4 py-3 text-right">余额</th>
              <th className="px-4 py-3 text-center">状态</th>
              <th className="px-4 py-3 text-left">注册时间</th>
              <th className="px-4 py-3 text-center">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-background">
                <td className="px-4 py-3">{user.username}</td>
                <td className="px-4 py-3 text-foreground/50">{user.email}</td>
                <td className="px-4 py-3 text-right">{user.balance.toLocaleString()}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-0.5 rounded text-xs ${
                    user.status === 'active' 
                      ? 'bg-success/10 text-success' 
                      : 'bg-danger/10 text-danger'
                  }`}>
                    {user.status === 'active' ? '正常' : '已封禁'}
                  </span>
                </td>
                <td className="px-4 py-3 text-foreground/50">{user.createdAt}</td>
                <td className="px-4 py-3 text-center">
                  {user.status === 'active' ? (
                    <button className="p-1 hover:bg-border rounded text-danger" title="封禁">
                      <Ban size={16} />
                    </button>
                  ) : (
                    <button className="p-1 hover:bg-border rounded text-success" title="解封">
                      <CheckCircle size={16} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
