import type { User } from '@supabase/supabase-js';
import { Loader2, Sparkles, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface AddScaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScaleAdded: () => void;
}

const NOTES = ['DO', 'DO#', 'RE', 'RE#', 'MI', 'FA', 'FA#', 'SOL', 'SOL#', 'LA', 'LA#', 'SI'];
const SCALES = [
  'Dórico',
  'Frígio',
  'Lídio',
  'Mixolídio',
  'Lócrio',
  'Blues',
  'Pentatônica',
  'Harmônica',
  'Melódica',
];
const TYPES = ['Maior', 'Menor'];

export function AddScaleModal({ isOpen, onClose, onScaleAdded }: AddScaleModalProps) {
  const [note, setNote] = useState('DO');
  const [scale, setScale] = useState('Dórico');
  const [type, setType] = useState('Maior');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };

    getUser();
  }, []);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!note || !scale || !type) {
        throw new Error('Por favor, preencha todos os campos');
      }

      if (!user) {
        throw new Error('Você precisa estar autenticado para criar uma escala');
      }

      const scaleName = `${note} ${scale} ${type}`;
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-scale`;

      // Obter token de acesso do usuário autenticado
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          scaleName: scaleName.trim(),
          userId: user.id,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || responseData.message || 'Erro ao gerar escala');
      }

      setNote('DO');
      setScale('Dórico');
      setType('Maior');
      onScaleAdded();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-emerald-400" />
            <h2 className="text-xl font-bold text-white">Gerar Nova Escala</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="note" className="block text-sm font-medium text-slate-300 mb-2">
              Nota
            </label>
            <select
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent cursor-pointer"
            >
              {NOTES.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="scale" className="block text-sm font-medium text-slate-300 mb-2">
              Escala
            </label>
            <select
              id="scale"
              value={scale}
              onChange={(e) => setScale(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent cursor-pointer"
            >
              {SCALES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="type" className="block text-sm font-medium text-slate-300 mb-2">
              Tipo
            </label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent cursor-pointer"
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Gerar com IA
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
