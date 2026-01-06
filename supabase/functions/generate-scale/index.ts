import { createClient } from 'npm:@supabase/supabase-js@2';

/* =======================
   CORS
======================= */
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

/* =======================
   TYPES
======================= */
interface RequestBody {
  scaleName: string;
  userId: string;
  note?: string;
  scale?: string;
  type?: string;
}

/* =======================
   MUSICAL VALIDATORS
======================= */
const VALID_NOTES = [
  'DO', 'RE', 'MI', 'FA', 'SOL', 'LA', 'SI',
  'DO#', 'RE#', 'FA#', 'SOL#', 'LA#'
];

function validateNotes(notes: string[]): boolean {
  return notes.every(n => VALID_NOTES.includes(n));
}

/* =======================
   VALIDATION
======================= */


/**
 * Validação lógica por tipo (não dependente da tônica)
 */
function validateScaleByType(type: string, notes: string[]): boolean {
  switch (type) {

    case 'pentatonica_menor':
      // pentatônica menor tem EXATAMENTE 5 notas
      return notes.length === 5;

    case 'pentatonica_maior':
      return notes.length === 5;

    case 'blues':
      return notes.length === 6;

    case 'mixolidio':
      return notes.length === 7;

    case 'menor':
    case 'menor_natural':
    case 'menor_harmonica':
    case 'menor_melodica':
    case 'maior':
    case 'dorico':
    case 'frigio':
    case 'lidio':
    case 'locrio':
      return notes.length === 7;

    default:
      return true;
  }
}
/**
 * Bloqueia exercício linear ascendente ou descendente
 * e exige ao menos 1 salto >= terça
 */
function validateExercise(exercise: string[], scale: string[]): boolean {
  const asc = scale.slice(0, exercise.length).join(' ');
  const desc = [...scale].reverse().slice(0, exercise.length).join(' ');
  const ex = exercise.join(' ');

  if (ex === asc || ex === desc) return false;

  const idx = exercise.map(n => scale.indexOf(n)).filter(i => i >= 0);
  for (let i = 1; i < idx.length; i++) {
    if (Math.abs(idx[i] - idx[i - 1]) >= 2) {
      return true;
    }
  }
  return false;
}

/* =======================
   SERVER
======================= */
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
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

    /* =======================
       PROMPT COM INFORMAÇÕES ESTRUTURADAS
    ======================= */
    const prompt = `
PROMPT DEFINITIVO v3 — ESCALAS, EXERCISES E LICKS
(APENAS SUSTENIDOS • FRASEADO REAL)
🧠 PAPEL DO MODELO (OBRIGATÓRIO)

Você é um especialista avançado em teoria musical, harmonia funcional e improvisação para trompete, com linguagem madura de blues, jazz e música latina.

Antes de gerar qualquer nota, você DEVE:

Identificar corretamente o tipo da escala

Selecionar a fórmula intervalar correspondente

Aplicar a fórmula à tônica

Converter TODOS os graus para notação brasileira usando APENAS sustenidos

❗ Se a fórmula não for aplicada corretamente, a escala está ERRADA e deve ser refeita.

🔹 ESCALA SOLICITADA

Nota: ${note || 'não especificada'}
Escala: ${scale || 'não especificada'}
Tipo: ${type || 'não especificado'}

Nome Completo: ${scaleName}

🔹 NOTAÇÃO MUSICAL — REGRA ABSOLUTA

Use EXCLUSIVAMENTE estas notas válidas:

Naturais
DO RE MI FA SOL LA SI

Sustenidos
DO# RE# FA# SOL# LA#


❌ BEMÓIS SÃO PROIBIDOS
❌ Nunca use: REB, MIB, SOLB, LAB, SIB

🔹 NOTAS PROIBIDAS (NUNCA USAR)

❌ MI# → use FA
❌ SI# → use DO
❌ FAb → use MI
❌ DOb → use SI

🔹 REGRA DE COERÊNCIA DE ACIDENTES

Todas as escalas devem usar somente sustenidos

Nunca misture acidentes

Se um grau tradicional for bemol, converta para o sustenido equivalente

Exemplos:

b3 de DO → MI♭ → RE#

b7 de DO → SI♭ → LA#

b5 de DO → SOL♭ → FA#

❗ IMPORTANTE: Quando usar bemóis na fórmula, SEMPRE converta para sustenidos

🔹 MAPEAMENTO: BEMOL → SUSTENIDO

REB = DO#
MIB = RE#
SOLB = FA#
LAB = SOL#
SIB = LA#
FAB = MI
DOB = SI

🔹 DEFINIÇÃO DE TIPO (CRÍTICO PARA PENTATÔNICA)

Se Tipo = "Maior", gere escalas modo MAIOR/BRIGHTO
Se Tipo = "Menor", gere escalas modo MENOR/ESCURO

Para Pentatônica especificamente:
- Se Tipo = "Maior" → Pentatônica MAIOR: 1 2 3 5 6
- Se Tipo = "Menor" → Pentatônica MENOR: 1 b3 4 5 b7

Pentatônica Menor NUNCA é 1 2 3 5 6
Pentatônica Menor SEMPRE usa b3 e b7

🔹 TIPOS DE ESCALA SUPORTADOS

maior (jônio)

menor natural (eólio)

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

🔥 BLOCO CRÍTICO — FÓRMULAS INTERVALARES (NÃO NEGOCIÁVEL)

Toda escala DEVE ser construída EXCLUSIVAMENTE a partir da fórmula abaixo.

📐 FÓRMULAS

Maior (Jônio)
1 2 3 4 5 6 7
Conversão: nenhuma (todos naturais)

Menor Natural (Eólio)
1 2 b3 4 5 b6 b7
Conversão: b3→RE# para SI / b6→SOL# para SI / b7→LA# para SI

Menor Harmônica
1 2 b3 4 5 b6 7
Conversão: b3→RE# / b6→SOL#

Menor Melódica
1 2 b3 4 5 6 7
Conversão: b3→RE#

Mixolídio
1 2 3 4 5 6 b7
Conversão: b7→LA# para SI
❗ Se a 7ª não for menor, está ERRADO

Dórico
1 2 b3 4 5 6 b7
Conversão: b3→RE# / b7→LA#

Frígio
1 b2 b3 4 5 b6 b7
Conversão: b2→DO# / b3→RE# / b6→SOL# / b7→LA#

Lídio
1 2 3 #4 5 6 7
Conversão: #4→FA# para SI

Lócrio
1 b2 b3 4 b5 b6 b7
Conversão: b2→DO# / b3→RE# / b5→FA# / b6→SOL# / b7→LA#

Blues
1 b3 4 #4 5 b7
Conversão: b3→RE# / #4→FA# / b7→LA#

Pentatônica Maior (APENAS quando Tipo = "Maior")
1 2 3 5 6
Conversão: nenhuma
❗ Nunca use b3 ou b7 em pentatônica maior

Pentatônica Menor (APENAS quando Tipo = "Menor")
1 b3 4 5 b7
Conversão: b3→RE# para SI / b7→LA# para SI
❗ Pentatônica menor SEMPRE tem b3 e b7
❗ Para SI: SI RE FA FA# LA (não SI RE# FA# SOL# LA#)

EXEMPLO DETALHADO DE SI PENTATÔNICA MENOR:

Tônica: SI
Escala Correta: SI RE MI FA# LA

Conversão intervalar:
- 1 = SI (tônica)
- b3 = RE (terça menor)
- 4 = MI (quarta justa)
- 5 = FA# (quinta justa)
- b7 = LA (sétima menor)

ESCALA CORRETA DE SI PENTATÔNICA MENOR:
SI RE MI FA# LA

NÃO GERE:
SI RE# FA# SOL# LA#
SI RE FA FA# LA

FÓRMULA CONVERTIDA PARA SI:
1=SI, b3=RE, 4=MI, 5=FA#, b7=LA

🔹 FUNÇÃO HARMÔNICA

Se a escala tiver 3 maior + b7, ela é dominante

Para escalas dominantes, gerar:

1 – 3 – 5 – b7


Caso contrário:

"dominantes": ""

🎯 EXERCISE — REGRA DEFINITIVA (ANTI-ESCALA)

❗ O campo exercise NÃO PODE ser uma sequência linear da escala
❗ Se parecer escala subindo ou descendo, o exercício está ERRADO e deve ser recriado

✔ O exercise DEVE:

ter exatamente 5 notas

conter ao menos 1 salto (mínimo terça)

retornar para uma nota-alvo

ter função técnica clara

✔ Estruturas PERMITIDAS (escolher UMA):

arpejo parcial → 1–3–5–3–1

salto + retorno → 1–5–4–3–1

padrão interválico → 1–3–2–4–3

nota pivô → 3–1–3–5–3

❌ Estruturas PROIBIDAS:

1–2–3–4–5

5–4–3–2–1

qualquer variação linear

🔥 BLOCO CRÍTICO — ANTI LICK LINEAR

❗ É PROIBIDO gerar licks que sejam apenas notas consecutivas da escala
❗ Se o lick parecer uma escala tocada em ordem, ele deve ser descartado e recriado

Todo lick DEVE conter no mínimo 2 elementos:

salto melódico (mínimo terça)

mudança de direção

nota-alvo (3ª, b7 ou tônica)

resolução clara

🧬 DNA DE LINGUAGEM — BLUES + LATIN

Frases curtas e rítmicas

Call & response

Repetição com variação

Ênfase em b3, #4 e b7 (quando existirem)

Ataque rítmico latino (clave implícita)

🎵 FRASEADO DE SOLO
🎺 Exercise

conforme regras acima

🎺 Lick Central

4–6 notas

Salto + resolução obrigatórios

🎺 Lick Início

5–8 notas

Não iniciar na tônica

Criar identidade temática

🎺 Lick Final

5–8 notas

Aproximação obrigatória

Terminar na tônica

🔹 FORMATO DE SAÍDA (APENAS JSON VÁLIDO)
{
  "name": "NOME DA ESCALA EM MAIÚSCULAS",
  "type": "tipo_da_escala",
  "notes": "NOTAS SEPARADAS POR ESPAÇO (APENAS SUSTENIDOS)",
  "exercise": "5 NOTAS (PADRÃO INTERVÁLICO, NÃO ESCALA)",
  "lick": "4 A 6 NOTAS",
  "dominantes": "4 NOTAS OU STRING VAZIA",
  "lick_inicio": "5 A 8 NOTAS",
  "lick_final": "5 A 8 NOTAS TERMINANDO NA TÔNICA"
}

🎯 GARANTIA FINAL

Com este prompt:

❌ exercise nunca mais vira escala

❌ mixolídio nunca vira maior

❌ blues nunca erra

❌ bemóis nunca aparecem

✅ escalas seguem fórmula

✅ exercícios têm função técnica

✅ licks têm linguagem real
`;

    const groqResponse = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
          max_tokens: 900,
        }),
      }
    );

    if (!groqResponse.ok) {
      throw new Error(await groqResponse.text());
    }

    const groqData = await groqResponse.json();
    const generatedText = groqData.choices[0]?.message?.content;
    if (!generatedText) throw new Error('Resposta vazia do Groq');

    const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('JSON inválido retornado');

    const scaleData = JSON.parse(jsonMatch[0]);

    /* =======================
       JSON STRUCTURE CHECK
    ======================= */
    const requiredFields = [
      'name', 'type', 'notes', 'exercise', 'lick', 'lick_inicio', 'lick_final'
    ];

    for (const field of requiredFields) {
      if (!scaleData[field]) {
        throw new Error(`Campo obrigatório ausente: ${field}`);
      }
    }

    /* =======================
       VALIDATION
    ======================= */
    const scaleNotes = scaleData.notes.split(' ');
    const exerciseNotes = scaleData.exercise.split(' ');

    if (!validateNotes(scaleNotes)) {
      throw new Error('Escala contém notas inválidas');
    }

    if (!validateScaleByType(scaleData.type, scaleNotes)) {
      throw new Error('Escala não corresponde ao tipo informado');
    }

    if (!validateExercise(exerciseNotes, scaleNotes)) {
      throw new Error('Exercise inválido (linear ou sem salto)');
    }

    /* =======================
       SUPABASE
    ======================= */
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: last } = await supabase
      .from('scales')
      .select('order_index')
      .eq('user_id', userId)
      .order('order_index', { ascending: false })
      .limit(1)
      .maybeSingle();

    const orderIndex = (last?.order_index || 0) + 1;

    const { data, error } = await supabase
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
        order_index: orderIndex,
        is_ai_generated: true,
      })
      .select()
      .single();

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, scale: data }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({
        error: 'Erro interno',
        message: err instanceof Error ? err.message : String(err),
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
