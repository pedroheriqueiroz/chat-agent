import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText, stepCountIs ,tool } from 'ai';
import { z } from 'zod';

const google = createGoogleGenerativeAI({
  apiKey: 'AIzaSyCY-ZB5BLNLN8EPLauKExRzZIr1FJIEEBc',
})

// 1. BANCO IMAGINÁRIO E CARDÁPIO
const saldoBancoImaginario = 20; // O cliente começa com R$ 20,00 fictícios

const menu = [
  { id: 1, nome: 'X-Burger', preco: 18, categoria: 'hambúrguer' },
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

  // 2. SYSTEM PROMPT: Personalidade do atendente de Fast-Food
  const sysPrompt = `
Você é um atendente virtual de fast-food super amigável.

Seu papel é:
- Ajudar o cliente a ver o cardápio.
- Sempre que o cliente pedir para ver o menu, o cardápio ou perguntar o que ele pode comprar, use a ferramenta 'verMenuCustomizado'.
- Baseado no retorno da ferramenta, informe o saldo dele no banco imaginário, mostre as opções gerais e destaque os lanches que ele REALMENTE pode pagar com o dinheiro que tem na conta.

Regras:
- Seja prestativo e responda em português de forma natural.
- Nunca invente lanches fora do cardápio fornecido pela ferramenta.
`;

  // 3. EXECUÇÃO DO AGENTE
  const { text } = await generateText({
    model: google('gemini-2.5-flash'),
    prompt: `
${sysPrompt}

Cliente: ${prompt}
`,
    tools: {
      // NOVA TOOL DE MENU
      verMenuCustomizado: tool({
        description: 'Busca o cardápio de fast-food e cruza com o saldo atual do banco imaginário do cliente.',
        inputSchema: z.object({}), // Não precisa de parâmetros de entrada
        execute: async () => filtrarMenuPorSaldo(),
      }),
    },
    // Voltando para o padrão que a sua versão do pacote 'ai' reconhece:
    stopWhen: stepCountIs(5),
    onStepFinish: async ({ toolResults }) => {
      if (toolResults.length) {
        console.log("Ferramenta executada pelo agente:", JSON.stringify(toolResults, null, 2));
      }
    },
  });

  return text;
}


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
