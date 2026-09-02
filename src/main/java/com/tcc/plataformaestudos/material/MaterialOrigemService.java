package com.tcc.plataformaestudos.material;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.tcc.plataformaestudos.config.AcessoNegadoException;
import com.tcc.plataformaestudos.config.RecursoNaoEncontradoException;
import com.tcc.plataformaestudos.deck.Deck;
import com.tcc.plataformaestudos.deck.DeckService;
import com.tcc.plataformaestudos.usuario.SecurityUtils;

/**
 * UC03 — Enviar PDF de estudo. RN01 (isolamento por usuário) é garantida via
 * {@link DeckService#buscarDeckDoUsuarioAutenticado(Long)} (no envio e na
 * listagem por deck) e {@link #buscarMaterialDoUsuarioAutenticado(Long)} (na
 * busca por id). RN06
 * (formato/tamanho) é validada antes de qualquer processamento. RN07 (falha
 * de extração não deve acionar a IA) é implementada marcando o material com
 * status ERRO em vez de propagar a falha. UC22/RN29: um material pode ser
 * excluído a qualquer momento pelo dono; a exclusão remove o registro e o
 * arquivo físico, sem afetar flashcards já confirmados (RN29 é explícita:
 * eles não mantêm vínculo individual com o material de origem).
 */
@Service
public class MaterialOrigemService {

	private static final Logger log = LoggerFactory.getLogger(MaterialOrigemService.class);

	private static final String EXTENSAO_PDF = ".pdf";
	private static final long TAMANHO_MAXIMO_BYTES = 15L * 1024 * 1024;
	private static final byte[] ASSINATURA_PDF = "%PDF-".getBytes(StandardCharsets.US_ASCII);

	private final MaterialOrigemRepository materialOrigemRepository;
	private final DeckService deckService;
	private final PdfTextExtractorService pdfTextExtractorService;
	private final Path diretorioUpload;

	public MaterialOrigemService(
			MaterialOrigemRepository materialOrigemRepository,
			DeckService deckService,
			PdfTextExtractorService pdfTextExtractorService,
			@Value("${app.upload.dir}") String diretorioUpload) {
		this.materialOrigemRepository = materialOrigemRepository;
		this.deckService = deckService;
		this.pdfTextExtractorService = pdfTextExtractorService;
		this.diretorioUpload = Path.of(diretorioUpload);
	}

	@Transactional
	public MaterialOrigemResponseDTO enviarPdf(Long deckId, MultipartFile arquivo) {
		Deck deck = deckService.buscarDeckDoUsuarioAutenticado(deckId);
		validarArquivo(arquivo);

		String caminhoArquivo = salvarArquivoFisico(deckId, arquivo);

		MaterialOrigem material = new MaterialOrigem();
		material.setDeck(deck);
		material.setNomeArquivo(arquivo.getOriginalFilename());
		material.setCaminhoArquivo(caminhoArquivo);
		material.setStatusProcessamento(StatusProcessamento.PENDENTE);
		material = materialOrigemRepository.save(material);
		log.info("Material recebido: materialId={}, deckId={}", material.getId(), deckId);

		processarExtracaoTexto(material, new File(caminhoArquivo));
		material = materialOrigemRepository.save(material);

		return MaterialOrigemResponseDTO.fromEntity(material);
	}

	@Transactional(readOnly = true)
	public MaterialOrigemResponseDTO buscarPorId(Long materialId) {
		return MaterialOrigemResponseDTO.fromEntity(buscarMaterialDoUsuarioAutenticado(materialId));
	}

	@Transactional(readOnly = true)
	public List<MaterialOrigemResponseDTO> listarPorDeck(Long deckId) {
		deckService.buscarDeckDoUsuarioAutenticado(deckId);

		return materialOrigemRepository.findByDeckIdOrderByCriadoEmDesc(deckId).stream()
				.map(MaterialOrigemResponseDTO::fromEntity)
				.toList();
	}

	private void validarArquivo(MultipartFile arquivo) {
		if (arquivo == null || arquivo.isEmpty()) {
			throw new ArquivoInvalidoException("Nenhum arquivo enviado");
		}

		String nomeOriginal = arquivo.getOriginalFilename();
		boolean extensaoValida = nomeOriginal != null && nomeOriginal.toLowerCase().endsWith(EXTENSAO_PDF);

		if (!extensaoValida) {
			throw new ArquivoInvalidoException("Apenas arquivos PDF são aceitos");
		}

		if (arquivo.getSize() > TAMANHO_MAXIMO_BYTES) {
			throw new ArquivoInvalidoException("O arquivo enviado excede o tamanho máximo de 15MB");
		}

		if (!temAssinaturaDePdf(arquivo)) {
			throw new ArquivoInvalidoException("O arquivo enviado não é um PDF válido");
		}
	}

	/**
	 * RN06 diz "apenas arquivos PDF são aceitos" - a extensão do nome do
	 * arquivo (checada acima) não garante isso: um arquivo renomeado para
	 * ".pdf" (ex.: uma página HTML salva com essa extensão) passaria pela
	 * checagem de extensão e só falharia depois, na extração de texto
	 * (RN07, status ERRO), quando o contrato já documenta esse caso como
	 * 400 na própria chamada de upload. Verifica a assinatura real do
	 * arquivo (%PDF-) em vez de confiar só no nome.
	 */
	private boolean temAssinaturaDePdf(MultipartFile arquivo) {
		try (InputStream entrada = arquivo.getInputStream()) {
			byte[] cabecalho = entrada.readNBytes(ASSINATURA_PDF.length);
			return Arrays.equals(cabecalho, ASSINATURA_PDF);
		} catch (IOException e) {
			throw new ArquivoInvalidoException("Falha ao ler o arquivo enviado");
		}
	}

	private String salvarArquivoFisico(Long deckId, MultipartFile arquivo) {
		try {
			Path diretorioDeck = diretorioUpload.resolve(String.valueOf(deckId));
			Files.createDirectories(diretorioDeck);

			Path caminho = diretorioDeck.resolve(UUID.randomUUID() + EXTENSAO_PDF);
			arquivo.transferTo(caminho);

			return caminho.toString();
		} catch (IOException e) {
			throw new ArquivoInvalidoException("Falha ao salvar o arquivo enviado");
		}
	}

	private void processarExtracaoTexto(MaterialOrigem material, File arquivoFisico) {
		try {
			String texto = pdfTextExtractorService.extrairTexto(arquivoFisico);
			material.setTextoExtraido(texto);
			material.setStatusProcessamento(StatusProcessamento.PROCESSADO);
			log.info("Texto extraído com sucesso: materialId={}", material.getId());
		} catch (ExtracaoTextoException e) {
			material.setStatusProcessamento(StatusProcessamento.ERRO);
			log.error("Falha ao extrair texto do PDF (RN07 — IA não será chamada): materialId={}", material.getId(), e);
		}
	}

	/**
	 * UC22/RN29 — exclui o material e seu arquivo físico. Se a remoção do
	 * arquivo falhar (ex.: permissão, arquivo já removido manualmente),
	 * loga o erro mas ainda assim remove o registro — mesmo espírito de
	 * RN07 (falha num passo secundário não deve travar o fluxo principal),
	 * já que deixar o registro "preso" por causa do arquivo seria pior
	 * para o usuário do que um arquivo órfão no disco.
	 */
	@Transactional
	public void excluir(Long materialId) {
		MaterialOrigem material = buscarMaterialDoUsuarioAutenticado(materialId);

		excluirArquivoFisico(material);
		materialOrigemRepository.delete(material);
		log.info("Material excluído: materialId={}", materialId);
	}

	private void excluirArquivoFisico(MaterialOrigem material) {
		try {
			Files.deleteIfExists(Path.of(material.getCaminhoArquivo()));
		} catch (IOException e) {
			log.error("Falha ao remover o arquivo físico do material (registro será removido mesmo assim): materialId={}",
					material.getId(), e);
		}
	}

	/**
	 * Centraliza RN01 para MaterialOrigem. Público para reuso por outros
	 * services que precisam do material já verificado (ex.:
	 * FlashcardGenerationService, UC04).
	 */
	public MaterialOrigem buscarMaterialDoUsuarioAutenticado(Long materialId) {
		Long usuarioId = SecurityUtils.obterUsuarioAutenticadoId();

		return materialOrigemRepository.findByIdAndDeckUsuarioId(materialId, usuarioId)
				.orElseGet(() -> {
					if (materialOrigemRepository.existsById(materialId)) {
						throw new AcessoNegadoException("Você não tem permissão para acessar este material");
					}
					throw new RecursoNaoEncontradoException("Material não encontrado");
				});
	}

}
