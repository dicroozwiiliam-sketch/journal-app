import React, { useState, useEffect, useRef } from 'react';
import { 
  Table2, 
  Plus, 
  Trash2, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Copy, 
  Trash, 
  Columns, 
  Maximize2, 
  Menu,
  ChevronDown,
  ChevronUp,
  RotateCcw
} from 'lucide-react';
import { JournalBlock } from './JournalTimeline';

interface TableBlockProps {
  block: JournalBlock;
  index: number;
  onUpdate: (blockId: string, updatedFields: Partial<JournalBlock>) => void;
  onDuplicate: (index: number) => void;
  onDelete: (blockId: string) => void;
  showToast: (msg: string) => void;
}

export default function TableBlock({
  block,
  index,
  onUpdate,
  onDelete,
  onDuplicate,
  showToast
}: TableBlockProps) {
  const meta = block.meta || {};
  const rows = meta.rows || [[]];
  const cols = meta.cols || [];
  const colWidths = meta.colWidths || Array(cols.length).fill(120);

  // Active sorting config
  const [sortConfig, setSortConfig] = useState<{ colIndex: number; direction: 'asc' | 'desc' } | null>(null);

  // Hover states for inline actions
  const [hoveredRowIndex, setHoveredRowIndex] = useState<number | null>(null);
  const [hoveredColIndex, setHoveredColIndex] = useState<number | null>(null);

  // Column Resizing mouse-drag state
  const resizingColIndexRef = useRef<number | null>(null);
  const resizeStartXRef = useRef<number>(0);
  const resizeStartWidthRef = useRef<number>(0);
  const [isResizing, setIsResizing] = useState<boolean>(false);

  // Update table columns & rows
  const updateTableData = (newCols: string[], newRows: string[][], newWidths?: number[]) => {
    onUpdate(block.id, {
      meta: {
        ...meta,
        cols: newCols,
        rows: newRows,
        colWidths: newWidths || colWidths
      }
    });
  };

  // Add a new row at the end
  const addRow = () => {
    const newRow = Array(cols.length).fill('');
    const updatedRows = [...rows, newRow];
    updateTableData(cols, updatedRows);
    showToast("Added new row");
  };

  // Insert row at specific index
  const insertRowAt = (rIdx: number) => {
    const newRow = Array(cols.length).fill('');
    const updatedRows = [...rows];
    updatedRows.splice(rIdx, 0, newRow);
    updateTableData(cols, updatedRows);
    showToast(`Inserted row at line ${rIdx + 1}`);
  };

  // Delete row by index
  const deleteRow = (rIdx: number) => {
    if (rows.length <= 1) {
      showToast("Cannot delete the last remaining row");
      return;
    }
    const updatedRows = rows.filter((_: any, idx: number) => idx !== rIdx);
    updateTableData(cols, updatedRows);
    showToast("Deleted row");
  };

  // Add a new column at the end
  const addColumn = () => {
    const nextColNum = cols.length + 1;
    const newCols = [...cols, `Column ${nextColNum}`];
    const updatedRows = rows.map((r: string[]) => [...r, '']);
    const updatedWidths = [...colWidths, 120];
    updateTableData(newCols, updatedRows, updatedWidths);
    showToast("Added new column");
  };

  // Delete column by index
  const deleteColumn = (cIdx: number) => {
    if (cols.length <= 1) {
      showToast("Cannot delete the last remaining column");
      return;
    }
    const newCols = cols.filter((_: any, idx: number) => idx !== cIdx);
    const updatedRows = rows.map((r: string[]) => r.filter((_: any, idx: number) => idx !== cIdx));
    const updatedWidths = colWidths.filter((_: any, idx: number) => idx !== cIdx);
    updateTableData(newCols, updatedRows, updatedWidths);
    showToast("Deleted column");
  };

  // Handle cell edit change
  const handleCellChange = (rIdx: number, cIdx: number, val: string) => {
    const updatedRows = rows.map((r: string[], ri: number) => {
      if (ri === rIdx) {
        const nextRow = [...r];
        nextRow[cIdx] = val;
        return nextRow;
      }
      return r;
    });
    // Direct edit updates block state natively
    onUpdate(block.id, {
      meta: {
        ...meta,
        rows: updatedRows
      }
    });
  };

  // Handle column header title edit change
  const handleHeaderChange = (cIdx: number, val: string) => {
    const nextCols = [...cols];
    nextCols[cIdx] = val;
    onUpdate(block.id, {
      meta: {
        ...meta,
        cols: nextCols
      }
    });
  };

  // Perform Column sorting
  const handleSort = (cIdx: number) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.colIndex === cIdx) {
      if (sortConfig.direction === 'asc') {
        direction = 'desc';
      } else {
        // Reset sort
        setSortConfig(null);
        showToast("Table sort cleared");
        return;
      }
    }

    setSortConfig({ colIndex: cIdx, direction });

    const sortedRows = [...rows];
    sortedRows.sort((a, b) => {
      const valA = a[cIdx] || '';
      const valB = b[cIdx] || '';

      const numA = parseFloat(valA);
      const numB = parseFloat(valB);
      if (!isNaN(numA) && !isNaN(numB)) {
        return direction === 'asc' ? numA - numB : numB - numA;
      }

      return direction === 'asc'
        ? valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' })
        : valB.localeCompare(valA, undefined, { numeric: true, sensitivity: 'base' });
    });

    onUpdate(block.id, {
      meta: {
        ...meta,
        rows: sortedRows
      }
    });
    showToast(`Sorted table by ${cols[cIdx]} (${direction.toUpperCase()})`);
  };

  // Drag listeners for Column Resizing
  const handleResizeStart = (e: React.MouseEvent, cIdx: number) => {
    e.preventDefault();
    resizingColIndexRef.current = cIdx;
    resizeStartXRef.current = e.clientX;
    resizeStartWidthRef.current = colWidths[cIdx] || 120;
    setIsResizing(true);
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (resizingColIndexRef.current === null) return;
      const index = resizingColIndexRef.current;
      const deltaX = e.clientX - resizeStartXRef.current;
      const newWidth = Math.max(60, Math.min(400, resizeStartWidthRef.current + deltaX));

      const nextWidths = [...colWidths];
      nextWidths[index] = newWidth;

      onUpdate(block.id, {
        meta: {
          ...meta,
          colWidths: nextWidths
        }
      });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      resizingColIndexRef.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, colWidths]);

  // Fill up widths array if not present or inconsistent
  useEffect(() => {
    if (!colWidths || colWidths.length !== cols.length) {
      const defaults = Array(cols.length).fill(120);
      onUpdate(block.id, {
        meta: {
          ...meta,
          colWidths: defaults
        }
      });
    }
  }, [cols.length]);

  return (
    <div className="w-full bg-white border border-[#E2D1C3] p-4 sm:p-5 rounded-2xl shadow-xs font-sans space-y-4">
      
      {/* Table Header toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#E2D1C3]/40">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-[#D28C5C]/10 text-[#D28C5C] rounded-lg">
            <Table2 size={15} />
          </div>
          <div>
            <span className="text-xs font-black text-cozy-text-dark tracking-wide uppercase">Table Grid Sheet</span>
            <span className="block text-[9px] text-cozy-text-muted">Interactive spreadsheet sandbox</span>
          </div>
        </div>

        {/* Global actions */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={addColumn}
            className="px-2.5 py-1.5 bg-[#FDF8F1] border border-[#E2D1C3] hover:border-[#D28C5C] hover:bg-white rounded-lg text-[10px] font-bold text-[#D28C5C] transition flex items-center gap-1 cursor-pointer"
            title="Append column to far-right"
          >
            <Columns size={11} />
            <span>+ Add Column</span>
          </button>
          
          <button
            type="button"
            onClick={addRow}
            className="px-2.5 py-1.5 bg-cozy-orange hover:bg-cozy-orange-hover text-white rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
            title="Append row to bottom"
          >
            <Plus size={11} />
            <span>+ Add Row</span>
          </button>

          <div className="h-5 w-[1px] bg-[#E2D1C3]/60 mx-1" />

          <button
            type="button"
            onClick={() => onDuplicate(index)}
            className="p-1.5 text-cozy-text-muted hover:text-[#D28C5C] hover:bg-[#FDF8F1] rounded-lg transition"
            title="Duplicate Block"
          >
            <Copy size={13} />
          </button>
          <button
            type="button"
            onClick={() => onDelete(block.id)}
            className="p-1.5 text-cozy-text-muted hover:text-rose-500 hover:bg-rose-50 rounded-lg transition"
            title="Delete Block"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Spreadsheet grid scrollable viewport */}
      <div className="overflow-x-auto border border-[#E2D1C3]/60 rounded-xl bg-[#FDF8F1]/10">
        <table className="w-full text-xs border-collapse table-fixed select-text">
          <thead>
            <tr className="bg-[#FDF8F1] border-b border-[#E2D1C3]/70">
              
              {/* Extra index column for row deletion / insertions */}
              <th className="w-10 text-center p-1.5 border-r border-[#E2D1C3]/60 select-none">
                <span className="text-[9px] font-mono text-cozy-text-muted">#</span>
              </th>

              {/* Dynamic Headers */}
              {cols.map((col: string, cIdx: number) => {
                const width = colWidths[cIdx] || 120;
                const isSorted = sortConfig?.colIndex === cIdx;
                const sortDir = sortConfig?.direction;

                return (
                  <th 
                    key={cIdx} 
                    style={{ width: `${width}px` }}
                    className="relative p-2 border-r border-[#E2D1C3]/60 font-bold text-cozy-text-dark text-left group/th min-w-[70px] select-none"
                    onMouseEnter={() => setHoveredColIndex(cIdx)}
                    onMouseLeave={() => setHoveredColIndex(null)}
                  >
                    <div className="flex items-center justify-between gap-1 w-full">
                      <input
                        type="text"
                        value={col}
                        onChange={(e) => handleHeaderChange(cIdx, e.target.value)}
                        className="w-full bg-transparent border-none font-extrabold text-cozy-text-dark focus:outline-none focus:ring-0 text-xs py-0.5"
                        title="Double click to edit column name"
                      />
                      
                      {/* Interactive Header utilities: Sort & Delete */}
                      <div className="flex items-center gap-0.5 opacity-0 group-hover/th:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => handleSort(cIdx)}
                          className={`p-0.5 rounded hover:bg-cozy-orange/20 transition ${
                            isSorted ? 'text-cozy-orange font-bold' : 'text-cozy-text-muted'
                          }`}
                          title="Sort table by column values"
                        >
                          {isSorted ? (
                            sortDir === 'asc' ? <ArrowUp size={10} /> : <ArrowDown size={10} />
                          ) : (
                            <ArrowUpDown size={10} />
                          )}
                        </button>
                        
                        {cols.length > 1 && (
                          <button
                            type="button"
                            onClick={() => deleteColumn(cIdx)}
                            className="p-0.5 rounded text-rose-500 hover:bg-rose-50 transition"
                            title="Delete Column"
                          >
                            <Trash size={10} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Draggable boundary resize handle */}
                    <div 
                      onMouseDown={(e) => handleResizeStart(e, cIdx)}
                      className="absolute right-0 top-0 bottom-0 w-[4px] cursor-col-resize hover:bg-[#D28C5C]/55 active:bg-[#D28C5C] transition-all z-10"
                      title="Drag to resize column"
                    />
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((row: string[], rIdx: number) => (
              <tr 
                key={rIdx} 
                className="border-b border-[#E2D1C3]/30 last:border-b-0 hover:bg-[#FDF8F1]/20 transition-colors group/tr"
                onMouseEnter={() => setHoveredRowIndex(rIdx)}
                onMouseLeave={() => setHoveredRowIndex(null)}
              >
                {/* Index & row actions td */}
                <td className="p-1.5 border-r border-[#E2D1C3]/30 bg-[#FDF8F1]/30 text-center select-none relative">
                  {hoveredRowIndex === rIdx ? (
                    <div className="absolute inset-0 flex items-center justify-center gap-0.5 bg-white/90">
                      <button
                        type="button"
                        onClick={() => insertRowAt(rIdx)}
                        className="p-0.5 rounded hover:bg-[#FDF8F1] text-cozy-orange transition"
                        title="Insert row above"
                      >
                        <ChevronUp size={10} />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertRowAt(rIdx + 1)}
                        className="p-0.5 rounded hover:bg-[#FDF8F1] text-cozy-orange transition"
                        title="Insert row below"
                      >
                        <ChevronDown size={10} />
                      </button>
                      {rows.length > 1 && (
                        <button
                          type="button"
                          onClick={() => deleteRow(rIdx)}
                          className="p-0.5 rounded hover:bg-rose-50 text-rose-500 transition"
                          title="Delete row"
                        >
                          <Trash size={9} />
                        </button>
                      )}
                    </div>
                  ) : (
                    <span className="font-mono text-[9px] text-cozy-text-muted">{rIdx + 1}</span>
                  )}
                </td>

                {/* Grid values inputs */}
                {row.map((cell: string, cIdx: number) => (
                  <td 
                    key={cIdx} 
                    className="p-1 border-r border-[#E2D1C3]/30"
                  >
                    <input
                      type="text"
                      value={cell}
                      onChange={(e) => handleCellChange(rIdx, cIdx, e.target.value)}
                      className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-cozy-text-dark text-xs px-1.5 py-1"
                      placeholder="..."
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Spreadsheet Quick Stats Indicator */}
      <div className="flex items-center justify-between text-[10px] text-cozy-text-muted select-none px-1">
        <span className="font-mono">
          Dimensions: {rows.length} rows × {cols.length} columns
        </span>
        
        {sortConfig && (
          <button
            onClick={() => {
              setSortConfig(null);
              // Simply refresh state
              showToast("Sorting reset");
            }}
            className="text-cozy-orange font-bold hover:underline flex items-center gap-0.5"
          >
            <RotateCcw size={9} />
            <span>Reset original sorting</span>
          </button>
        )}
      </div>

    </div>
  );
}
