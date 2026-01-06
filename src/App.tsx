import type { User } from '@supabase/supabase-js';
import { ChevronDown, ChevronUp, LogOut, Music, Plus, Sparkles, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AddScaleModal } from './components/AddScaleModal';
import { Login } from './components/Login';
import { Scale, supabase } from './lib/supabase';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);
  const [scales, setScales] = useState<Scale[]>([]);
  const [selectedScale, setSelectedScale] = useState<Scale | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Verificar autenticação ao carregar
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      setIsUserLoading(false);
    };

    checkAuth();

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const loadScales = async () => {
    if (!user) return;
    
    setIsLoading(true);
    const { data, error } = await supabase
      .from('scales')
      .select('*')
      .eq('user_id', user.id)
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
    if (user) {
      loadScales();
    }
  }, [user]);

  const handleScaleAdded = async () => {
    if (!user) return;
    
    setIsLoading(true);
    const { data, error } = await supabase
      .from('scales')
      .select('*')
      .eq('user_id', user.id)
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Erro ao carregar escalas:', error);
    } else if (data && data.length > 0) {
      setScales(data);
      // Seleciona a última escala adicionada (com maior order_index)
      setSelectedScale(data[data.length - 1]);
    }
    setIsLoading(false);
  };

  const handleDeleteScale = async (scaleId: string) => {
    if (!user) return;
    if (!confirm('Tem certeza que deseja deletar esta escala?')) {
      return;
    }

    const { error } = await supabase
      .from('scales')
      .delete()
      .eq('id', scaleId)
      .eq('user_id', user.id);

    if (error) {
      alert('Erro ao deletar escala: ' + error.message);
    } else {
      setIsLoading(true);
      const { data, error: fetchError } = await supabase
        .from('scales')
        .select('*')
        .eq('user_id', user.id)
        .order('order_index', { ascending: true });

      if (fetchError) {
        console.error('Erro ao carregar escalas:', fetchError);
      } else if (data && data.length > 0) {
        setScales(data);
        // Se a escala deletada era a selecionada, seleciona a primeira disponível
        if (selectedScale?.id === scaleId) {
          setSelectedScale(data[0]);
        }
      } else {
        // Se não há mais escalas
        setScales([]);
        setSelectedScale(null);
      }
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setScales([]);
    setSelectedScale(null);
  };

  // Mostrar a página de login se o usuário não estiver autenticado
  if (isUserLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Music className="w-12 h-12 text-emerald-400 animate-pulse mx-auto mb-4" />
          <p className="text-slate-400">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login onLoginSuccess={() => {}} />;
  }

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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="max-w-2xl mx-auto px-4 py-6 pb-20 min-h-screen flex flex-col items-center justify-center">
          {/* Logo e Titulo */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-6">
              <Music className="w-16 h-16 text-emerald-400 animate-pulse" />
              <h1 className="text-4xl font-bold text-white">Escalas Musicais</h1>
            </div>
            <p className="text-slate-300 text-lg mb-2">Guia de estudo de escalas</p>
            <p className="text-slate-400">Domine escalas e licks com IA gerado</p>
          </div>

          {/* Conteúdo de Boas-vindas */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 max-w-lg w-full mb-8 shadow-2xl">
            <div className="text-center mb-8">
              <Sparkles className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-3">Bem-vindo!</h2>
              <p className="text-slate-300 text-base leading-relaxed">
                Você ainda não tem nenhuma escala. Crie sua primeira escala agora e comece a estudar!
              </p>
            </div>

            <div className="space-y-3 mb-8 text-slate-300 text-sm">
              <div className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                <span>Gere escalas musicais com IA</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                <span>Receba exercícios e licks personalizados</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                <span>Organize seu estudo de forma inteligente</span>
              </div>
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold rounded-xl px-6 py-4 flex items-center justify-center gap-3 transition-all group shadow-lg"
            >
              <Sparkles className="w-5 h-5 group-hover:scale-110 transition-transform" />
              Criar Primeira Escala
              <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </button>
          </div>

          {/* Rodapé com dica */}
          <p className="text-slate-400 text-sm text-center">
            Comece digitando o nome de uma escala, por exemplo: <br />
            <span className="text-emerald-400 font-semibold">DO Mixolídio, LA Menor, SOL Blues</span>
          </p>
        </div>

        <AddScaleModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onScaleAdded={handleScaleAdded}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-2xl mx-auto px-4 py-6 pb-20">
        <header className="mb-10">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="inline-flex items-center justify-center gap-3 p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/30">
              <Music className="w-8 h-8 text-emerald-400" />
              <h1 className="text-3xl font-bold text-white">Escalas Musicais</h1>
            </div>
            
            <button
              onClick={handleLogout}
              className="p-3 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-slate-200 transition-all"
              title="Sair"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
          
          <p className="text-slate-300 text-base text-center">Guia de estudo de escalas</p>
        </header>

        <div className="mb-6">
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full bg-gradient-to-r from-emerald-500/30 to-emerald-600/20 backdrop-blur-sm border border-emerald-500/50 rounded-xl p-4 flex items-center justify-center gap-2 hover:from-emerald-500/40 hover:to-emerald-600/30 transition-all group shadow-lg hover:shadow-emerald-500/20"
          >
            <Sparkles className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span className="text-emerald-300 font-semibold">Gerar Nova Escala com IA</span>
            <Plus className="w-5 h-5 text-emerald-400 group-hover:rotate-90 transition-transform" />
          </button>
        </div>
        <div className="mb-6">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="w-full bg-gradient-to-r from-slate-800/60 to-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-5 flex items-center justify-between hover:from-slate-800/80 hover:to-slate-800/60 transition-all group shadow-lg"
          >
            <div className="flex items-center gap-4">
              <div className={`w-3 h-3 rounded-full ${selectedScale.type === 'mixolidio' ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`} />
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold mb-1">Escala Atual</p>
                <span className="text-white font-bold text-lg group-hover:text-emerald-400 transition-colors">{selectedScale.name}</span>
              </div>
              {selectedScale.is_ai_generated && (
                <Sparkles className="w-4 h-4 text-emerald-400" />
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteScale(selectedScale.id);
                }}
                className="p-2 text-slate-400 hover:text-red-400 transition-colors hover:bg-red-500/20 rounded-lg"
                title="Deletar escala"
              >
                <Trash2 className="w-5 h-5" />
              </button>
              {isMenuOpen ? (
                <ChevronUp className="w-5 h-5 text-slate-400 group-hover:text-emerald-400 transition-colors" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-400 group-hover:text-emerald-400 transition-colors" />
              )}
            </div>
          </button>

          {isMenuOpen && (
            <div className="mt-3 bg-slate-800/95 backdrop-blur-sm border border-slate-700/50 rounded-2xl overflow-hidden shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="p-4 bg-gradient-to-r from-slate-900/50 to-slate-800/30 border-b border-slate-700/30">
                <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">
                  📚 Todas as Escalas ({scales.length})
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
                    className={`w-full p-4 flex items-center gap-3 hover:bg-slate-700/50 transition-colors border-b border-slate-700/30 last:border-b-0 group ${
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
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteScale(scale.id);
                      }}
                      className="p-1 text-slate-400 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                      title="Deletar escala"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div className="bg-gradient-to-br from-slate-800/60 to-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 shadow-lg hover:shadow-emerald-500/10 transition-shadow">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-1.5 h-7 bg-gradient-to-b from-emerald-400 to-emerald-600 rounded-full" />
              <h2 className="text-lg font-bold text-white">Notas da Escala</h2>
            </div>
            <div className="flex gap-2 nowrap overflow-x-auto pb-2 scrollbar-hide">
              {selectedScale.notes.split(' ').map((note, index) => (
                <span
                  key={index}
                  className="px-2.5 py-1.5 bg-gradient-to-b from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30 rounded-lg text-emerald-200 font-bold text-xs whitespace-nowrap hover:from-emerald-500/30 hover:to-emerald-600/20 transition-all flex-shrink-0"
                >
                  {note}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-800/60 to-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 shadow-lg hover:shadow-blue-500/10 transition-shadow">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-1.5 h-7 bg-gradient-to-b from-blue-400 to-blue-600 rounded-full" />
              <h2 className="text-lg font-bold text-white">Exercício</h2>
            </div>
            <p className="text-slate-100 font-mono text-lg tracking-widest bg-slate-900/40 p-4 rounded-lg border border-slate-700/30">{selectedScale.exercise}</p>
          </div>

          <div className="bg-gradient-to-br from-slate-800/60 to-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 shadow-lg hover:shadow-violet-500/10 transition-shadow">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-1.5 h-7 bg-gradient-to-b from-violet-400 to-violet-600 rounded-full" />
              <h2 className="text-lg font-bold text-white">Lick</h2>
            </div>
            <p className="text-slate-100 font-mono text-lg tracking-widest bg-slate-900/40 p-4 rounded-lg border border-slate-700/30">{selectedScale.lick}</p>
          </div>

          {selectedScale.dominantes && (
            <div className="bg-gradient-to-br from-slate-800/60 to-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 shadow-lg hover:shadow-orange-500/10 transition-shadow">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-1.5 h-7 bg-gradient-to-b from-orange-400 to-orange-600 rounded-full" />
                <h2 className="text-lg font-bold text-white">Dominantes</h2>
              </div>
              <p className="text-slate-100 font-mono text-lg tracking-widest bg-slate-900/40 p-4 rounded-lg border border-slate-700/30">{selectedScale.dominantes}</p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-5">
            <div className="bg-gradient-to-br from-slate-800/60 to-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 shadow-lg hover:shadow-cyan-500/10 transition-shadow">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-1.5 h-7 bg-gradient-to-b from-cyan-400 to-cyan-600 rounded-full" />
                <h2 className="text-lg font-bold text-white">Lick Início</h2>
              </div>
              <p className="text-slate-100 font-mono text-lg tracking-widest bg-slate-900/40 p-4 rounded-lg border border-slate-700/30">{selectedScale.lick_inicio}</p>
            </div>

            <div className="bg-gradient-to-br from-slate-800/60 to-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 shadow-lg hover:shadow-pink-500/10 transition-shadow">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-1.5 h-7 bg-gradient-to-b from-pink-400 to-pink-600 rounded-full" />
                <h2 className="text-lg font-bold text-white">Lick Final</h2>
              </div>
              <p className="text-slate-100 font-mono text-lg tracking-widest bg-slate-900/40 p-4 rounded-lg border border-slate-700/30">{selectedScale.lick_final}</p>
            </div>
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
