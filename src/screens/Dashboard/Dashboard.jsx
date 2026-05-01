import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDesigns } from '@/hooks/useDesigns';
import { useTemplates } from '@/hooks/useTemplates';
import { useDesignStore } from '@/stores/designStore';
import { useSessionStore } from '@/stores/sessionStore';
import Button from '@/components/Button';
import Card from '@/components/Card';
import STATIC_TEMPLATES from '@/constants/staticTemplates';

function useInstallPrompt() {
  const [prompt, setPrompt] = useState(null);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const install = async () => {
    if (!prompt) return;
    prompt.prompt();
    await prompt.userChoice;
    setPrompt(null);
  };

  return { canInstall: !!prompt, install };
}

function InstallBanner({ onInstall, onDismiss }) {
  return (
    <div className="bg-brand-600 text-white rounded-xl p-4 flex items-center gap-3 shadow-md">
      <span className="text-2xl shrink-0">🪄</span>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">Add WallWizard to your home screen</p>
        <p className="text-xs text-brand-100 mt-0.5">Works offline · Launches full-screen on iPad</p>
      </div>
      <div className="flex gap-2 shrink-0">
        <button
          onClick={onDismiss}
          className="text-brand-200 hover:text-white text-xs px-2 py-1 rounded min-h-[44px]"
        >
          Later
        </button>
        <button
          onClick={onInstall}
          className="bg-white text-brand-700 text-xs font-semibold px-3 py-1.5 rounded-lg min-h-[44px] hover:bg-brand-50"
        >
          Install
        </button>
      </div>
    </div>
  );
}

const PATTERN_COLORS = {
  chevron: 'from-blue-400 to-blue-600',
  herringbone: 'from-purple-400 to-purple-600',
  'board-batten': 'from-amber-400 to-amber-600',
  shiplap: 'from-teal-400 to-teal-600',
  'vertical-slat': 'from-green-400 to-green-600',
  diagonal: 'from-orange-400 to-orange-600',
  hexagon: 'from-pink-400 to-pink-600',
  'faux-beam': 'from-stone-400 to-stone-600',
  wave: 'from-cyan-400 to-cyan-600',
  'arched-niche': 'from-violet-400 to-violet-600',
  industrial: 'from-zinc-400 to-zinc-600',
  fluted: 'from-rose-400 to-rose-600',
  diamond: 'from-indigo-400 to-indigo-600',
  'ledge-shelf': 'from-lime-400 to-lime-600',
  brick: 'from-red-400 to-red-600',
  'asym-zig': 'from-fuchsia-400 to-fuchsia-600',
  wainscot: 'from-sky-400 to-sky-600',
};

function PatternGradient({ type, name }) {
  const grad = PATTERN_COLORS[type] ?? 'from-gray-400 to-gray-600';
  return (
    <div className={`bg-gradient-to-br ${grad} w-full h-full flex items-center justify-center`}>
      <span className="text-white text-xs font-medium opacity-80 px-2 text-center leading-tight">
        {name}
      </span>
    </div>
  );
}

function JobCard({ design, onOpen }) {
  const profit = design.pricing?.profit ?? 0;
  const patternType = design.pattern?.type ?? '';

  return (
    <Card onClick={onOpen} className="overflow-hidden">
      <div className="aspect-video relative overflow-hidden bg-gray-100">
        {design.thumbnail_url ? (
          <img
            src={design.thumbnail_url}
            alt={design.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <PatternGradient type={patternType} name={design.pattern?.type ?? ''} />
        )}
        <div
          className={`absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full font-medium
          ${design.status === 'quoted' ? 'bg-green-100 text-green-700' : ''}
          ${design.status === 'draft' ? 'bg-gray-100 text-gray-600' : ''}
          ${design.status === 'won' ? 'bg-blue-100 text-blue-700' : ''}
          ${design.status === 'lost' ? 'bg-red-100 text-red-600' : ''}
        `}
        >
          {design.status}
        </div>
      </div>
      <div className="p-3">
        <h3 className="font-semibold text-gray-900 truncate">{design.name}</h3>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-gray-500">
            {design.pattern?.type?.replace(/-/g, ' ') ?? 'No pattern'}
          </span>
          {profit > 0 && (
            <span className="text-xs font-semibold text-green-600">
              ${profit.toFixed(0)} profit
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}

function TemplateCard({ template, onSelect }) {
  const type = template.pattern?.type ?? '';
  return (
    <Card
      onClick={onSelect}
      className="shrink-0 w-36 overflow-hidden"
    >
      <div className="aspect-square overflow-hidden bg-gray-100">
        {template.thumbnail_url ? (
          <img src={template.thumbnail_url} alt={template.name} className="w-full h-full object-cover" />
        ) : (
          <PatternGradient type={type} name={template.name} />
        )}
      </div>
      <div className="p-2">
        <p className="text-xs font-medium text-gray-700 leading-tight truncate">{template.name}</p>
        {template.pricing?.profit > 0 && (
          <p className="text-xs text-green-600 mt-0.5">
            ~${template.pricing.profit.toFixed(0)} profit
          </p>
        )}
      </div>
    </Card>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { list: listJobs } = useDesigns();
  const { list: listTemplates } = useTemplates();
  const { reset, loadDesign, setPattern, setWallDims } = useDesignStore();
  const user = useSessionStore((s) => s.user);
  const { canInstall, install } = useInstallPrompt();

  const [jobs, setJobs] = useState([]);
  const [templates, setTemplates] = useState(STATIC_TEMPLATES);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [installDismissed, setInstallDismissed] = useState(false);

  useEffect(() => {
    (async () => {
      setLoadingJobs(true);
      const { data } = await listJobs('job');
      setJobs(data ?? []);
      setLoadingJobs(false);
    })();
    (async () => {
      const { data } = await listTemplates();
      if (data?.length) setTemplates(data);
    })();
  }, []);

  const handleNewJob = () => {
    reset();
    navigate('/setup');
  };

  const handleOpenJob = (design) => {
    loadDesign(design);
    navigate('/design');
  };

  const handleSelectTemplate = (template) => {
    reset();
    setWallDims(template.wall_dims);
    setPattern(template.pattern);
    navigate('/setup');
  };

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🪄</span>
          <h1 className="text-lg font-bold text-brand-700 md:hidden">WallWizard</h1>
          <h1 className="text-lg font-bold text-gray-900 hidden md:block">Dashboard</h1>
        </div>
        <Button onClick={handleNewJob} size="md">
          + New Job
        </Button>
      </div>

      <div className="p-4 max-w-6xl mx-auto space-y-8">
        {/* Install prompt */}
        {canInstall && !installDismissed && (
          <InstallBanner
            onInstall={install}
            onDismiss={() => setInstallDismissed(true)}
          />
        )}

        {/* Saved Jobs */}
        <section>
          <h2 className="text-base font-semibold text-gray-700 mb-3">Saved Jobs</h2>
          {loadingJobs ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-gray-100 rounded-xl aspect-[4/3] animate-pulse" />
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center">
              <div className="text-5xl mb-4">🏠</div>
              <h3 className="font-semibold text-gray-700 text-lg mb-1">No jobs yet</h3>
              <p className="text-gray-500 text-sm mb-6">
                Start your first job and generate a professional quote in minutes.
              </p>
              <Button onClick={handleNewJob} size="lg">
                Start your first job
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {jobs.map((job) => (
                <JobCard key={job.id} design={job} onOpen={() => handleOpenJob(job)} />
              ))}
            </div>
          )}
        </section>

        {/* Templates */}
        <section>
          <h2 className="text-base font-semibold text-gray-700 mb-3">Pattern Templates</h2>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-4 lg:grid-cols-6 md:overflow-visible">
            {templates.map((t) => (
              <TemplateCard
                key={t.id ?? t._key}
                template={t}
                onSelect={() => handleSelectTemplate(t)}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
