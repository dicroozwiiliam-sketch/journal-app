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
  ChevronDown, 
  ChevronUp, 
  RotateCcw,
  Type,
  Hash,
  Star,
  CheckSquare,
  Check,
  Calculator
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

  // Read Column Types & Calculations
  const colTypes = meta.colTypes || Array(cols.length).fill('text');
  const colCalculations = meta.colCalculations || {};

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

  // Column type selection dropdown
  const [activeTypeDropdown, setActiveTypeDropdown] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Confirmation state for clearing cells
  const [confirmClear, setConfirmClear] = useState<boolean>(false);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveTypeDropdown(null);
      }
    }
    if (activeTypeDropdown !== null) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeTypeDropdown]);

  // Update table columns & rows & meta attributes
  const updateTableData = (
    newCols: string[], 
    newRows: string[][], 
    newWidths?: number[],
    newTypes?: string[],
    newCalcs?: Record<number, string>
  ) => {
    onUpdate(block.id, {
      meta: {
        ...meta,
        cols: newCols,
        rows: newRows,
        colWidths: newWidths || colWidths,
        colTypes: newTypes || colTypes,
        colCalculations: newCalcs || colCalculations
      }
    });
  };

  // Add a new row at the end
  const addRow = () => {
    const newRow = Array(cols.length).fill('');
    const updatedRows = [...rows, newRow];
    updateTableData(cols, updatedRows);
    showToast("Added new row ✨");
  };

  // Insert row at specific index
  const insertRowAt = (rIdx: number) => {
    const newRow = Array(cols.length).fill('');
    const updatedRows = [...rows];
    updatedRows.splice(rIdx, 0, newRow);
    updateTableData(cols, updatedRows);
    showToast(`Inserted row at line ${rIdx + 1} 📝`);
  };

  // Delete row by index
  const deleteRow = (rIdx: number) => {
    if (rows.length <= 1) {
      showToast("Cannot delete the last remaining row ⚠️");
      return;
    }
    const updatedRows = rows.filter((_: any, idx: number) => idx !== rIdx);
    updateTableData(cols, updatedRows);
    showToast("Deleted row 🗑️");
  };

  // Add a new column at the end
  const addColumn = () => {
    const nextColNum = cols.length + 1;
    const newCols = [...cols, `Column ${nextColNum}`];
    const updatedRows = rows.map((r: string[]) => [...r, '']);
    const updatedWidths = [...colWidths, 120];
    const nextTypes = [...colTypes, 'text'];

    updateTableData(newCols, updatedRows, updatedWidths, nextTypes);
    showToast("Added new column 📊");
  };

  // Delete column by index
  const deleteColumn = (cIdx: number) => {
    if (cols.length <= 1) {
      showToast("Cannot delete the last remaining column ⚠️");
      return;
    }
    const newCols = cols.filter((_: any, idx: number) => idx !== cIdx);
    const updatedRows = rows.map((r: string[]) => r.filter((_: any, idx: number) => idx !== cIdx));
    const updatedWidths = colWidths.filter((_: any, idx: number) => idx !== cIdx);
    
    // Filter column types and calculations
    const nextTypes = colTypes.filter((_: any, idx: number) => idx !== cIdx);
    const nextCalcs = { ...colCalculations };
    delete nextCalcs[cIdx];

    updateTableData(newCols, updatedRows, updatedWidths, nextTypes, nextCalcs);
    showToast("Deleted column 🗑️");
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

  // Handle column type change
  const handleColTypeChange = (cIdx: number, type: 'text' | 'number' | 'rating' | 'checkbox') => {
    const nextTypes = [...colTypes];
    while (nextTypes.length < cols.length) {
      nextTypes.push('text');
    }
    nextTypes[cIdx] = type;

    // Convert values appropriately
    const nextRows = rows.map((row: string[]) => {
      const nextRow = [...row];
      if (type === 'checkbox') {
        const isTrue = row[cIdx] === 'true' || row[cIdx] === 'checked' || row[cIdx] === 'yes' || row[cIdx] === '1';
        nextRow[cIdx] = isTrue ? 'true' : 'false';
      } else if (type === 'rating') {
        const val = parseInt(row[cIdx], 10);
        if (isNaN(val) || val < 0 || val > 5) {
          nextRow[cIdx] = '0';
        } else {
          nextRow[cIdx] = String(val);
        }
      }
      return nextRow;
    });

    onUpdate(block.id, {
      meta: {
        ...meta,
        colTypes: nextTypes,
        rows: nextRows
      }
    });
    showToast(`Column set to ${type.toUpperCase()}`);
  };

  // Perform Column sorting
  const handleSort = (cIdx: number) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.colIndex === cIdx) {
      if (sortConfig.direction === 'asc') {
        direction = 'desc';
      } else {
        setSortConfig(null);
        showToast("Table sort cleared 🧹");
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
    showToast(`Sorted by ${cols[cIdx]} (${direction.toUpperCase()}) ↕️`);
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

  // Fill up widths array and types array if not present or inconsistent
  useEffect(() => {
    let changed = false;
    const nextMeta = { ...meta };

    if (!colWidths || colWidths.length !== cols.length) {
      nextMeta.colWidths = Array(cols.length).fill(120);
      changed = true;
    }
    if (!meta.colTypes || meta.colTypes.length !== cols.length) {
      nextMeta.colTypes = Array(cols.length).fill('text');
      changed = true;
    }

    if (changed) {
      onUpdate(block.id, { meta: nextMeta });
    }
  }, [cols.length]);

  // Math calculation helper
  const calculateValue = (cIdx: number, calcType: string) => {
    const values = rows
      .map((r: string[]) => parseFloat(r[cIdx]))
      .filter((v: number) => !isNaN(v));
      
    if (values.length === 0) return '-';
    
    if (calcType === 'sum') {
      const sum = values.reduce((acc: number, curr: number) => acc + curr, 0);
      return Number(sum.toFixed(2));
    }
    if (calcType === 'avg') {
      const sum = values.reduce((acc: number, curr: number) => acc + curr, 0);
      return Number((sum / values.length).toFixed(2));
    }
    if (calcType === 'min') {
      return Math.min(...values);
    }
    if (calcType === 'max') {
      return Math.max(...values);
    }
    return '';
  };

  return (
    <div className="w-full bg-white border-2 border-cozy-border p-4 sm:p-5 rounded-3xl shadow-xs font-sans space-y-4">
      
      {/* Table Header toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-cozy-border/40">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-[#D28C5C]/10 text-cozy-orange rounded-xl">
            <Table2 size={16} />
          </div>
          <div>
            <span className="text-xs font-black text-cozy-text-dark tracking-wide uppercase">Table Grid Sheet</span>
            <span className="block text-[9px] text-cozy-text-muted">Interactive spreadsheet sandbox</span>
          </div>
        </div>

        {/* Global actions */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {confirmClear ? (
            <button
              type="button"
              onClick={() => {
                const clearedRows = rows.map((r: string[]) => Array(cols.length).fill(''));
                updateTableData(cols, clearedRows);
                setConfirmClear(false);
                showToast("Cleared all table cells 🧼");
              }}
              onMouseLeave={() => setTimeout(() => setConfirmClear(false), 3000)}
              className="px-2.5 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
              title="Confirm clearing all cell contents"
            >
              <Trash size={11} />
              <span>Confirm Clear?</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmClear(true)}
              className="px-2.5 py-1.5 bg-[#FDF8F1] border border-rose-200 hover:bg-rose-50/50 text-rose-500 rounded-xl text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
              title="Empty all cell contents"
            >
              <RotateCcw size={11} />
              <span>Clear Cells</span>
            </button>
          )}

          <button
            type="button"
            onClick={addColumn}
            className="px-2.5 py-1.5 bg-[#FDF8F1] border border-cozy-border hover:border-cozy-orange hover:bg-white rounded-xl text-[10px] font-bold text-cozy-text-dark hover:text-cozy-orange transition flex items-center gap-1 cursor-pointer"
            title="Append column to far-right"
          >
            <Columns size={11} />
            <span>+ Add Column</span>
          </button>
          
          <button
            type="button"
            onClick={addRow}
            className="px-2.5 py-1.5 bg-cozy-orange hover:bg-cozy-orange-hover text-white rounded-xl text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
            title="Append row to bottom"
          >
            <Plus size={11} />
            <span>+ Add Row</span>
          </button>

          <div className="h-5 w-[1px] bg-cozy-border/60 mx-1" />

          <button
            type="button"
            onClick={() => onDuplicate(index)}
            className="p-1.5 text-cozy-text-muted hover:text-cozy-orange hover:bg-[#FDF8F1] rounded-lg transition cursor-pointer"
            title="Duplicate Block"
          >
            <Copy size={13} />
          </button>
          <button
            type="button"
            onClick={() => onDelete(block.id)}
            className="p-1.5 text-cozy-text-muted hover:text-rose-500 hover:bg-rose-50 rounded-lg transition cursor-pointer"
            title="Delete Block"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Spreadsheet grid scrollable viewport */}
      <div className="overflow-x-auto border-2 border-cozy-border rounded-2xl bg-cozy-bg/10 relative">
        <table className="w-full text-xs border-collapse table-fixed select-text">
          <thead>
            <tr className="bg-cozy-bg/50 border-b-2 border-cozy-border">
              
              {/* Extra index column for row deletion / insertions */}
              <th className="w-10 text-center p-1.5 border-r border-cozy-border select-none bg-cozy-bg/30">
                <span className="text-[9px] font-mono text-cozy-text-muted">#</span>
              </th>

              {/* Dynamic Headers */}
              {cols.map((col: string, cIdx: number) => {
                const width = colWidths[cIdx] || 120;
                const isSorted = sortConfig?.colIndex === cIdx;
                const sortDir = sortConfig?.direction;
                
                const type = colTypes[cIdx] || 'text';
                let typeIcon = <Type size={11} className="text-cozy-text-muted" />;
                if (type === 'number') typeIcon = <Hash size={11} className="text-amber-600 font-bold" />;
                if (type === 'rating') typeIcon = <Star size={11} className="text-cozy-yellow fill-cozy-yellow" />;
                if (type === 'checkbox') typeIcon = <CheckSquare size={11} className="text-cozy-green" />;

                return (
                  <th 
                    key={cIdx} 
                    style={{ width: `${width}px` }}
                    className="relative p-2 border-r border-cozy-border font-bold text-cozy-text-dark text-left group/th min-w-[80px] select-none"
                    onMouseEnter={() => setHoveredColIndex(cIdx)}
                    onMouseLeave={() => setHoveredColIndex(null)}
                  >
                    <div className="flex items-center justify-between gap-1 w-full">
                      <div className="flex items-center gap-1 flex-1 overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setActiveTypeDropdown(activeTypeDropdown === cIdx ? null : cIdx)}
                          className="p-1 rounded bg-white hover:bg-cozy-orange/10 border border-cozy-border transition cursor-pointer flex items-center justify-center shrink-0"
                          title="Click to change column data type"
                        >
                          {typeIcon}
                        </button>
                        <input
                          type="text"
                          value={col}
                          onChange={(e) => handleHeaderChange(cIdx, e.target.value)}
                          className="w-full bg-transparent border-none font-extrabold text-cozy-text-dark focus:outline-none focus:ring-0 text-xs py-0.5"
                          title="Double click to edit column name"
                        />
                      </div>
                      
                      {/* Interactive Header utilities: Sort & Delete */}
                      <div className="flex items-center gap-0.5 opacity-0 group-hover/th:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => handleSort(cIdx)}
                          className={`p-1 rounded hover:bg-cozy-orange/20 transition cursor-pointer ${
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
                            className="p-1 rounded text-rose-500 hover:bg-rose-50 transition cursor-pointer"
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
                      className="absolute right-0 top-0 bottom-0 w-[4px] cursor-col-resize hover:bg-cozy-orange/50 active:bg-cozy-orange transition-all z-10"
                      title="Drag to resize column"
                    />

                    {/* Column Type Select Dropdown popover */}
                    {activeTypeDropdown === cIdx && (
                      <div 
                        ref={dropdownRef}
                        className="absolute top-10 left-2 bg-white border-2 border-cozy-border rounded-2xl shadow-md p-1.5 z-30 min-w-[140px] text-xs font-medium space-y-0.5 text-cozy-text-dark text-left"
                      >
                        <div className="text-[9px] uppercase tracking-wider text-cozy-text-muted font-bold px-2 py-1 select-none">
                          Column Type
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            handleColTypeChange(cIdx, 'text');
                            setActiveTypeDropdown(null);
                          }}
                          className={`w-full text-left px-2 py-1.5 rounded-lg flex items-center gap-2 hover:bg-cozy-orange/10 transition cursor-pointer ${type === 'text' ? 'bg-cozy-orange/15 text-cozy-text-dark font-black' : ''}`}
                        >
                          <Type size={11} className="text-cozy-text-muted" />
                          <span>Text</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            handleColTypeChange(cIdx, 'number');
                            setActiveTypeDropdown(null);
                          }}
                          className={`w-full text-left px-2 py-1.5 rounded-lg flex items-center gap-2 hover:bg-cozy-orange/10 transition cursor-pointer ${type === 'number' ? 'bg-cozy-orange/15 text-cozy-text-dark font-black' : ''}`}
                        >
                          <Hash size={11} className="text-amber-600" />
                          <span>Number</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            handleColTypeChange(cIdx, 'rating');
                            setActiveTypeDropdown(null);
                          }}
                          className={`w-full text-left px-2 py-1.5 rounded-lg flex items-center gap-2 hover:bg-cozy-orange/10 transition cursor-pointer ${type === 'rating' ? 'bg-cozy-orange/15 text-cozy-text-dark font-black' : ''}`}
                        >
                          <Star size={11} className="text-cozy-yellow fill-cozy-yellow" />
                          <span>Rating Stars</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            handleColTypeChange(cIdx, 'checkbox');
                            setActiveTypeDropdown(null);
                          }}
                          className={`w-full text-left px-2 py-1.5 rounded-lg flex items-center gap-2 hover:bg-cozy-orange/10 transition cursor-pointer ${type === 'checkbox' ? 'bg-cozy-orange/15 text-cozy-text-dark font-black' : ''}`}
                        >
                          <CheckSquare size={11} className="text-cozy-green" />
                          <span>Checkbox</span>
                        </button>
                      </div>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((row: string[], rIdx: number) => (
              <tr 
                key={rIdx} 
                className="border-b border-cozy-border/40 last:border-b-0 hover:bg-cozy-bg/20 transition-colors group/tr"
                onMouseEnter={() => setHoveredRowIndex(rIdx)}
                onMouseLeave={() => setHoveredRowIndex(null)}
              >
                {/* Index & row actions td */}
                <td className="p-1 border-r border-cozy-border/60 bg-cozy-bg/10 text-center select-none relative h-[36px]">
                  {hoveredRowIndex === rIdx ? (
                    <div className="absolute inset-0 flex items-center justify-center gap-0.5 bg-white/95">
                      <button
                        type="button"
                        onClick={() => insertRowAt(rIdx)}
                        className="p-0.5 rounded hover:bg-cozy-orange/10 text-cozy-orange transition cursor-pointer"
                        title="Insert row above"
                      >
                        <ChevronUp size={11} />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertRowAt(rIdx + 1)}
                        className="p-0.5 rounded hover:bg-cozy-orange/10 text-cozy-orange transition cursor-pointer"
                        title="Insert row below"
                      >
                        <ChevronDown size={11} />
                      </button>
                      {rows.length > 1 && (
                        <button
                          type="button"
                          onClick={() => deleteRow(rIdx)}
                          className="p-0.5 rounded hover:bg-rose-50 text-rose-500 transition cursor-pointer"
                          title="Delete row"
                        >
                          <Trash size={10} />
                        </button>
                      )}
                    </div>
                  ) : (
                    <span className="font-mono text-[9px] text-cozy-text-muted">{rIdx + 1}</span>
                  )}
                </td>

                {/* Grid values inputs based on dynamic type */}
                {row.map((cell: string, cIdx: number) => {
                  const type = colTypes[cIdx] || 'text';

                  return (
                    <td 
                      key={cIdx} 
                      className="p-1 border-r border-cozy-border/40 align-middle"
                    >
                      {type === 'rating' ? (
                        (() => {
                          const ratingVal = parseInt(cell, 10) || 0;
                          return (
                            <div className="flex items-center justify-center gap-0.5 py-1">
                              {[1, 2, 3, 4, 5].map((starNum) => (
                                <button
                                  key={starNum}
                                  type="button"
                                  onClick={() => {
                                    const newVal = ratingVal === starNum ? 0 : starNum;
                                    handleCellChange(rIdx, cIdx, String(newVal));
                                  }}
                                  className="text-amber-400 hover:scale-125 transition cursor-pointer"
                                >
                                  <Star 
                                    size={13} 
                                    fill={starNum <= ratingVal ? '#F6D285' : 'transparent'} 
                                    className={starNum <= ratingVal ? 'text-cozy-yellow' : 'text-cozy-text-muted/30'}
                                  />
                                </button>
                              ))}
                            </div>
                          );
                        })()
                      ) : type === 'checkbox' ? (
                        (() => {
                          const isChecked = cell === 'true';
                          return (
                            <div className="flex items-center justify-center py-1">
                              <button
                                type="button"
                                onClick={() => {
                                  handleCellChange(rIdx, cIdx, isChecked ? 'false' : 'true');
                                }}
                                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition cursor-pointer ${
                                  isChecked 
                                    ? 'bg-cozy-orange border-cozy-orange text-white' 
                                    : 'border-cozy-text-dark/20 hover:border-cozy-orange bg-white'
                                }`}
                              >
                                {isChecked && <Check size={12} className="stroke-[3.5]" />}
                              </button>
                            </div>
                          );
                        })()
                      ) : type === 'number' ? (
                        <input
                          type="text"
                          value={cell}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === '' || /^-?\d*\.?\d*$/.test(val)) {
                              handleCellChange(rIdx, cIdx, val);
                            }
                          }}
                          placeholder="0"
                          className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-cozy-text-dark text-xs px-1.5 py-1 text-right font-mono"
                        />
                      ) : (
                        <input
                          type="text"
                          value={cell}
                          onChange={(e) => handleCellChange(rIdx, cIdx, e.target.value)}
                          className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-cozy-text-dark text-xs px-1.5 py-1"
                          placeholder="..."
                        />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>

          {/* Table Footer with quick aggregate options */}
          <tfoot>
            <tr className="bg-cozy-bg/10 border-t-2 border-cozy-border">
              <td className="p-1 border-r border-cozy-border select-none bg-cozy-bg/30 text-center">
                <span className="font-mono text-[9px] font-bold text-cozy-text-muted">∑</span>
              </td>
              {cols.map((col: string, cIdx: number) => {
                const type = colTypes[cIdx] || 'text';
                const calcType = colCalculations[cIdx] || 'none';

                if (type !== 'number') {
                  return (
                    <td key={cIdx} className="p-1 border-r border-cozy-border/40 bg-cozy-bg/5" />
                  );
                }

                return (
                  <td key={cIdx} className="p-1 border-r border-cozy-border/40 font-mono text-[10px] text-right text-cozy-text-muted bg-cozy-bg/10 align-middle">
                    <div className="flex items-center justify-end gap-1 px-1 group/footer relative">
                      {calcType !== 'none' && (
                        <span className="font-black text-[#D28C5C] text-[10px] uppercase mr-1">
                          {calcType}: {calculateValue(cIdx, calcType)}
                        </span>
                      )}
                      <select
                        value={calcType}
                        onChange={(e) => {
                          const nextCalcs = { ...colCalculations, [cIdx]: e.target.value };
                          onUpdate(block.id, {
                            meta: {
                              ...meta,
                              colCalculations: nextCalcs
                            }
                          });
                        }}
                        className="bg-white border border-cozy-border rounded-lg px-1 py-0.5 text-[9px] font-sans font-bold text-cozy-text-dark cursor-pointer hover:border-cozy-orange focus:outline-none"
                      >
                        <option value="none">Calculate</option>
                        <option value="sum">Sum</option>
                        <option value="avg">Avg</option>
                        <option value="min">Min</option>
                        <option value="max">Max</option>
                      </select>
                    </div>
                  </td>
                );
              })}
            </tr>
          </tfoot>
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
              showToast("Sorting reset 🧹");
            }}
            className="text-cozy-orange font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
          >
            <RotateCcw size={9} />
            <span>Reset sorting</span>
          </button>
        )}
      </div>

    </div>
  );
}
