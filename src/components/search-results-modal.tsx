'use client'

import { useState } from 'react'
import { X, Check, Loader2, User, Building2, Mail, Linkedin, ExternalLink, Copy, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SearchResult {
  company?: string
  name?: string
  website?: string
  description?: string
  domain?: string
  type?: 'company' | 'person'
  isTalent?: boolean
}

interface EnrichedData {
  contact?: {
    name: string
    role: string
    linkedIn?: string
  }
  draftMessage: string
}

interface SearchResultsModalProps {
  isOpen: boolean
  onClose: () => void
  results: SearchResult[]
  searchQuery: string
}

export function SearchResultsModal({ isOpen, onClose, results, searchQuery }: SearchResultsModalProps) {
  const [addedItems, setAddedItems] = useState<Set<number>>(new Set())
  const [loadingItems, setLoadingItems] = useState<Set<number>>(new Set())
  const [addingType, setAddingType] = useState<Record<number, 'customer' | 'recruit' | null>>({})
  const [enrichedData, setEnrichedData] = useState<Record<number, EnrichedData>>({})
  const [enrichingItems, setEnrichingItems] = useState<Set<number>>(new Set())
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  if (!isOpen) return null

  const handleAddToCustomers = async (item: SearchResult, index: number) => {
    if (loadingItems.has(index)) return
    
    setLoadingItems(prev => new Set(prev).add(index))
    setAddingType(prev => ({ ...prev, [index]: 'customer' }))

    try {
      const res = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: item.company || item.name,
          website: item.website,
          description: item.description,
          source: 'web_search',
        }),
      })

      if (res.ok || res.status === 409) {
        setAddedItems(prev => new Set(prev).add(index))
        // Start enrichment automatically
        enrichCompany(item, index)
      } else {
        const data = await res.json()
        console.error('Failed to add:', data.error)
      }
    } catch (error) {
      console.error('Failed to add company:', error)
    } finally {
      setLoadingItems(prev => {
        const next = new Set(prev)
        next.delete(index)
        return next
      })
    }
  }

  const enrichCompany = async (item: SearchResult, index: number) => {
    if (enrichingItems.has(index) || enrichedData[index]) return

    setEnrichingItems(prev => new Set(prev).add(index))

    try {
      const res = await fetch('/api/companies/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: item.company || item.name,
          website: item.website,
          description: item.description,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setEnrichedData(prev => ({ ...prev, [index]: data }))

        // Save outreach data for later retrieval
        if (data.contact || data.draftMessage) {
          fetch('/api/outreach', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              companyName: item.company || item.name,
              contactName: data.contact?.name,
              contactRole: data.contact?.role,
              linkedIn: data.contact?.linkedIn,
              draftMessage: data.draftMessage,
            }),
          }).catch(e => console.log('Outreach save skipped:', e))
        }
      }
    } catch (error) {
      console.error('Failed to enrich:', error)
    } finally {
      setEnrichingItems(prev => {
        const next = new Set(prev)
        next.delete(index)
        return next
      })
    }
  }

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const handleAddToRecruitment = async (item: SearchResult, index: number) => {
    if (loadingItems.has(index)) return
    
    setLoadingItems(prev => new Set(prev).add(index))
    setAddingType(prev => ({ ...prev, [index]: 'recruit' }))

    try {
      const res = await fetch('/api/recruits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: item.name || item.company,
          role: item.description?.slice(0, 100),
          comments: `Website: ${item.website}\nSource: web_search`,
          stage: 'lead',
        }),
      })

      if (res.ok || res.status === 409) {
        setAddedItems(prev => new Set(prev).add(index))
      }
    } catch (error) {
      console.error('Failed to add recruit:', error)
    } finally {
      setLoadingItems(prev => {
        const next = new Set(prev)
        next.delete(index)
        return next
      })
    }
  }

  const handleFindEmail = (item: SearchResult) => {
    const domain = item.domain || (item.website ? new URL(item.website).hostname : '')
    window.open(`https://hunter.io/search/${domain}`, '_blank')
  }

  const handleFindLinkedIn = (item: SearchResult) => {
    const query = encodeURIComponent(`${item.company || item.name} ${item.domain || ''}`)
    window.open(`https://www.linkedin.com/search/results/companies/?keywords=${query}`, '_blank')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col m-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-lg font-semibold">Search Results</h2>
            <p className="text-sm text-gray-500">{searchQuery}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-4">
          {results.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No results found
            </div>
          ) : (
            <div className="space-y-3">
              {results.map((item, index) => {
                const isAdded = addedItems.has(index)
                const isLoading = loadingItems.has(index)
                const addType = addingType[index]

                return (
                  <div
                    key={index}
                    className={cn(
                      'border rounded-lg p-4 transition-colors',
                      isAdded ? 'bg-green-50 border-green-200' : 'hover:bg-gray-50'
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {item.isTalent ? (item.name || item.company || 'Unknown') : (item.company || item.name || 'Unknown')}
                          </span>
                          {item.isTalent && item.company && (
                            <span className="text-xs text-gray-500">
                              @ {item.company}
                            </span>
                          )}
                          {!item.isTalent && item.domain && (
                            <span className="text-xs text-gray-400">
                              {item.domain}
                            </span>
                          )}
                          {isAdded && (
                            <span className="text-xs text-green-600 flex items-center gap-1">
                              <Check className="h-3 w-3" />
                              Added to {addType === 'recruit' ? 'recruitment' : 'customers'}
                            </span>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {item.description}
                          </p>
                        )}
                        {item.website && (
                          <a
                            href={item.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-violet-600 hover:underline mt-1 inline-flex items-center gap-1"
                          >
                            {item.website}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>

                      {/* Actions - order depends on whether this is talent or company */}
                      {!isAdded && (
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {/* Show Recruit button first if this is a talent result */}
                          {item.isTalent ? (
                            <>
                              <button
                                onClick={() => handleAddToRecruitment(item, index)}
                                disabled={isLoading}
                                className={cn(
                                  'flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors',
                                  'bg-blue-100 text-blue-700 hover:bg-blue-200',
                                  isLoading && 'opacity-50 cursor-not-allowed'
                                )}
                                title="Add to Recruitment"
                              >
                                {isLoading && addType === 'recruit' ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <User className="h-4 w-4" />
                                )}
                                <span className="hidden sm:inline">Recruit</span>
                              </button>
                              
                              <button
                                onClick={() => handleAddToCustomers(item, index)}
                                disabled={isLoading}
                                className={cn(
                                  'flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors',
                                  'bg-gray-100 text-gray-600 hover:bg-gray-200',
                                  isLoading && 'opacity-50 cursor-not-allowed'
                                )}
                                title="Add to Customers"
                              >
                                {isLoading && addType === 'customer' ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Building2 className="h-4 w-4" />
                                )}
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleAddToCustomers(item, index)}
                                disabled={isLoading}
                                className={cn(
                                  'flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors',
                                  'bg-violet-100 text-violet-700 hover:bg-violet-200',
                                  isLoading && 'opacity-50 cursor-not-allowed'
                                )}
                                title="Add to Customers"
                              >
                                {isLoading && addType === 'customer' ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Building2 className="h-4 w-4" />
                                )}
                                <span className="hidden sm:inline">Customer</span>
                              </button>
                              
                              <button
                                onClick={() => handleAddToRecruitment(item, index)}
                                disabled={isLoading}
                                className={cn(
                                  'flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors',
                                  'bg-gray-100 text-gray-600 hover:bg-gray-200',
                                  isLoading && 'opacity-50 cursor-not-allowed'
                                )}
                                title="Add to Recruitment"
                              >
                                {isLoading && addType === 'recruit' ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <User className="h-4 w-4" />
                                )}
                              </button>
                            </>
                          )}

                          <button
                            onClick={() => handleFindEmail(item)}
                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Find Email (Hunter.io)"
                          >
                            <Mail className="h-4 w-4" />
                          </button>
                          
                          <button
                            onClick={() => handleFindLinkedIn(item)}
                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Find on LinkedIn"
                          >
                            <Linkedin className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Enriched data section - shows after adding */}
                    {isAdded && (
                      <div className="mt-4 pt-4 border-t border-green-200">
                        {enrichingItems.has(index) ? (
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Sparkles className="h-4 w-4 animate-pulse text-violet-500" />
                            Finding contact & drafting message...
                          </div>
                        ) : enrichedData[index] ? (
                          <div className="space-y-3">
                            {/* Contact info */}
                            {enrichedData[index].contact && (
                              <div className="flex items-center gap-3 p-2 bg-white rounded-lg border">
                                <div className="w-8 h-8 bg-violet-100 rounded-full flex items-center justify-center">
                                  <User className="h-4 w-4 text-violet-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm">{enrichedData[index].contact!.name}</p>
                                  <p className="text-xs text-gray-500">{enrichedData[index].contact!.role}</p>
                                </div>
                                {enrichedData[index].contact!.linkedIn && (
                                  <a
                                    href={enrichedData[index].contact!.linkedIn}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  >
                                    <Linkedin className="h-4 w-4" />
                                  </a>
                                )}
                              </div>
                            )}

                            {/* Draft message */}
                            <div className="relative">
                              <div className="p-3 bg-white rounded-lg border text-sm whitespace-pre-wrap font-mono text-gray-700">
                                {enrichedData[index].draftMessage}
                              </div>
                              <button
                                onClick={() => copyToClipboard(enrichedData[index].draftMessage, index)}
                                className={cn(
                                  'absolute top-2 right-2 p-1.5 rounded-md transition-colors',
                                  copiedIndex === index
                                    ? 'bg-green-100 text-green-600'
                                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                )}
                              >
                                {copiedIndex === index ? (
                                  <Check className="h-4 w-4" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => enrichCompany(item, index)}
                            className="flex items-center gap-2 text-sm text-violet-600 hover:text-violet-700"
                          >
                            <Sparkles className="h-4 w-4" />
                            Find contact & draft message
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 rounded-b-xl">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">
              {results.length} result{results.length !== 1 ? 's' : ''} • {addedItems.size} added
            </span>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
