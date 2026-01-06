import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface RequestBody {
  scaleName: string;
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
    const { scaleName }: RequestBody = await req.json();

    if (!scaleName) {
      return new Response(
        JSON.stringify({ error: 'scaleName é obrigatório' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const groqApiKey = Deno.env.get('GROQ_API_KEY');

    if (!groqApiKey) {
      return new Response(
        JSON.stringify({ error: 'GROQ_API_KEY não configurada' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const prompt = `Você é um especialista em teoria musical e escalas para trompete. Gere uma escala musical completa no formato JSON exato abaixo.

Escala solicitada: ${scaleName}

REGRAS OBRIGATÓRIAS PARA NOTAÇÃO MUSICAL:

1. NOTAS VÁLIDAS (use APENAS estas):
   - Naturais: DO, RE, MI, FA, SOL, LA, SI
   - Sustenidos (#): DO#, RE#, FA#, SOL#, LA#

2. NOTAS PROIBIDAS (NUNCA use):
   - MI# (não existe, use FA)
   - SI# (não existe, use DO)
   - FAb (não existe, use MI)
   - DOb (não existe, use SI)

3. Use SEMPRE notação brasileira: DO RE MI FA SOL LA SI (nunca C D E F G A B)

4. Para sustenidos, use o símbolo # (exemplo: DO# RE# FA#)

5. IMPORTANTE: Analise as escalas de referência abaixo e siga o mesmo padrão de construção

ESCALAS DE REFERÊNCIA (siga estes exemplos):

DO MIXOLÍDIO: DO RE MI FA SOL LA LA#
SOL MIXOLÍDIO: SOL LA SI DO RE MI FA
FA MIXOLÍDIO: FA SOL LA LA# DO RE RE#
RE MIXOLÍDIO: RE MI FA# SOL LA SI DO
LA# MIXOLÍDIO: LA# DO RE RE# FA SOL SOL#
LA MIXOLÍDIO: LA SI DO# RE MI FA# SOL
MI MIXOLÍDIO: MI FA# SOL# LA SI DO# RE
RE# MIXOLÍDIO: RE# FA SOL SOL# LA# DO DO#
SOL# MIXOLÍDIO: SOL# LA# DO DO# RE# FA FA#
DO# MIXOLÍDIO: DO# RE# FA FA# SOL# LA# SI
FA# MIXOLÍDIO: FA# SOL# LA# SI DO# RE# MI
SI MIXOLÍDIO: SI DO# RE# MI FA# SOL# LA
SI MENOR: SI DO# RE MI FA# SOL LA
DO# MENOR: DO# RE# MI FA# SOL# LA SI

FORMATO JSON (retorne APENAS o JSON):

{
  "name": "NOME DA ESCALA EM MAIÚSCULAS",
  "type": "mixolidio" ou "menor",
  "notes": "notas separadas por espaço usando APENAS as notas válidas listadas acima",
  "exercise": "sequência de 5 notas da escala para praticar",
  "lick": "sequência de 4 notas da escala",
  "dominantes": "4 notas da tétrade dominante (ou string vazia se escala menor)",
  "lick_inicio": "3 notas para começar",
  "lick_final": "3 notas terminando na tônica"
}

EXEMPLO COMPLETO:
{
  "name": "DO BLUES",
  "type": "menor",
  "notes": "DO RE# FA FA# SOL LA#",
  "exercise": "DO FA FA# LA# FA#",
  "lick": "FA# LA# SOL FA#",
  "dominantes": "",
  "lick_inicio": "DO FA FA#",
  "lick_final": "LA# SOL DO"
}

Agora gere a escala para: ${scaleName}

Lembre-se: Use APENAS as notas válidas listadas. NUNCA use MI#, SI#, FAb ou DOb.`;

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
      .order('order_index', { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextOrder = (maxOrderData?.order_index || 0) + 1;

    const { data: insertedScale, error: insertError } = await supabase
      .from('scales')
      .insert({
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