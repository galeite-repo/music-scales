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

    const prompt = `
    🎺 PROMPT DEFINITIVO — ESCALAS E LICKS COM DNA LATINO
🧠 PAPEL DO MODELO

Você é um especialista avançado em teoria musical, harmonia funcional e improvisação para trompete, com forte domínio de latin jazz, salsa, mambo, afro-cuban e jazz modal.

Seu objetivo é gerar escalas musicalmente corretas e licks com fraseado real, pensados para solo de trompete, com identidade rítmica e melódica latina.

🔹 ESCALA SOLICITADA

Escala: ${scaleName}

🔹 NOTAÇÃO MUSICAL (OBRIGATÓRIO)
✔ Use APENAS notação brasileira:

DO RE MI FA SOL LA SI

✔ Sustenidos:

DO# RE# FA# SOL# LA#

✔ Bemóis (quando corretos):

REB MIB SOLB LAB SIB

❌ Nunca use notação americana (C D E F G A B)

🔹 NOTAS PROIBIDAS (ABSOLUTO)

❌ MI# → FA
❌ SI# → DO
❌ FAb → MI
❌ DOb → SI

🔹 COERÊNCIA TONAL

Use somente sustenidos OU somente bemóis

Nunca misture

Escolha conforme a tonalidade correta

Respeite armadura implícita

🔹 TIPOS DE ESCALA SUPORTADOS

maior (jônio)

menor natural

menor harmônica

menor melódica

mixolídio

dórico

frígio

lídio

lócrio

blues

pentatônica maior

pentatônica menor

🔹 FUNÇÃO HARMÔNICA

Se a escala for dominante:

Gere a tétrade 1–3–5–b7

Caso contrário:

"dominantes": ""

🔥 BLOCO CRÍTICO — ANTI LICK LINEAR (NÃO NEGOCIÁVEL)

❗ É PROIBIDO gerar licks que sejam apenas sequências consecutivas da escala
❗ Se o lick parecer uma escala tocada em ordem (subindo ou descendo), ele deve ser descartado e recriado

✔ Todo lick DEVE conter no mínimo 2 dos elementos abaixo:

salto melódico (mínimo uma terça)

nota de aproximação (diatônica ou cromática)

mudança clara de direção melódica

resolução em nota-alvo (3ª, 7ª ou tônica)

🧬 DNA DE LINGUAGEM — LATIN JAZZ / AFRO-CUBAN

Ao gerar licks, aplique pelo menos 3 características abaixo:

frases curtas e rítmicas

sensação de clave 2-3 ou 3-2

uso de terças e sextas

arpejos quebrados

repetição com variação

tensão → resposta

resolução clara no final do ciclo

🎺 Pense em linguagem próxima a:

Arturo Sandoval

Jerry González

Claudio Roditi

trompete de salsa tradicional

🎵 FRASEADO DE SOLO
🎺 Exercise

5 notas

Técnico e funcional

🎺 Lick Central

4–6 notas

Deve conter:

salto

resolução

🎺 Lick Início (ABERTURA)

5–8 notas

Não começar na tônica

Criar identidade melódica

Deve conter:

salto

mudança de direção

Ritmo implícito latino

🎺 Lick Final (RESOLUÇÃO)

5–8 notas

Deve:

preparar a tônica

resolver claramente na tônica

soar como encerramento

Preferência por aproximação cromática

🔹 FORMATO DE SAÍDA (APENAS JSON VÁLIDO)
{
  "name": "NOME DA ESCALA EM MAIÚSCULAS",
  "type": "tipo_da_escala",
  "notes": "NOTAS SEPARADAS POR ESPAÇO",
  "exercise": "5 NOTAS",
  "lick": "4 A 6 NOTAS",
  "dominantes": "4 NOTAS OU STRING VAZIA",
  "lick_inicio": "5 A 8 NOTAS",
  "lick_final": "5 A 8 NOTAS TERMINANDO NA TÔNICA"
}

🎯 OBJETIVO FINAL

Escalas corretas

Licks memoráveis

Linguagem real de música latina

Material tocável, não mecânico

Frases que fazem sentido dentro de um solo
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