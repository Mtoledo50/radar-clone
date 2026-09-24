"""
Parser de Extratos Bancários do ITAÚ (Pessoa Jurídica / Empresas)
=================================================================

🎯 OBJETIVO:
    Extrair lançamentos de extratos do Itaú no formato "Entradas e Saídas".
    Este parser foi criado para resolver o problema onde extratos do Itaú
    eram erroneamente identificados como Banco do Brasil devido à presença
    genérica das palavras "AGÊNCIA" e "CONTA" no cabeçalho.

📝 LAYOUT SUPORTADO:
    Baseado no PDF: Entradas_Saidas_ag3115cc994851_11-08-26.pdf
    
    Estrutura típica de linha de lançamento:
    DD/MM/AAAA | DESCRIÇÃO DO LANÇAMENTO + DADOS DA CONTRAPARTE | VALOR
    
    Exemplos reais extraídos do PDF de referência:
    - "18/05/2026 PAGAMENTOS PIX QR-CODE RECEITA FEDERAL 00.394.460/0058-87 -2.987,81"
    - "18/05/2026 PIX ENVIADO RODRIGO D AVILA DA SILVA 008.664.990-67 -15.000,00"
    - "18/05/2026 RENDIMENTOS REND PAGO APLIC AUT MAIS 0,21"

⚠️ NOTAS TÉCNICAS:
    - O Itaú NÃO usa colunas fixas separadas por espaços simples como o BB.
      A descrição e os dados da contraparte (nome, CPF/CNPJ) vêm tudo junto
      antes do valor. Por isso usamos uma regex mais flexível.
    - Valores negativos possuem sinal "-" explícito.
    - Valores positivos (entradas) NÃO possuem sinal "+" (são implícitos).
    - Linhas de "SALDO TOTAL DISPONÍVEL" devem ser IGNORADAS (não são lançamentos).
    - O cabeçalho contém "Agência XXXX Conta XXXXX-X" (formato específico do Itaú).

🔗 DEPENDÊNCIAS:
    - app.models.lancamento (ExtratoBancario, LancamentoBancario, SinalMovimento)
    - app.parsers.base (BaseParser)
    - pdfplumber (extração de texto nativa)
    - re (expressões regulares)

👤 AUTOR: IA Engenheiro Sênior (Radar Conta Certa)
📅 DATA: Setembro/2026
"""

import re
import pdfplumber
from pathlib import Path
from typing import Optional, List, Dict, Any

from app.models.lancamento import (
    ExtratoBancario,
    LancamentoBancario,
    SinalMovimento,
)
from app.parsers.base import BaseParser


class ParserItauError(Exception):
    """Exceção específica para erros no parser do Itaú."""
    pass


class ParserItau(BaseParser):
    """
    Parser especializado para extratos do Itaú (PJ/Empresas).
    
    Herda de BaseParser e implementa os métodos abstratos
    detecta_banco() e parse().
    """

    # =========================================================================
    # PROPRIEDADES OBRIGATÓRIAS (Interface BaseParser)
    # =========================================================================
    
    @property
    def nome_banco(self) -> str:
        """Nome exibido nos logs e na resposta da API."""
        return "ITAU"

    @property
    def codigo_banco(self) -> str:
        """Código interno usado pelo ParserFactory e forçar_parser()."""
        return "itau"

    # =========================================================================
    # EXPRESSÕES REGULARES (Regex)
    # Cada regex é documentada individualmente para manutenção futura.
    # =========================================================================

    # 🔍 DETECÇÃO DO BANCO NO CABEÇALHO
    # O Itaú usa "Itaú" ou "ITAU" + padrão de conta com hífen (ex: 0099485-1)
    # Isso diferencia do BB que usa conta sem hífen.
    REGEX_DETECT_ITAU = re.compile(
        r'(?:ITA[UÚ]|ITAU\s+UNIBANCO)', 
        re.IGNORECASE
    )

    # 🏦 EXTRAÇÃO DE AGÊNCIA (4 dígitos)
    # Formato no PDF: "Agência 3115" ou "Agencia 3115"
    REGEX_AGENCIA = re.compile(
        r'Ag[eê]ncia[:\s]+(\d{4})', 
        re.IGNORECASE
    )

    # 🏦 EXTRAÇÃO DE CONTA CORRENTE (com dígito verificador após hífen)
    # Formato no PDF: "Conta 0099485-1" ou "Conta Corrente 0099485-1"
    # O hífen é CARACTERÍSTICO do Itaú e ajuda a diferenciar de outros bancos.
    REGEX_CONTA = re.compile(
        r'Conta(?:\s+Corrente)?[:\s]+([\d]+-[\dXx])', 
        re.IGNORECASE
    )

    # 📅 EXTRAÇÃO DA COMPETÊNCIA (Mês/Ano de referência)
    # Busca datas no formato DD/MM/AAAA no corpo do extrato para determinar
    # o mês de competência. Pega a primeira data encontrada nos lançamentos.
    REGEX_PRIMEIRA_DATA = re.compile(
        r'(\d{2})/(\d{2})/(\d{4})'
    )

    # 💰 LINHA DE LANÇAMENTO
    # Captura: DATA | DESCRIÇÃO_COMPLETA | VALOR
    # 
    # Explicação detalhada da regex:
    #   ^(\d{2}/\d{2}/\d{4})     → Data no início da linha (DD/MM/AAAA)
    #   \s+                       → Espaços entre data e descrição
    #   (.+?)                     → Descrição completa (non-greedy)
    #   \s+                       → Espaços antes do valor
    #   (-?[\d.]+,\d{2})          → Valor monetário BR (opcional negativo)
    #   \s*$                      → Fim da linha
    #
    # ⚠️ IMPORTANTE: Esta regex é intencionalmente flexível na descrição
    # porque o Itaú mistura tipo + nome + documento numa string só.
    # A separação inteligente acontece em _separar_descricao().
    REGEX_LANCAMENTO = re.compile(
        r'^(\d{2}/\d{2}/\d{4})\s+(.+?)\s+(-?[\d.]+,\d{2})\s*$'
    )

    # 🚫 LINHAS QUE DEVEM SER IGNORADAS
    # Palavras-chave que indicam linhas de rodapé, cabeçalho ou saldos.
    PALAVRAS_IGNORAR = [
        'SALDO TOTAL',
        'SALDO ANTERIOR',
        'SALDO ATUAL',
        'DISPONÍVEL DIA',
        'EM CASO DE DÚVIDAS',
        'RECLAMAÇÕES',
        'OUVIDORIA',
        'ATUALIZADO EM',
        'OS SALDOS ACIMA',
        'CENTRAL NO',
        'FALE CONOSCO',
    ]

    # =========================================================================
    # MÉTODO DE DETECÇÃO
    # =========================================================================

    def detecta_banco(self, texto_pdf: str) -> bool:
        """
        Verifica se o texto extraído pertence a um extrato do Itaú.
        
        🔒 SEGURANÇA: Usamos DOIS critérios simultâneos para evitar
           falsos positivos (como aconteceu com o BB):
           1. Presença de "ITAÚ" ou "ITAU UNIBANCO"
           2. Formato de conta com hífen (característico do Itaú)
        
        Args:
            texto_pdf: Texto bruto extraído do PDF
            
        Returns:
            True se for Itaú, False caso contrário
        """
        texto_upper = texto_pdf.upper()
        
        # Critério 1: Nome do banco
        tem_nome_itau = bool(self.REGEX_DETECT_ITAU.search(texto_pdf))
        
        # Critério 2: Formato de conta com hífen (ex: 0099485-1)
        tem_conta_itau = bool(self.REGEX_CONTA.search(texto_pdf))
        
        # Ambos devem ser verdadeiros para confirmar Itaú
        if tem_nome_itau and tem_conta_itau:
            print(f"✅ [ParserItau] Detectado como ITAU (nome={tem_nome_itau}, conta_formato={tem_conta_itau})")
            return True
        
        return False

    # =========================================================================
    # MÉTODO PRINCIPAL DE PARSING
    # =========================================================================

    def parse(self, caminho_pdf: str | Path) -> ExtratoBancario:
        """
        Extrai todos os dados do extrato Itaú e retorna objeto estruturado.
        
        Fluxo:
        1. Extrair texto do PDF (pdfplumber)
        2. Validar que é realmente Itaú
        3. Extrair cabeçalho (agência, conta, competência)
        4. Extrair lançamentos linha a linha
        5. Retornar ExtratoBancario preenchido
        
        Args:
            caminho_pdf: Caminho para o arquivo PDF
            
        Returns:
            ExtratoBancario com todos os dados extraídos
            
        Raises:
            ParserItauError: Se o arquivo não existir ou não for Itaú
        """
        caminho_pdf = Path(caminho_pdf)
        
        # 🔒 Validação de existência do arquivo
        if not caminho_pdf.exists():
            raise ParserItauError(f"Arquivo não encontrado: {caminho_pdf}")

        print(f"\n{'='*80}")
        print(f"🔍 PARSING ITAÚ: {caminho_pdf.name}")
        print("="*80)

        # Passo 1: Extrair texto
        texto = self._extrair_texto_pdf(caminho_pdf)
        
        # Normalização básica de caracteres especiais
        texto = self._normalizar_texto(texto)
        
        print(f"📏 Texto extraído: {len(texto)} caracteres")

        # Passo 2: Validar banco
        if not self.detecta_banco(texto):
            raise ParserItauError(
                "Texto extraído não corresponde ao layout do Itaú. "
                "Verifique se o PDF é realmente um extrato do Itaú."
            )

        # Passo 3: Extrair cabeçalho
        cabecalho = self._extrair_cabecalho(texto)
        print(f"📋 Cabeçalho: Ag={cabecalho['agencia']} | "
              f"Cta={cabecalho['conta']} | Comp={cabecalho['competencia']}")

        # Passo 4: Extrair lançamentos
        lancamentos = self._extrair_lancamentos(texto)
        
        print(f"✅ {len(lancamentos)} lançamentos extraídos com sucesso")
        print("="*80 + "\n")

        # Passo 5: Montar objeto de retorno
        return ExtratoBancario(
            banco=self.nome_banco,
            agencia=cabecalho["agencia"],
            conta=cabecalho["conta"],
            nome_cliente=cabecalho.get("nome_cliente", "N/A"),
            competencia=cabecalho["competencia"],
            lancamentos=lancamentos,
        )

    # =========================================================================
    # MÉTODOS PRIVADOS DE EXTRAÇÃO
    # =========================================================================

    def _extrair_texto_pdf(self, caminho_pdf: Path) -> str:
        """
        Extrai texto do PDF usando pdfplumber.
        
        Nota: O Itaú geralmente gera PDFs com texto nativo (não escaneado),
        então pdfplumber funciona bem. Se precisar de OCR no futuro,
        adicionar fallback similar ao Banrisul/BB.
        """
        partes: List[str] = []
        
        try:
            with pdfplumber.open(caminho_pdf) as pdf:
                for pagina in pdf.pages:
                    texto = pagina.extract_text()
                    if texto:
                        partes.append(texto)
        except Exception as e:
            print(f"⚠️ [ParserItau] Erro ao extrair texto: {e}")
            raise ParserItauError(f"Falha na extração do PDF: {str(e)}")
        
        return "\n".join(partes)

    def _normalizar_texto(self, texto: str) -> str:
        """
        Normaliza caracteres especiais comuns em PDFs bancários.
        
        PDFs frequentemente substituem caracteres ASCII por equivalentes
        Unicode full-width ou similares. Esta função padroniza tudo.
        """
        substituicoes = {
            '：': ':',      # Dois-pontos full-width
            '，': ',',      # Vírgula full-width  
            '。': '.',      # Ponto full-width
            '√': '',        # Marca de check às vezes aparece como lixo
            '\u3000': ' ',  # Espaço ideográfico (CJK)
            '\u2003': ' ',  # Espaço eme
            '‐': '-',       # Hífen Unicode
            '−': '-',       # Sinal de menos Unicode
            '–': '-',       # Traço en-dash
            '—': '-',       # Traço em-dash
        }
        
        for original, substituto in substituicoes.items():
            texto = texto.replace(original, substituto)
        
        return texto

    def _extrair_cabecalho(self, texto: str) -> Dict[str, str]:
        """
        Extrai agência, conta e competência do cabeçalho do extrato.
        
        Returns:
            Dict com chaves: agencia, conta, competencia, nome_cliente
        """
        # Agência
        match_ag = self.REGEX_AGENCIA.search(texto)
        agencia = match_ag.group(1) if match_ag else "0000"
        
        # Conta (com dígito)
        match_ct = self.REGEX_CONTA.search(texto)
        conta = match_ct.group(1) if match_ct else "0000000-0"
        
        # Competência: pega o mês/ano da primeira data encontrada
        match_data = self.REGEX_PRIMEIRA_DATA.search(texto)
        if match_data:
            mes_num = int(match_data.group(2))
            ano = match_data.group(3)
            meses = [
                "JAN", "FEV", "MAR", "ABR", "MAI", "JUN",
                "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"
            ]
            competencia = f"{meses[mes_num - 1]}/{ano}"
        else:
            competencia = "DESCONHECIDO"
        
        # Nome do cliente: tenta extrair do topo do PDF
        # O Itaú geralmente coloca o nome logo após "Conta Corrente"
        nome_cliente = "N/A"
        linhas = texto.split("\n")
        for i, linha in enumerate(linhas[:20]):  # Busca nas primeiras 20 linhas
            linha_upper = linha.upper()
            if "CORRENTE" in linha_upper or "EMPRESA" in linha_upper:
                # A próxima linha não-vazia costuma ser o nome
                for j in range(i + 1, min(i + 3, len(linhas))):
                    proxima = linhas[j].strip()
                    if proxima and not proxima.startswith(("DIA", "DATA", "---")):
                        nome_cliente = proxima[:100]  # Limita tamanho
                        break
                break
        
        return {
            "agencia": agencia,
            "conta": conta,
            "competencia": competencia,
            "nome_cliente": nome_cliente,
        }

    def _extrair_lancamentos(self, texto: str) -> List[LancamentoBancario]:
        """
        Percorre o texto linha a linha e extrai todos os lançamentos válidos.
        
        Estratégia:
        1. Filtra linhas ignoráveis (saldos, rodapés)
        2. Aplica regex de lançamento
        3. Separa descrição em tipo + contraparte
        4. Determina sinal (entrada/saída)
        5. Cria objeto LancamentoBancario
        """
        lancamentos: List[LancamentoBancario] = []
        linhas = texto.split("\n")
        
        for linha in linhas:
            linha_limpa = linha.strip()
            
            # Pula linhas vazias
            if not linha_limpa:
                continue
            
            # Pula linhas de saldo/rodapé/cabeçalho
            if self._deve_ignorar_linha(linha_limpa):
                continue
            
            # Tenta casar com padrão de lançamento
            match = self.REGEX_LANCAMENTO.match(linha_limpa)
            if not match:
                continue
            
            # Extrai grupos capturados pela regex
            data_str = match.group(1)       # "18/05/2026"
            descricao_raw = match.group(2)  # "PAGAMENTOS PIX QR-CODE RECEITA FEDERAL..."
            valor_str = match.group(3)      # "-2.987,81" ou "0,21"
            
            # Converte dia
            dia = int(data_str.split("/")[0])
            
            # Converte valor (formato brasileiro)
            valor = self._converter_valor(valor_str)
            
            # Determina sinal
            sinal = SinalMovimento.SAIDA if valor_str.startswith("-") else SinalMovimento.ENTRADA
            
            # Usa valor absoluto (o sinal já está separado)
            valor_absoluto = abs(valor)
            
            # Separa tipo e contraparte da descrição
            tipo, nome_destinatario, documento = self._separar_descricao(descricao_raw)
            
            # Monta descrição completa padronizada
            descricao_completa = f"{tipo} - {nome_destinatario}" if nome_destinatario else tipo
            
            # Cria o lançamento
            lancamento = LancamentoBancario(
                dia=dia,
                data_completa=data_str,  # 🆕 NOVO: Envia "15/07/2026" completo
                tipo=tipo,
                documento=documento,
                valor=valor_absoluto,
                sinal=sinal,
                nome_destinatario=nome_destinatario,
                descricao_completa=descricao_completa,
            )
            
            lancamentos.append(lancamento)
        
        return lancamentos

    def _deve_ignorar_linha(self, linha: str) -> bool:
        """
        Verifica se a linha deve ser ignorada (não é lançamento).
        
        Retorna True para linhas de saldo, rodapé, cabeçalho, etc.
        """
        linha_upper = linha.upper()
        
        for palavra in self.PALAVRAS_IGNORAR:
            if palavra in linha_upper:
                return True
        
        # Ignora linhas muito curtas (provavelmente lixo ou separadores)
        if len(linha.strip()) < 5:
            return True
        
        # Ignora linhas que são apenas números de página ou separadores
        if re.match(r'^[\d\-|=|]+$', linha.strip()):
            return True
        
        return False

    def _converter_valor(self, valor_str: str) -> float:
        """
        Converte string de valor monetário BR para float.
        
        Exemplos:
            "-2.987,81" → -2987.81
            "0,21"      → 0.21
            "15.000,00" → 15000.00
        """
        # Remove pontos de milhar e substitui vírgula decimal por ponto
        limpo = valor_str.replace(".", "").replace(",", ".")
        return float(limpo)

    def _separar_descricao(self, descricao_raw: str) -> tuple[str, Optional[str], str]:
        """
        Separa a descrição bruta do Itaú em componentes estruturados.
        
        O Itaú concatena tudo numa string só. Tentamos identificar:
        - Tipo de transação (PIX ENVIADO, BOLETO PAGO, RENDIMENTOS, etc.)
        - Nome da contraparte (pessoa/empresa)
        - Documento (CPF/CNPJ)
        
        Args:
            descricao_raw: String completa da descrição
            
        Returns:
            Tupla (tipo, nome_destinatario, documento)
        """
        desc = descricao_raw.strip()
        
        # 🔍 Regex para CPF/CNPJ no final da descrição
        # CPF: 000.000.000-00 | CNPJ: 00.000.000/0000-00
        regex_doc = re.compile(
            r'\s+(\d{2,3}\.\d{3}\.\d{3}/\d{4}-\d{2}|\d{3}\.\d{3}\.\d{3}-\d{2})\s*$'
        )
        
        documento = "000000"
        match_doc = regex_doc.search(desc)
        if match_doc:
            documento = match_doc.group(1).replace(".", "").replace("/", "").replace("-", "")
            # Remove o documento da descrição para facilitar parsing do tipo
            desc = desc[:match_doc.start()].strip()
        
        # 🔍 Identificação do tipo de transação
        # Lista de tipos conhecidos do Itaú (ordem importa: mais específicos primeiro)
        TIPOS_CONHECIDOS = [
            "PAGAMENTOS PIX QR-CODE",
            "PIX ENVIADO",
            "PIX RECEBIDO",
            "BOLETO PAGO",
            "BOLETO RECEBIDO",
            "TED ENVIADA",
            "TED RECEBIDA",
            "DOC/TED INTERNET PJ",
            "RENDIMENTOS",
            "REND PAGO APLIC AUT",
            "RESGATE APLIC",
            "APLICACAO",
            "TARIFA",
            "IOF",
            "ENCARGOS",
            "DEBITO CONVENIOS",
            "CESTA DE RELACIONAMENTO",
            "LIQUIDACAO BOLETO",
            "TRANSFERENCIA",
        ]
        
        tipo = "OUTROS"
        nome_destinatario = None
        
        desc_upper = desc.upper()
        for tipo_conhecido in TIPOS_CONHECIDOS:
            if tipo_conhecido in desc_upper:
                tipo = tipo_conhecido
                # Tudo que vem DEPOIS do tipo é a contraparte
                idx = desc_upper.find(tipo_conhecido)
                resto = desc[idx + len(tipo_conhecido):].strip()
                
                # Limpa separadores comuns
                resto = resto.lstrip("- ").strip()
                
                if resto:
                    nome_destinatario = resto
                break
        
        # Se não encontrou tipo conhecido, usa as primeiras palavras como tipo
        if tipo == "OUTROS":
            partes = desc.split()
            if len(partes) >= 2:
                tipo = " ".join(partes[:2]).upper()
                nome_destinatario = " ".join(partes[2:]) if len(partes) > 2 else None
            elif partes:
                tipo = partes[0].upper()
        
        return tipo, nome_destinatario, documento