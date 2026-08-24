package com.tcc.plataformaestudos.material;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
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
 * {@link DeckService#buscarDeckDoUsuarioAutenticado(Long)} (no envio) e
 * {@link #buscarMaterialDoUsuarioAutenticado(Long)} (na busca por id). RN06
 * (formato/tamanho) é validada antes de qualquer processamento. RN07 (falha
 * de extração não deve acionar a IA) é implementada marcando o material com
 * status ERRO em vez de propagar a falha.
 */
@Service
public class MaterialOrigemService {

	private static final Logger log = LoggerFactory.getLogger(MaterialOrigemService.class);

	private static final String EXTENSAO_PDF = ".pdf";
	private static final long TAMANHO_MAXIMO_BYTES = 15L * 1024 * 1024;

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
