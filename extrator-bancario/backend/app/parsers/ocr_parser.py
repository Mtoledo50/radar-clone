"""
Parser genérico que recebe texto OCR (markdown) e extrai dados bancários.
VERSÃO COM DEBUG: Mostra texto extraído e usa múltiplas estratégias de detecção.
"""
import re
from app.models.lancamento import ExtratoBancario, LancamentoBancario, SinalMovimento


class OCRParser:
    def __init__(self):
        pass

    def _normalizar_texto(self, texto: str) -> str:
        texto = texto.replace('：', ':')
        texto = texto.replace('，', ',')
        texto = texto.replace('。', '.')
        texto = texto.replace('√', '')
        texto = texto.replace('一', '-')
        texto = texto.replace('十一', '')
        texto = texto.replace('口', '')
        texto = texto.replace('<br>', ' ')
        texto = texto.replace('<br/>', ' ')
        texto = texto.replace('|', ' ')
        
        linhas = texto.split('\n')
        linhas = [l for l in linhas if not re.match(r'^\s*[-=]+\s*$', l)]
        texto = '\n'.join(linhas)
        texto = re.sub(r'[ \t]+', ' ', texto)
        
        return texto.strip()

    def detectar_banco(self, texto: str) -> str:
        """Detecção ultra-robusta com múltiplas estratégias."""
        texto_upper = texto.upper()
        
        # Estratégia 1: Busca direta
        if 'BANRISUL' in texto_upper:
            return "banrisul"
        elif 'SICREDI' in texto_upper:
            return "sicredi"
        elif 'BANCO DO BRASIL' in texto_upper:
            return "bb"
        
        # Estratégia 2: Busca com espaços entre letras (OCR pode separar)
        texto_sem_espacos = re.sub(r'\s+', '', texto_upper)
        if 'BANRISUL' in texto_sem_espacos:
            return "banrisul"
        elif 'SICREDI' in texto_sem_espacos:
            return "sicredi"
        elif 'BANCOBRASIL' in texto_sem_espacos or 'BB' in texto_sem_espacos:
            return "bb"
        
        # Estratégia 3: Busca por palavras-chave individuais
        if 'BANCO' in texto_upper and 'BRASIL' in texto_upper:
            return "bb"
        
        # Estratégia 4: Busca por agência/conta específicas
        if re.search(r'Ag[êe]ncia.*?1430', texto, re.IGNORECASE):
            return "bb"
        
        return "desconhecido"
    
    def extrair_cabecalho(self, texto: str, banco: str) -> dict:
        if banco == "bb":
            match_ag = re.search(r'Ag[êe]ncia[:\s]+([\d\-]+)', texto, re.IGNORECASE)
            match_ct = re.search(r'Conta\s+corrente\s+([\d\-]+)', texto, re.IGNORECASE)
            match_nome = re.search(r'(ASSOCIACAO[^\\n|]+)', texto, re.IGNORECASE)
            match_per = re.search(r'Per[íi]odo\s+do\s+extrato\s+(\d{2})\s*/\s*(\d{4})', texto, re.IGNORECASE)
            periodo = f"{match_per.group(1)}/{match_per.group(2)}" if match_per else "N/A"
            return {
                "agencia": match_ag.group(1).strip() if match_ag else "N/A",
                "conta": match_ct.group(1).strip() if match_ct else "N/A",
                "nome": match_nome.group(1).strip() if match_nome else "N/A",
                "periodo": periodo,
                "banco": "bb",
            }
        elif banco == "banrisul":
            match_ag = re.search(r'AGENCIA[：:]\s*(\d{4})', texto, re.IGNORECASE)
            match_ct = re.search(r'CONTA[.:：]+\s*([\d.\-]+)', texto, re.IGNORECASE)
            match_nome = re.search(r'NOME[.:：]+\s*(.+?)(?:\n|$)', texto, re.IGNORECASE)
            match_data = re.search(r'(\d{2}/\d{2}/\d{4})', texto)
            periodo = "N/A"
            if match_data:
                partes = match_data.group(1).split('/')
                if len(partes) == 3:
                    meses = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"]
                    periodo = f"{meses[int(partes[1])-1]}/{partes[2]}"
            return {
                "agencia": match_ag.group(1).strip() if match_ag else "N/A",
                "conta": match_ct.group(1).strip() if match_ct else "N/A",
                "nome": match_nome.group(1).strip() if match_nome else "N/A",
                "periodo": periodo,
                "banco": "banrisul",
            }
        elif banco == "sicredi":
            match_coop = re.search(r'Cooperativa[:\s]+(\d{4})', texto, re.IGNORECASE)
            match_ct = re.search(r'Conta\s+Corrente[:\s]+([\d\-]+)', texto, re.IGNORECASE)
            match_assoc = re.search(r'Associado[:\s]+(.+?)(?:\n|$)', texto, re.IGNORECASE)
            match_per = re.search(
                r'(?:Extrato\s*\(Período de|Dados referentes ao período)\s+'
                r'(\d{2}/\d{2}/\d{4})\s+a\s+(\d{2}/\d{2}/\d{4})',
                texto, re.IGNORECASE
            )
            periodo = "N/A"
            if match_per:
                partes = match_per.group(1).split('/')
                if len(partes) == 3:
                    meses = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"]
                    periodo = f"{meses[int(partes[1])-1]}/{partes[2]}"
            return {
                "agencia": match_coop.group(1).strip() if match_coop else "N/A",
                "conta": match_ct.group(1).strip() if match_ct else "N/A",
                "nome": match_assoc.group(1).strip() if match_assoc else "N/A",
                "periodo": periodo,
                "banco": "sicredi",
            }
        return {"agencia": "N/A", "conta": "N/A", "nome": "N/A", "periodo": "N/A", "banco": banco}

    def extrair_lancamentos(self, texto: str, banco: str) -> list:
        if banco == "bb":
            return self._extrair_lancamentos_bb(texto)
        elif banco == "sicredi":
            return self._extrair_lancamentos_sicredi(texto)
        elif banco == "banrisul":
            return self._extrair_lancamentos_banrisul(texto)
        return []
    
    def _extrair_lancamentos_bb(self, texto: str) -> list:
        texto_limpo = self._normalizar_texto(texto)
        linhas = texto_limpo.split("\n")
        lancamentos = []
        i = 0
        
        print(f"\n Processando {len(linhas)} linhas do BB...")
        
        while i < len(linhas):
            linha = linhas[i].strip()
            i += 1
            
            if not linha:
                continue
            
            if any(p in linha.upper() for p in ["DT.", "BALANCETE", "SALDO", "LANÇAMENTOS", "VISUALIZAR", "CONSULTAS"]):
                continue
            
            match = re.match(
                r'^\s*(\d{2}/\d{2}/\d{4})\s+'
                r'(\d{4})\s+'
                r'(\d{5})\s+'
                r'(\d{3})\s+'
                r'(.+?)\s+'
                r'(\d[\d\.,]*)?\s*'
                r'([\d.,]+)\s*'
                r'([CD])\s*$',
                linha
            )
            
            if match:
                data, ag, lote, hist, desc, doc_ou_val, valor_str, sinal = match.groups()
                
                valor = float(valor_str.replace(".", "").replace(",", "."))
                
                if valor == 0.0 or "SALDO" in desc.upper():
                    continue
                
                dia = int(data.split("/")[0])
                sinal_mov = SinalMovimento.SAIDA if sinal == "D" else SinalMovimento.ENTRADA
                
                nome = None
                if i < len(linhas):
                    prox = linhas[i].strip()
                    match_nome = re.match(r'^\s*(\d{2}/\d{2}\s+\d{2}:\d{2}\s+.+)$', prox)
                    if match_nome:
                        nome = match_nome.group(1).strip()
                        i += 1
                
                desc_final = f"{desc.strip()} - {nome}" if nome else desc.strip()
                tipo = "PIX ENVIADO" if "PIX" in desc.upper() else desc.upper().strip()
                doc_final = doc_ou_val if doc_ou_val and len(doc_ou_val) > 4 else "000000"
                
                lancamentos.append(LancamentoBancario(
                    dia=dia, tipo=tipo, documento=doc_final, valor=valor,
                    sinal=sinal_mov, descricao_completa=desc_final,
                ))
                print(f"   ✅ Lançamento BB: {dia}/{desc_final[:35]}... R$ {valor:.2f} {sinal}")
        
        return lancamentos
    
    def _extrair_lancamentos_sicredi(self, texto: str) -> list:
        texto_limpo = self._normalizar_texto(texto)
        linhas = texto_limpo.split("\n")
        lancamentos = []
        
        for linha in linhas:
            linha = linha.strip()
            if not linha:
                continue
            
            match = re.match(
                r'(\d{2}/\d{2}/\d{4})\s+'
                r'(RECEBIMENTO\s+PIX|PAGAMENTO\s+PIX|TED|LIQUIDACAO\s+BOLETO|'
                r'CESTA\s+DE\s+RELACIONAMENTO|DEBITO\s+TED/IB|'
                r'DOC/TED\s+INTERNET\s+PJ|DEBITO\s+CONVENIOS|DEP\s+DINHEIRO)\s+'
                r'(\d{11,14})\s+'
                r'(.+?)\s+'
                r'(PIX_CRED|PIX_DEB|PIX_CRE|CX\d+|\d+)?\s*'
                r'(-?[\d.,]+)\s+'
                r'([\d.,]+)',
                linha
            )
            if match:
                data_str, tipo, documento, nome, codigo, valor_str, saldo_str = match.groups()
                dia = int(data_str.split("/")[0])
                valor = abs(float(valor_str.replace(".", "").replace(",", ".")))
                sinal = SinalMovimento.SAIDA if valor_str.startswith("-") or (codigo and "DEB" in codigo.upper()) else SinalMovimento.ENTRADA
                
                lancamentos.append(LancamentoBancario(
                    dia=dia, tipo=tipo, documento=documento, valor=valor,
                    sinal=sinal, descricao_completa=f"{tipo} - {nome}",
                ))
        return lancamentos
    
    def _extrair_lancamentos_banrisul(self, texto: str) -> list:
        texto_limpo = self._normalizar_texto(texto)
        linhas = texto_limpo.split("\n")
        lancamentos = []
        
        print(f"\n Processando {len(linhas)} linhas do Banrisul (Modo Stateful)...")
        
        dia_atual = None
        ultimo_dia = None
        tipo_atual = None
        doc_atual = None
        valor_atual = None
        sinal_atual = "C"
        cpf_atual = None
        nome_atual = None
        
        def finalizar_lancamento():
            nonlocal dia_atual, tipo_atual, doc_atual, valor_atual, sinal_atual, cpf_atual, nome_atual, ultimo_dia
            if dia_atual is not None and valor_atual is not None:
                if "SALDO" in tipo_atual.upper() or "MOVIMENTOS" in tipo_atual.upper():
                    pass
                else:
                    desc_final = f"{tipo_atual} - {nome_atual}" if nome_atual else tipo_atual
                    doc_final = cpf_atual if cpf_atual else (doc_atual or "000000")
                    sinal_mov = SinalMovimento.SAIDA if sinal_atual == "-" else SinalMovimento.ENTRADA
                    
                    lancamentos.append(LancamentoBancario(
                        dia=dia_atual, tipo=tipo_atual, documento=doc_final, valor=valor_atual,
                        sinal=sinal_mov, descricao_completa=desc_final,
                    ))
                    print(f"   ✅ Lançamento Banrisul: {dia_atual}/{desc_final[:35]}... R$ {valor_atual:.2f} {'D' if sinal_mov == SinalMovimento.SAIDA else 'C'}")
            
            dia_atual = None
            tipo_atual = None
            doc_atual = None
            valor_atual = None
            sinal_atual = "C"
            cpf_atual = None
            nome_atual = None

        for linha in linhas:
            linha = linha.strip()
            if not linha:
                continue
                
            if any(p in linha.upper() for p in ["DIA", "HISTORICO", "DOCUMENTO", "VALOR", "MOVIMENTOS", "SALDO ANT", "SALDO NA DATA", "EXTRATO", "EMITIDO", "SAC", "OUVIDORIA", "BANRISUL", "AGENCIA", "CONTA", "NOME", "IDENTIFICACAO", "PARA SIMPLES", "SALDO DISPONIVEL", "INVESTIMENTOS", "VALOR DA COTA", "QUANTIDADE"]):
                continue
            
            match_cpf = re.search(r'CPF/CNPJ:\s*(\d{11,14})', linha, re.IGNORECASE)
            if match_cpf:
                cpf_atual = match_cpf.group(1)
                continue
            
            match_nome = re.search(r'NOME:\s*(.+)', linha, re.IGNORECASE)
            if match_nome:
                nome_atual = match_nome.group(1).strip()
                if valor_atual is not None:
                    finalizar_lancamento()
                continue

            match_inicio_com_dia = re.match(r'^(\d{1,2})\s+(RESGATE AUTOMATICO|PIX ENVIADO|PIX RECEBIDO|TED|DOC)\s*$', linha, re.IGNORECASE)
            if match_inicio_com_dia:
                finalizar_lancamento()
                dia_atual = int(match_inicio_com_dia.group(1))
                ultimo_dia = dia_atual
                tipo_atual = match_inicio_com_dia.group(2).upper()
                continue
                
            match_inicio_sem_dia = re.match(r'^(PIX ENVIADO|PIX RECEBIDO|TED|DOC)\s*$', linha, re.IGNORECASE)
            if match_inicio_sem_dia:
                if valor_atual is not None:
                    finalizar_lancamento()
                tipo_atual = match_inicio_sem_dia.group(1).upper()
                dia_atual = ultimo_dia
                continue
                
            if dia_atual is not None:
                match_doc_val = re.match(r'^(\d{6})\s+([\d.,]+)(-?)\s*$', linha)
                if match_doc_val:
                    doc_atual = match_doc_val.group(1)
                    valor_str = match_doc_val.group(2)
                    sinal_atual = match_doc_val.group(3)
                    valor_atual = float(valor_str.replace(".", "").replace(",", "."))
                    if valor_atual is not None and nome_atual is not None:
                        finalizar_lancamento()
                    continue
                
                if "SALDO" in linha.upper() or "TOTAL" in linha.upper():
                    finalizar_lancamento()
                    continue

        finalizar_lancamento()
        return lancamentos
    
    def parse(self, texto_ocr: str) -> ExtratoBancario:
        texto_normalizado = self._normalizar_texto(texto_ocr)
        
        # 🔍 DEBUG: Mostra o texto extraído
        print(f"\n{'='*80}")
        print(f" TEXTO EXTRAÍDO DO OCR (primeiros 1000 caracteres):")
        print("="*80)
        print(texto_normalizado[:1000])
        print("="*80)
        
        banco = self.detectar_banco(texto_normalizado)
        print(f"🏦 Banco detectado: {banco}")
        
        cabecalho = self.extrair_cabecalho(texto_normalizado, banco)
        print(f"📋 Cabeçalho: {cabecalho}")
        
        lancamentos = self.extrair_lancamentos(texto_normalizado, banco)
        print(f"📊 {len(lancamentos)} lançamentos extraídos")
        
        return ExtratoBancario(
            banco=cabecalho["banco"].upper(),
            agencia=cabecalho["agencia"],
            conta=cabecalho["conta"],
            nome_cliente=cabecalho["nome"],
            competencia=cabecalho["periodo"],
            lancamentos=lancamentos,
        )