"use client";
import { createContext, useContext, useId, useMemo, useRef } from "react";
import { useDataGrid } from "@/components/reui/data-grid/data-grid"
import {
  DataGridTableBase,
  DataGridTableBody,
  DataGridTableBodyRow,
  DataGridTableBodyRowCell,
  DataGridTableBodyRowSkeleton,
  DataGridTableBodyRowSkeletonCell,
  DataGridTableEmpty,
  DataGridTableHead,
  DataGridTableHeadRow,
  DataGridTableHeadRowCell,
  DataGridTableHeadRowCellResize,
  DataGridTableRowSpacer,
} from "@/components/reui/data-grid/data-grid-table"
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { flexRender } from "@tanstack/react-table";

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { GripHorizontalIcon } from "lucide-react"

const SortableRowContext = createContext(null)

function DataGridTableDndRowHandle({
  className
}) {
  const context = useContext(SortableRowContext)

  if (!context) {
    // Fallback if context is not available (shouldn't happen in normal usage)
    return (
      <Button
        variant="ghost"
        size="icon-sm"
        className={cn(
          "size-7 cursor-move opacity-70 hover:bg-transparent hover:opacity-100",
          className
        )}
        disabled>
        <GripHorizontalIcon />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      className={cn(
        "size-7 cursor-move opacity-70 hover:bg-transparent hover:opacity-100",
        className
      )}
      {...context.attributes}
      {...context.listeners}>
      <GripHorizontalIcon />
    </Button>
  );
}

function DataGridTableDndRow(
  {
    row
  }
) {
  const {
    transform,
    transition,
    setNodeRef,
    isDragging,
    attributes,
    listeners,
  } = useSortable({
    id: row.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition,
    opacity: isDragging ? 0.8 : 1,
    zIndex: isDragging ? 1 : 0,
    position: "relative",
  }

  return (
    <SortableRowContext.Provider value={{ attributes, listeners }}>
      <DataGridTableBodyRow row={row} dndRef={setNodeRef} dndStyle={style} key={row.id}>
        {row.getVisibleCells().map((cell, colIndex) => {
          return (
            <DataGridTableBodyRowCell cell={cell} key={colIndex}>
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </DataGridTableBodyRowCell>
          );
        })}
      </DataGridTableBodyRow>
    </SortableRowContext.Provider>
  );
}

function DataGridTableDndRows(
  {
    handleDragEnd,
    dataIds
  }
) {
  const { table, isLoading, props } = useDataGrid()
  const pagination = table.getState().pagination
  const tableContainerRef = useRef(null)

  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  )

  const modifiers = useMemo(() => {
    const restrictToTableContainer = ({
      transform,
      draggingNodeRect,
    }) => {
      if (!tableContainerRef.current || !draggingNodeRect) {
        return transform
      }

      const containerRect = tableContainerRef.current.getBoundingClientRect()
      const { x, y } = transform

      const minX = containerRect.left - draggingNodeRect.left
      const maxX = containerRect.right - draggingNodeRect.right
      const minY = containerRect.top - draggingNodeRect.top
      const maxY = containerRect.bottom - draggingNodeRect.bottom

      return {
        ...transform,
        x: Math.max(minX, Math.min(maxX, x)),
        y: Math.max(minY, Math.min(maxY, y)),
      };
    }

    return [restrictToVerticalAxis, restrictToTableContainer]
  }, [])

  return (
    <DndContext
      id={useId()}
      collisionDetection={closestCenter}
      modifiers={modifiers}
      onDragEnd={handleDragEnd}
      sensors={sensors}>
      <div ref={tableContainerRef} className="relative">
        <DataGridTableBase>
          <DataGridTableHead>
            {table
              .getHeaderGroups()
              .map((headerGroup, index) => {
                return (
                  <DataGridTableHeadRow headerGroup={headerGroup} key={index}>
                    {headerGroup.headers.map((header, index) => {
                      const { column } = header

                      return (
                        <DataGridTableHeadRowCell header={header} key={index}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                          {props.tableLayout?.columnsResizable &&
                            column.getCanResize() && (
                              <DataGridTableHeadRowCellResize header={header} />
                            )}
                        </DataGridTableHeadRowCell>
                      );
                    })}
                  </DataGridTableHeadRow>
                );
              })}
          </DataGridTableHead>

          {(props.tableLayout?.stripped || !props.tableLayout?.rowBorder) && (
            <DataGridTableRowSpacer />
          )}

          <DataGridTableBody>
            {props.loadingMode === "skeleton" &&
            isLoading &&
            pagination?.pageSize ? (
              Array.from({ length: pagination.pageSize }).map((_, rowIndex) => (
                <DataGridTableBodyRowSkeleton key={rowIndex}>
                  {table.getVisibleFlatColumns().map((column, colIndex) => {
                    return (
                      <DataGridTableBodyRowSkeletonCell column={column} key={colIndex}>
                        {column.columnDef.meta?.skeleton}
                      </DataGridTableBodyRowSkeletonCell>
                    );
                  })}
                </DataGridTableBodyRowSkeleton>
              ))
            ) : table.getRowModel().rows.length ? (
              <SortableContext items={dataIds} strategy={verticalListSortingStrategy}>
                {table.getRowModel().rows.map((row) => {
                  return <DataGridTableDndRow row={row} key={row.id} />;
                })}
              </SortableContext>
            ) : (
              <DataGridTableEmpty />
            )}
          </DataGridTableBody>
        </DataGridTableBase>
      </div>
    </DndContext>
  );
}

export { DataGridTableDndRowHandle, DataGridTableDndRows }