import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Canvas, Rect, Line, Text, Group } from 'fabric';
import { useDesignStore } from '@/stores/designStore';
import { generatePattern } from '@/utils/patternEngine';
import { useTemplates } from '@/hooks/useTemplates';
import Button from '@/components/Button';
import Slider from '@/components/Slider';
import { showToast } from '@/components/Toast';
import STATIC_TEMPLATES from '@/constants/staticTemplates';

const PATTERN_PARAMS = {
  chevron: [
    { key: 'spacing_in', label: 'Row Height', min: 6, max: 24, step: 0.5, default: 12 },
    { key: 'angle_deg', label: 'Angle °', min: 30, max: 60, step: 1, default: 45 },
    { key: 'thickness_in', label: 'Thickness', min: 0.5, max: 1.5, step: 0.25, default: 0.75 },
  ],
  zigzag: [
    { key: 'spacing_in', label: 'Row Height', min: 6, max: 24, step: 0.5, default: 10 },
    { key: 'angle_deg', label: 'Angle °', min: 30, max: 80, step: 1, default: 60 },
    { key: 'thickness_in', label: 'Thickness', min: 0.5, max: 1.5, step: 0.25, default: 0.75 },
  ],
  herringbone: [
    { key: 'tile_w_in', label: 'Board Width', min: 3, max: 12, step: 0.5, default: 6 },
    { key: 'tile_h_in', label: 'Board Length', min: 12, max: 36, step: 1, default: 24 },
    { key: 'angle_deg', label: 'Angle °', min: 30, max: 60, step: 5, default: 45 },
  ],
  'board-batten': [
    { key: 'vertical_spacing_in', label: 'Spacing', min: 8, max: 32, step: 1, default: 16 },
    { key: 'batten_w_in', label: 'Batten Width', min: 1.5, max: 5.5, step: 0.25, default: 3.5 },
    { key: 'rail_height_in', label: 'Rail Height', min: 24, max: 48, step: 1, default: 36 },
  ],
  shiplap: [
    { key: 'board_w_in', label: 'Board Width', min: 3.5, max: 12, step: 0.25, default: 7.25 },
    { key: 'overlap_in', label: 'Overlap', min: 0.25, max: 1.5, step: 0.125, default: 1 },
  ],
  'vertical-slat': [
    { key: 'slat_w_in', label: 'Slat Width', min: 0.75, max: 4, step: 0.25, default: 1.5 },
    { key: 'gap_in', label: 'Gap', min: 0.5, max: 4, step: 0.25, default: 1.5 },
  ],
  diagonal: [
    { key: 'board_w_in', label: 'Board Width', min: 2, max: 8, step: 0.5, default: 3.5 },
    { key: 'angle_deg', label: 'Angle °', min: 20, max: 70, step: 5, default: 45 },
  ],
  hexagon: [
    { key: 'size_in', label: 'Hex Size', min: 4, max: 16, step: 1, default: 8 },
  ],
  'faux-beam': [
    { key: 'beam_w_in', label: 'Beam Width', min: 3.5, max: 12, step: 0.5, default: 5.5 },
    { key: 'spacing_in', label: 'Spacing', min: 12, max: 48, step: 2, default: 24 },
  ],
  wave: [
    { key: 'amplitude_in', label: 'Amplitude', min: 2, max: 8, step: 0.5, default: 4 },
    { key: 'period_in', label: 'Period', min: 12, max: 48, step: 2, default: 24 },
    { key: 'board_w_in', label: 'Board Width', min: 0.5, max: 2, step: 0.25, default: 0.75 },
  ],
  'arched-niche': [
    { key: 'niche_radius_in', label: 'Arch Radius', min: 12, max: 36, step: 1, default: 18 },
    { key: 'grid_spacing_in', label: 'Grid Size', min: 8, max: 24, step: 1, default: 12 },
  ],
  industrial: [
    { key: 'plank_w_in', label: 'Plank Width', min: 4, max: 12, step: 0.5, default: 8 },
    { key: 'pipe_reveal_in', label: 'Gap', min: 0.5, max: 2, step: 0.25, default: 1 },
  ],
  fluted: [
    { key: 'flute_w_in', label: 'Flute Width', min: 0.75, max: 3, step: 0.25, default: 1.5 },
    { key: 'spacing_in', label: 'Spacing', min: 2, max: 8, step: 0.5, default: 4 },
  ],
  diamond: [
    { key: 'size_in', label: 'Diamond Size', min: 4, max: 12, step: 1, default: 6 },
    { key: 'angle_deg', label: 'Angle °', min: 30, max: 60, step: 5, default: 45 },
  ],
  'ledge-shelf': [
    { key: 'shelf_depth_in', label: 'Shelf Depth', min: 6, max: 18, step: 1, default: 12 },
    { key: 'spacing_in', label: 'Shelf Spacing', min: 12, max: 48, step: 2, default: 24 },
  ],
  brick: [
    { key: 'brick_w_in', label: 'Brick Width', min: 4, max: 12, step: 0.5, default: 8 },
    { key: 'brick_h_in', label: 'Brick Height', min: 2, max: 6, step: 0.25, default: 4 },
    { key: 'offset_in', label: 'Row Offset', min: 2, max: 8, step: 0.5, default: 4 },
  ],
  'asym-zig': [
    { key: 'base_spacing_in', label: 'Base Spacing', min: 8, max: 24, step: 1, default: 12 },
    { key: 'variance_in', label: 'Variance', min: 0, max: 6, step: 0.5, default: 3 },
  ],
  wainscot: [
    { key: 'wainscot_height_in', label: 'Wainscot Height', min: 24, max: 60, step: 1, default: 48 },
    { key: 'rail_w_in', label: 'Rail Width', min: 3.5, max: 7, step: 0.25, default: 5.5 },
    { key: 'panel_count', label: 'Panel Count', min: 2, max: 8, step: 1, default: 4 },
  ],
};

const LAYER_COLORS = {
  boards: '#2563eb',
  battens: '#7c3aed',
  rail: '#059669',
  baseboard: '#d97706',
  trim: '#dc2626',
  rip: '#9ca3af',
  background: '#f1f5f9',
};

function PatternCard({ template, isSelected, onClick }) {
  const grad = `from-gray-200 to-gray-400`;
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-lg overflow-hidden border-2 transition-all
        ${isSelected ? 'border-brand-500 shadow-md' : 'border-transparent hover:border-gray-300'}`}
    >
      <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
        <span className="text-xs text-gray-500 font-medium">
          {template.pattern?.type?.replace(/-/g, ' ')}
        </span>
      </div>
      <div className="p-1.5">
        <p className="text-xs font-medium text-gray-700 truncate">{template.name}</p>
      </div>
    </button>
  );
}

export default function PatternDesigner() {
  const navigate = useNavigate();
  const { wallDims, obstacles, pattern, setPattern, undo, redo } = useDesignStore();
  const { save: saveTemplate } = useTemplates();

  const canvasRef = useRef(null);
  const fabricRef = useRef(null);
  const renderTimer = useRef(null);

  const [sideTab, setSideTab] = useState('patterns');
  const [layers, setLayers] = useState(pattern.layers ?? { boards: true, trim: true, baseboard: true, background: true });
  const [params, setParams] = useState(pattern.params ?? {});
  const [saving, setSaving] = useState(false);

  const currentParamDefs = PATTERN_PARAMS[pattern.type] ?? [];

  const getParam = (key) => {
    const def = currentParamDefs.find((d) => d.key === key);
    return params[key] ?? def?.default ?? 0;
  };

  const updateParam = useCallback((key, value) => {
    const next = { ...params, [key]: value };
    setParams(next);
    setPattern({ ...pattern, params: next });
  }, [params, pattern, setPattern]);

  const updateLayer = (key, val) => {
    const next = { ...layers, [key]: val };
    setLayers(next);
    setPattern({ ...pattern, layers: next });
  };

  // Init canvas
  useEffect(() => {
    if (!canvasRef.current) return;
    const el = canvasRef.current;
    const container = el.parentElement;
    el.width = container.clientWidth;
    el.height = container.clientHeight;

    const canvas = new Canvas(el, {
      selection: false,
      allowTouchScrolling: true,
    });
    fabricRef.current = canvas;

    return () => {
      canvas.dispose();
      fabricRef.current = null;
    };
  }, []);

  // Debounced redraw on any parameter change
  const redraw = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    clearTimeout(renderTimer.current);
    renderTimer.current = setTimeout(() => {
      const cw = canvas.width;
      const ch = canvas.height;
      const pad = 32;

      const wallW = wallDims.width_in;
      const wallH = wallDims.height_in;
      const scaleX = (cw - pad * 2) / wallW;
      const scaleY = (ch - pad * 2) / wallH;
      const scale = Math.min(scaleX, scaleY, 3);

      const offX = (cw - wallW * scale) / 2;
      const offY = (ch - wallH * scale) / 2;

      canvas.clear();

      if (layers.background !== false) {
        canvas.add(
          new Rect({
            left: offX,
            top: offY,
            width: wallW * scale,
            height: wallH * scale,
            fill: '#f8fafc',
            stroke: '#94a3b8',
            strokeWidth: 2,
            selectable: false,
            evented: false,
          })
        );
      }

      // Generate pieces
      const pieces = generatePattern(pattern.type, wallDims, params, obstacles);

      pieces.forEach((p) => {
        if (layers[p.layer] === false) return;

        const color = LAYER_COLORS[p.layer] ?? '#3b82f6';
        const rect = new Rect({
          left: offX + p.x_in * scale,
          top: offY + p.y_in * scale,
          width: Math.max(p.w_in * scale, 1),
          height: Math.max(p.h_in * scale, 1),
          fill: color + '30',
          stroke: color,
          strokeWidth: 0.8,
          angle: p.angle_deg,
          originX: 'left',
          originY: 'top',
          selectable: false,
          evented: false,
        });
        canvas.add(rect);
      });

      // Obstacles
      obstacles.forEach((obs) => {
        canvas.add(
          new Rect({
            left: offX + obs.x_in * scale,
            top: offY + obs.y_in * scale,
            width: obs.w_in * scale,
            height: obs.h_in * scale,
            fill: '#94a3b880',
            stroke: '#64748b',
            strokeWidth: 1.5,
            selectable: false,
            evented: false,
          })
        );
      });

      // Wall border on top
      canvas.add(
        new Rect({
          left: offX,
          top: offY,
          width: wallW * scale,
          height: wallH * scale,
          fill: 'transparent',
          stroke: '#475569',
          strokeWidth: 2,
          selectable: false,
          evented: false,
        })
      );

      canvas.renderAll();
    }, 50);
  }, [wallDims, obstacles, pattern, params, layers]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  const handleSelectTemplate = (template) => {
    const newPattern = template.pattern;
    setParams(newPattern.params ?? {});
    setLayers(newPattern.layers ?? { boards: true });
    setPattern(newPattern);
  };

  const handleSaveTemplate = async () => {
    setSaving(true);
    const { error } = await saveTemplate({
      name: `Custom ${pattern.type} ${Date.now()}`,
      type: 'template',
      status: 'draft',
      wall_dims: wallDims,
      obstacles,
      pattern,
      materials: [],
      pricing: {},
      client: null,
    });
    setSaving(false);
    if (error) {
      showToast('Failed to save template', 'error');
    } else {
      showToast('Template saved!', 'success');
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-[100svh] overflow-hidden bg-gray-900">
      {/* Left panel — pattern library */}
      <div className="md:w-52 bg-white border-r border-gray-200 flex flex-col shrink-0 md:h-full">
        <div className="flex border-b border-gray-100">
          {['patterns', 'layers'].map((tab) => (
            <button
              key={tab}
              onClick={() => setSideTab(tab)}
              className={`flex-1 py-2.5 text-xs font-medium capitalize transition-colors
                ${sideTab === tab ? 'text-brand-600 border-b-2 border-brand-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {sideTab === 'patterns' ? (
            <div className="grid grid-cols-2 md:grid-cols-1 gap-2">
              {STATIC_TEMPLATES.map((t) => (
                <PatternCard
                  key={t._key}
                  template={t}
                  isSelected={pattern.type === t.pattern.type && JSON.stringify(pattern.params) === JSON.stringify(t.pattern.params)}
                  onClick={() => handleSelectTemplate(t)}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-2 p-1">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Layers</p>
              {Object.entries(LAYER_COLORS).map(([key, color]) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer min-h-[36px]">
                  <input
                    type="checkbox"
                    checked={layers[key] !== false}
                    onChange={(e) => updateLayer(key, e.target.checked)}
                    className="rounded"
                  />
                  <span
                    className="w-3 h-3 rounded-sm shrink-0"
                    style={{ backgroundColor: color + '60', border: `1.5px solid ${color}` }}
                  />
                  <span className="text-sm text-gray-700 capitalize">{key.replace(/-/g, ' ')}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Center canvas */}
      <div className="flex-1 relative min-h-48 md:min-h-0 overflow-hidden">
        <canvas ref={canvasRef} className="w-full h-full touch-none" />

        {/* Pattern label */}
        <div className="absolute top-3 left-3 bg-black/50 text-white text-xs px-2 py-1 rounded-lg font-medium">
          {pattern.type?.replace(/-/g, ' ')} · {wallDims.width_in / 12}′ × {wallDims.height_in / 12}′
        </div>

        {/* Undo/Redo toolbar */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 bg-black/60 rounded-xl px-3 py-2">
          <button onClick={undo} className="text-white text-sm px-2 min-h-[36px] hover:text-gray-200" title="Undo">↩ Undo</button>
          <button onClick={redo} className="text-white text-sm px-2 min-h-[36px] hover:text-gray-200" title="Redo">↪ Redo</button>
          <button
            onClick={() => showToast('3D preview coming soon!', 'info')}
            className="text-white text-sm px-2 min-h-[36px] hover:text-gray-200"
          >
            3D ✨
          </button>
        </div>
      </div>

      {/* Right panel — settings */}
      <div className="md:w-64 bg-white border-l border-gray-200 flex flex-col shrink-0 md:h-full">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800 text-sm capitalize">
            {pattern.type?.replace(/-/g, ' ')} Settings
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {currentParamDefs.map((def) => (
            <Slider
              key={def.key}
              label={def.label}
              value={getParam(def.key)}
              min={def.min}
              max={def.max}
              step={def.step}
              onChange={(v) => updateParam(def.key, v)}
              format={(v) => `${v}″`}
            />
          ))}

          {currentParamDefs.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">No parameters for this pattern.</p>
          )}
        </div>

        <div className="p-4 border-t border-gray-100 space-y-2">
          <button
            onClick={handleSaveTemplate}
            disabled={saving}
            className="w-full text-sm text-brand-600 hover:text-brand-700 font-medium py-2 rounded-lg hover:bg-brand-50 min-h-[44px]"
          >
            {saving ? 'Saving…' : '💾 Save as Template'}
          </button>
          <Button className="w-full" onClick={() => navigate('/cuts')}>
            Next: Cut List →
          </Button>
        </div>
      </div>

      {/* Mobile top bar */}
      <div className="md:hidden absolute top-0 left-0 right-0 bg-black/70 flex items-center justify-between px-4 py-2 z-20">
        <button onClick={() => navigate('/setup')} className="text-white min-h-[44px] min-w-[44px] flex items-center">
          ←
        </button>
        <span className="text-white text-sm font-medium">Pattern Designer</span>
        <button onClick={() => navigate('/cuts')} className="text-brand-300 text-sm font-semibold min-h-[44px] flex items-center">
          Next →
        </button>
      </div>
    </div>
  );
}
