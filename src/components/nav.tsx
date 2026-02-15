'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Users, Target, UserPlus, Lightbulb, Presentation } from 'lucide-react'

const navItems = [
  { href: '/customers', label: 'Customers', icon: Users },
  { href: '/competitors', label: 'Competitors', icon: Target },
  { href: '/recruitment', label: 'Recruitment', icon: UserPlus },
  { href: '/interviews', label: 'Experts', icon: Lightbulb },
  { href: '/presentations', label: 'Presentations', icon: Presentation },
]

export function Nav() {
  const pathname = usePathname()

  return (
    <nav className="border-b bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex h-14 items-center gap-8">
          <Link href="/" className="font-semibold text-lg">
            VXA Labs
          </Link>
          <div className="flex gap-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </nav>
  )
}
