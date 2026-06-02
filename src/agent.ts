import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText, stepCountIs ,tool } from 'ai';
import { z } from 'zod';

const google = createGoogleGenerativeAI({
  apiKey: import.meta.env.VITE_GEMINI_API_KEY,
})

console.log('Google Gemini API Key:', import.meta.env.VITE_GEMINI_API_KEY);

const saldoBancoImaginario = 20; 

const menu = [
  { id: 1, nome: 'Pizza', preco: 18, categoria: 'pizza' },
  { id: 2, nome: 'Batata Frita', preco: 10, categoria: 'acompanhamento' },
  { id: 3, nome: 'Coca-Cola', preco: 7, categoria: 'bebida' },
  { id: 4, nome: 'Combo Master', preco: 32, categoria: 'combo' },
];

export async function askForAgent(prompt: string): Promise<string> {
  
  // FUNÇÃO AUXILIAR DA TOOL: Filtra o cardápio baseado no bolso do cliente
  const filtrarMenuPorSaldo = () => {
    console.log('Consultando banco imaginário... Saldo atual:', saldoBancoImaginario);
    const itensCabemNoBolso = menu.filter(item => item.preco <= saldoBancoImaginario);
    
    return {
      saldoAtual: saldoBancoImaginario,
      cardapioCompleto: menu,
      sugestoesParaOBolso: itensCabemNoBolso.length > 0 ? itensCabemNoBolso : "Nenhum lanche cabe no seu saldo.",
    };
  };

    // FUNÇÃO AUXILIAR DA TOOL: Busca item pelo nome
const buscarItemPorNome = (nome: string) => {
  const normalizar = (texto: string) =>
    texto
      .toLowerCase()
      .replace(/[-_]/g, ' ')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();

  const termoBusca = normalizar(nome);

  const itemEncontrado = menu.find(item => {
    const nomeItem = normalizar(item.nome);

    return (
      nomeItem.includes(termoBusca) ||
      termoBusca.includes(nomeItem)
    );
  });

  console.log(`Buscando item pelo nome: "${nome}"`);
  console.log('Termo normalizado:', termoBusca);
  console.log('Item encontrado:', itemEncontrado);

  if (!itemEncontrado) {
    return {
      encontrado: false,
      mensagem: 'Item não encontrado no cardápio.',
    };
  }

  return {
    encontrado: true,
    item: itemEncontrado,
  };
};

  // 2. SYSTEM PROMPT
const { text } = await generateText({
  model: google('gemini-2.5-flash'),

  system: `
Você é um atendente virtual de fast-food super amigável.

Ferramentas disponíveis:

1. verMenuCustomizado
- Use quando o cliente pedir para ver o cardápio.
- Use quando o cliente perguntar o que pode comprar.
- Use quando o cliente perguntar quais opções existem.

2. buscarItem
- Use quando o cliente mencionar um item específico.
- Use quando o cliente perguntar o preço de um item.
- Use quando o cliente pedir detalhes de um item.
- Use quando o cliente perguntar a categoria de um item.

3. buscarCategoria
- Use quando o cliente pedir todos os itens de uma categoria.
- Use quando o cliente perguntar quais hambúrgueres existem.
- Use quando o cliente perguntar quais bebidas existem.
- Use quando o cliente perguntar quais acompanhamentos existem.
- Use quando o cliente pedir para listar itens de uma categoria.

Regras:
- Sempre utilize a ferramenta mais apropriada antes de responder.
- Nunca invente itens ou categorias.
- Nunca responda informações do cardápio sem consultar uma ferramenta.
- Responda sempre em português.
- Seja amigável e objetivo.
`,

  prompt,

  tools: {
    verMenuCustomizado: tool({
      description:
        'Busca o cardápio de fast-food e cruza com o saldo atual do banco imaginário do cliente.',
      inputSchema: z.object({}),
      execute: async () => filtrarMenuPorSaldo(),
    }),

    buscarItem: tool({
      description:
        'Busca um item específico no cardápio pelo nome e retorna seus detalhes.',
      inputSchema: z.object({
        nome: z.string().describe('Nome do item procurado'),
      }),
      execute: async ({ nome }) => {
        console.log('========================');
        console.log('TOOL buscarItem executada');
        console.log('Nome recebido:', nome);
        console.log('========================');

        return buscarItemPorNome(nome);
      },
    }),

    buscarCategoria: tool({
  description:
    'Lista todos os itens de uma categoria específica do cardápio como pizza, bebida, acompanhamento ou combo.',

  inputSchema: z.object({
    categoria: z.string().describe('Categoria dos itens procurados'),
  }),

  execute: async ({ categoria }) => {
    console.log('========================');
    console.log('TOOL buscarCategoria executada');
    console.log('Categoria recebida:', categoria);
    console.log('========================');

    const normalizar = (texto: string) =>
      texto
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

    const categoriaBusca = normalizar(categoria);

    const itensNaCategoria = menu.filter(item =>
      normalizar(item.categoria).includes(categoriaBusca) ||
      categoriaBusca.includes(normalizar(item.categoria))
    );

    return {
      categoria,
      itens:
        itensNaCategoria.length > 0
          ? itensNaCategoria
          : 'Nenhum item encontrado nessa categoria.',
    };
  },
}),
  },

  stopWhen: stepCountIs(3),

  onStepFinish: async ({ toolResults }) => {
    if (toolResults.length) {
      console.log(
        'Ferramenta executada pelo agente:',
        JSON.stringify(toolResults, null, 2)
      );
    }
  },
});

  return text;
}


/*
export async function askAgent(prompt: string): Promise<string> {
  const getTemperature = () => {
    const temperature = Math.round(Math.random() * (90 - 32) + 32);
    console.log('Getting the temperature...', temperature);
    return temperature;
  }
  const executeTool = async (location: string) => {
    console.log('Executing tool with location:', location);
    const temperature = getTemperature();
    return {
      location,
      temperature,
    }
  };
  const sysPrompt = `
  Contexto: Você é um agente de clima, sua função é informar o clima de um local fornecido pelo usuário. Utilize as classificações de temperatura em Fahrenheit:
- abaixo de 32 -> muito frio;
- entre 32 à 59 -> frio;
- entre 60 à 77 -> ambiente;
- entre 61 à 84,2 -> agradável;
- entre 84,3 à 86 -> ameno; 
- entre 87,8 à 102,2 -> quente;
- entre 102,3 à 104 -> muito quente;
- entre 104,1 à 111,2 -> padrão Rio de Janeiro;
- acima de 111,2 -> inferno.
Não retorne algo com “classifica-se” ou “pode ser classificado”. Apenas informe como a temperatura está baseado na classificação utilizando palavras iguais ou similares, sempre informando a temperatura.

user: ${prompt}
`
  const { text } = await generateText({
    model: google('gemini-2.5-flash'),
    prompt: sysPrompt,
    tools: {
    weather: tool({
      description: 'Get the weather in a location (fahrenheit)',
      inputSchema: z.object({
        location: z.string().describe('The location to get the weather for'),
      }),
      execute: async ({ location }) => executeTool(location),
    }),
  },
  stopWhen: stepCountIs(5),
  onStepFinish: async ({ toolResults }) => {
    if (toolResults.length) {
      console.log(JSON.stringify(toolResults, null, 2));
    }
  },
  });
  return text;
}

*/
