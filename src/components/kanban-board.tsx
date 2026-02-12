'use client'

import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

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
}

export function KanbanBoard<T extends { id: string }>({
  columns,
  onDragEnd,
  renderCard,
  onCardClick,
}: KanbanBoardProps<T>) {
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((column) => (
          <div key={column.id} className="flex-shrink-0 w-72">
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
