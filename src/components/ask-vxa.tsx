'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Sparkles, Loader2, X, Users, Briefcase, Target, Search } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { SearchResultsModal } from './search-results-modal'

interface AskResponse {
  type: 'pipeline' | 'recruitment' | 'meeting' | 'competitor' | 'prospecting' | 'general' | string
  title: string
  summary: string
  data?: Record<string, unknown>[]
  suggestions?: string[]
  suggestedActions?: string[]
  insights?: string[]
  meta?: {
    searchQuery?: string
  }
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  response?: AskResponse
  timestamp: Date
}

interface SearchResult {
  company?: string
  name?: string
  website?: string
  description?: string
  domain?: string
}

const quickActions = [
  { label: 'Pipeline overview', query: 'Show me the pipeline', icon: Target },
  { label: 'Open candidates', query: 'Show recruitment candidates', icon: Users },
  { label: 'Find companies', query: 'Find AI marketing companies', icon: Search },
  { label: 'Competitor intel', query: 'Show competitor analysis', icon: Briefcase },
]

export function AskVXA({ className }: { className?: string }) {
  const [query, setQuery] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [isThinking, setIsThinking] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [lastSearchQuery, setLastSearchQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus()
    }
  }, [isOpen])

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault()
    if (!query.trim() || isThinking) return

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: query,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    const currentQuery = query
    setQuery('')
    setIsThinking(true)

    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userMessage.content }),
      })

      const data: AskResponse = await res.json()

      // If prospecting results, open modal instead of showing in chat
      if (data.type === 'prospecting' && data.data && data.data.length > 0) {
        setSearchResults(data.data as SearchResult[])
        setLastSearchQuery(currentQuery)
        setModalOpen(true)
        
        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `Found ${data.data.length} results. Opening...`,
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, assistantMessage])
      } else {
        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: data.summary,
          response: data,
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, assistantMessage])
      }
    } catch (error) {
      console.error('Ask VXA error:', error)
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date(),
        },
      ])
    } finally {
      setIsThinking(false)
    }
  }

  function handleQuickAction(actionQuery: string) {
    setQuery(actionQuery)
    setTimeout(() => handleSubmit(), 0)
  }

  function clearChat() {
    setMessages([])
  }

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className={cn(
          'fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg',
          'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700',
          className
        )}
        size="icon"
      >
        <Sparkles className="h-6 w-6" />
      </Button>
    )
  }

  return (
    <>
    <Card
      className={cn(
        'fixed bottom-6 right-6 w-96 max-h-[600px] flex flex-col shadow-2xl border-violet-200/50',
        className
      )}
    >
      <CardHeader className="pb-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-t-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            <CardTitle className="text-lg">Ask VXA</CardTitle>
          </div>
          <div className="flex gap-1">
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={clearChat}
                className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[200px] max-h-[400px]">
        {messages.length === 0 ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Ask me anything about your CRM data
            </p>
            <div className="grid grid-cols-2 gap-2">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  onClick={() => handleQuickAction(action.query)}
                  className="flex items-center gap-2 p-3 text-left text-sm rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-violet-300 transition-colors"
                >
                  <action.icon className="h-4 w-4 text-violet-600" />
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex flex-col',
                  message.role === 'user' ? 'items-end' : 'items-start'
                )}
              >
                <div
                  className={cn(
                    'max-w-[85%] rounded-lg px-3 py-2 text-sm',
                    message.role === 'user'
                      ? 'bg-violet-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  )}
                >
                  {message.content}
                </div>

                {/* Response card with data */}
                {message.response?.data && message.response.data.length > 0 && (
                  <div className="mt-2 w-full">
                    <ResponseCard response={message.response} />
                  </div>
                )}

                {/* Suggestion chips */}
                {(message.response?.suggestions || message.response?.suggestedActions) && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {(message.response.suggestions || message.response.suggestedActions || []).map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => handleQuickAction(suggestion)}
                        className="text-xs px-2 py-1 rounded-full border border-violet-200 text-violet-700 hover:bg-violet-50 transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {isThinking && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin text-violet-600" />
                <span>Thinking...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </CardContent>

      <div className="p-4 border-t">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask anything..."
            disabled={isThinking}
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={!query.trim() || isThinking}
            size="icon"
            className="bg-violet-600 hover:bg-violet-700"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>

    </Card>

      {/* Search Results Modal - rendered outside Card for proper z-index */}
      <SearchResultsModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        results={searchResults}
        searchQuery={lastSearchQuery}
      />
    </>
  )
}

function ResponseCard({ response }: { response: AskResponse }) {
  const maxItems = 5
  const data = response.data || []
  const displayData = data.slice(0, maxItems)
  const remaining = data.length - maxItems

  return (
    <div className="bg-white border rounded-lg overflow-hidden">
      <div className="px-3 py-2 bg-gray-50 border-b">
        <span className="text-xs font-medium text-gray-600">{response.title}</span>
      </div>
      <div className="divide-y">
        {displayData.map((item, i) => (
          <div key={i} className="px-3 py-2 text-sm">
            {renderDataItem(response.type, item)}
          </div>
        ))}
      </div>
      {remaining > 0 && (
        <div className="px-3 py-2 text-xs text-muted-foreground border-t bg-gray-50">
          +{remaining} more
        </div>
      )}
    </div>
  )
}

function renderDataItem(type: AskResponse['type'], item: Record<string, unknown>) {
  switch (type) {
    case 'pipeline':
      return (
        <div className="flex justify-between items-center">
          <span className="font-medium">{String(item.name || item.company || 'Unknown')}</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">
            {String(item.stage || item.status || 'N/A')}
          </span>
        </div>
      )
    case 'recruitment':
      return (
        <div className="flex justify-between items-center">
          <span className="font-medium">{String(item.name || 'Unknown')}</span>
          <span className="text-xs text-muted-foreground">
            {String(item.role || item.position || 'N/A')}
          </span>
        </div>
      )
    case 'competitor':
      return (
        <div>
          <span className="font-medium">{String(item.name || item.company || 'Unknown')}</span>
          {item.notes ? (
            <p className="text-xs text-muted-foreground mt-0.5">{String(item.notes)}</p>
          ) : null}
        </div>
      )
    default:
      return (
        <span className="font-medium">
          {String(item.name || item.title || JSON.stringify(item))}
        </span>
      )
  }
}
