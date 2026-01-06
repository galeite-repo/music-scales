import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface RequestBody {
  scaleName: string;
  userId: string;
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
    const { scaleName, userId }: RequestBody = await req.json();

    if (!scaleName) {
      return new Response(
        JSON.stringify({ error: 'scaleName é obrigatório' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId é obrigatório' }),
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
  
🎼 PROMPT DEFINITIVO — ESCALAS E LICKS (APENAS SUSTENIDOS)
🧠 PAPEL DO MODELO

Você é um especialista avançado em teoria musical, harmonia funcional e improvisação para trompete, com linguagem madura de blues, jazz e música latina.

Gere escalas corretas e licks musicais reais, nunca sequências lineares de escala.

🔹 ESCALA SOLICITADA

Escala: ${scaleName}

🔹 NOTAÇÃO MUSICAL — REGRA ABSOLUTA
✔ Use APENAS estas notas válidas:
Naturais
DO RE MI FA SOL LA SI

Sustenidos
DO# RE# FA# SOL# LA#


❌ BEMÓIS SÃO PROIBIDOS
❌ Nunca use REB, MIB, SOLB, LAB, SIB

🔹 NOTAS PROIBIDAS (NUNCA USAR)

❌ MI# → use FA
❌ SI# → use DO
❌ FAb → use MI
❌ DOb → use SI

🔹 REGRA DE COERÊNCIA

Todas as escalas devem ser escritas somente com sustenidos

Nunca misture acidentes

Se a escala tradicional usar bemol, converta para o sustenido equivalente

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

🔹 ESTRUTURAS OBRIGATÓRIAS (ANTI-ERRO)
🔵 Escala Blues

Use EXATAMENTE:

1  b3  4  #4  5  b7


Convertendo sempre para sustenidos.

Exemplo:

DO BLUES = DO RE# FA FA# SOL LA#

🔹 FUNÇÃO HARMÔNICA

Escalas dominantes → gerar tétrade 1–3–5–b7

Outras → "dominantes": ""

🔥 BLOCO CRÍTICO — ANTI LICK LINEAR

❗ Proibido gerar licks que sejam apenas notas consecutivas da escala
❗ Todo lick deve conter:

salto melódico

mudança de direção

resolução clara

Se parecer escala tocada, recrie.

🧬 DNA DE LINGUAGEM (BLUES + LATIN)

Frases curtas

Call & response

Repetição com variação

Uso forte da b3, #4 e b7 no blues

Ataque rítmico latino

🎵 FRASEADO DE SOLO
🎺 Exercise

5 notas

Técnico

🎺 Lick Central

4–6 notas

Com salto + resolução

🎺 Lick Início

5–8 notas

Não iniciar na tônica

Criar identidade

🎺 Lick Final

5–8 notas

Aproximação + terminar na tônica

🔹 FORMATO DE SAÍDA (APENAS JSON)
{
  "name": "NOME DA ESCALA EM MAIÚSCULAS",
  "type": "tipo_da_escala",
  "notes": "NOTAS SEPARADAS POR ESPAÇO (APENAS SUSTENIDOS)",
  "exercise": "5 NOTAS",
  "lick": "4 A 6 NOTAS",
  "dominantes": "4 NOTAS OU STRING VAZIA",
  "lick_inicio": "5 A 8 NOTAS",
  "lick_final": "5 A 8 NOTAS TERMINANDO NA TÔNICA"
}

🎯 RESULTADO GARANTIDO

Com este prompt:

❌ nunca mais aparecem bemóis

❌ nunca mais aparece blues errado

✅ escalas coerentes

✅ licks com identidade

✅ material realmente tocável

Se quiser, no próximo passo posso:

Criar validação automática de escala

Criar testes unitários musicais

Criar presets de linguagem (blues, salsa, fusion)

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