require('dotenv').config();
const { connectDB, sequelize } = require('./database');
const { User, Category, Tag, Article } = require('../models');

const seed = async () => {
  await connectDB();
  console.log('🌱 Iniciando seed do banco de dados...\n');

  await sequelize.sync({ force: true });
  console.log('✅ Tabelas criadas/recriadas');

  const [users, categories, tags] = await Promise.all([
    User.bulkCreate([
      { name: 'Ana Editora', email: 'editor@noticias.com', password: '12345', role: 'editor' },
      { name: 'João Jornalista', email: 'joao@noticias.com', password: '12345', role: 'journalist' },
      { name: 'Maria Repórter', email: 'maria@noticias.com', password: '12345', role: 'journalist' }
    ], { individualHooks: true }),
    Category.bulkCreate([
      { name: 'Tecnologia', description: 'Notícias sobre tecnologia e inovação', color: '#3B82F6' },
      { name: 'Política', description: 'Notícias políticas nacionais e internacionais', color: '#EF4444' },
      { name: 'Economia', description: 'Mercado, finanças e negócios', color: '#10B981' },
      { name: 'Esportes', description: 'Cobertura esportiva completa', color: '#F59E0B' },
      { name: 'Cultura', description: 'Arte, entretenimento e cultura', color: '#8B5CF6' }
    ]),
    Tag.bulkCreate([
      { name: 'Inteligência Artificial' },
      { name: 'Startups' },
      { name: 'Eleições' },
      { name: 'Bolsa de Valores' },
      { name: 'Futebol' },
      { name: 'Cinema' },
      { name: 'Meio Ambiente' },
      { name: 'Saúde' },
      { name: 'Educação' },
      { name: 'Inovação' }
    ])
  ]);

  console.log(`✅ ${users.length} usuários criados`);
  console.log(`✅ ${categories.length} categorias criadas`);
  console.log(`✅ ${tags.length} tags criadas`);

  const tech = categories.find(c => c.name === 'Tecnologia');
  const pol = categories.find(c => c.name === 'Política');
  const eco = categories.find(c => c.name === 'Economia');
  const esp = categories.find(c => c.name === 'Esportes');
  const cul = categories.find(c => c.name === 'Cultura');

  const tagAI = tags.find(t => t.name === 'Inteligência Artificial');
  const tagStartup = tags.find(t => t.name === 'Startups');
  const tagBolsa = tags.find(t => t.name === 'Bolsa de Valores');
  const tagFutebol = tags.find(t => t.name === 'Futebol');
  const tagInovacao = tags.find(t => t.name === 'Inovação');

  const joao = users.find(u => u.name === 'João Jornalista');
  const maria = users.find(u => u.name === 'Maria Repórter');
  const ana = users.find(u => u.name === 'Ana Editora');

  const articlesData = [
    {
      title: 'Inteligência Artificial transforma o mercado de trabalho em 2025',
      subtitle: 'Especialistas apontam que 40% das funções serão automatizadas até 2030',
      content: `A inteligência artificial continua a remodelar profundamente o mercado de trabalho global. Segundo um novo relatório do Fórum Econômico Mundial, cerca de 40% das funções atuais serão parcialmente ou totalmente automatizadas até 2030.

Empresas de tecnologia estão investindo bilhões em sistemas de IA capazes de executar tarefas cognitivas complexas, desde análise de dados até criação de conteúdo e atendimento ao cliente.

Ao mesmo tempo, surgem novas oportunidades. Profissionais capacitados em IA, aprendizado de máquina e análise de dados estão entre os mais requisitados do mercado, com salários acima da média.

"A chave é a adaptação", afirma a especialista em futuro do trabalho, Dra. Fernanda Lima. "Profissionais que aprendem a trabalhar com IA, em vez de competir com ela, terão vantagens significativas."

O governo brasileiro anunciou recentemente um programa de requalificação profissional focado em tecnologia, com previsão de capacitar 500 mil trabalhadores até o final do ano.`,
      categoryId: tech.id,
      authorId: joao.id,
      status: 'published',
      publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      viewCount: 1247
    },
    {
      title: 'Startups brasileiras captam recorde de R$ 8 bilhões no primeiro semestre',
      subtitle: 'Setor de fintechs e healthtechs lidera rodadas de investimento',
      content: `O ecossistema de startups do Brasil registrou captação recorde no primeiro semestre, atingindo a marca de R$ 8 bilhões em rodadas de investimento. O número representa crescimento de 35% em relação ao mesmo período do ano anterior.

As fintechs e healthtechs lideraram os aportes, respondendo por 60% do total captado. São Paulo concentra 70% das startups que receberam investimentos, seguida por Belo Horizonte (12%) e Recife (8%).

Entre os destaques estão uma startup de pagamentos instantâneos que captou R$ 1,2 bilhão em sua série C, e uma plataforma de telemedicina que recebeu R$ 800 milhões em aporte internacional.

O aquecimento do setor é impulsionado pela maturidade do mercado de venture capital nacional e pelo crescente interesse de fundos estrangeiros no Brasil.`,
      categoryId: eco.id,
      authorId: maria.id,
      status: 'published',
      publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      viewCount: 892
    },
    {
      title: 'Seleção Brasileira se classifica com 100% de aproveitamento',
      subtitle: 'Time comandado pelo técnico Dorival Júnior vence todos os jogos das eliminatórias',
      content: `A Seleção Brasileira de Futebol encerrou a primeira fase das eliminatórias sul-americanas com desempenho impecável: seis vitórias em seis jogos, 18 pontos conquistados e melhor ataque do grupo com 22 gols marcados.

O time mostrou evolução tática significativa sob o comando do técnico Dorival Júnior, combinando solidez defensiva — apenas 3 gols sofridos — com um ataque veloz e criativo liderado por Vini Jr e Rodrygo.

A classificação antecipada para a Copa do Mundo dá ao Brasil a possibilidade de poupar titulares nas últimas rodadas e testar novas peças para o torneio principal.

"Estamos no caminho certo. A equipe tem identidade e os jogadores entenderam o que pedimos", declarou o técnico após o último jogo.`,
      categoryId: esp.id,
      authorId: joao.id,
      status: 'published',
      publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      viewCount: 3456
    },
    {
      title: 'Festival de Cinema de São Paulo anuncia programação com 200 filmes',
      subtitle: 'Edição deste ano terá mostra especial dedicada ao cinema africano',
      content: `O Festival Internacional de Cinema de São Paulo divulgou a programação completa de sua 48ª edição, que acontecerá em outubro. Com 200 filmes selecionados de 60 países, o evento promete ser um dos maiores da história do festival.

A grande novidade desta edição é a mostra especial dedicada ao cinema africano, com 30 longas-metragens inéditos no Brasil. Serão exibidos filmes da Nigéria, Senegal, Etiópia, África do Sul e outros 12 países.

Na competição principal, o Brasil estará representado por cinco produções nacionais concorrendo à Bandeira Paulista, principal prêmio do evento.

"Esta edição celebra a diversidade do cinema mundial e reafirma o compromisso do festival com a distribuição de filmes de todo o planeta", afirma a diretora artística.`,
      categoryId: cul.id,
      authorId: ana.id,
      status: 'published',
      publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      viewCount: 445
    },
    {
      title: 'Câmara aprova projeto de regulação das redes sociais',
      subtitle: 'Lei prevê multas de até R$ 50 milhões para plataformas que descumprirem regras',
      content: `A Câmara dos Deputados aprovou por 312 votos a 98 o projeto de lei que regulamenta o funcionamento das redes sociais no Brasil. A proposta segue agora para o Senado Federal.

Entre os pontos principais do projeto estão a obrigatoriedade de identificação de conteúdo impulsionado por algoritmos, criação de canal para denúncia de desinformação e multas de até R$ 50 milhões para plataformas que descumprirem as novas regras.

O texto também prevê transparência nos algoritmos de recomendação de conteúdo e proteção especial para crianças e adolescentes, limitando o tempo de uso para menores de 14 anos.

Representantes das big techs manifestaram preocupação com algumas disposições do projeto, enquanto entidades de defesa do consumidor celebraram a aprovação.`,
      categoryId: pol.id,
      authorId: maria.id,
      status: 'draft',
      viewCount: 0
    },
    {
      title: 'Nova lei de IA: o que muda para empresas brasileiras',
      subtitle: 'Regulação prevê impactos significativos no setor de tecnologia a partir de 2026',
      content: `Com a aprovação iminente do marco legal da Inteligência Artificial no Brasil, empresas do setor já se preparam para adequar seus sistemas às novas exigências regulatórias.

Este artigo está sendo preparado com análise detalhada dos principais impactos para o mercado corporativo.`,
      categoryId: tech.id,
      authorId: joao.id,
      status: 'scheduled',
      publishedAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      viewCount: 0
    }
  ];

  for (let i = 0; i < articlesData.length; i++) {
    const data = articlesData[i];
    const tagIds = [];
    if (i === 0) tagIds.push(tagAI.id, tagInovacao.id);
    else if (i === 1) tagIds.push(tagStartup.id, tagBolsa.id);
    else if (i === 2) tagIds.push(tagFutebol.id);
    else if (i === 4) tagIds.push(tagAI.id, tagInovacao.id);
    const article = await Article.create(data);
    if (tagIds.length) await article.setTags(tagIds);
  }

  console.log('✅ 6 artigos criados (4 publicados, 1 rascunho, 1 agendado)');
  console.log('\n📋 Usuários de acesso:');
  console.log('   Editor:     editor@noticias.com / 12345');
  console.log('   Jornalista: joao@noticias.com / 12345');
  console.log('   Jornalista: maria@noticias.com / 12345');
  console.log('\n Seed concluído com sucesso!');
  process.exit(0);
};

seed().catch(err => {
  console.error(' Erro no seed:', err);
  process.exit(1);
});
