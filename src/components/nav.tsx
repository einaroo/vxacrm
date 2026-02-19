'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Users, Target, UserPlus, Lightbulb, Presentation, Radio } from 'lucide-react'

const navItems = [
  { href: '/customers', label: 'Customers', icon: Users },
  { href: '/competitors', label: 'Competitors', icon: Target },
  { href: '/signals', label: 'Signals', icon: Radio },
  { href: '/recruitment', label: 'Recruitment', icon: UserPlus },
  { href: '/interviews', label: 'Experts', icon: Lightbulb },
  { href: '/presentations', label: 'Presentations', icon: Presentation },
]

export function Nav() {
  const pathname = usePathname()

  return (
    <aside className="w-60 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="h-14 flex items-center px-5 border-b border-gray-100">
        <Link href="/" className="font-semibold text-lg text-gray-900 tracking-tight">
          VXA Labs
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-gray-900 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <Icon className="w-[18px] h-[18px] flex-shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-gray-100">
        <p className="text-xs text-gray-400">© VXA Labs</p>
      </div>
    </aside>
  )
}
