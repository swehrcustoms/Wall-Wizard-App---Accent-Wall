import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Canvas, Rect, Text, Group } from 'fabric';
import { useDesignStore } from '@/stores/designStore';
import Button from '@/components/Button';
import { showToast } from '@/components/Toast';

const MIN_FT = 4;
const MAX_W_FT = 50;
const MAX_H_FT = 20;

const OBSTACLE_DEFAULTS = {
  outlet: { w_in: 4, h_in: 4, label: 'Outlet', color: '#f59e0b' },
  door: { w_in: 36, h_in: 80, label: 'Door', color: '#3b82f6' },
  window: { w_in: 36, h_in: 48, label: 'Window', color: '#06b6d4' },
};

function inToFtIn(totalIn) {
  const ft = Math.floor(totalIn / 12);
  const inch = Math.round(totalIn % 12);
  return { ft, inch };
}

function ftInToIn(ft, inch) {
  return ft * 12 + inch;
}

export default function WallSetup() {
  const navigate = useNavigate();
  const { wallDims, obstacles, setWallDims, addObstacle, removeObstacle, updateObstacle } =
    useDesignStore();

  const [unit, setUnit] = useState('imperial');
  const [widthFt, setWidthFt] = useState(() => Math.floor(wallDims.width_in / 12));
  const [widthIn, setWidthIn] = useState(() => Math.round(wallDims.width_in % 12));
  const [heightFt, setHeightFt] = useState(() => Math.floor(wallDims.height_in / 12));
  const [heightIn, setHeightIn] = useState(() => Math.round(wallDims.height_in % 12));
  const [widthError, setWidthError] = useState('');
  const [heightError, setHeightError] = useState('');

  const canvasRef = useRef(null);
  const fabricRef = useRef(null);
  const scaleRef = useRef(1);

  const totalWidthIn = ftInToIn(widthFt, widthIn);
  const totalHeightIn = ftInToIn(heightFt, heightIn);
  const isValid =
    !widthError &&
    !heightError &&
    totalWidthIn >= MIN_FT * 12 &&
    totalHeightIn >= MIN_FT * 12;

  // Validate and update store on dimension change
  useEffect(() => {
    const wErr =
      totalWidthIn < MIN_FT * 12
        ? `Width must be at least ${MIN_FT} ft`
        : totalWidthIn > MAX_W_FT * 12
        ? `Width must be at most ${MAX_W_FT} ft`
        : '';
    const hErr =
      totalHeightIn < MIN_FT * 12
        ? `Height must be at least ${MIN_FT} ft`
        : totalHeightIn > MAX_H_FT * 12
        ? `Height must be at most ${MAX_H_FT} ft`
        : '';
    setWidthError(wErr);
    setHeightError(hErr);
    if (!wErr && !hErr) setWallDims({ width_in: totalWidthIn, height_in: totalHeightIn });
  }, [totalWidthIn, totalHeightIn]);

  // Init Fabric canvas
  useEffect(() => {
    if (!canvasRef.current) return;
    const el = canvasRef.current;
    const container = el.parentElement;
    const cw = container.clientWidth || 600;
    const ch = Math.min(cw * 0.55, 320);
    el.width = cw;
    el.height = ch;

    const canvas = new Canvas(el, { selection: true });
    fabricRef.current = canvas;
    canvas.enablePointerEvents = true;

    return () => {
      canvas.dispose();
      fabricRef.current = null;
    };
  }, []);

  // Redraw canvas when dims or obstacles change
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    const cw = canvas.width;
    const ch = canvas.height;
    const pad = 40;

    const wallW = wallDims.width_in;
    const wallH = wallDims.height_in;
    const scaleX = (cw - pad * 2) / wallW;
    const scaleY = (ch - pad * 2) / wallH;
    const scale = Math.min(scaleX, scaleY);
    scaleRef.current = scale;

    const offX = (cw - wallW * scale) / 2;
    const offY = (ch - wallH * scale) / 2;

    canvas.clear();
    canvas.setBackgroundColor('#f8fafc', canvas.renderAll.bind(canvas));

    // Wall background
    const wallRect = new Rect({
      left: offX,
      top: offY,
      width: wallW * scale,
      height: wallH * scale,
      fill: '#e2e8f0',
      stroke: '#94a3b8',
      strokeWidth: 2,
      selectable: false,
      evented: false,
    });
    canvas.add(wallRect);

    // Dimension labels
    const dimStyle = { fontSize: 11, fill: '#64748b', selectable: false, evented: false };
    canvas.add(
      new Text(`${Math.floor(wallW / 12)} ft ${Math.round(wallW % 12)} in`, {
        ...dimStyle,
        left: offX + (wallW * scale) / 2,
        top: offY - 18,
        originX: 'center',
      })
    );
    canvas.add(
      new Text(`${Math.floor(wallH / 12)} ft ${Math.round(wallH % 12)} in`, {
        ...dimStyle,
        left: offX - 4,
        top: offY + (wallH * scale) / 2,
        originX: 'right',
        originY: 'center',
        angle: -90,
      })
    );

    // Obstacles
    obstacles.forEach((obs) => {
      const def = OBSTACLE_DEFAULTS[obs.type] ?? OBSTACLE_DEFAULTS.outlet;
      const r = new Rect({
        left: offX + obs.x_in * scale,
        top: offY + obs.y_in * scale,
        width: obs.w_in * scale,
        height: obs.h_in * scale,
        fill: def.color + '55',
        stroke: def.color,
        strokeWidth: 1.5,
        cornerSize: 8,
        cornerStyle: 'circle',
        transparentCorners: false,
        data: { id: obs.id, type: obs.type },
      });

      const lbl = new Text(def.label, {
        fontSize: 10,
        fill: '#1e293b',
        originX: 'center',
        originY: 'center',
        left: (obs.w_in * scale) / 2,
        top: (obs.h_in * scale) / 2,
        selectable: false,
        evented: false,
      });

      const grp = new Group([r, lbl], {
        left: offX + obs.x_in * scale,
        top: offY + obs.y_in * scale,
        data: { id: obs.id },
      });

      grp.on('modified', () => {
        const newX = Math.max(0, Math.min((grp.left - offX) / scale, wallW - obs.w_in));
        const newY = Math.max(0, Math.min((grp.top - offY) / scale, wallH - obs.h_in));
        updateObstacle(obs.id, { x_in: +newX.toFixed(1), y_in: +newY.toFixed(1) });
      });

      canvas.add(grp);
    });

    canvas.renderAll();

    // Delete selected obstacle on Delete/Backspace
    const handleKey = (e) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const active = canvas.getActiveObject();
        if (active?.data?.id) {
          removeObstacle(active.data.id);
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [wallDims, obstacles]);

  const handleDropObstacle = (type) => {
    const def = OBSTACLE_DEFAULTS[type];
    const newObs = {
      id: `obs-${Date.now()}`,
      type,
      x_in: (wallDims.width_in - def.w_in) / 2,
      y_in: (wallDims.height_in - def.h_in) / 2,
      w_in: def.w_in,
      h_in: def.h_in,
    };
    addObstacle(newObs);
    showToast(`${def.label} added — drag to position`, 'info');
  };

  const handleMetric = (totalIn) => {
    const cm = (totalIn * 2.54).toFixed(0);
    return `${cm} cm`;
  };

  return (
    <div className="min-h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 flex items-center gap-3 sticky top-0 z-20">
        <button
          onClick={() => navigate('/')}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          ←
        </button>
        <h1 className="text-base font-semibold text-gray-900">Wall Setup</h1>
        <div className="ml-auto flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setUnit(unit === 'imperial' ? 'metric' : 'imperial')}
          >
            {unit === 'imperial' ? 'Switch to Metric' : 'Switch to Imperial'}
          </Button>
        </div>
      </div>

      <div className="p-4 max-w-2xl mx-auto space-y-6">
        {/* Dimensions */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-5">
          <h2 className="font-semibold text-gray-800">Wall Dimensions</h2>

          {/* Width */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Width</label>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={0}
                  max={MAX_W_FT}
                  value={widthFt}
                  onChange={(e) => setWidthFt(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-16 px-2 py-2 border border-gray-300 rounded-lg text-center text-sm"
                />
                <span className="text-sm text-gray-500">ft</span>
              </div>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={0}
                  max={11}
                  value={widthIn}
                  onChange={(e) => setWidthIn(Math.max(0, Math.min(11, parseInt(e.target.value) || 0)))}
                  className="w-16 px-2 py-2 border border-gray-300 rounded-lg text-center text-sm"
                />
                <span className="text-sm text-gray-500">in</span>
              </div>
              {unit === 'metric' && (
                <span className="text-sm text-gray-400">{handleMetric(totalWidthIn)}</span>
              )}
            </div>
            <input
              type="range"
              min={MIN_FT * 12}
              max={MAX_W_FT * 12}
              value={totalWidthIn}
              onChange={(e) => {
                const v = parseInt(e.target.value);
                setWidthFt(Math.floor(v / 12));
                setWidthIn(v % 12);
              }}
              className="w-full mt-2 accent-brand-600"
            />
            {widthError && <p className="text-red-600 text-xs mt-1">{widthError}</p>}
          </div>

          {/* Height */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Height</label>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={0}
                  max={MAX_H_FT}
                  value={heightFt}
                  onChange={(e) => setHeightFt(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-16 px-2 py-2 border border-gray-300 rounded-lg text-center text-sm"
                />
                <span className="text-sm text-gray-500">ft</span>
              </div>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={0}
                  max={11}
                  value={heightIn}
                  onChange={(e) => setHeightIn(Math.max(0, Math.min(11, parseInt(e.target.value) || 0)))}
                  className="w-16 px-2 py-2 border border-gray-300 rounded-lg text-center text-sm"
                />
                <span className="text-sm text-gray-500">in</span>
              </div>
              {unit === 'metric' && (
                <span className="text-sm text-gray-400">{handleMetric(totalHeightIn)}</span>
              )}
            </div>
            <input
              type="range"
              min={MIN_FT * 12}
              max={MAX_H_FT * 12}
              value={totalHeightIn}
              onChange={(e) => {
                const v = parseInt(e.target.value);
                setHeightFt(Math.floor(v / 12));
                setHeightIn(v % 12);
              }}
              className="w-full mt-2 accent-brand-600"
            />
            {heightError && <p className="text-red-600 text-xs mt-1">{heightError}</p>}
          </div>
        </div>

        {/* Obstacles */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">Add Obstacles</h2>
            <span className="text-xs text-gray-400">Tap to add, drag to position</span>
          </div>

          <div className="flex gap-2 flex-wrap">
            {Object.entries(OBSTACLE_DEFAULTS).map(([type, def]) => (
              <button
                key={type}
                onClick={() => handleDropObstacle(type)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200
                  hover:bg-gray-50 text-sm font-medium min-h-[44px] transition-colors"
                style={{ borderColor: def.color + '80', color: def.color }}
              >
                <span
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: def.color + '55', border: `1.5px solid ${def.color}` }}
                />
                {def.label}
              </button>
            ))}
          </div>

          {/* Canvas */}
          <div className="relative rounded-lg overflow-hidden border border-gray-200 bg-slate-100">
            <canvas ref={canvasRef} className="w-full touch-none" />
            {obstacles.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-gray-400 text-sm">Wall preview — tap above to add obstacles</span>
              </div>
            )}
          </div>

          {obstacles.length > 0 && (
            <div className="space-y-1">
              {obstacles.map((obs) => {
                const def = OBSTACLE_DEFAULTS[obs.type];
                return (
                  <div
                    key={obs.id}
                    className="flex items-center justify-between text-sm py-1 px-2 rounded hover:bg-gray-50"
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-sm"
                        style={{
                          backgroundColor: def?.color + '55',
                          border: `1.5px solid ${def?.color}`,
                        }}
                      />
                      <span>{def?.label} — {obs.w_in}″ × {obs.h_in}″</span>
                    </span>
                    <button
                      onClick={() => removeObstacle(obs.id)}
                      className="text-red-400 hover:text-red-600 px-2 py-1 rounded min-h-[44px] min-w-[44px] flex items-center justify-center"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 py-3 flex justify-between gap-3 md:static">
        <Button variant="secondary" onClick={() => navigate('/')}>
          Back
        </Button>
        <Button disabled={!isValid} onClick={() => navigate('/design')}>
          Next: Pattern →
        </Button>
      </div>
    </div>
  );
}
