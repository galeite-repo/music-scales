import { useState, useEffect } from 'react';
import { Music, ChevronDown, ChevronUp, Plus, Sparkles } from 'lucide-react';
import { supabase, Scale } from './lib/supabase';
import { AddScaleModal } from './components/AddScaleModal';

function App() {
  const [scales, setScales] = useState<Scale[]>([]);
  const [selectedScale, setSelectedScale] = useState<Scale | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadScales = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('scales')
      .select('*')
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Erro ao carregar escalas:', error);
    } else if (data) {
      setScales(data);
      if (data.length > 0 && !selectedScale) {
        setSelectedScale(data[0]);
      }
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadScales();
  }, []);

  const handleScaleAdded = () => {
    loadScales();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Music className="w-12 h-12 text-emerald-400 animate-pulse mx-auto mb-4" />
          <p className="text-slate-400">Carregando escalas...</p>
        </div>
      </div>
    );
  }

  if (!selectedScale) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Music className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
          <p className="text-slate-400">Nenhuma escala encontrada</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-2xl mx-auto px-4 py-6 pb-20">
        <header className="text-center mb-8 pt-4">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Music className="w-8 h-8 text-emerald-400" />
            <h1 className="text-3xl font-bold text-white">Escalas Musicais</h1>
          </div>
          <p className="text-slate-400 text-sm">Guia de estudo para trompete</p>
        </header>

        <div className="mb-4">
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full bg-emerald-500/20 backdrop-blur-sm border border-emerald-500/50 rounded-xl p-4 flex items-center justify-center gap-2 hover:bg-emerald-500/30 transition-all group"
          >
            <Sparkles className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span className="text-emerald-400 font-semibold">Gerar Nova Escala com IA</span>
            <Plus className="w-5 h-5 text-emerald-400" />
          </button>
        </div>

        <div className="mb-6">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="w-full bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-4 flex items-center justify-between hover:bg-slate-800/70 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${selectedScale.type === 'mixolidio' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <span className="text-white font-semibold text-lg">{selectedScale.name}</span>
              {selectedScale.is_ai_generated && (
                <Sparkles className="w-4 h-4 text-emerald-400" />
              )}
            </div>
            {isMenuOpen ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </button>

          {isMenuOpen && (
            <div className="mt-2 bg-slate-800/90 backdrop-blur-sm border border-slate-700 rounded-xl overflow-hidden shadow-2xl">
              <div className="p-3 bg-slate-900/50 border-b border-slate-700">
                <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold">
                  Todas as Escalas ({scales.length})
                </p>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {scales.map((scale, index) => (
                  <button
                    key={scale.id}
                    onClick={() => {
                      setSelectedScale(scale);
                      setIsMenuOpen(false);
                    }}
                    className={`w-full p-4 flex items-center gap-3 hover:bg-slate-700/50 transition-colors border-b border-slate-700/30 last:border-b-0 ${
                      selectedScale.id === scale.id ? 'bg-slate-700/50' : ''
                    }`}
                  >
                    <span className="text-slate-500 text-sm font-mono w-6">{index + 1}</span>
                    <div className={`w-2 h-2 rounded-full ${scale.type === 'mixolidio' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    <span className={`text-left font-medium flex-1 ${
                      selectedScale.id === scale.id ? 'text-emerald-400' : 'text-slate-300'
                    }`}>
                      {scale.name}
                    </span>
                    {scale.is_ai_generated && (
                      <Sparkles className="w-4 h-4 text-emerald-400/70" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-5 shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-6 bg-emerald-500 rounded-full" />
              <h2 className="text-lg font-semibold text-white">Notas da Escala</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedScale.notes.split(' ').map((note, index) => (
                <span
                  key={index}
                  className="px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white font-mono text-lg"
                >
                  {note}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-5 shadow-lg">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-6 bg-blue-500 rounded-full" />
              <h2 className="text-lg font-semibold text-white">Exercício</h2>
            </div>
            <p className="text-slate-200 font-mono text-lg tracking-wide">{selectedScale.exercise}</p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-5 shadow-lg">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-6 bg-violet-500 rounded-full" />
              <h2 className="text-lg font-semibold text-white">Lick</h2>
            </div>
            <p className="text-slate-200 font-mono text-lg tracking-wide">{selectedScale.lick}</p>
          </div>

          {selectedScale.dominantes && (
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-5 shadow-lg">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-6 bg-orange-500 rounded-full" />
                <h2 className="text-lg font-semibold text-white">Dominantes</h2>
              </div>
              <p className="text-slate-200 font-mono text-lg tracking-wide">{selectedScale.dominantes}</p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4">
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-5 shadow-lg">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-6 bg-cyan-500 rounded-full" />
                <h2 className="text-base font-semibold text-white">Lick Início</h2>
              </div>
              <p className="text-slate-200 font-mono text-lg tracking-wide">{selectedScale.lick_inicio}</p>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-5 shadow-lg">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-6 bg-pink-500 rounded-full" />
                <h2 className="text-base font-semibold text-white">Lick Final</h2>
              </div>
              <p className="text-slate-200 font-mono text-lg tracking-wide">{selectedScale.lick_final}</p>
            </div>
          </div>
        </div>

        <div className="mt-8 p-4 bg-slate-900/50 border border-slate-700 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-slate-300 text-sm">Mixolídio</span>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-slate-300 text-sm">Menor Natural</span>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-3 h-3 text-emerald-400" />
            <span className="text-slate-300 text-sm">Gerada por IA</span>
          </div>
        </div>
      </div>

      <AddScaleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onScaleAdded={handleScaleAdded}
      />
    </div>
  );
}

export default App;
