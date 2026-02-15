'use client'

import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Inbox } from 'lucide-react'

interface Column<T> {
  id: string
  title: string
  color: string
  items: T[]
}

interface KanbanBoardProps<T extends { id: string }> {
  columns: Column<T>[]
  onDragEnd: (result: DropResult) => void
  renderCard: (item: T) => React.ReactNode
  onCardClick?: (item: T) => void
  loading?: boolean
  emptyMessage?: string
}

function KanbanSkeleton() {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {[...Array(4)].map((_, colIndex) => (
        <div key={colIndex} className="flex-1 min-w-[200px]">
          <div className="mb-3 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-gray-300 animate-pulse" />
            <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
            <div className="ml-auto h-5 w-8 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="min-h-[500px] p-2 rounded-lg bg-gray-50/50">
            {[...Array(colIndex === 0 ? 3 : colIndex === 1 ? 2 : 1)].map((_, cardIndex) => (
              <div key={cardIndex} className="mb-2">
                <Card className="p-3 bg-white border-gray-200">
                  <div className="space-y-2">
                    <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
                    <div className="h-3 w-1/2 bg-gray-100 rounded animate-pulse" />
                    <div className="h-3 w-2/3 bg-gray-100 rounded animate-pulse" />
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <Inbox className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">No items yet</h3>
      <p className="text-gray-500 text-center max-w-sm">{message}</p>
    </div>
  )
}

export function KanbanBoard<T extends { id: string }>({
  columns,
  onDragEnd,
  renderCard,
  onCardClick,
  loading = false,
  emptyMessage = 'Add your first item to get started.',
}: KanbanBoardProps<T>) {
  if (loading) {
    return <KanbanSkeleton />
  }

  const totalItems = columns.reduce((sum, col) => sum + col.items.length, 0)

  if (totalItems === 0) {
    return <EmptyState message={emptyMessage} />
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((column) => (
          <div key={column.id} className="flex-1 min-w-[200px]">
            <div className="mb-3 flex items-center gap-2">
              <div className={cn('w-2 h-2 rounded-full', column.color)} />
              <h3 className="font-medium text-sm text-gray-700">{column.title}</h3>
              <Badge variant="secondary" className="ml-auto text-xs">
                {column.items.length}
              </Badge>
            </div>
            <Droppable droppableId={column.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={cn(
                    'min-h-[500px] p-2 rounded-lg transition-colors',
                    snapshot.isDraggingOver ? 'bg-gray-100' : 'bg-gray-50/50'
                  )}
                >
                  {column.items.length === 0 && !snapshot.isDraggingOver && (
                    <div className="flex items-center justify-center h-20 text-sm text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                      Drop items here
                    </div>
                  )}
                  {column.items.map((item, index) => (
                    <Draggable key={item.id} draggableId={item.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          onClick={() => onCardClick?.(item)}
                          className={cn(
                            'mb-2 cursor-pointer',
                            snapshot.isDragging && 'rotate-2'
                          )}
                        >
                          <Card className="p-3 bg-white hover:shadow-md transition-shadow border-gray-200">
                            {renderCard(item)}
                          </Card>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  )
}
