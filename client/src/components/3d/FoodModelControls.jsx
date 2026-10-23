import React from 'react';
import { RotateCcw, Play, Pause, ZoomIn, ZoomOut, Image as ImageIcon, Box, HelpCircle } from 'lucide-react';

/**
 * FoodModelControls
 * Accessible interactive controls for the 3D food model viewer.
 * Provides controls for auto-spin, reset camera view, zoom in/out, and switching to 2D photo.
 */
export const FoodModelControls = ({
  viewMode = '3d',
  onToggleViewMode,
  isAutoRotating = true,
  onToggleAutoRotate,
  onResetView,
  onZoomIn,
  onZoomOut,
  zoomLevel = 100,
  className = ''
}) => {
  return (
    <>
      {/* Top Left Control Bar: Mode Toggle & Camera Actions */}
      <div className={`absolute top-3 left-3 z-20 flex items-center gap-1.5 ${className}`}>
        {/* Toggle 3D / Photo Mode */}
        {onToggleViewMode && (
          <button
            type="button"
            id="food-viewer-mode-toggle-btn"
            onClick={onToggleViewMode}
            aria-label={viewMode === '3d' ? 'Switch to High-Resolution Photo' : 'Switch to 3D Model View'}
            title={viewMode === '3d' ? 'Switch to High-Resolution Photo' : 'Switch to 3D Model View'}
            className="px-3 py-1.5 rounded-full bg-black/80 backdrop-blur-md border border-white/20 hover:border-amber-400 text-xs text-white font-medium flex items-center gap-1.5 shadow-md transition-colors cursor-pointer"
          >
            {viewMode === '3d' ? (
              <>
                <ImageIcon size={13} className="text-amber-400" />
                <span>Photo</span>
              </>
            ) : (
              <>
                <Box size={13} className="text-amber-400" />
                <span>3D View</span>
              </>
            )}
          </button>
        )}

        {viewMode === '3d' && onToggleAutoRotate && (
          /* Auto-Rotation Toggle */
          <button
            type="button"
            id="food-viewer-autorotate-btn"
            onClick={onToggleAutoRotate}
            aria-label={isAutoRotating ? 'Pause 3D rotation' : 'Start 3D auto-rotation'}
            title={isAutoRotating ? 'Pause Auto-Spin' : 'Start Auto-Spin'}
            className={`p-1.5 rounded-full backdrop-blur-md border text-xs shadow-md transition-colors cursor-pointer ${
              isAutoRotating
                ? 'bg-amber-400/25 border-amber-400/50 text-amber-300'
                : 'bg-black/80 border-white/20 text-slate-300 hover:text-white'
            }`}
          >
            {isAutoRotating ? <Pause size={14} /> : <Play size={14} />}
          </button>
        )}

        {/* Reset View Button */}
        {onResetView && (
          <button
            type="button"
            id="food-viewer-reset-btn"
            onClick={onResetView}
            aria-label={viewMode === '3d' ? "Reset 3D camera view" : "Reset photo view"}
            title="Reset View (R)"
            className="p-1.5 rounded-full bg-black/80 backdrop-blur-md border border-white/20 hover:border-amber-400/60 text-slate-300 hover:text-white text-xs shadow-md transition-colors cursor-pointer"
          >
            <RotateCcw size={14} />
          </button>
        )}

        {/* Controlled Zoom In & Out */}
        {onZoomOut && (
          <button
            type="button"
            id="food-viewer-zoomout-btn"
            onClick={onZoomOut}
            aria-label="Zoom out of 3D food model"
            title="Zoom Out (-)"
            className="p-1.5 rounded-full bg-black/80 backdrop-blur-md border border-white/20 hover:border-amber-400/60 text-slate-300 hover:text-white text-xs shadow-md transition-colors cursor-pointer"
          >
            <ZoomOut size={14} />
          </button>
        )}

        {/* Zoom Level Indicator */}
        <span
          id="food-viewer-zoom-level-badge"
          className="px-2 py-1 rounded-full bg-black/80 border border-white/10 text-[10px] font-mono font-bold text-amber-300 min-w-[42px] text-center shadow-md select-none"
        >
          {zoomLevel}%
        </span>

        {onZoomIn && (
          <button
            type="button"
            id="food-viewer-zoomin-btn"
            onClick={onZoomIn}
            aria-label="Zoom in on 3D food model"
            title="Zoom In (+)"
            className="p-1.5 rounded-full bg-black/80 backdrop-blur-md border border-white/20 hover:border-amber-400/60 text-slate-300 hover:text-white text-xs shadow-md transition-colors cursor-pointer"
          >
            <ZoomIn size={14} />
          </button>
        )}
      </div>

      {/* Bottom Hint Banner for 3D View */}
      {viewMode === '3d' && (
        <div
          role="note"
          aria-label="3D Interaction Guidance"
          className="absolute bottom-2.5 left-3 right-3 z-10 flex items-center justify-between text-[11px] text-slate-300 px-3 py-1.5 rounded-xl bg-black/80 backdrop-blur-md border border-white/10 pointer-events-none shadow-md"
        >
          <div className="flex items-center gap-1.5 text-amber-300 font-semibold truncate">
            <Box size={13} className="shrink-0" />
            <span className="truncate">360° Interactive 3D Model</span>
          </div>
          <span className="text-[10px] text-slate-400 italic shrink-0 hidden xs:inline ml-2">
            Drag to orbit • Scroll to zoom • Press R to reset
          </span>
        </div>
      )}
    </>
  );
};
