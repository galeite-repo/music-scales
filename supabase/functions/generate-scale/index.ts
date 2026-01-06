import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface RequestBody {
  scaleName: string;
  userId: string;
  note?: string;
  scale?: string;
  type?: string;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const body: RequestBody = await req.json();
    const { userId, note, scale, type } = body;
    let { scaleName } = body;

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Se receber os novos parâmetros (note, scale, type), construir scaleName
    if (note && scale && type) {
      scaleName = `${note} ${scale} ${type}`;
    } else if (!scaleName) {
      return new Response(
        JSON.stringify({ error: 'scaleName ou (note, scale, type) são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const groqApiKey = Deno.env.get('GROQ_API_KEY');
    if (!groqApiKey) {
      throw new Error('GROQ_API_KEY não configurada');
    }

    const prompt = `


Você é um gerador de dados musicais em formato JSON. Receba uma entrada no formato "TOM ESCALA TIPO" (ex: "DO BLUES MAIOR") e gere um JSON com esta estrutura exata:

{
  "name": "NOME DA ESCALA EM MAIÚSCULAS",
  "type": "MAIOR | MENOR",
  "notes": "NOTAS SEPARADAS POR ESPAÇO",
  "exercise": "5 NOTAS",
  "lick": "4 A 6 NOTAS",
  "dominantes": "4 NOTAS OU \"\"",
  "lick_inicio": "5 A 8 NOTAS",
  "lick_final": "5 A 8 NOTAS TERMINANDO NA TÔNICA"
}

REGRAS:
1. Consulte a TABELA DE REFERÊNCIA abaixo para as notas corretas de cada escala
2. SEMPRE converta bemóis (b) para sustenidos (#) na saída
3. Se a escala não tem variação maior/menor (ex: Blues, Pentatônica), ignore o tipo da entrada
4. "notes": use exatamente as notas da tabela de referência (convertidas para sustenido)

5. "exercise": crie um exercício técnico de 5 notas que explore INTERVALOS da escala (não sequencial):
   - Use saltos de terças, quartas ou quintas
   - Exemplo: em vez de "DÓ RÉ MI FÁ SOL", faça "DÓ MI SOL MI DÓ" ou "DÓ FÁ RÉ SOL MI"
   - Foque em desenvolver digitação e reconhecimento de intervalos
   - Pode repetir notas para criar padrões melódicos

6. "lick": frase idiomática de 4-6 notas com RITMO e MUSICALIDADE:
   - Use cromatismos, bends, slides típicos da escala (indique com ~ quando apropriado)
   - Inclua movimentos não-lineares: saltos, appoggiaturas, notas de passagem
   - Para Blues: use blue notes e cromatismos (ex: "DÓ RÉ# FÁ FÁ# SOL")
   - Para Pentatônica: use bends e slides característicos
   - Para Modos: explore as notas características (ex: Lídio enfatize a #4)
   - Crie frases que soem naturais para improvisação

7. "dominantes": acorde dominante de 4 notas (fundamental, terça maior, quinta, sétima menor) se aplicável à escala, senão ""

8. "lick_inicio": frase de abertura de 5-8 notas que SUBA ou EXPANDA melodicamente:
   - Deve criar tensão e expectativa
   - Use arpejos, sequências ascendentes, ou padrões que levem a um clímax
   - Não seja apenas ascendente linear - use saltos e direções variadas
   
9. "lick_final": frase de encerramento de 5-8 notas que RESOLVA na tônica:
   - Deve criar sensação de conclusão
   - Use resolução melódica típica (ex: dominante → tônica, leading tone → tônica)
   - Últimas 2-3 notas devem guiar claramente para a tônica
   - DEVE terminar na nota tônica (primeira nota da escala)
10. Retorne APENAS o JSON, sem explicações

TABELA DE REFERÊNCIA:
TABELA DE REFERÊNCIA COMPLETA DE ESCALAS
🔹 PENTATÔNICA MENOR
Fórmula: 1, ♭3, 4, 5, ♭7

DÓ PENTATÔNICA MENOR: DÓ RÉ# FÁ SOL LÁ#
DÓ# PENTATÔNICA MENOR: DÓ# MI FÁ# SOL# SI
RÉ PENTATÔNICA MENOR: RÉ FÁ SOL LÁ DÓ
RÉ# PENTATÔNICA MENOR: RÉ# FÁ# SOL# LÁ# DÓ#
MI PENTATÔNICA MENOR: MI SOL LÁ SI RÉ
FÁ PENTATÔNICA MENOR: FÁ SOL# LÁ# DÓ RÉ#
FÁ# PENTATÔNICA MENOR: FÁ# LÁ SI DÓ# MI
SOL PENTATÔNICA MENOR: SOL LÁ# DÓ RÉ FÁ
SOL# PENTATÔNICA MENOR: SOL# SI DÓ# RÉ# FÁ#
LÁ PENTATÔNICA MENOR: LÁ DÓ RÉ MI SOL
LÁ# PENTATÔNICA MENOR: LÁ# DÓ# RÉ# FÁ SOL#
SI PENTATÔNICA MENOR: SI RÉ MI FÁ# LÁ


🔹 PENTATÔNICA MAIOR
Fórmula: 1, 2, 3, 5, 6

DÓ PENTATÔNICA MAIOR: DÓ RÉ MI SOL LÁ
DÓ# PENTATÔNICA MAIOR: DÓ# RÉ# FÁ SOL# LÁ#
RÉ PENTATÔNICA MAIOR: RÉ MI FÁ# LÁ SI
RÉ# PENTATÔNICA MAIOR: RÉ# FÁ SOL LÁ# DÓ
MI PENTATÔNICA MAIOR: MI FÁ# SOL# SI DÓ#
FÁ PENTATÔNICA MAIOR: FÁ SOL LÁ DÓ RÉ
FÁ# PENTATÔNICA MAIOR: FÁ# SOL# LÁ# DÓ# RÉ#
SOL PENTATÔNICA MAIOR: SOL LÁ SI RÉ MI
SOL# PENTATÔNICA MAIOR: SOL# LÁ# DÓ RÉ# FÁ
LÁ PENTATÔNICA MAIOR: LÁ SI DÓ# MI FÁ#
LÁ# PENTATÔNICA MAIOR: LÁ# DÓ RÉ FÁ SOL
SI PENTATÔNICA MAIOR: SI DÓ# RÉ# FÁ# SOL#


🔹 BLUES
Fórmula: 1, ♭3, 4, ♭5, 5, ♭7

DÓ BLUES: DÓ RÉ# FÁ FÁ# SOL LÁ#
DÓ# BLUES: DÓ# MI FÁ# SOL SOL# SI
RÉ BLUES: RÉ FÁ SOL SOL# LÁ DÓ
RÉ# BLUES: RÉ# FÁ# SOL# LÁ LÁ# DÓ#
MI BLUES: MI SOL LÁ LÁ# SI RÉ
FÁ BLUES: FÁ SOL# LÁ# SI DÓ RÉ#
FÁ# BLUES: FÁ# LÁ SI DÓ DÓ# MI
SOL BLUES: SOL LÁ# DÓ DÓ# RÉ FÁ
SOL# BLUES: SOL# SI DÓ# RÉ RÉ# FÁ#
LÁ BLUES: LÁ DÓ RÉ RÉ# MI SOL
LÁ# BLUES: LÁ# DÓ# RÉ# MI FÁ SOL#
SI BLUES: SI RÉ MI FÁ FÁ# LÁ


🔹 DÓRICO
Fórmula: 1, 2, ♭3, 4, 5, 6, ♭7

DÓ DÓRICO: DÓ RÉ RÉ# FÁ SOL LÁ LÁ#
DÓ# DÓRICO: DÓ# RÉ# MI FÁ# SOL# LÁ# SI
RÉ DÓRICO: RÉ MI FÁ SOL LÁ SI DÓ
RÉ# DÓRICO: RÉ# FÁ FÁ# SOL# LÁ# DÓ DÓ#
MI DÓRICO: MI FÁ# SOL LÁ SI DÓ# RÉ
FÁ DÓRICO: FÁ SOL SOL# LÁ# DÓ RÉ RÉ#
FÁ# DÓRICO: FÁ# SOL# LÁ SI DÓ# RÉ# MI
SOL DÓRICO: SOL LÁ LÁ# DÓ RÉ MI FÁ
SOL# DÓRICO: SOL# LÁ# SI DÓ# RÉ# FÁ FÁ#
LÁ DÓRICO: LÁ SI DÓ RÉ MI FÁ# SOL
LÁ# DÓRICO: LÁ# DÓ DÓ# RÉ# FÁ SOL SOL#
SI DÓRICO: SI DÓ# RÉ MI FÁ# SOL# LÁ


🔹 FRÍGIO
Fórmula: 1, ♭2, ♭3, 4, 5, ♭6, ♭7

DÓ FRÍGIO: DÓ DÓ# RÉ# FÁ SOL SOL# LÁ#
DÓ# FRÍGIO: DÓ# RÉ MI FÁ# SOL# LÁ SI
RÉ FRÍGIO: RÉ RÉ# FÁ SOL LÁ LÁ# DÓ
RÉ# FRÍGIO: RÉ# MI FÁ# SOL# LÁ# SI DÓ#
MI FRÍGIO: MI FÁ SOL LÁ SI DÓ RÉ
FÁ FRÍGIO: FÁ FÁ# SOL# LÁ# DÓ DÓ# RÉ#
FÁ# FRÍGIO: FÁ# SOL LÁ SI DÓ# RÉ MI
SOL FRÍGIO: SOL SOL# LÁ# DÓ RÉ RÉ# FÁ
SOL# FRÍGIO: SOL# LÁ SI DÓ# RÉ# MI FÁ#
LÁ FRÍGIO: LÁ LÁ# DÓ RÉ MI FÁ SOL
LÁ# FRÍGIO: LÁ# SI DÓ# RÉ# FÁ FÁ# SOL#
SI FRÍGIO: SI DÓ RÉ MI FÁ# SOL LÁ


🔹 LÍDIO
Fórmula: 1, 2, 3, #4, 5, 6, 7

DÓ LÍDIO: DÓ RÉ MI FÁ# SOL LÁ SI
DÓ# LÍDIO: DÓ# RÉ# FÁ SOL SOL# LÁ# DÓ
RÉ LÍDIO: RÉ MI FÁ# SOL# LÁ SI DÓ#
RÉ# LÍDIO: RÉ# FÁ SOL LÁ LÁ# DÓ RÉ
MI LÍDIO: MI FÁ# SOL# LÁ# SI DÓ# RÉ#
FÁ LÍDIO: FÁ SOL LÁ SI DÓ RÉ MI
FÁ# LÍDIO: FÁ# SOL# LÁ# DÓ DÓ# RÉ# FÁ
SOL LÍDIO: SOL LÁ SI DÓ# RÉ MI FÁ#
SOL# LÍDIO: SOL# LÁ# DÓ RÉ RÉ# FÁ SOL
LÁ LÍDIO: LÁ SI DÓ# RÉ# MI FÁ# SOL#
LÁ# LÍDIO: LÁ# DÓ RÉ MI FÁ SOL LÁ
SI LÍDIO: SI DÓ# RÉ# FÁ FÁ# SOL# LÁ#


🔹 MIXOLÍDIO
Fórmula: 1, 2, 3, 4, 5, 6, ♭7

DÓ MIXOLÍDIO: DÓ RÉ MI FÁ SOL LÁ LÁ#
DÓ# MIXOLÍDIO: DÓ# RÉ# FÁ FÁ# SOL# LÁ# SI
RÉ MIXOLÍDIO: RÉ MI FÁ# SOL LÁ SI DÓ
RÉ# MIXOLÍDIO: RÉ# FÁ SOL SOL# LÁ# DÓ DÓ#
MI MIXOLÍDIO: MI FÁ# SOL# LÁ SI DÓ# RÉ
FÁ MIXOLÍDIO: FÁ SOL LÁ LÁ# DÓ RÉ RÉ#
FÁ# MIXOLÍDIO: FÁ# SOL# LÁ# SI DÓ# RÉ# MI
SOL MIXOLÍDIO: SOL LÁ SI DÓ RÉ MI FÁ
SOL# MIXOLÍDIO: SOL# LÁ# DÓ DÓ# RÉ# FÁ FÁ#
LÁ MIXOLÍDIO: LÁ SI DÓ# RÉ MI FÁ# SOL
LÁ# MIXOLÍDIO: LÁ# DÓ RÉ RÉ# FÁ SOL SOL#
SI MIXOLÍDIO: SI DÓ# RÉ# MI FÁ# SOL# LÁ


🔹 LÓCRIO
Fórmula: 1, ♭2, ♭3, 4, ♭5, ♭6, ♭7

DÓ LÓCRIO: DÓ DÓ# RÉ# FÁ FÁ# SOL# LÁ#
DÓ# LÓCRIO: DÓ# RÉ MI FÁ# SOL LÁ SI
RÉ LÓCRIO: RÉ RÉ# FÁ SOL SOL# LÁ# DÓ
RÉ# LÓCRIO: RÉ# MI FÁ# SOL# LÁ SI DÓ#
MI LÓCRIO: MI FÁ SOL LÁ LÁ# DÓ RÉ
FÁ LÓCRIO: FÁ FÁ# SOL# LÁ# SI DÓ# RÉ#
FÁ# LÓCRIO: FÁ# SOL LÁ SI DÓ RÉ MI
SOL LÓCRIO: SOL SOL# LÁ# DÓ DÓ# RÉ# FÁ
SOL# LÓCRIO: SOL# LÁ SI DÓ# RÉ MI FÁ#
LÁ LÓCRIO: LÁ LÁ# DÓ RÉ RÉ# FÁ SOL
LÁ# LÓCRIO: LÁ# SI DÓ# RÉ# MI FÁ# SOL#
SI LÓCRIO: SI DÓ RÉ MI FÁ SOL LÁ


🔹 HARMÔNICA MENOR
Fórmula: 1, 2, ♭3, 4, 5, ♭6, 7

DÓ HARMÔNICA MENOR: DÓ RÉ RÉ# FÁ SOL SOL# SI
DÓ# HARMÔNICA MENOR: DÓ# RÉ# MI FÁ# SOL# LÁ DÓ
RÉ HARMÔNICA MENOR: RÉ MI FÁ SOL LÁ LÁ# DÓ#
RÉ# HARMÔNICA MENOR: RÉ# FÁ FÁ# SOL# LÁ# SI RÉ
MI HARMÔNICA MENOR: MI FÁ# SOL LÁ SI DÓ RÉ#
FÁ HARMÔNICA MENOR: FÁ SOL SOL# LÁ# DÓ DÓ# MI
FÁ# HARMÔNICA MENOR: FÁ# SOL# LÁ SI DÓ# RÉ FÁ
SOL HARMÔNICA MENOR: SOL LÁ LÁ# DÓ RÉ RÉ# FÁ#
SOL# HARMÔNICA MENOR: SOL# LÁ# SI DÓ# RÉ# MI SOL
LÁ HARMÔNICA MENOR: LÁ SI DÓ RÉ MI FÁ SOL#
LÁ# HARMÔNICA MENOR: LÁ# DÓ DÓ# RÉ# FÁ FÁ# LÁ
SI HARMÔNICA MENOR: SI DÓ# RÉ MI FÁ# SOL LÁ#


🔹 MELÓDICA MENOR
Fórmula: 1, 2, ♭3, 4, 5, 6, 7

DÓ MELÓDICA MENOR: DÓ RÉ RÉ# FÁ SOL LÁ SI
DÓ# MELÓDICA MENOR: DÓ# RÉ# MI FÁ# SOL# LÁ# DÓ
RÉ MELÓDICA MENOR: RÉ MI FÁ SOL LÁ SI DÓ#
RÉ# MELÓDICA MENOR: RÉ# FÁ FÁ# SOL# LÁ# DÓ RÉ
MI MELÓDICA MENOR: MI FÁ# SOL LÁ SI DÓ# RÉ#
FÁ MELÓDICA MENOR: FÁ SOL SOL# LÁ# DÓ RÉ MI
FÁ# MELÓDICA MENOR: FÁ# SOL# LÁ SI DÓ# RÉ# FÁ
SOL MELÓDICA MENOR: SOL LÁ LÁ# DÓ RÉ MI FÁ#
SOL# MELÓDICA MENOR: SOL# LÁ# SI DÓ# RÉ# FÁ SOL
LÁ MELÓDICA MENOR: LÁ SI DÓ RÉ MI FÁ# SOL#
LÁ# MELÓDICA MENOR: LÁ# DÓ DÓ# RÉ# FÁ SOL LÁ
SI MELÓDICA MENOR: SI DÓ# RÉ MI FÁ# SOL# LÁ#

Entrada: ${scaleName}

`;

    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 1000,
      }),
    });

    if (!groqResponse.ok) {
      const errorData = await groqResponse.text();
      return new Response(
        JSON.stringify({ error: 'Erro ao chamar API Groq', details: errorData }),
        {
          status: groqResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const groqData = await groqResponse.json();
    const generatedText = groqData.choices[0]?.message?.content;

    if (!generatedText) {
      return new Response(
        JSON.stringify({ error: 'Nenhuma resposta gerada pelo Groq' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return new Response(
        JSON.stringify({ error: 'Formato JSON inválido na resposta', rawResponse: generatedText }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const scaleData = JSON.parse(jsonMatch[0]);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: maxOrderData } = await supabase
      .from('scales')
      .select('order_index')
      .eq('user_id', userId)
      .order('order_index', { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextOrder = (maxOrderData?.order_index || 0) + 1;

    const { data: insertedScale, error: insertError } = await supabase
      .from('scales')
      .insert({
        user_id: userId,
        name: scaleData.name,
        type: scaleData.type,
        notes: scaleData.notes,
        exercise: scaleData.exercise,
        lick: scaleData.lick,
        dominantes: scaleData.dominantes || '',
        lick_inicio: scaleData.lick_inicio,
        lick_final: scaleData.lick_final,
        order_index: nextOrder,
        is_ai_generated: true,
      })
      .select()
      .single();

    if (insertError) {
      return new Response(
        JSON.stringify({ error: 'Erro ao salvar no banco de dados', details: insertError }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({ success: true, scale: insertedScale }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Erro na função generate-scale:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno',
        message: error instanceof Error ? error.message : String(error)
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});