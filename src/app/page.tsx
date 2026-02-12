import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Users, Target, UserPlus, MessageSquare } from 'lucide-react'

const cards = [
  {
    href: '/customers',
    title: 'Customers',
    description: 'Track sales pipeline from lead to won',
    icon: Users,
    color: 'bg-blue-500',
  },
  {
    href: '/competitors',
    title: 'Competitors',
    description: 'Monitor market competition',
    icon: Target,
    color: 'bg-orange-500',
  },
  {
    href: '/recruitment',
    title: 'Recruitment',
    description: 'Manage hiring pipeline',
    icon: UserPlus,
    color: 'bg-green-500',
  },
  {
    href: '/interviews',
    title: 'Interviews',
    description: 'Customer interview insights',
    icon: MessageSquare,
    color: 'bg-purple-500',
  },
]

export default function Home() {
  return (
    <div className="py-8">
      <h1 className="text-3xl font-bold mb-2">Welcome to VXA Labs CRM</h1>
      <p className="text-gray-600 mb-8">Manage your sales, recruitment, and competitive intelligence.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <Link key={card.href} href={card.href}>
              <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer h-full">
                <div className={`w-10 h-10 ${card.color} rounded-lg flex items-center justify-center mb-4`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <h2 className="font-semibold mb-1">{card.title}</h2>
                <p className="text-sm text-gray-600">{card.description}</p>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
