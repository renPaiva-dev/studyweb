package com.tcc.plataformaestudos.demo;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.tcc.plataformaestudos.deck.Deck;
import com.tcc.plataformaestudos.deck.DeckRepository;
import com.tcc.plataformaestudos.flashcard.Flashcard;
import com.tcc.plataformaestudos.flashcard.OrigemFlashcard;
import com.tcc.plataformaestudos.quiz.AlternativaQuiz;
import com.tcc.plataformaestudos.quiz.EstiloProva;
import com.tcc.plataformaestudos.quiz.OrigemQuiz;
import com.tcc.plataformaestudos.quiz.QuestaoQuiz;
import com.tcc.plataformaestudos.quiz.Quiz;
import com.tcc.plataformaestudos.quiz.RespostaTentativaQuiz;
import com.tcc.plataformaestudos.quiz.TentativaQuiz;
import com.tcc.plataformaestudos.revisao.RevisaoFlashcard;
import com.tcc.plataformaestudos.usuario.Usuario;
import com.tcc.plataformaestudos.usuario.UsuarioRepository;

/**
 * Conveniência só para a demonstração/defesa do TCC: povoa uma conta com 3
 * decks, dezenas de flashcards já com histórico de revisão maduro (alguns
 * "dominados", outros "em risco" por resposta fraca ou por atraso — mesmos
 * critérios de {@link com.tcc.plataformaestudos.dashboard.CriterioDesempenhoFlashcard},
 * RN14), data-alvo de prova (UC31/RN40) e duas tentativas de quiz já
 * registradas — para que Dashboard, Evolução, Tópicos, Ranking Geral e
 * Previsão de Prontidão mostrem dados reais na primeira tela, em vez de
 * estados vazios.
 *
 * <p>Idempotente (não duplica se a conta demo já existe) e gated por
 * {@code app.seed-demo.enabled}, com o mesmo espírito de segurança de
 * {@link com.tcc.plataformaestudos.usuario.SeedUsuarioDevRunner}: fallback
 * {@code false}, nunca ligado por acidente fora de um ambiente de
 * demonstração explicitamente configurado.
 *
 * <p><b>As datas de revisão são relativas a "agora" no momento em que este
 * runner executa</b> (streak e o gráfico de evolução dependem disso) — para
 * a demonstração ficar com dados "frescos", rode com a conta demo ainda
 * inexistente (banco limpo, ou após excluir a conta {@code banca@studyweb.local})
 * pouco antes da apresentação.
 */
@Component
public class SeedDemoDataRunner {

	private static final Logger log = LoggerFactory.getLogger(SeedDemoDataRunner.class);

	private static final String EMAIL = "banca@studyweb.local";
	private static final String SENHA = "Banca@2026";
	private static final String NOME_USUARIO = "banca";

	private final UsuarioRepository usuarioRepository;
	private final DeckRepository deckRepository;
	private final PasswordEncoder passwordEncoder;
	private final boolean habilitado;
	private final String termosVersaoAtual;

	private LocalDateTime agora;
	private Usuario usuario;

	public SeedDemoDataRunner(
			UsuarioRepository usuarioRepository,
			DeckRepository deckRepository,
			PasswordEncoder passwordEncoder,
			@Value("${app.seed-demo.enabled:false}") boolean habilitado,
			@Value("${app.termos.versao-atual}") String termosVersaoAtual) {
		this.usuarioRepository = usuarioRepository;
		this.deckRepository = deckRepository;
		this.passwordEncoder = passwordEncoder;
		this.habilitado = habilitado;
		this.termosVersaoAtual = termosVersaoAtual;
	}

	@EventListener(ApplicationReadyEvent.class)
	@Transactional
	public void semearAoSubir() {
		if (!habilitado) {
			return;
		}

		if (usuarioRepository.findByEmail(EMAIL).isPresent()) {
			log.info("Conta de demonstração já existe: email={}", EMAIL);
			return;
		}

		this.agora = LocalDateTime.now();
		this.usuario = criarUsuarioDemo();

		criarDeckDireitoConstitucional();
		criarDeckAnatomia();
		criarDeckCalculo();

		log.info("Dados de demonstração criados — email={}, senha={} (3 decks, dashboard/evolução/prontidão já com histórico)",
				EMAIL, SENHA);
	}

	private Usuario criarUsuarioDemo() {
		Usuario u = new Usuario();
		u.setNome("Banca Examinadora");
		u.setNomeUsuario(NOME_USUARIO);
		u.setEmail(EMAIL);
		u.setSenhaHash(passwordEncoder.encode(SENHA));
		u.setEmailVerificado(true);
		u.setTermosAceitosEm(agora);
		u.setTermosVersao(termosVersaoAtual);
		return usuarioRepository.save(u);
	}

	// --- Perfis de histórico de revisão (RN09/RN14) ------------------------

	/** Ponto de revisão relativo a "agora", na ordem em que foi respondido. */
	private record PontoRevisao(int diasAtras, int qualidade, String fatorFacilidade, int intervaloDias, int repeticoes,
			int proximaRevisaoEmDiasAPartirDaRevisao) {
	}

	private enum Perfil {
		/** repeticoes>=3 e última qualidade>=4 (RN14) — não deve estar em risco. */
		DOMINADO(List.of(
				new PontoRevisao(20, 3, "2.30", 1, 1, 6),
				new PontoRevisao(10, 4, "2.50", 6, 2, 15),
				new PontoRevisao(2, 5, "2.70", 16, 3, 16))),
		/** última qualidade < 3 — em risco por resposta fraca, revisão vencida hoje. */
		EM_RISCO_RESPOSTA(List.of(
				new PontoRevisao(15, 4, "2.40", 6, 2, 6),
				new PontoRevisao(0, 1, "1.80", 1, 0, 0))),
		/** última qualidade ok, mas próxima revisão vencida há mais de 7 dias (RN14) sem retorno. */
		EM_RISCO_ATRASO(List.of(
				new PontoRevisao(25, 3, "2.20", 10, 1, -15))),
		/** nunca revisado — some para a fila de estudo pela regra de "primeira revisão" (RN10). */
		NUNCA_REVISADO(List.of());

		final List<PontoRevisao> historico;

		Perfil(List<PontoRevisao> historico) {
			this.historico = historico;
		}
	}

	private record ItemFlashcard(String pergunta, String resposta, String topico, Perfil perfil, String mnemonico) {
		ItemFlashcard(String pergunta, String resposta, String topico, Perfil perfil) {
			this(pergunta, resposta, topico, perfil, null);
		}
	}

	private Deck novoDeck(String titulo, String descricao, LocalDate dataAlvoProva) {
		Deck deck = new Deck();
		deck.setUsuario(usuario);
		deck.setTitulo(titulo);
		deck.setDescricao(descricao);
		deck.setDataAlvoProva(dataAlvoProva);
		return deck;
	}

	private void adicionarFlashcards(Deck deck, List<ItemFlashcard> itens) {
		for (ItemFlashcard item : itens) {
			Flashcard flashcard = new Flashcard();
			flashcard.setDeck(deck);
			flashcard.setPergunta(item.pergunta());
			flashcard.setResposta(item.resposta());
			flashcard.setTopico(item.topico());
			flashcard.setMnemonico(item.mnemonico());
			flashcard.setOrigem(OrigemFlashcard.MANUAL);
			deck.getFlashcards().add(flashcard);

			for (PontoRevisao ponto : item.perfil().historico) {
				LocalDateTime dataRevisao = agora.minusDays(ponto.diasAtras());
				RevisaoFlashcard revisao = new RevisaoFlashcard();
				revisao.setFlashcard(flashcard);
				revisao.setUsuario(usuario);
				revisao.setDataRevisao(dataRevisao);
				revisao.setQualidadeResposta(ponto.qualidade());
				revisao.setFatorFacilidade(new BigDecimal(ponto.fatorFacilidade()));
				revisao.setIntervaloDias(ponto.intervaloDias());
				revisao.setRepeticoes(ponto.repeticoes());
				revisao.setProximaRevisao(dataRevisao.toLocalDate().plusDays(ponto.proximaRevisaoEmDiasAPartirDaRevisao()));
				flashcard.getRevisoes().add(revisao);
			}
		}
	}

	private record AlternativaSeed(String texto, boolean correta) {
	}

	private record QuestaoSeed(String enunciado, List<AlternativaSeed> alternativas, String explicacao, boolean acertouNaTentativa) {
	}

	private void adicionarQuizComTentativa(
			Deck deck, String titulo, OrigemQuiz origem, EstiloProva estilo, int diasAtrasTentativa, List<QuestaoSeed> questoesSeed) {
		Quiz quiz = new Quiz();
		quiz.setDeck(deck);
		quiz.setTitulo(titulo);
		quiz.setOrigem(origem);
		quiz.setEstilo(estilo);
		deck.getQuizzes().add(quiz);

		List<QuestaoQuiz> questoes = new ArrayList<>();
		for (QuestaoSeed seed : questoesSeed) {
			QuestaoQuiz questao = new QuestaoQuiz();
			questao.setQuiz(quiz);
			questao.setEnunciado(seed.enunciado());
			questao.setAlternativas(seed.alternativas().stream().map(a -> new AlternativaQuiz(a.texto(), a.correta())).toList());
			questao.setRespostaCorreta(seed.alternativas().stream().filter(AlternativaSeed::correta).findFirst().orElseThrow().texto());
			questao.setExplicacao(seed.explicacao());
			quiz.getQuestoes().add(questao);
			questoes.add(questao);
		}

		TentativaQuiz tentativa = new TentativaQuiz();
		tentativa.setQuiz(quiz);
		tentativa.setUsuario(usuario);
		tentativa.setDataTentativa(agora.minusDays(diasAtrasTentativa));

		int acertos = 0;
		for (int i = 0; i < questoes.size(); i++) {
			QuestaoSeed seed = questoesSeed.get(i);
			QuestaoQuiz questao = questoes.get(i);
			boolean acertou = seed.acertouNaTentativa();
			String escolhida = acertou
					? questao.getRespostaCorreta()
					: seed.alternativas().stream().filter(a -> !a.correta()).findFirst().orElseThrow().texto();

			RespostaTentativaQuiz resposta = new RespostaTentativaQuiz();
			resposta.setTentativa(tentativa);
			resposta.setQuestao(questao);
			resposta.setAlternativaEscolhida(escolhida);
			resposta.setCorreta(acertou);
			tentativa.getRespostas().add(resposta);

			if (acertou) {
				acertos++;
			}
		}

		tentativa.setPontuacao(BigDecimal.valueOf(acertos * 100.0 / questoes.size()).setScale(2, java.math.RoundingMode.HALF_UP));
		quiz.getTentativas().add(tentativa);
	}

	// --- Deck 1: Direito Constitucional -------------------------------------

	private void criarDeckDireitoConstitucional() {
		Deck deck = novoDeck(
				"Direito Constitucional",
				"Direitos fundamentais, organização do Estado e controle de constitucionalidade.",
				agora.toLocalDate().plusDays(10));

		adicionarFlashcards(deck, List.of(
				new ItemFlashcard("O que são cláusulas pétreas?",
						"Dispositivos constitucionais que não podem ser abolidos nem por emenda (art. 60, §4º da CF/88): forma federativa, voto direto/secreto/universal/periódico, separação dos poderes e direitos e garantias individuais.",
						"Direitos Fundamentais", Perfil.DOMINADO),
				new ItemFlashcard("Qual a diferença entre direitos individuais e direitos sociais?",
						"Direitos individuais (art. 5º) protegem a liberdade do indivíduo frente ao Estado (1ª geração); direitos sociais (art. 6º) exigem prestação positiva do Estado (2ª geração), como saúde, educação e trabalho.",
						"Direitos Fundamentais", Perfil.DOMINADO),
				new ItemFlashcard("O direito à vida admite exceções no ordenamento brasileiro?",
						"Sim: a CF/88 prevê a pena de morte em caso de guerra declarada (art. 5º, XLVII, 'a'), única exceção expressa ao direito à vida.",
						"Direitos Fundamentais", Perfil.NUNCA_REVISADO),
				new ItemFlashcard("O que é o princípio da dignidade da pessoa humana?",
						"Fundamento da República (art. 1º, III) que serve de base interpretativa para todos os direitos fundamentais — nenhuma norma pode ser aplicada de forma a reduzir a pessoa à condição de mero objeto.",
						"Direitos Fundamentais", Perfil.DOMINADO),

				new ItemFlashcard("Quais são os entes federativos no Brasil?",
						"União, Estados, Distrito Federal e Municípios (art. 18), todos autônomos entre si, sem relação de hierarquia.",
						"Organização do Estado", Perfil.DOMINADO),
				new ItemFlashcard("O que é competência privativa da União?",
						"Matérias que só a União pode legislar (art. 22), como direito civil, penal e trabalho — delegáveis a Estados por lei complementar em questões específicas (art. 22, parágrafo único).",
						"Organização do Estado", Perfil.NUNCA_REVISADO),
				new ItemFlashcard("Quais são os Poderes da República e o princípio que os rege?",
						"Executivo, Legislativo e Judiciário (art. 2º), independentes e harmônicos entre si — o princípio da separação dos poderes, com freios e contrapesos mútuos.",
						"Organização do Estado", Perfil.DOMINADO),
				new ItemFlashcard("O que é intervenção federal?",
						"Medida excepcional (art. 34) em que a União afasta temporariamente a autonomia de um Estado/DF, em hipóteses taxativas como grave comprometimento da ordem pública.",
						"Organização do Estado", Perfil.EM_RISCO_RESPOSTA),

				new ItemFlashcard("O que é controle de constitucionalidade difuso?",
						"Controle exercido por qualquer juiz ou tribunal, incidentalmente, ao julgar um caso concreto — efeitos, em regra, inter partes (salvo resolução do Senado, art. 52, X).",
						"Controle de Constitucionalidade", Perfil.EM_RISCO_RESPOSTA),
				new ItemFlashcard("O que é uma ADI (Ação Direta de Inconstitucionalidade)?",
						"Instrumento de controle concentrado, julgado originariamente pelo STF, que questiona a constitucionalidade de lei ou ato normativo em tese, com efeitos erga omnes e vinculantes.",
						"Controle de Constitucionalidade", Perfil.EM_RISCO_ATRASO),
				new ItemFlashcard("Qual a diferença entre inconstitucionalidade formal e material?",
						"Formal: vício no processo de elaboração da norma (ex.: quórum errado). Material: o conteúdo da norma contraria a Constituição, independentemente de como foi aprovada.",
						"Controle de Constitucionalidade", Perfil.EM_RISCO_RESPOSTA),
				new ItemFlashcard("O que é a modulação de efeitos em controle de constitucionalidade?",
						"Mecanismo (art. 27 da Lei 9.868/99) que permite ao STF restringir os efeitos da declaração de inconstitucionalidade (ex.: só a partir do trânsito em julgado), por segurança jurídica ou excepcional interesse social.",
						"Controle de Constitucionalidade", Perfil.EM_RISCO_ATRASO)));

		adicionarQuizComTentativa(deck, "Quiz — Direito Constitucional", OrigemQuiz.DETERMINISTICO, null, 3, List.of(
				new QuestaoSeed("Qual NÃO é uma cláusula pétrea?",
						List.of(new AlternativaSeed("Separação dos poderes", false), new AlternativaSeed("Voto obrigatório", true),
								new AlternativaSeed("Forma federativa de Estado", false), new AlternativaSeed("Direitos e garantias individuais", false)),
						"Voto obrigatório não é cláusula pétrea — o que é protegido é o voto direto, secreto, universal e periódico (art. 60, §4º).", true),
				new QuestaoSeed("O controle difuso de constitucionalidade é exercido por:",
						List.of(new AlternativaSeed("Somente o STF", false), new AlternativaSeed("Qualquer juiz ou tribunal, em caso concreto", true),
								new AlternativaSeed("Somente o Senado Federal", false), new AlternativaSeed("Somente o Presidente da República", false)),
						"O controle difuso é incidental, exercido por qualquer órgão do Judiciário ao julgar um caso concreto.", true),
				new QuestaoSeed("A ADI tem efeitos:",
						List.of(new AlternativaSeed("Inter partes", false), new AlternativaSeed("Erga omnes e vinculante", true),
								new AlternativaSeed("Apenas para a União", false), new AlternativaSeed("Retroativos apenas ao autor da ação", false)),
						"Efeitos erga omnes (para todos) e vinculante em relação aos demais órgãos do Judiciário e à Administração Pública.", true),
				new QuestaoSeed("Intervenção federal é medida:",
						List.of(new AlternativaSeed("Regra geral do federalismo", false), new AlternativaSeed("Excepcional e taxativa", true),
								new AlternativaSeed("De competência dos Estados", false), new AlternativaSeed("Permanente", false)),
						"É excepcional, cabível apenas nas hipóteses taxativas do art. 34 da CF/88.", true),
				new QuestaoSeed("A pena de morte no Brasil é:",
						List.of(new AlternativaSeed("Proibida em qualquer hipótese", true), new AlternativaSeed("Permitida em caso de guerra declarada", false),
								new AlternativaSeed("Permitida para crimes hediondos", false), new AlternativaSeed("Decidida por plebiscito", false)),
						"É admitida em caso de guerra declarada (art. 5º, XLVII, 'a') — única exceção expressa.", false)));

		deckRepository.save(deck);
	}

	// --- Deck 2: Anatomia — Sistema Nervoso ---------------------------------

	private void criarDeckAnatomia() {
		Deck deck = novoDeck(
				"Anatomia — Sistema Nervoso",
				"Neurônios, sistema nervoso central e periférico.",
				agora.toLocalDate().plusDays(5));

		adicionarFlashcards(deck, List.of(
				new ItemFlashcard("O que é um neurônio e quais suas partes principais?",
						"Célula excitável especializada em transmitir impulsos elétricos, composta por dendritos (recebem estímulos), corpo celular/soma (núcleo e organelas) e axônio (conduz o impulso até outra célula).",
						"Neurônios e Sinapses", Perfil.DOMINADO, "Dendrito recebe, axônio envia — como uma antena e um cabo."),
				new ItemFlashcard("O que é uma sinapse?",
						"Região de comunicação entre dois neurônios (ou neurônio e célula efetora), onde o impulso é transmitido quimicamente (neurotransmissores) ou eletricamente.",
						"Neurônios e Sinapses", Perfil.DOMINADO),
				new ItemFlashcard("Qual a função da bainha de mielina?",
						"Isolante elétrico produzido por oligodendrócitos (SNC) ou células de Schwann (SNP) que acelera a condução do impulso nervoso por condução saltatória (nodos de Ranvier).",
						"Neurônios e Sinapses", Perfil.NUNCA_REVISADO),
				new ItemFlashcard("O que são neurotransmissores? Cite dois exemplos.",
						"Substâncias químicas liberadas na fenda sináptica que transmitem o sinal ao neurônio seguinte. Exemplos: dopamina (recompensa/movimento) e serotonina (humor/sono).",
						"Neurônios e Sinapses", Perfil.DOMINADO),

				new ItemFlashcard("Quais estruturas compõem o Sistema Nervoso Central (SNC)?",
						"Encéfalo (cérebro, cerebelo e tronco encefálico) e medula espinhal, protegidos por meninges e líquido cefalorraquidiano.",
						"Sistema Nervoso Central", Perfil.DOMINADO),
				new ItemFlashcard("Qual a função do cerebelo?",
						"Coordenação motora fina, equilíbrio e postura — não inicia o movimento, mas ajusta sua precisão e sincronia.",
						"Sistema Nervoso Central", Perfil.NUNCA_REVISADO),
				new ItemFlashcard("Quais são os principais lobos do córtex cerebral?",
						"Frontal (planejamento e movimento voluntário), parietal (sensações somáticas), temporal (audição e memória) e occipital (visão).",
						"Sistema Nervoso Central", Perfil.DOMINADO),
				new ItemFlashcard("Qual a função do tronco encefálico?",
						"Controla funções vitais automáticas (respiração, batimentos cardíacos, pressão arterial) e é via de passagem entre encéfalo e medula.",
						"Sistema Nervoso Central", Perfil.EM_RISCO_RESPOSTA),

				new ItemFlashcard("O que compõe o Sistema Nervoso Periférico (SNP)?",
						"Nervos cranianos e espinhais, e os gânglios nervosos — tudo que fica fora do encéfalo e da medula espinhal.",
						"Sistema Nervoso Periférico", Perfil.EM_RISCO_RESPOSTA),
				new ItemFlashcard("Qual a diferença entre sistema nervoso simpático e parassimpático?",
						"Ambos compõem o sistema nervoso autônomo. Simpático prepara o corpo para ação ('luta ou fuga': acelera batimentos, dilata pupilas); parassimpático promove repouso e digestão ('descansar e digerir').",
						"Sistema Nervoso Periférico", Perfil.EM_RISCO_ATRASO),
				new ItemFlashcard("O que é um arco reflexo?",
						"Via neural curta e involuntária (receptor → neurônio sensitivo → medula → neurônio motor → efetor) que gera resposta rápida sem processamento consciente pelo encéfalo, como o reflexo patelar.",
						"Sistema Nervoso Periférico", Perfil.EM_RISCO_RESPOSTA),
				new ItemFlashcard("Quantos pares de nervos cranianos existem e dê um exemplo?",
						"12 pares. Exemplo: o nervo vago (X par), com ampla distribuição parassimpática para órgãos torácicos e abdominais.",
						"Sistema Nervoso Periférico", Perfil.EM_RISCO_ATRASO)));

		adicionarQuizComTentativa(deck, "Simulado ENEM — Sistema Nervoso", OrigemQuiz.IA_PERSONALIZADA, EstiloProva.ENEM, 1, List.of(
				new QuestaoSeed("A condução saltatória do impulso nervoso é possibilitada por:",
						List.of(new AlternativaSeed("Ausência de axônio", false), new AlternativaSeed("Bainha de mielina e nodos de Ranvier", true),
								new AlternativaSeed("Presença exclusiva de dendritos", false), new AlternativaSeed("Ausência de sinapses", false)),
						"A mielina isola o axônio, e o impulso 'salta' entre os nodos de Ranvier, acelerando a condução.", true),
				new QuestaoSeed("Um atleta que precisa de reação rápida diante de um estímulo inesperado depende principalmente de:",
						List.of(new AlternativaSeed("Sistema nervoso parassimpático", false), new AlternativaSeed("Sistema nervoso simpático", true),
								new AlternativaSeed("Bainha de mielina do intestino", false), new AlternativaSeed("Córtex occipital isoladamente", false)),
						"O sistema simpático ativa a resposta de 'luta ou fuga', preparando o corpo para reação rápida.", true),
				new QuestaoSeed("A coordenação motora fina e o equilíbrio são funções principalmente de qual estrutura?",
						List.of(new AlternativaSeed("Cerebelo", true), new AlternativaSeed("Lobo occipital", false),
								new AlternativaSeed("Nervo vago", false), new AlternativaSeed("Gânglio nervoso", false)),
						"O cerebelo ajusta precisão e sincronia do movimento, além do equilíbrio.", true),
				new QuestaoSeed("O reflexo patelar é um exemplo clássico de:",
						List.of(new AlternativaSeed("Processamento consciente no córtex", false), new AlternativaSeed("Arco reflexo", true),
								new AlternativaSeed("Sinapse simpática exclusiva", false), new AlternativaSeed("Função do tronco encefálico", false)),
						"É uma via neural curta e involuntária, sem passar pelo processamento consciente do encéfalo.", false),
				new QuestaoSeed("O sistema nervoso periférico é formado por:",
						List.of(new AlternativaSeed("Encéfalo e medula espinhal", false), new AlternativaSeed("Nervos cranianos, espinhais e gânglios", true),
								new AlternativaSeed("Apenas o cerebelo", false), new AlternativaSeed("Apenas os lobos cerebrais", false)),
						"SNC = encéfalo + medula; SNP = tudo que fica fora disso (nervos e gânglios).", false)));

		deckRepository.save(deck);
	}

	// --- Deck 3: Cálculo I --------------------------------------------------

	private void criarDeckCalculo() {
		Deck deck = novoDeck(
				"Cálculo I — Limites e Derivadas",
				"Limites, derivadas e regras de derivação.",
				null);

		adicionarFlashcards(deck, List.of(
				new ItemFlashcard("O que significa intuitivamente o limite de uma função em um ponto?",
						"O valor que f(x) se aproxima quando x se aproxima de um ponto a, independentemente de f estar definida (ou não) em a.",
						"Limites", Perfil.DOMINADO),
				new ItemFlashcard("Quando um limite não existe?",
						"Quando os limites laterais (pela esquerda e pela direita) são diferentes, ou quando a função oscila/diverge sem se estabilizar em um valor.",
						"Limites", Perfil.DOMINADO),
				new ItemFlashcard("O que é uma indeterminação do tipo 0/0?",
						"Situação em que substituir o valor de x direto na função resulta em 0/0 — não significa que o limite não existe, apenas que é preciso simplificar a expressão (fatoração, racionalização) antes de calcular.",
						"Limites", Perfil.NUNCA_REVISADO),
				new ItemFlashcard("O que é continuidade de uma função em um ponto?",
						"f é contínua em a quando: f(a) existe, o limite de f em a existe, e esse limite é igual a f(a).",
						"Limites", Perfil.DOMINADO),

				new ItemFlashcard("O que é a derivada de uma função em um ponto?",
						"A taxa de variação instantânea de f em relação a x naquele ponto — geometricamente, o coeficiente angular da reta tangente ao gráfico de f nesse ponto.",
						"Derivadas", Perfil.DOMINADO),
				new ItemFlashcard("Qual a definição formal de derivada via limite?",
						"f'(x) = lim(h→0) [f(x+h) − f(x)] / h, quando esse limite existe.",
						"Derivadas", Perfil.NUNCA_REVISADO),
				new ItemFlashcard("Toda função contínua é derivável?",
						"Não. Continuidade é condição necessária, mas não suficiente — ex.: f(x) = |x| é contínua em x=0, mas não é derivável ali (bico no gráfico).",
						"Derivadas", Perfil.DOMINADO),
				new ItemFlashcard("O que a derivada segunda indica sobre o gráfico de uma função?",
						"A concavidade: f''(x) > 0 indica concavidade para cima; f''(x) < 0, para baixo. Pontos onde f'' muda de sinal são pontos de inflexão.",
						"Derivadas", Perfil.EM_RISCO_RESPOSTA),

				new ItemFlashcard("Qual a regra da derivada de uma potência xⁿ?",
						"d/dx[xⁿ] = n·xⁿ⁻¹ (regra do tombamento).",
						"Regras de Derivação", Perfil.EM_RISCO_RESPOSTA),
				new ItemFlashcard("Como funciona a regra do produto?",
						"d/dx[f·g] = f'·g + f·g' — a derivada de um produto NÃO é o produto das derivadas.",
						"Regras de Derivação", Perfil.EM_RISCO_ATRASO),
				new ItemFlashcard("Como funciona a regra da cadeia?",
						"Para h(x) = f(g(x)), h'(x) = f'(g(x)) · g'(x) — deriva-se 'de fora para dentro', multiplicando pela derivada da função interna.",
						"Regras de Derivação", Perfil.EM_RISCO_RESPOSTA),
				new ItemFlashcard("Qual a derivada de sen(x) e de cos(x)?",
						"d/dx[sen(x)] = cos(x); d/dx[cos(x)] = −sen(x).",
						"Regras de Derivação", Perfil.EM_RISCO_ATRASO)));

		deckRepository.save(deck);
	}

}
