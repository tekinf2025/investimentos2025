import React, { useState, useEffect } from 'react';
import { PlusCircle, TrendingUp, TrendingDown, DollarSign, Calendar, Hash, Tag, Info, BarChart3, User, Settings, PieChart, Gift, Home, Receipt, Filter, Target, Activity, Edit3, Trash2, X, Save, Download, Upload, FileDown, FileUp, Shield, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { createClient } from 'https://cdn.skypack.dev/@supabase/supabase-js@2';

// Configuração do Supabase
const supabaseUrl = 'https://empucpjeocyhqdnlzghy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtcHVjcGplb2N5aHFkbmx6Z2h5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxOTc1NzMsImV4cCI6MjA2ODc3MzU3M30.MI9Mb6RdaGUuBrwmkzuWWiGtCtCbQxTcPoGf_uPLJXM';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const { useStoredState } = hatch;

const InvestmentManager = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [compras, setCompras] = useState([]);
  const [vendas, setVendas] = useState([]);
  const [proventos, setProventos] = useState([]);
  const [derivativos, setDerivativos] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  
  // Form states
  const [formData, setFormData] = useState({
    tipo_ativo: '',
    ativo: '',
    data: new Date().toISOString().split('T')[0],
    quantidade: '',
    preco: '',
    outros_custos: ''
  });

  // Provento form states
  const [proventoData, setProventoData] = useState({
    tipo_provento: '',
    ativo: '',
    data: new Date().toISOString().split('T')[0],
    valor: '',
    quantidade: '',
    a_receber: false
  });

  // Derivativo form states
  const [derivativoData, setDerivativoData] = useState({
    tipo_operacao: '',
    tipo_derivativo: '',
    ativo_subjacente: '',
    codigo_opcao: '',
    strike: '',
    data: new Date().toISOString().split('T')[0],
    quantidade: '',
    preco: '',
    outros_custos: '',
    status: 'aberta'
  });

  // Filters
  const [filters, setFilters] = useState({
    tipo_provento: '',
    ativo: '',
    ano: new Date().getFullYear()
  });

  const [errors, setErrors] = useState({});
  const [proventoErrors, setProventoErrors] = useState({});
  const [derivativoErrors, setDerivativoErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estados para edição
  const [editingId, setEditingId] = useState(null);
  const [editingProventoId, setEditingProventoId] = useState(null);
  const [editingDerivativoId, setEditingDerivativoId] = useState(null);

  // Estados para a página de carteira
  const [carteiraFilters, setCarteiraFilters] = useState({
    tipo_ativo: '',
    periodo: '',
    busca: ''
  });

  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'asc'
  });

  // Estados para valores atuais dos ativos
  const [valoresAtuais, setValoresAtuais] = useStoredState('investment_valores_atuais', {});
  const [editingValorAtivo, setEditingValorAtivo] = useState(null);
  const [valorAtualTemp, setValorAtualTemp] = useState('');
  
  // Estados para atualização automática de preços
  const [isUpdatingPrices, setIsUpdatingPrices] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useStoredState('investment_last_update', null);
  const [priceUpdateMessage, setPriceUpdateMessage] = useState('');
  const [updatingSingleStock, setUpdatingSingleStock] = useState(null);
  const [autoUpdateEnabled, setAutoUpdateEnabled] = useStoredState('investment_auto_update', false);

  // Tipos de ativos disponíveis
  const tiposAtivos = [
    { value: 'acoes', label: 'Ações' },
    { value: 'fundos_imobiliarios', label: 'Fundos Imobiliários' },
    { value: 'criptomoedas', label: 'Criptomoedas' },
    { value: 'fundos_investimento', label: 'Fundos de Investimento' },
    { value: 'renda_fixa', label: 'Renda Fixa' },
    { value: 'etfs', label: 'ETFs' }
  ];

  // Tipos de proventos
  const tiposProventos = [
    { value: 'dividendos', label: 'Dividendos' },
    { value: 'jcp', label: 'Juros sobre Capital Próprio (JCP)' },
    { value: 'rendimentos', label: 'Rendimentos' }
  ];

  // Tipos de operações de derivativos
  const tiposOperacoes = [
    { value: 'compra', label: 'Compra' },
    { value: 'venda', label: 'Venda' }
  ];

  // Tipos de derivativos
  const tiposDerivativo = [
    { value: 'call', label: 'CALL (Opção de Compra)' },
    { value: 'put', label: 'PUT (Opção de Venda)' }
  ];

  // Status das opções
  const statusOpcoes = [
    { value: 'aberta', label: 'Aberta' },
    { value: 'exercida', label: 'Exercida' },
    { value: 'expirada', label: 'Expirada' }
  ];

  // Ativos fictícios por categoria
  const ativosPorTipo = {
    acoes: ['PETR4', 'VALE3', 'ITUB4', 'ABEV3', 'BBDC4', 'WEGE3', 'MGLU3', 'RENT3', 'SUZB3', 'JBSS3', 'GOAU4', 'BBAS3'],
    fundos_imobiliarios: ['HGLG11', 'KNRI11', 'XPML11', 'VISC11', 'BCFF11', 'MXRF11', 'HGRU11', 'GALG11', 'KNCR11', 'GGRC11'],
    criptomoedas: ['Bitcoin (BTC)', 'Ethereum (ETH)', 'Binance Coin (BNB)', 'Cardano (ADA)', 'Solana (SOL)', 'Polkadot (DOT)', 'Chainlink (LINK)', 'Polygon (MATIC)', 'Avalanche (AVAX)', 'Uniswap (UNI)'],
    fundos_investimento: ['Fundo XP Multi', 'Fundo BTG RF', 'Fundo Bradesco FI', 'Fundo Itaú Multimercado', 'Fundo Santander RF', 'Fundo BB Multimercado', 'Fundo Inter RF', 'Fundo Modal Multimercado', 'Fundo Warren FI', 'Fundo Rico RF'],
    renda_fixa: ['Tesouro Selic 2028', 'Tesouro IPCA+ 2030', 'CDB Inter 110% CDI', 'LCA Banco do Brasil', 'LCI Bradesco', 'Debenture Petrobras', 'CRA Securitizadora', 'CRI Habitat', 'Tesouro Prefixado 2027', 'LC Banco Original', 'Tesouro Selic 2029'],
    etfs: ['BOVA11', 'IVVB11', 'SMAL11', 'DIVO11', 'FIND11', 'XINA11', 'SPXI11', 'MATB11', 'ISUS11', 'ECOO11']
  };

  // Calcular valor total automaticamente
  const calcularValorTotal = () => {
    const quantidade = parseFloat(formData.quantidade) || 0;
    const preco = parseFloat(formData.preco) || 0;
    const outrosCustos = parseFloat(formData.outros_custos) || 0;
    return (quantidade * preco) + outrosCustos;
  };

  // Calcular valor total de derivativos
  const calcularValorTotalDerivativo = () => {
    const quantidade = parseFloat(derivativoData.quantidade) || 0;
    const preco = parseFloat(derivativoData.preco) || 0;
    const outrosCustos = parseFloat(derivativoData.outros_custos) || 0;
    return (quantidade * preco) + outrosCustos;
  };

  // Validar formulário
  const validarFormulario = () => {
    const newErrors = {};
    
    if (!formData.tipo_ativo) newErrors.tipo_ativo = 'Tipo de ativo é obrigatório';
    if (!formData.ativo) newErrors.ativo = 'Ativo é obrigatório';
    if (!formData.data) newErrors.data = 'Data é obrigatória';
    if (!formData.quantidade || formData.quantidade <= 0) newErrors.quantidade = 'Quantidade deve ser maior que 0';
    if (!formData.preco || formData.preco <= 0) newErrors.preco = 'Preço deve ser maior que 0';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submeter formulário
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validarFormulario()) return;
    
    setIsSubmitting(true);
    
    const itemData = {
      tipo_ativo: formData.tipo_ativo,
      ativo: formData.ativo,
      data: formData.data,
      quantidade: parseFloat(formData.quantidade),
      preco: parseFloat(formData.preco),
      outros_custos: parseFloat(formData.outros_custos) || 0,
      valor_total: calcularValorTotal()
    };
    
    try {
      if (editingId) {
        // Editar item existente no Supabase
        const tableName = activeTab === 'compra' ? 'investimentos_compras' : 'investimentos_vendas';
        const { data, error } = await supabase
          .from(tableName)
          .update(itemData)
          .eq('id', editingId)
          .select();

        if (error) {
          throw error;
        }

        // Atualizar estado local
        if (activeTab === 'compra') {
          setCompras(compras.map(item => item.id === editingId ? data[0] : item));
        } else {
          setVendas(vendas.map(item => item.id === editingId ? data[0] : item));
        }
        setEditingId(null);
      } else {
        // Criar novo item no Supabase
        const tableName = activeTab === 'compra' ? 'investimentos_compras' : 'investimentos_vendas';
        const { data, error } = await supabase
          .from(tableName)
          .insert([itemData])
          .select();

        if (error) {
          throw error;
        }

        // Atualizar estado local
        if (activeTab === 'compra') {
          setCompras([data[0], ...compras]);
        } else {
          setVendas([data[0], ...vendas]);
        }
      }

      setImportMessage(`✅ ${activeTab === 'compra' ? 'Compra' : 'Venda'} ${editingId ? 'atualizada' : 'adicionada'} com sucesso!`);
      setTimeout(() => setImportMessage(''), 3000);
      
    } catch (error) {
      console.error('Erro ao salvar no Supabase:', error);
      setImportMessage(`❌ Erro ao ${editingId ? 'atualizar' : 'adicionar'} ${activeTab === 'compra' ? 'compra' : 'venda'}. Tente novamente.`);
      setTimeout(() => setImportMessage(''), 5000);
    }
    
    // Limpar formulário
    setFormData({
      tipo_ativo: '',
      ativo: '',
      data: new Date().toISOString().split('T')[0],
      quantidade: '',
      preco: '',
      outros_custos: ''
    });
    
    setIsSubmitting(false);
  };

  // Função para editar transação
  const handleEdit = (item) => {
    setFormData({
      tipo_ativo: item.tipo_ativo,
      ativo: item.ativo,
      data: item.data,
      quantidade: item.quantidade.toString(),
      preco: item.preco.toString(),
      outros_custos: item.outros_custos.toString()
    });
    setEditingId(item.id);
  };

  // Função para excluir transação
  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir esta transação?')) {
      try {
        const tableName = activeTab === 'compra' ? 'investimentos_compras' : 'investimentos_vendas';
        const { error } = await supabase
          .from(tableName)
          .delete()
          .eq('id', id);

        if (error) {
          throw error;
        }

        // Atualizar estado local
        if (activeTab === 'compra') {
          setCompras(compras.filter(item => item.id !== id));
        } else {
          setVendas(vendas.filter(item => item.id !== id));
        }

        setImportMessage(`✅ ${activeTab === 'compra' ? 'Compra' : 'Venda'} excluída com sucesso!`);
        setTimeout(() => setImportMessage(''), 3000);

      } catch (error) {
        console.error('Erro ao excluir do Supabase:', error);
        setImportMessage(`❌ Erro ao excluir ${activeTab === 'compra' ? 'compra' : 'venda'}. Tente novamente.`);
        setTimeout(() => setImportMessage(''), 5000);
      }
    }
  };

  // Cancelar edição
  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({
      tipo_ativo: '',
      ativo: '',
      data: new Date().toISOString().split('T')[0],
      quantidade: '',
      preco: '',
      outros_custos: ''
    });
    setErrors({});
  };

  // Atualizar campo do formulário
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Limpar erro quando campo é alterado
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
    
    // Limpar ativo quando tipo de ativo muda
    if (field === 'tipo_ativo') {
      setFormData(prev => ({
        ...prev,
        ativo: ''
      }));
    }
  };



  // Obter estatísticas
  const getEstatisticas = () => {
    const totalCompras = compras.reduce((sum, item) => sum + item.valor_total, 0);
    const totalVendas = vendas.reduce((sum, item) => sum + item.valor_total, 0);
    const totalProventos = proventos.filter(p => !p.a_receber).reduce((sum, item) => sum + (item.valor * (item.quantidade || 1)), 0);
    const proventosAReceber = proventos.filter(p => p.a_receber).reduce((sum, item) => sum + (item.valor * (item.quantidade || 1)), 0);
    
    // Calcular derivativos recebidos (vendas de call)
    const derivativosRecebidos = derivativos
      .filter(d => d.tipo_operacao === 'venda' && d.tipo_derivativo === 'call')
      .reduce((sum, item) => sum + item.valor_total, 0);
    
    // Calcular valor de mercado total baseado na carteira atual
    const carteiraData = getCarteiraData();
    const valorMercadoTotal = carteiraData
      .filter(item => item.quantidadeTotal > 0 && item.valorAtual > 0)
      .reduce((sum, item) => sum + item.valorMercado, 0);
    
    // Calcular total investido atual (apenas posições abertas)
    const totalInvestidoAtual = carteiraData
      .filter(item => item.quantidadeTotal > 0)
      .reduce((sum, item) => sum + (item.quantidadeTotal * item.precoMedio), 0);
    
    // Saldo líquido = valor de mercado atual - total investido atual
    const saldoLiquido = valorMercadoTotal - totalInvestidoAtual;
    
    return {
      totalCompras,
      totalVendas,
      saldoLiquido,
      valorMercadoTotal,
      totalInvestidoAtual,
      totalTransacoes: compras.length + vendas.length,
      totalProventos,
      proventosAReceber,
      derivativosRecebidos
    };
  };

  // Obter ativos únicos cadastrados
  const getAtivosUnicos = () => {
    const ativosCompras = compras.map(item => item.ativo);
    const ativosVendas = vendas.map(item => item.ativo);
    return [...new Set([...ativosCompras, ...ativosVendas])];
  };

  // Dados para gráficos
  const getDadosGraficos = () => {
    // Evolução de proventos dos últimos 12 meses
    const proventosPorMes = Array.from({length: 12}, (_, i) => {
      const data = new Date();
      data.setMonth(data.getMonth() - (11 - i)); // Começar de 11 meses atrás até o mês atual
      const mes = data.getMonth() + 1;
      const ano = data.getFullYear();
      
      // Calcular valor total de proventos recebidos no mês
      const valorMes = proventos
        .filter(p => !p.a_receber) // Apenas proventos já recebidos
        .filter(p => {
          if (!p.data) return false;
          const dataProvento = new Date(p.data + 'T12:00:00');
          const mesProvento = dataProvento.getMonth() + 1;
          const anoProvento = dataProvento.getFullYear();
          return mesProvento === mes && anoProvento === ano;
        })
        .reduce((sum, p) => sum + ((p.valor || 0) * (p.quantidade || 1)), 0);
      
      return {
        mes: data.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }).replace('.', ''),
        mesCompleto: data.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
        mesFormatado: `${data.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}/${ano}`,
        valor: valorMes,
        ano: ano,
        mesNumero: mes
      };
    });

    // Distribuição de ativos baseada no valor total investido
    const ativosValorInvestido = {};
    
    // Calcular valor total investido por ativo (considerando apenas posições atuais)
    compras.forEach(compra => {
      if (!ativosValorInvestido[compra.ativo]) {
        ativosValorInvestido[compra.ativo] = {
          ativo: compra.ativo,
          valorCompras: 0,
          valorVendas: 0,
          quantidadeComprada: 0,
          quantidadeVendida: 0
        };
      }
      ativosValorInvestido[compra.ativo].valorCompras += compra.valor_total;
      ativosValorInvestido[compra.ativo].quantidadeComprada += compra.quantidade;
    });

    vendas.forEach(venda => {
      if (ativosValorInvestido[venda.ativo]) {
        ativosValorInvestido[venda.ativo].valorVendas += venda.valor_total;
        ativosValorInvestido[venda.ativo].quantidadeVendida += venda.quantidade;
      }
    });

    // Calcular valor investido atual (baseado no preço médio das compras e quantidade atual)
    const distribuicaoAtivos = Object.values(ativosValorInvestido)
      .map(item => {
        const quantidadeAtual = item.quantidadeComprada - item.quantidadeVendida;
        const precoMedio = item.quantidadeComprada > 0 ? item.valorCompras / item.quantidadeComprada : 0;
        const valorInvestidoAtual = quantidadeAtual * precoMedio;
        
        return {
          ativo: item.ativo,
          valorInvestido: valorInvestidoAtual,
          quantidade: quantidadeAtual
        };
      })
      .filter(item => item.quantidade > 0 && item.valorInvestido > 0) // Apenas posições ativas com valor
      .sort((a, b) => b.valorInvestido - a.valorInvestido)
      .slice(0, 6);

    // Calcular porcentagens baseadas no valor total investido
    const totalInvestido = distribuicaoAtivos.reduce((sum, item) => sum + item.valorInvestido, 0);
    
    const distribuicaoAtivosComPorcentagem = distribuicaoAtivos.map(item => ({
      ...item,
      porcentagem: totalInvestido > 0 ? ((item.valorInvestido / totalInvestido) * 100).toFixed(1) : 0
    }));

    return { proventosPorMes, distribuicaoAtivos: distribuicaoAtivosComPorcentagem };
  };

  // Função para obter proventos por ativo
  const getProventosPorAtivo = () => {
    const proventosPorAtivo = {};
    
    proventos.forEach(provento => {
      if (!proventosPorAtivo[provento.ativo]) {
        proventosPorAtivo[provento.ativo] = {
          ativo: provento.ativo,
          totalRecebido: 0,
          totalAReceber: 0,
          totalGeral: 0,
          quantidadeOperacoes: 0
        };
      }
      
      const valorCalculado = provento.valor * (provento.quantidade || 1);
      
      proventosPorAtivo[provento.ativo].quantidadeOperacoes += 1;
      proventosPorAtivo[provento.ativo].totalGeral += valorCalculado;
      
      if (provento.a_receber) {
        proventosPorAtivo[provento.ativo].totalAReceber += valorCalculado;
      } else {
        proventosPorAtivo[provento.ativo].totalRecebido += valorCalculado;
      }
    });

    return Object.values(proventosPorAtivo)
      .sort((a, b) => b.totalGeral - a.totalGeral)
      .slice(0, 10); // Top 10 ativos por proventos
  };

  // Função para obter derivativos por ativo subjacente
  const getDerivativosPorAtivo = () => {
    const derivativosPorAtivo = {};
    
    derivativos.forEach(derivativo => {
      if (!derivativosPorAtivo[derivativo.ativo_subjacente]) {
        derivativosPorAtivo[derivativo.ativo_subjacente] = {
          ativo: derivativo.ativo_subjacente,
          totalCompras: 0,
          totalVendas: 0,
          totalGeral: 0,
          quantidadeOperacoes: 0,
          opcoes: {
            calls: { compras: 0, vendas: 0 },
            puts: { compras: 0, vendas: 0 }
          }
        };
      }
      
      const item = derivativosPorAtivo[derivativo.ativo_subjacente];
      item.quantidadeOperacoes += 1;
      item.totalGeral += derivativo.valor_total;
      
      if (derivativo.tipo_operacao === 'compra') {
        item.totalCompras += derivativo.valor_total;
      } else {
        item.totalVendas += derivativo.valor_total;
      }
      
      // Contabilizar por tipo de opção
      if (derivativo.tipo_derivativo === 'call') {
        if (derivativo.tipo_operacao === 'compra') {
          item.opcoes.calls.compras += derivativo.valor_total;
        } else {
          item.opcoes.calls.vendas += derivativo.valor_total;
        }
      } else {
        if (derivativo.tipo_operacao === 'compra') {
          item.opcoes.puts.compras += derivativo.valor_total;
        } else {
          item.opcoes.puts.vendas += derivativo.valor_total;
        }
      }
    });

    return Object.values(derivativosPorAtivo)
      .sort((a, b) => b.totalGeral - a.totalGeral)
      .slice(0, 10); // Top 10 ativos por volume de derivativos
  };

  // Submeter formulário de proventos
  const handleProventoSubmit = async (e) => {
    e.preventDefault();
    
    const newErrors = {};
    if (!proventoData.tipo_provento) newErrors.tipo_provento = 'Tipo de provento é obrigatório';
    if (!proventoData.ativo) newErrors.ativo = 'Ativo é obrigatório';
    if (!proventoData.data) newErrors.data = 'Data é obrigatória';
    if (!proventoData.valor || proventoData.valor <= 0) newErrors.valor = 'Valor deve ser maior que 0';
    
    setProventoErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;
    
    setIsSubmitting(true);
    
    const proventoDataToSave = {
      tipo_provento: proventoData.tipo_provento,
      ativo: proventoData.ativo,
      data: proventoData.data,
      valor: parseFloat(proventoData.valor),
      quantidade: parseFloat(proventoData.quantidade) || 0,
      a_receber: proventoData.a_receber
    };
    
    try {
      if (editingProventoId) {
        // Editar provento existente no Supabase
        const { data, error } = await supabase
          .from('investimentos_proventos')
          .update(proventoDataToSave)
          .eq('id', editingProventoId)
          .select();

        if (error) {
          throw error;
        }

        setProventos(proventos.map(item => item.id === editingProventoId ? data[0] : item));
        setEditingProventoId(null);
      } else {
        // Criar novo provento no Supabase
        const { data, error } = await supabase
          .from('investimentos_proventos')
          .insert([proventoDataToSave])
          .select();

        if (error) {
          throw error;
        }

        setProventos([data[0], ...proventos]);
      }

      setImportMessage(`✅ Provento ${editingProventoId ? 'atualizado' : 'adicionado'} com sucesso!`);
      setTimeout(() => setImportMessage(''), 3000);

    } catch (error) {
      console.error('Erro ao salvar provento no Supabase:', error);
      setImportMessage(`❌ Erro ao ${editingProventoId ? 'atualizar' : 'adicionar'} provento. Tente novamente.`);
      setTimeout(() => setImportMessage(''), 5000);
    }
    
    setProventoData({
      tipo_provento: '',
      ativo: '',
      data: new Date().toISOString().split('T')[0],
      valor: '',
      quantidade: '',
      a_receber: false
    });
    
    setIsSubmitting(false);
  };

  // Função para editar provento
  const handleEditProvento = (provento) => {
    setProventoData({
      tipo_provento: provento.tipo_provento,
      ativo: provento.ativo,
      data: provento.data,
      valor: provento.valor.toString(),
      quantidade: provento.quantidade.toString(),
      a_receber: provento.a_receber
    });
    setEditingProventoId(provento.id);
  };

  // Função para excluir provento
  const handleDeleteProvento = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este provento?')) {
      try {
        const { error } = await supabase
          .from('investimentos_proventos')
          .delete()
          .eq('id', id);

        if (error) {
          throw error;
        }

        setProventos(proventos.filter(item => item.id !== id));
        setImportMessage('✅ Provento excluído com sucesso!');
        setTimeout(() => setImportMessage(''), 3000);

      } catch (error) {
        console.error('Erro ao excluir provento do Supabase:', error);
        setImportMessage('❌ Erro ao excluir provento. Tente novamente.');
        setTimeout(() => setImportMessage(''), 5000);
      }
    }
  };

  // Cancelar edição de provento
  const handleCancelEditProvento = () => {
    setEditingProventoId(null);
    setProventoData({
      tipo_provento: '',
      ativo: '',
      data: new Date().toISOString().split('T')[0],
      valor: '',
      quantidade: '',
      a_receber: false
    });
    setProventoErrors({});
  };

  // Filtrar proventos
  const getProventosFiltrados = () => {
    return proventos.filter(p => {
      const dataProvento = new Date(p.data + 'T12:00:00');
      const anoProvento = dataProvento.getFullYear();
      
      return (!filters.tipo_provento || p.tipo_provento === filters.tipo_provento) &&
             (!filters.ativo || p.ativo === filters.ativo) &&
             (anoProvento === filters.ano);
    });
  };

  // Efeito para atualização automática periódica
  useEffect(() => {
    if (!autoUpdateEnabled) return;

    const interval = setInterval(() => {
      // Verificar se ainda está na página carteira antes de atualizar
      if (activeTab === 'carteira') {
        const carteiraData = getCarteiraData();
        const acoesNaCarteira = carteiraData
          .filter(item => item.tipo_ativo === 'acoes' && item.quantidadeTotal > 0);

        if (acoesNaCarteira.length > 0) {
          updateStockPricesFromAPI();
        }
      }
    }, 5 * 60 * 1000); // Atualizar a cada 5 minutos

    return () => clearInterval(interval);
  }, [autoUpdateEnabled]); // Removido activeTab das dependências para evitar recriação do intervalo

  // Submeter formulário de derivativos
  const handleDerivativoSubmit = async (e) => {
    e.preventDefault();
    
    const newErrors = {};
    if (!derivativoData.tipo_operacao) newErrors.tipo_operacao = 'Tipo de operação é obrigatório';
    if (!derivativoData.tipo_derivativo) newErrors.tipo_derivativo = 'Tipo de derivativo é obrigatório';
    if (!derivativoData.ativo_subjacente) newErrors.ativo_subjacente = 'Ativo subjacente é obrigatório';
    if (!derivativoData.codigo_opcao) newErrors.codigo_opcao = 'Código da opção é obrigatório';
    if (!derivativoData.strike || derivativoData.strike <= 0) newErrors.strike = 'Strike deve ser maior que 0';
    if (!derivativoData.data) newErrors.data = 'Data é obrigatória';
    if (!derivativoData.quantidade || derivativoData.quantidade <= 0) newErrors.quantidade = 'Quantidade deve ser maior que 0';
    if (!derivativoData.preco || derivativoData.preco <= 0) newErrors.preco = 'Preço deve ser maior que 0';
    
    setDerivativoErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;
    
    setIsSubmitting(true);
    
    const derivativoDataToSave = {
      tipo_operacao: derivativoData.tipo_operacao,
      tipo_derivativo: derivativoData.tipo_derivativo,
      ativo_subjacente: derivativoData.ativo_subjacente,
      codigo_opcao: derivativoData.codigo_opcao,
      strike: parseFloat(derivativoData.strike),
      data: derivativoData.data,
      quantidade: parseFloat(derivativoData.quantidade),
      preco: parseFloat(derivativoData.preco),
      outros_custos: parseFloat(derivativoData.outros_custos) || 0,
      status: derivativoData.status,
      valor_total: calcularValorTotalDerivativo()
    };
    
    try {
      if (editingDerivativoId) {
        // Editar derivativo existente no Supabase
        const { data, error } = await supabase
          .from('investimentos_derivativos')
          .update(derivativoDataToSave)
          .eq('id', editingDerivativoId)
          .select();

        if (error) {
          throw error;
        }

        setDerivativos(derivativos.map(item => item.id === editingDerivativoId ? data[0] : item));
        setEditingDerivativoId(null);
      } else {
        // Criar novo derivativo no Supabase
        const { data, error } = await supabase
          .from('investimentos_derivativos')
          .insert([derivativoDataToSave])
          .select();

        if (error) {
          throw error;
        }

        setDerivativos([data[0], ...derivativos]);
      }

      setImportMessage(`✅ Derivativo ${editingDerivativoId ? 'atualizado' : 'adicionado'} com sucesso!`);
      setTimeout(() => setImportMessage(''), 3000);

    } catch (error) {
      console.error('Erro ao salvar derivativo no Supabase:', error);
      setImportMessage(`❌ Erro ao ${editingDerivativoId ? 'atualizar' : 'adicionar'} derivativo. Tente novamente.`);
      setTimeout(() => setImportMessage(''), 5000);
    }
    
    setDerivativoData({
      tipo_operacao: '',
      tipo_derivativo: '',
      ativo_subjacente: '',
      codigo_opcao: '',
      strike: '',
      data: new Date().toISOString().split('T')[0],
      quantidade: '',
      preco: '',
      outros_custos: '',
      status: 'aberta'
    });
    
    setIsSubmitting(false);
  };

  // Função para editar derivativo
  const handleEditDerivativo = (derivativo) => {
    setDerivativoData({
      tipo_operacao: derivativo.tipo_operacao,
      tipo_derivativo: derivativo.tipo_derivativo,
      ativo_subjacente: derivativo.ativo_subjacente,
      codigo_opcao: derivativo.codigo_opcao,
      strike: derivativo.strike ? derivativo.strike.toString() : '',
      data: derivativo.data,
      quantidade: derivativo.quantidade.toString(),
      preco: derivativo.preco.toString(),
      outros_custos: derivativo.outros_custos.toString(),
      status: derivativo.status
    });
    setEditingDerivativoId(derivativo.id);
  };

  // Função para excluir derivativo
  const handleDeleteDerivativo = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir esta operação?')) {
      try {
        const { error } = await supabase
          .from('investimentos_derivativos')
          .delete()
          .eq('id', id);

        if (error) {
          throw error;
        }

        setDerivativos(derivativos.filter(item => item.id !== id));
        setImportMessage('✅ Derivativo excluído com sucesso!');
        setTimeout(() => setImportMessage(''), 3000);

      } catch (error) {
        console.error('Erro ao excluir derivativo do Supabase:', error);
        setImportMessage('❌ Erro ao excluir derivativo. Tente novamente.');
        setTimeout(() => setImportMessage(''), 5000);
      }
    }
  };

  // Cancelar edição de derivativo
  const handleCancelEditDerivativo = () => {
    setEditingDerivativoId(null);
    setDerivativoData({
      tipo_operacao: '',
      tipo_derivativo: '',
      ativo_subjacente: '',
      codigo_opcao: '',
      strike: '',
      data: new Date().toISOString().split('T')[0],
      quantidade: '',
      preco: '',
      outros_custos: '',
      status: 'aberta'
    });
    setDerivativoErrors({});
  };

  // Função para calcular dados da carteira
  const getCarteiraData = () => {
    const ativosMap = {};

    // Processar compras
    compras.forEach(compra => {
      if (!ativosMap[compra.ativo]) {
        ativosMap[compra.ativo] = {
          ativo: compra.ativo,
          tipo_ativo: compra.tipo_ativo,
          totalComprado: 0,
          quantidadeComprada: 0,
          valorTotalCompras: 0,
          totalVendido: 0,
          quantidadeVendida: 0,
          valorTotalVendas: 0
        };
      }
      
      ativosMap[compra.ativo].quantidadeComprada += compra.quantidade;
      ativosMap[compra.ativo].valorTotalCompras += compra.valor_total;
    });

    // Processar vendas
    vendas.forEach(venda => {
      if (ativosMap[venda.ativo]) {
        ativosMap[venda.ativo].quantidadeVendida += venda.quantidade;
        ativosMap[venda.ativo].valorTotalVendas += venda.valor_total;
      }
    });

    // Calcular métricas para cada ativo
    const carteiraData = Object.values(ativosMap).map(item => {
      const quantidadeTotal = item.quantidadeComprada - item.quantidadeVendida;
      const precoMedio = item.quantidadeComprada > 0 ? item.valorTotalCompras / item.quantidadeComprada : 0;
      const custoVendas = item.quantidadeVendida * precoMedio;
      const lucroPrejuizo = item.valorTotalVendas - custoVendas;
      const retornoPercentual = custoVendas > 0 ? (lucroPrejuizo / custoVendas) * 100 : 0;

      // Cálculos com valor atual
      const valorAtual = valoresAtuais[item.ativo] || 0;
      const valorMercado = quantidadeTotal * valorAtual;
      const valorInvestidoAtual = quantidadeTotal * precoMedio;
      const lucroPrejuizoLatente = valorMercado - valorInvestidoAtual;
      const retornoPercentualLatente = valorInvestidoAtual > 0 ? (lucroPrejuizoLatente / valorInvestidoAtual) * 100 : 0;

      return {
        ...item,
        quantidadeTotal,
        precoMedio,
        lucroPrejuizo,
        retornoPercentual: isFinite(retornoPercentual) ? retornoPercentual : 0,
        valorAtual,
        valorMercado,
        lucroPrejuizoLatente,
        retornoPercentualLatente: isFinite(retornoPercentualLatente) ? retornoPercentualLatente : 0
      };
    });

    // Aplicar filtros
    let dadosFiltrados = carteiraData;

    if (carteiraFilters.tipo_ativo) {
      dadosFiltrados = dadosFiltrados.filter(item => item.tipo_ativo === carteiraFilters.tipo_ativo);
    }

    if (carteiraFilters.busca) {
      dadosFiltrados = dadosFiltrados.filter(item => 
        item.ativo.toLowerCase().includes(carteiraFilters.busca.toLowerCase())
      );
    }

    if (carteiraFilters.periodo) {
      const hoje = new Date();
      let dataCorte = new Date();
      
      switch (carteiraFilters.periodo) {
        case '30dias':
          dataCorte.setDate(hoje.getDate() - 30);
          break;
        case '6meses':
          dataCorte.setMonth(hoje.getMonth() - 6);
          break;
        case 'ano':
          dataCorte.setFullYear(hoje.getFullYear(), 0, 1);
          break;
        default:
          dataCorte = new Date('1900-01-01');
      }

      // Filtrar por período considerando compras/vendas
      dadosFiltrados = dadosFiltrados.filter(item => {
        const comprasRecentes = compras.filter(c => 
          c.ativo === item.ativo && new Date(c.data + 'T12:00:00') >= dataCorte
        );
        const vendasRecentes = vendas.filter(v => 
          v.ativo === item.ativo && new Date(v.data + 'T12:00:00') >= dataCorte
        );
        return comprasRecentes.length > 0 || vendasRecentes.length > 0;
      });
    }

    // Aplicar ordenação
    if (sortConfig.key) {
      dadosFiltrados.sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return dadosFiltrados;
  };

  // Função para ordenar tabela
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Função para obter ícone de ordenação
  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return <span className="text-gray-400">↕</span>;
    }
    return sortConfig.direction === 'asc' ? 
      <span className="text-blue-400">↑</span> : 
      <span className="text-blue-400">↓</span>;
  };

  // Funções para edição de valor atual
  const handleEditValorAtual = (ativo, valorAtual) => {
    setEditingValorAtivo(ativo);
    setValorAtualTemp(valorAtual.toString());
  };

  const handleSaveValorAtual = (ativo) => {
    const novoValor = parseFloat(valorAtualTemp) || 0;
    setValoresAtuais({
      ...valoresAtuais,
      [ativo]: novoValor
    });
    setEditingValorAtivo(null);
    setValorAtualTemp('');
  };

  const handleCancelEditValorAtual = () => {
    setEditingValorAtivo(null);
    setValorAtualTemp('');
  };

  // Função para atualizar preços automaticamente via API brapi.dev
  const updateStockPricesFromAPI = async () => {
    // Verificar se ainda está na página carteira antes de iniciar a atualização
    if (activeTab !== 'carteira') {
      return;
    }
    
    setIsUpdatingPrices(true);
    setPriceUpdateMessage('🔄 Buscando cotações atualizadas...');
    
    try {
      // Filtrar apenas ações brasileiras da carteira
      const carteiraData = getCarteiraData();
      const acoesNaCarteira = carteiraData
        .filter(item => item.tipo_ativo === 'acoes' && item.quantidadeTotal > 0)
        .map(item => item.ativo);

      if (acoesNaCarteira.length === 0) {
        setPriceUpdateMessage('ℹ️ Nenhuma ação encontrada na carteira para atualizar.');
        setTimeout(() => setPriceUpdateMessage(''), 3000);
        setIsUpdatingPrices(false);
        return;
      }

      const token = 'sb9Cd84Y9hW5eRharMMRuD';
      const updatedPrices = {};
      let successCount = 0;
      let errorCount = 0;

      // Processar ações em lotes para evitar sobrecarga da API
      for (const symbol of acoesNaCarteira) {
        // Verificar se o usuário ainda está na página carteira
        if (activeTab !== 'carteira') {
          setIsUpdatingPrices(false);
          setPriceUpdateMessage('');
          return;
        }
        
        try {
          const url = `https://brapi.dev/api/quote/${symbol}?token=${token}`;
          const response = await fetch(url);
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }
          
          const data = await response.json();
          
          if (data.results && data.results.length > 0) {
            const stockData = data.results[0];
            if (stockData.regularMarketPrice && stockData.regularMarketPrice > 0) {
              updatedPrices[symbol] = stockData.regularMarketPrice;
              successCount++;
            }
          }
          
          // Pequeno delay entre requisições para ser respeitoso com a API
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (error) {
          console.error(`Erro ao buscar preço de ${symbol}:`, error);
          errorCount++;
        }
      }

      // Atualizar os preços no estado
      if (Object.keys(updatedPrices).length > 0) {
        setValoresAtuais(prev => ({
          ...prev,
          ...updatedPrices
        }));
        
        setLastUpdateTime(new Date().toISOString());
        
        setPriceUpdateMessage(
          `✅ Cotações atualizadas! ${successCount} sucessos${errorCount > 0 ? `, ${errorCount} erros` : ''}`
        );
      } else {
        setPriceUpdateMessage('⚠️ Nenhum preço pôde ser atualizado. Verifique sua conexão.');
      }
      
    } catch (error) {
      console.error('Erro geral na atualização de preços:', error);
      setPriceUpdateMessage('❌ Erro ao conectar com a API de cotações.');
    }
    
    setIsUpdatingPrices(false);
    setTimeout(() => setPriceUpdateMessage(''), 5000);
  };

  // Função para atualizar preço de uma ação específica
  const updateSingleStockPrice = async (symbol) => {
    setUpdatingSingleStock(symbol);
    
    try {
      const token = 'sb9Cd84Y9hW5eRharMMRuD';
      const url = `https://brapi.dev/api/quote/${symbol}?token=${token}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const stockData = data.results[0];
        if (stockData.regularMarketPrice && stockData.regularMarketPrice > 0) {
          setValoresAtuais(prev => ({
            ...prev,
            [symbol]: stockData.regularMarketPrice
          }));
          
          setPriceUpdateMessage(`✅ ${symbol}: R$ ${stockData.regularMarketPrice.toLocaleString('pt-BR', {minimumFractionDigits: 2})} atualizado!`);
          setTimeout(() => setPriceUpdateMessage(''), 3000);
          
          return stockData.regularMarketPrice;
        }
      }
      
      throw new Error('Preço não encontrado na resposta da API');
      
    } catch (error) {
      console.error(`Erro ao buscar preço de ${symbol}:`, error);
      setPriceUpdateMessage(`❌ Erro ao atualizar ${symbol}. Tente novamente.`);
      setTimeout(() => setPriceUpdateMessage(''), 3000);
      throw error;
    } finally {
      setUpdatingSingleStock(null);
    }
  };

  // Função para formatar tempo da última atualização
  const formatLastUpdateTime = () => {
    if (!lastUpdateTime) return 'Nunca';
    
    const updateDate = new Date(lastUpdateTime);
    const now = new Date();
    const diffMinutes = Math.floor((now - updateDate) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Agora mesmo';
    if (diffMinutes < 60) return `${diffMinutes} min atrás`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h atrás`;
    
    return updateDate.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Estados para configurações
  const [exportMessage, setExportMessage] = useState('');
  const [importMessage, setImportMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Funções para carregar dados do Supabase
  const loadDataFromSupabase = async () => {
    setIsLoading(true);
    setConnectionStatus('connecting');
    
    try {
      console.log('🔄 Iniciando conexão com Supabase...');
      setImportMessage('🔄 Conectando ao Supabase...');

      // Testar conexão
      const { data: testData, error: testError } = await supabase
        .from('investimentos_compras')
        .select('count', { count: 'exact', head: true });
      
      if (testError) {
        console.error('❌ Erro ao testar conexão:', testError);
        setConnectionStatus('error');
        setImportMessage(`❌ Erro de conexão: ${testError.message}`);
        setTimeout(() => setImportMessage(''), 8000);
        setIsLoading(false);
        return;
      }

      console.log('✅ Conexão estabelecida com sucesso!');
      setConnectionStatus('connected');
      setImportMessage('✅ Conectado! Carregando dados das tabelas...');

      let totalRegistros = 0;

      // Carregar compras
      console.log('📦 Carregando compras...');
      const { data: comprasData, error: comprasError } = await supabase
        .from('investimentos_compras')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (comprasError) {
        console.error('❌ Erro ao carregar compras:', comprasError);
        setImportMessage(`❌ Erro ao carregar compras: ${comprasError.message}`);
      } else {
        setCompras(comprasData || []);
        totalRegistros += comprasData?.length || 0;
        console.log(`✅ ${comprasData?.length || 0} compras carregadas`);
      }

      // Carregar vendas
      console.log('💰 Carregando vendas...');
      const { data: vendasData, error: vendasError } = await supabase
        .from('investimentos_vendas')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (vendasError) {
        console.error('❌ Erro ao carregar vendas:', vendasError);
        setImportMessage(`❌ Erro ao carregar vendas: ${vendasError.message}`);
      } else {
        setVendas(vendasData || []);
        totalRegistros += vendasData?.length || 0;
        console.log(`✅ ${vendasData?.length || 0} vendas carregadas`);
      }

      // Carregar proventos
      console.log('🎁 Carregando proventos...');
      const { data: proventosData, error: proventosError } = await supabase
        .from('investimentos_proventos')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (proventosError) {
        console.error('❌ Erro ao carregar proventos:', proventosError);
        setImportMessage(`❌ Erro ao carregar proventos: ${proventosError.message}`);
      } else {
        setProventos(proventosData || []);
        totalRegistros += proventosData?.length || 0;
        console.log(`✅ ${proventosData?.length || 0} proventos carregados`);
      }

      // Carregar derivativos
      console.log('🎯 Carregando derivativos...');
      const { data: derivativosData, error: derivativosError } = await supabase
        .from('investimentos_derivativos')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (derivativosError) {
        console.error('❌ Erro ao carregar derivativos:', derivativosError);
        setImportMessage(`❌ Erro ao carregar derivativos: ${derivativosError.message}`);
      } else {
        setDerivativos(derivativosData || []);
        totalRegistros += derivativosData?.length || 0;
        console.log(`✅ ${derivativosData?.length || 0} derivativos carregados`);
      }

      const mensagemSucesso = `✅ Sincronização completa! Total: ${totalRegistros} registros carregados | Compras: ${comprasData?.length || 0} | Vendas: ${vendasData?.length || 0} | Proventos: ${proventosData?.length || 0} | Derivativos: ${derivativosData?.length || 0}`;
      console.log(mensagemSucesso);
      setImportMessage(mensagemSucesso);
      setTimeout(() => setImportMessage(''), 8000);

    } catch (error) {
      console.error('💥 Erro geral ao carregar dados:', error);
      setConnectionStatus('error');
      setImportMessage(`❌ Erro inesperado: ${error.message}`);
      setTimeout(() => setImportMessage(''), 8000);
    }
    
    setIsLoading(false);
  };

  // Carregar dados na inicialização
  useEffect(() => {
    loadDataFromSupabase();
  }, []);

  // Função para testar conexão com Supabase
  const testSupabaseConnection = async () => {
    setIsLoading(true);
    setImportMessage('🔄 Testando conexão com Supabase...');
    
    try {
      const { data, error } = await supabase
        .from('investimentos_compras')
        .select('count', { count: 'exact', head: true });
      
      if (error) {
        throw error;
      }

      setImportMessage('✅ Conexão com Supabase funcionando! Carregando dados...');
      setTimeout(() => {
        loadDataFromSupabase();
      }, 1000);

    } catch (error) {
      console.error('Erro de conexão:', error);
      setImportMessage(`❌ Erro de conexão: ${error.message}`);
      setTimeout(() => setImportMessage(''), 5000);
    }
    
    setIsLoading(false);
  };

  // Funções de Exportação
  const downloadCSV = (data, filename) => {
    const csvContent = data.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const exportCompras = () => {
    if (compras.length === 0) {
      setExportMessage('Nenhuma compra para exportar.');
      setTimeout(() => setExportMessage(''), 3000);
      return;
    }

    const headers = ['tipo_ativo', 'ativo', 'data', 'quantidade', 'preco', 'outros_custos', 'valor_total'];
    const csvData = [headers.join(',')];
    
    compras.forEach(item => {
      const row = [
        item.tipo_ativo,
        item.ativo,
        item.data,
        item.quantidade,
        item.preco,
        item.outros_custos,
        item.valor_total
      ];
      csvData.push(row.join(','));
    });

    downloadCSV(csvData, 'compras_TEK.csv');
    setExportMessage(`✅ ${compras.length} compras exportadas com sucesso!`);
    setTimeout(() => setExportMessage(''), 3000);
  };

  const exportVendas = () => {
    if (vendas.length === 0) {
      setExportMessage('Nenhuma venda para exportar.');
      setTimeout(() => setExportMessage(''), 3000);
      return;
    }

    const headers = ['tipo_ativo', 'ativo', 'data', 'quantidade', 'preco', 'outros_custos', 'valor_total'];
    const csvData = [headers.join(',')];
    
    vendas.forEach(item => {
      const row = [
        item.tipo_ativo,
        item.ativo,
        item.data,
        item.quantidade,
        item.preco,
        item.outros_custos,
        item.valor_total
      ];
      csvData.push(row.join(','));
    });

    downloadCSV(csvData, 'vendas_TEK.csv');
    setExportMessage(`✅ ${vendas.length} vendas exportadas com sucesso!`);
    setTimeout(() => setExportMessage(''), 3000);
  };

  const exportProventos = () => {
    if (proventos.length === 0) {
      setExportMessage('Nenhum provento para exportar.');
      setTimeout(() => setExportMessage(''), 3000);
      return;
    }

    const headers = ['tipo_provento', 'ativo', 'data', 'valor', 'quantidade', 'a_receber'];
    const csvData = [headers.join(',')];
    
    proventos.forEach(item => {
      const row = [
        item.tipo_provento,
        item.ativo,
        item.data,
        item.valor,
        item.quantidade || 0,
        item.a_receber ? 'true' : 'false'
      ];
      csvData.push(row.join(','));
    });

    downloadCSV(csvData, 'proventos_TEK.csv');
    setExportMessage(`✅ ${proventos.length} proventos exportados com sucesso!`);
    setTimeout(() => setExportMessage(''), 3000);
  };

  const exportDerivativos = () => {
    if (derivativos.length === 0) {
      setExportMessage('Nenhum derivativo para exportar.');
      setTimeout(() => setExportMessage(''), 3000);
      return;
    }

    const headers = ['tipo_operacao', 'tipo_derivativo', 'ativo_subjacente', 'codigo_opcao', 'strike', 'data', 'quantidade', 'preco', 'outros_custos', 'status', 'valor_total'];
    const csvData = [headers.join(',')];
    
    derivativos.forEach(item => {
      const row = [
        item.tipo_operacao,
        item.tipo_derivativo,
        item.ativo_subjacente,
        item.codigo_opcao,
        item.strike || 0,
        item.data,
        item.quantidade,
        item.preco,
        item.outros_custos,
        item.status,
        item.valor_total
      ];
      csvData.push(row.join(','));
    });

    downloadCSV(csvData, 'derivativos_TEK.csv');
    setExportMessage(`✅ ${derivativos.length} derivativos exportados com sucesso!`);
    setTimeout(() => setExportMessage(''), 3000);
  };

  const exportCarteiraConsolidada = () => {
    const carteiraData = getCarteiraData();
    if (carteiraData.length === 0) {
      setExportMessage('Nenhum dado de carteira para exportar.');
      setTimeout(() => setExportMessage(''), 3000);
      return;
    }

    const headers = ['ativo', 'tipo_ativo', 'quantidade_total', 'preco_medio', 'valor_total_compras', 'valor_total_vendas', 'lucro_prejuizo', 'retorno_percentual', 'valor_atual', 'valor_mercado', 'lucro_prejuizo_latente', 'retorno_percentual_latente'];
    const csvData = [headers.join(',')];
    
    carteiraData.forEach(item => {
      const row = [
        item.ativo,
        item.tipo_ativo,
        item.quantidadeTotal,
        item.precoMedio,
        item.valorTotalCompras,
        item.valorTotalVendas,
        item.lucroPrejuizo,
        item.retornoPercentual,
        item.valorAtual,
        item.valorMercado,
        item.lucroPrejuizoLatente,
        item.retornoPercentualLatente
      ];
      csvData.push(row.join(','));
    });

    downloadCSV(csvData, 'carteira_consolidada_TEK.csv');
    setExportMessage(`✅ Carteira consolidada exportada com sucesso!`);
    setTimeout(() => setExportMessage(''), 3000);
  };

  const exportBackupCompleto = () => {
    setIsProcessing(true);
    
    // Exportar todos os arquivos individuais
    setTimeout(() => {
      if (compras.length > 0) exportCompras();
    }, 100);
    
    setTimeout(() => {
      if (vendas.length > 0) exportVendas();
    }, 200);
    
    setTimeout(() => {
      if (proventos.length > 0) exportProventos();
    }, 300);
    
    setTimeout(() => {
      if (derivativos.length > 0) exportDerivativos();
    }, 400);
    
    setTimeout(() => {
      exportCarteiraConsolidada();
      setIsProcessing(false);
      setExportMessage('✅ Backup completo exportado! Verifique os downloads.');
      setTimeout(() => setExportMessage(''), 5000);
    }, 500);
  };

  // Funções de Importação
  const parseCSV = (csvText) => {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim());
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length === headers.length) {
        const item = {};
        headers.forEach((header, index) => {
          item[header] = values[index];
        });
        data.push(item);
      }
    }
    
    return data;
  };

  const handleFileImport = (event, type) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      setImportMessage('❌ Por favor, selecione um arquivo .CSV válido.');
      setTimeout(() => setImportMessage(''), 3000);
      return;
    }

    setIsProcessing(true);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const csvData = parseCSV(e.target.result);
        
        if (csvData.length === 0) {
          setImportMessage('❌ Arquivo CSV vazio ou formato inválido.');
          setIsProcessing(false);
          setTimeout(() => setImportMessage(''), 3000);
          return;
        }

        // Validar e importar dados baseado no tipo
        switch (type) {
          case 'compras':
            importComprasData(csvData);
            break;
          case 'vendas':
            importVendasData(csvData);
            break;
          case 'proventos':
            importProventosData(csvData);
            break;
          case 'derivativos':
            importDerivativosData(csvData);
            break;
        }
        
      } catch (error) {
        setImportMessage('❌ Erro ao processar o arquivo CSV.');
        setIsProcessing(false);
        setTimeout(() => setImportMessage(''), 3000);
      }
    };
    
    reader.readAsText(file);
    event.target.value = ''; // Limpar input
  };

  const importComprasData = (data) => {
    try {
      const requiredFields = ['tipo_ativo', 'ativo', 'data', 'quantidade', 'preco'];
      const validData = data.filter(item => 
        requiredFields.every(field => item[field] && item[field] !== '')
      );

      if (validData.length === 0) {
        setImportMessage('❌ Nenhum dado válido encontrado no arquivo de compras.');
        setIsProcessing(false);
        setTimeout(() => setImportMessage(''), 3000);
        return;
      }

      const newCompras = validData.map(item => ({
        id: Date.now() + Math.random(),
        tipo_ativo: item.tipo_ativo,
        ativo: item.ativo,
        data: item.data,
        quantidade: parseFloat(item.quantidade) || 0,
        preco: parseFloat(item.preco) || 0,
        outros_custos: parseFloat(item.outros_custos) || 0,
        valor_total: parseFloat(item.valor_total) || ((parseFloat(item.quantidade) || 0) * (parseFloat(item.preco) || 0) + (parseFloat(item.outros_custos) || 0)),
        timestamp: new Date().toISOString()
      }));

      setCompras([...compras, ...newCompras]);
      setImportMessage(`✅ ${newCompras.length} compras importadas com sucesso!`);
      setIsProcessing(false);
      setTimeout(() => setImportMessage(''), 3000);
      
    } catch (error) {
      setImportMessage('❌ Erro ao importar dados de compras.');
      setIsProcessing(false);
      setTimeout(() => setImportMessage(''), 3000);
    }
  };

  const importVendasData = (data) => {
    try {
      const requiredFields = ['tipo_ativo', 'ativo', 'data', 'quantidade', 'preco'];
      const validData = data.filter(item => 
        requiredFields.every(field => item[field] && item[field] !== '')
      );

      if (validData.length === 0) {
        setImportMessage('❌ Nenhum dado válido encontrado no arquivo de vendas.');
        setIsProcessing(false);
        setTimeout(() => setImportMessage(''), 3000);
        return;
      }

      const newVendas = validData.map(item => ({
        id: Date.now() + Math.random(),
        tipo_ativo: item.tipo_ativo,
        ativo: item.ativo,
        data: item.data,
        quantidade: parseFloat(item.quantidade) || 0,
        preco: parseFloat(item.preco) || 0,
        outros_custos: parseFloat(item.outros_custos) || 0,
        valor_total: parseFloat(item.valor_total) || ((parseFloat(item.quantidade) || 0) * (parseFloat(item.preco) || 0) + (parseFloat(item.outros_custos) || 0)),
        timestamp: new Date().toISOString()
      }));

      setVendas([...vendas, ...newVendas]);
      setImportMessage(`✅ ${newVendas.length} vendas importadas com sucesso!`);
      setIsProcessing(false);
      setTimeout(() => setImportMessage(''), 3000);
      
    } catch (error) {
      setImportMessage('❌ Erro ao importar dados de vendas.');
      setIsProcessing(false);
      setTimeout(() => setImportMessage(''), 3000);
    }
  };

  const importProventosData = (data) => {
    try {
      const requiredFields = ['tipo_provento', 'ativo', 'data', 'valor'];
      const validData = data.filter(item => 
        requiredFields.every(field => item[field] && item[field] !== '')
      );

      if (validData.length === 0) {
        setImportMessage('❌ Nenhum dado válido encontrado no arquivo de proventos.');
        setIsProcessing(false);
        setTimeout(() => setImportMessage(''), 3000);
        return;
      }

      const newProventos = validData.map(item => ({
        id: Date.now() + Math.random(),
        tipo_provento: item.tipo_provento,
        ativo: item.ativo,
        data: item.data,
        valor: parseFloat(item.valor) || 0,
        quantidade: parseFloat(item.quantidade) || 0,
        a_receber: item.a_receber === 'true',
        timestamp: new Date().toISOString()
      }));

      setProventos([...proventos, ...newProventos]);
      setImportMessage(`✅ ${newProventos.length} proventos importados com sucesso!`);
      setIsProcessing(false);
      setTimeout(() => setImportMessage(''), 3000);
      
    } catch (error) {
      setImportMessage('❌ Erro ao importar dados de proventos.');
      setIsProcessing(false);
      setTimeout(() => setImportMessage(''), 3000);
    }
  };

  const importDerivativosData = (data) => {
    try {
      const requiredFields = ['tipo_operacao', 'tipo_derivativo', 'ativo_subjacente', 'codigo_opcao', 'data', 'quantidade', 'preco'];
      const validData = data.filter(item => 
        requiredFields.every(field => item[field] && item[field] !== '')
      );

      if (validData.length === 0) {
        setImportMessage('❌ Nenhum dado válido encontrado no arquivo de derivativos.');
        setIsProcessing(false);
        setTimeout(() => setImportMessage(''), 3000);
        return;
      }

      const newDerivativos = validData.map(item => ({
        id: Date.now() + Math.random(),
        tipo_operacao: item.tipo_operacao,
        tipo_derivativo: item.tipo_derivativo,
        ativo_subjacente: item.ativo_subjacente,
        codigo_opcao: item.codigo_opcao,
        strike: parseFloat(item.strike) || 0,
        data: item.data,
        quantidade: parseFloat(item.quantidade) || 0,
        preco: parseFloat(item.preco) || 0,
        outros_custos: parseFloat(item.outros_custos) || 0,
        status: item.status || 'aberta',
        valor_total: parseFloat(item.valor_total) || ((parseFloat(item.quantidade) || 0) * (parseFloat(item.preco) || 0) + (parseFloat(item.outros_custos) || 0)),
        timestamp: new Date().toISOString()
      }));

      setDerivativos([...derivativos, ...newDerivativos]);
      setImportMessage(`✅ ${newDerivativos.length} derivativos importados com sucesso!`);
      setIsProcessing(false);
      setTimeout(() => setImportMessage(''), 3000);
      
    } catch (error) {
      setImportMessage('❌ Erro ao importar dados de derivativos.');
      setIsProcessing(false);
      setTimeout(() => setImportMessage(''), 3000);
    }
  };

  const limparTodosDados = () => {
    const confirmacao = window.confirm(
      '⚠️ ATENÇÃO: Esta ação irá apagar TODOS os dados salvos (compras, vendas, proventos, derivativos e valores atuais).\n\nEsta ação não pode ser desfeita!\n\nTem certeza que deseja continuar?'
    );
    
    if (confirmacao) {
      const segundaConfirmacao = window.confirm(
        '🚨 CONFIRMAÇÃO FINAL: Todos os seus dados serão perdidos permanentemente!\n\nDigite "CONFIRMAR" se deseja realmente apagar tudo:'
      );
      
      if (segundaConfirmacao) {
        setCompras([]);
        setVendas([]);
        setProventos([]);
        setDerivativos([]);
        setValoresAtuais({});
        setImportMessage('✅ Todos os dados foram apagados com sucesso.');
        setTimeout(() => setImportMessage(''), 3000);
      }
    }
  };

  const stats = getEstatisticas();
  const ativosUnicos = getAtivosUnicos();
  const dadosGraficos = getDadosGraficos();
  const proventosFiltrados = getProventosFiltrados();
  const proventosPorAtivo = getProventosPorAtivo();
  const derivativosPorAtivo = getDerivativosPorAtivo();

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-3 sm:px-6 py-3 sm:py-4">
        <div className="max-w-7xl mx-auto">
          {/* Desktop Header */}
          <div className="hidden lg:flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-8 h-8 text-blue-400" />
                <div>
                  <h1 className="text-2xl font-bold text-white">Tekinformática</h1>
                  <p className="text-sm text-gray-400">Gerenciamento de Investimentos</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <nav className="flex space-x-1">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`px-3 py-2 rounded-lg transition-colors ${
                    activeTab === 'dashboard' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  <Home className="w-4 h-4 inline mr-2" />
                  Dashboard
                </button>
                <button
                  onClick={() => setActiveTab('compra')}
                  className={`px-3 py-2 rounded-lg transition-colors ${
                    activeTab === 'compra' ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  <TrendingUp className="w-4 h-4 inline mr-2" />
                  Comprar
                </button>
                <button
                  onClick={() => setActiveTab('venda')}
                  className={`px-3 py-2 rounded-lg transition-colors ${
                    activeTab === 'venda' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  <TrendingDown className="w-4 h-4 inline mr-2" />
                  Vender
                </button>
                <button
                  onClick={() => setActiveTab('proventos')}
                  className={`px-3 py-2 rounded-lg transition-colors ${
                    activeTab === 'proventos' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  <Gift className="w-4 h-4 inline mr-2" />
                  Proventos
                </button>
                <button
                  onClick={() => setActiveTab('derivativos')}
                  className={`px-3 py-2 rounded-lg transition-colors ${
                    activeTab === 'derivativos' ? 'bg-orange-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  <Target className="w-4 h-4 inline mr-2" />
                  Derivativos
                </button>
                <button
                  onClick={() => setActiveTab('carteira')}
                  className={`px-3 py-2 rounded-lg transition-colors ${
                    activeTab === 'carteira' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  <PieChart className="w-4 h-4 inline mr-2" />
                  Carteira
                </button>
              </nav>
              <div className="flex items-center space-x-2 bg-gray-700 px-3 py-2 rounded-lg">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-sm">Admin</span>
              </div>
              <Settings 
                className="w-5 h-5 text-gray-400 cursor-pointer hover:text-white transition-colors" 
                onClick={() => setActiveTab('configuracoes')}
              />
            </div>
          </div>

          {/* Mobile Header */}
          <div className="lg:hidden">
            {/* Top Row - Logo and Settings */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-6 h-6 text-blue-400" />
                <div>
                  <h1 className="text-lg font-bold text-white">Tekinformática</h1>
                  <p className="text-xs text-gray-400">Gerenciamento de Investimentos</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1 bg-gray-700 px-2 py-1 rounded text-xs">
                  <User className="w-3 h-3 text-gray-400" />
                  <span>Admin</span>
                </div>
                <Settings 
                  className="w-5 h-5 text-gray-400 cursor-pointer hover:text-white transition-colors" 
                  onClick={() => setActiveTab('configuracoes')}
                />
              </div>
            </div>

            {/* Mobile Navigation - Horizontal Scroll */}
            <div className="overflow-x-auto scrollbar-hide">
              <nav className="flex space-x-2 pb-2" style={{ minWidth: 'max-content' }}>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`flex items-center px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
                    activeTab === 'dashboard' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  <Home className="w-4 h-4 mr-1" />
                  <span className="text-sm">Dashboard</span>
                </button>
                <button
                  onClick={() => setActiveTab('compra')}
                  className={`flex items-center px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
                    activeTab === 'compra' ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  <TrendingUp className="w-4 h-4 mr-1" />
                  <span className="text-sm">Comprar</span>
                </button>
                <button
                  onClick={() => setActiveTab('venda')}
                  className={`flex items-center px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
                    activeTab === 'venda' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  <TrendingDown className="w-4 h-4 mr-1" />
                  <span className="text-sm">Vender</span>
                </button>
                <button
                  onClick={() => setActiveTab('proventos')}
                  className={`flex items-center px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
                    activeTab === 'proventos' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  <Gift className="w-4 h-4 mr-1" />
                  <span className="text-sm">Proventos</span>
                </button>
                <button
                  onClick={() => setActiveTab('derivativos')}
                  className={`flex items-center px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
                    activeTab === 'derivativos' ? 'bg-orange-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  <Target className="w-4 h-4 mr-1" />
                  <span className="text-sm">Derivativos</span>
                </button>
                <button
                  onClick={() => setActiveTab('carteira')}
                  className={`flex items-center px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
                    activeTab === 'carteira' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  <PieChart className="w-4 h-4 mr-1" />
                  <span className="text-sm">Carteira</span>
                </button>
              </nav>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
        {/* Dashboard */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-8 gap-3 sm:gap-4">
              <div className="bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-xs sm:text-sm">Total Compras</p>
                    <p className="text-lg sm:text-xl font-bold text-green-400">R$ {stats.totalCompras.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
                  </div>
                  <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" />
                </div>
              </div>
              
              <div className="bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-xs sm:text-sm">Total Vendas</p>
                    <p className="text-lg sm:text-xl font-bold text-blue-400">R$ {stats.totalVendas.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
                  </div>
                  <TrendingDown className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
                </div>
              </div>
              
              <div className="bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-xs sm:text-sm">Valor Mercado Total</p>
                    <p className="text-lg sm:text-xl font-bold text-cyan-400">R$ {stats.valorMercadoTotal.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
                  </div>
                  <PieChart className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400" />
                </div>
              </div>
              
              <div className="bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-xs sm:text-sm">Saldo Líquido</p>
                    <p className={`text-lg sm:text-xl font-bold ${stats.saldoLiquido >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {stats.saldoLiquido >= 0 ? '+' : ''}R$ {stats.saldoLiquido.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Valorização</p>
                  </div>
                  <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400" />
                </div>
              </div>
              
              <div className="bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-xs sm:text-sm">Total Transações</p>
                    <p className="text-lg sm:text-xl font-bold text-purple-400">{stats.totalTransacoes}</p>
                  </div>
                  <Hash className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
                </div>
              </div>

              <div className="bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-xs sm:text-sm">Proventos Recebidos</p>
                    <p className="text-lg sm:text-xl font-bold text-emerald-400">R$ {stats.totalProventos.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
                  </div>
                  <Gift className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
                </div>
              </div>

              <div className="bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-xs sm:text-sm">A Receber</p>
                    <p className="text-lg sm:text-xl font-bold text-orange-400">R$ {stats.proventosAReceber.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
                  </div>
                  <Receipt className="w-5 h-5 sm:w-6 sm:h-6 text-orange-400" />
                </div>
              </div>

              <div className="bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-xs sm:text-sm">Derivativos Recebidos</p>
                    <p className="text-lg sm:text-xl font-bold text-pink-400">R$ {stats.derivativosRecebidos.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
                    <p className="text-xs text-gray-500 mt-1">Vendas de Call</p>
                  </div>
                  <Target className="w-5 h-5 sm:w-6 sm:h-6 text-pink-400" />
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
              {/* Evolução de Proventos - Gráfico Pizza */}
              <div className="bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-700">
                <h3 className="text-base sm:text-lg font-semibold text-white mb-4 flex items-center">
                  <PieChart className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-emerald-400" />
                  Distribuição de Proventos (12 meses)
                </h3>
                <div className="min-h-80 sm:min-h-96 lg:min-h-[32rem] bg-gray-750 rounded-lg">
                  {dadosGraficos.proventosPorMes.some(item => item.valor > 0) ? (
                    <div className="w-full h-full flex flex-col lg:flex-row p-2 sm:p-4">
                      {/* Container do Gráfico Pizza - Mobile: Top, Desktop: Left */}
                      <div className="flex-1 flex items-center justify-center lg:justify-start lg:pl-4 mb-4 lg:mb-0">
                        <div className="relative">
                          {/* Pizza Chart SVG - Responsivo */}
                          <svg 
                            width="100%" 
                            height="100%" 
                            viewBox="0 0 240 240" 
                            className="transform -rotate-90 w-48 h-48 sm:w-56 sm:h-56 lg:w-60 lg:h-60"
                          >
                            {(() => {
                              const dadosComValor = dadosGraficos.proventosPorMes.filter(item => item.valor > 0);
                              const totalValor = dadosComValor.reduce((sum, item) => sum + item.valor, 0);
                              
                              if (totalValor === 0) return null;
                              
                              let cumulativePercentage = 0;
                              const radius = 100;
                              const centerX = 120;
                              const centerY = 120;
                              
                              const cores = [
                                '#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', 
                                '#EF4444', '#06B6D4', '#84CC16', '#F97316',
                                '#EC4899', '#6366F1', '#14B8A6', '#F43F5E'
                              ];
                              
                              return dadosComValor.map((item, index) => {
                                const percentage = (item.valor / totalValor) * 100;
                                const angle = (percentage / 100) * 360;
                                
                                const startAngle = (cumulativePercentage / 100) * 360;
                                const endAngle = startAngle + angle;
                                
                                const x1 = centerX + radius * Math.cos((startAngle * Math.PI) / 180);
                                const y1 = centerY + radius * Math.sin((startAngle * Math.PI) / 180);
                                const x2 = centerX + radius * Math.cos((endAngle * Math.PI) / 180);
                                const y2 = centerY + radius * Math.sin((endAngle * Math.PI) / 180);
                                
                                const largeArcFlag = angle > 180 ? 1 : 0;
                                
                                const pathData = [
                                  `M ${centerX} ${centerY}`,
                                  `L ${x1} ${y1}`,
                                  `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                                  'Z'
                                ].join(' ');
                                
                                cumulativePercentage += percentage;
                                
                                return (
                                  <g key={index} className="group cursor-pointer">
                                    <path
                                      d={pathData}
                                      fill={cores[index % cores.length]}
                                      className="transition-all duration-300 hover:brightness-110"
                                      style={{ transformOrigin: `${centerX}px ${centerY}px` }}
                                    />
                                    <title>
                                      {item.mesFormatado}: R$ {item.valor.toLocaleString('pt-BR', {minimumFractionDigits: 2})} ({percentage.toFixed(1)}%)
                                    </title>
                                  </g>
                                );
                              });
                            })()}
                          </svg>
                          
                          {/* Centro do gráfico com total */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center bg-gray-800 rounded-full w-16 h-16 sm:w-20 sm:h-20 flex flex-col items-center justify-center border-2 sm:border-4 border-gray-700">
                              <div className="text-xs text-gray-400 font-medium">Total</div>
                              <div className="text-xs sm:text-sm font-bold text-emerald-400">
                                R$ {dadosGraficos.proventosPorMes
                                  .reduce((sum, item) => sum + item.valor, 0)
                                  .toLocaleString('pt-BR', {minimumFractionDigits: 0, maximumFractionDigits: 0})}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Legenda - Mobile: Bottom, Desktop: Right */}
                      <div className="w-full lg:w-64 lg:ml-6 flex flex-col min-h-0">
                        <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center">
                          📅 Meses com Proventos
                        </h4>
                        <div className="flex-1 overflow-y-auto space-y-2 max-h-64 lg:max-h-80">
                          {(() => {
                            const dadosComValor = dadosGraficos.proventosPorMes.filter(item => item.valor > 0);
                            const totalValor = dadosComValor.reduce((sum, item) => sum + item.valor, 0);
                            
                            const cores = [
                              '#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', 
                              '#EF4444', '#06B6D4', '#84CC16', '#F97316',
                              '#EC4899', '#6366F1', '#14B8A6', '#F43F5E'
                            ];
                            
                            return dadosComValor
                              .sort((a, b) => b.valor - a.valor)
                              .map((item, index) => {
                                const percentage = totalValor > 0 ? (item.valor / totalValor) * 100 : 0;
                                const originalIndex = dadosComValor.findIndex(d => d.mesFormatado === item.mesFormatado);
                                
                                return (
                                  <div key={item.mesFormatado} className="flex items-center justify-between group hover:bg-gray-700/50 rounded-lg p-2 sm:p-3 transition-colors cursor-pointer border border-gray-600/30">
                                    <div className="flex items-center space-x-2 sm:space-x-3">
                                      <div 
                                        className="w-3 h-3 sm:w-4 sm:h-4 rounded-full flex-shrink-0 border border-gray-600"
                                        style={{ backgroundColor: cores[originalIndex % cores.length] }}
                                      ></div>
                                      <div className="flex flex-col">
                                        <span className="text-xs sm:text-sm font-medium text-white">
                                          {item.mesFormatado}
                                        </span>
                                        <span className="text-xs text-gray-400">
                                          {percentage.toFixed(1)}% do total
                                        </span>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-xs sm:text-sm font-bold text-emerald-400">
                                        R$ {item.valor.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                                      </div>
                                    </div>
                                  </div>
                                );
                              });
                          })()}
                        </div>
                        
                        {/* Resumo da legenda */}
                        <div className="mt-4 pt-4 border-t border-gray-600 bg-gray-700/50 rounded-lg p-2 sm:p-3 flex-shrink-0">
                          <h5 className="text-xs sm:text-sm font-medium text-gray-300 mb-2">📊 Resumo</h5>
                          <div className="text-xs sm:text-sm text-gray-400 space-y-1 sm:space-y-2">
                            <div className="flex justify-between">
                              <span>Meses ativos:</span>
                              <span className="text-emerald-400 font-medium">
                                {dadosGraficos.proventosPorMes.filter(item => item.valor > 0).length} / 12
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Média mensal:</span>
                              <span className="text-emerald-400 font-medium">
                                R$ {(dadosGraficos.proventosPorMes
                                  .reduce((sum, item) => sum + item.valor, 0) / 12)
                                  .toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Melhor mês:</span>
                              <span className="text-emerald-400 font-medium">
                                {(() => {
                                  const melhorMes = dadosGraficos.proventosPorMes.reduce((max, item) => 
                                    item.valor > max.valor ? item : max
                                  );
                                  return melhorMes.valor > 0 ? melhorMes.mesFormatado : 'N/A';
                                })()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center text-gray-400">
                        <PieChart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium">Nenhum provento recebido</p>
                        <p className="text-sm mt-2">
                          Os proventos recebidos aparecerão neste gráfico quando forem lançados
                        </p>
                        <button
                          onClick={() => setActiveTab('proventos')}
                          className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm transition-colors"
                        >
                          Lançar Proventos →
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Resumo do gráfico */}
                {dadosGraficos.proventosPorMes.some(item => item.valor > 0) && (
                  <div className="mt-4 pt-4 border-t border-gray-700 bg-gray-750 rounded-lg">
                    <div className="p-4">
                      <h4 className="text-sm font-medium text-gray-300 mb-3">📊 Estatísticas dos Últimos 12 Meses</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        <div className="bg-gray-700 rounded-lg p-3 text-center">
                          <div className="text-xs text-gray-400 mb-1">Total Recebido</div>
                          <div className="text-lg font-bold text-green-400">
                            R$ {dadosGraficos.proventosPorMes
                              .reduce((sum, item) => sum + item.valor, 0)
                              .toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                          </div>
                        </div>
                        
                        <div className="bg-gray-700 rounded-lg p-3 text-center">
                          <div className="text-xs text-gray-400 mb-1">Melhor Mês</div>
                          <div className="text-sm font-bold text-green-400">
                            {(() => {
                              const melhorMes = dadosGraficos.proventosPorMes.reduce((max, item) => 
                                item.valor > max.valor ? item : max
                              );
                              return melhorMes.valor > 0 ? melhorMes.mesFormatado : 'N/A';
                            })()}
                          </div>
                          <div className="text-xs text-green-300">
                            R$ {Math.max(...dadosGraficos.proventosPorMes.map(i => i.valor))
                              .toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                          </div>
                        </div>
                        
                        <div className="bg-gray-700 rounded-lg p-3 text-center">
                          <div className="text-xs text-gray-400 mb-1">Média Mensal</div>
                          <div className="text-lg font-bold text-green-400">
                            R$ {(dadosGraficos.proventosPorMes
                              .reduce((sum, item) => sum + item.valor, 0) / 12)
                              .toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                          </div>
                        </div>
                        
                        <div className="bg-gray-700 rounded-lg p-3 text-center">
                          <div className="text-xs text-gray-400 mb-1">Meses com Proventos</div>
                          <div className="text-lg font-bold text-green-400">
                            {dadosGraficos.proventosPorMes.filter(item => item.valor > 0).length}
                          </div>
                          <div className="text-xs text-green-300">de 12 meses</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Distribuição de Ativos */}
              <div className="bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-700">
                <h3 className="text-base sm:text-lg font-semibold text-white mb-4">Distribuição de Ativos</h3>
                <div className="space-y-3">
                  {dadosGraficos.distribuicaoAtivos.length > 0 ? (
                    dadosGraficos.distribuicaoAtivos.map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 sm:space-x-3">
                          <div 
                            className="w-3 h-3 sm:w-4 sm:h-4 rounded-full flex-shrink-0"
                            style={{ backgroundColor: `hsl(${index * 60}, 70%, 50%)` }}
                          ></div>
                          <span className="text-sm font-medium text-white">{item.ativo}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-semibold text-white">{item.porcentagem}%</span>
                          <div className="text-xs text-gray-400">
                            R$ {item.valorInvestido.toLocaleString('pt-BR', {minimumFractionDigits: 0, maximumFractionDigits: 0})}
                          </div>
                          <div className="text-xs text-gray-500">{item.quantidade.toLocaleString('pt-BR', {maximumFractionDigits: 0})} cotas</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-400 py-8">
                      <PieChart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhum ativo cadastrado ainda</p>
                    </div>
                  )}
                </div>
              </div>
            </div>



            {/* Histórico de Ativos */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-gray-700">
                <h3 className="text-base sm:text-lg font-semibold text-white flex items-center">
                  <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-400" />
                  Histórico de Ativos
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-300">Data</th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-300 hidden sm:table-cell">Tipo</th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-300">Ativo</th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-300">Op.</th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-300 hidden md:table-cell">Qtd</th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-300 hidden md:table-cell">Preço</th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-300">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {[...compras.map(item => ({...item, tipo_operacao: 'compra'})), ...vendas.map(item => ({...item, tipo_operacao: 'venda'}))]
                      .sort((a, b) => new Date(b.data) - new Date(a.data))
                      .slice(0, 10)
                      .map((item) => (
                      <tr key={`${item.tipo_operacao}-${item.id}`} className="hover:bg-gray-700 transition-colors">
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-300">
                          {new Date(item.data + 'T12:00:00').toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-300 hidden sm:table-cell">
                          <span className="hidden lg:inline">
                            {tiposAtivos.find(t => t.value === item.tipo_ativo)?.label || item.tipo_ativo}
                          </span>
                          <span className="lg:hidden">
                            {(tiposAtivos.find(t => t.value === item.tipo_ativo)?.label || item.tipo_ativo).split(' ')[0]}
                          </span>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-white font-medium">
                          {item.ativo}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            item.tipo_operacao === 'compra' 
                              ? 'bg-green-600 text-green-100' 
                              : 'bg-blue-600 text-blue-100'
                          }`}>
                            <span className="hidden sm:inline">
                              {item.tipo_operacao === 'compra' ? 'Compra' : 'Venda'}
                            </span>
                            <span className="sm:hidden">
                              {item.tipo_operacao === 'compra' ? 'C' : 'V'}
                            </span>
                          </span>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-300 hidden md:table-cell">
                          {item.quantidade}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-300 hidden md:table-cell">
                          R$ {item.preco.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium text-white">
                          <div className="md:hidden text-xs text-gray-400 mb-1">
                            {item.quantidade} × R$ {item.preco.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                          </div>
                          R$ {item.valor_total.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {[...compras, ...vendas].length === 0 && (
                  <div className="p-8 text-center text-gray-400">
                    <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma transação com ativos registrada ainda.</p>
                    <p className="text-sm mt-2">
                      <button
                        onClick={() => setActiveTab('compra')}
                        className="text-green-400 hover:text-green-300 transition-colors mr-2"
                      >
                        Adicionar compra →
                      </button>
                      <button
                        onClick={() => setActiveTab('venda')}
                        className="text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        Adicionar venda →
                      </button>
                    </p>
                  </div>
                )}
                
                {[...compras, ...vendas].length > 10 && (
                  <div className="p-4 border-t border-gray-700 text-center">
                    <p className="text-sm text-gray-400">
                      Mostrando as 10 transações mais recentes de {[...compras, ...vendas].length} total
                    </p>
                    <div className="mt-2 space-x-4">
                      <button
                        onClick={() => setActiveTab('compra')}
                        className="text-sm text-green-400 hover:text-green-300 transition-colors"
                      >
                        Ver todas as compras →
                      </button>
                      <button
                        onClick={() => setActiveTab('venda')}
                        className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        Ver todas as vendas →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>



            {/* Proventos por Ativo */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
              <div className="p-6 border-b border-gray-700">
                <h3 className="text-lg font-semibold text-white flex items-center">
                  <Gift className="w-5 h-5 mr-2 text-emerald-400" />
                  Proventos por Ativo
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-300">Ativo</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-300">Total Recebido</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-300">A Receber</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-300">Total Geral</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-300">Operações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {proventosPorAtivo.map((item, index) => (
                      <tr key={item.ativo} className="hover:bg-gray-700 transition-colors">
                        <td className="px-6 py-4 text-sm text-white font-medium">
                          {item.ativo}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-green-400">
                          R$ {item.totalRecebido.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-orange-400">
                          R$ {item.totalAReceber.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-emerald-400">
                          R$ {item.totalGeral.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-300">
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-600 text-purple-100">
                            {item.quantidadeOperacoes}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {proventosPorAtivo.length === 0 && (
                  <div className="p-8 text-center text-gray-400">
                    <Gift className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum provento registrado ainda.</p>
                    <p className="text-sm mt-2">
                      <button
                        onClick={() => setActiveTab('proventos')}
                        className="text-emerald-400 hover:text-emerald-300 transition-colors"
                      >
                        Clique aqui para adicionar proventos →
                      </button>
                    </p>
                  </div>
                )}
              </div>

              {/* Resumo dos Proventos por Ativo */}
              {proventosPorAtivo.length > 0 && (
                <div className="p-6 border-t border-gray-700 bg-gray-750">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-300">Ativos com Proventos</span>
                        <span className="text-lg font-bold text-emerald-400">
                          {proventosPorAtivo.length}
                        </span>
                      </div>
                    </div>
                    
                    <div className="bg-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-300">Maior Pagador</span>
                        <span className="text-lg font-bold text-emerald-400">
                          {proventosPorAtivo.length > 0 ? proventosPorAtivo[0].ativo : 'N/A'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="bg-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-300">Maior Valor</span>
                        <span className="text-lg font-bold text-emerald-400">
                          R$ {proventosPorAtivo.length > 0 
                            ? proventosPorAtivo[0].totalGeral.toLocaleString('pt-BR', {minimumFractionDigits: 2})
                            : '0,00'
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Derivativos por Ativo Subjacente */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
              <div className="p-6 border-b border-gray-700">
                <h3 className="text-lg font-semibold text-white flex items-center">
                  <Target className="w-5 h-5 mr-2 text-orange-400" />
                  Derivativos por Ativo Subjacente
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-300">Ativo Subjacente</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-300">Total Compras</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-300">Total Vendas</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-300">Volume Total</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-300">CALLs</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-300">PUTs</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-300">Operações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {derivativosPorAtivo.map((item, index) => (
                      <tr key={item.ativo} className="hover:bg-gray-700 transition-colors">
                        <td className="px-6 py-4 text-sm text-white font-medium">
                          {item.ativo}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-blue-400">
                          R$ {item.totalCompras.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-purple-400">
                          R$ {item.totalVendas.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-orange-400">
                          R$ {item.totalGeral.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-300">
                          <div className="flex flex-col text-xs">
                            <span className="text-blue-300">
                              C: R$ {item.opcoes.calls.compras.toLocaleString('pt-BR', {minimumFractionDigits: 0})}
                            </span>
                            <span className="text-purple-300">
                              V: R$ {item.opcoes.calls.vendas.toLocaleString('pt-BR', {minimumFractionDigits: 0})}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-300">
                          <div className="flex flex-col text-xs">
                            <span className="text-blue-300">
                              C: R$ {item.opcoes.puts.compras.toLocaleString('pt-BR', {minimumFractionDigits: 0})}
                            </span>
                            <span className="text-purple-300">
                              V: R$ {item.opcoes.puts.vendas.toLocaleString('pt-BR', {minimumFractionDigits: 0})}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-300">
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-600 text-orange-100">
                            {item.quantidadeOperacoes}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {derivativosPorAtivo.length === 0 && (
                  <div className="p-8 text-center text-gray-400">
                    <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma operação com derivativos registrada ainda.</p>
                    <p className="text-sm mt-2">
                      <button
                        onClick={() => setActiveTab('derivativos')}
                        className="text-orange-400 hover:text-orange-300 transition-colors"
                      >
                        Clique aqui para adicionar derivativos →
                      </button>
                    </p>
                  </div>
                )}
              </div>

              {/* Resumo dos Derivativos por Ativo */}
              {derivativosPorAtivo.length > 0 && (
                <div className="p-6 border-t border-gray-700 bg-gray-750">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-300">Ativos Operados</span>
                        <span className="text-lg font-bold text-orange-400">
                          {derivativosPorAtivo.length}
                        </span>
                      </div>
                    </div>
                    
                    <div className="bg-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-300">Maior Volume</span>
                        <span className="text-lg font-bold text-orange-400">
                          {derivativosPorAtivo.length > 0 ? derivativosPorAtivo[0].ativo : 'N/A'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="bg-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-300">Volume Total</span>
                        <span className="text-lg font-bold text-orange-400">
                          R$ {derivativosPorAtivo
                            .reduce((sum, item) => sum + item.totalGeral, 0)
                            .toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                        </span>
                      </div>
                    </div>
                    
                    <div className="bg-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-300">Total Operações</span>
                        <span className="text-lg font-bold text-orange-400">
                          {derivativosPorAtivo.reduce((sum, item) => sum + item.quantidadeOperacoes, 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

        {/* Lançamento de Proventos */}
        {activeTab === 'proventos' && (
          <div className="space-y-8">
            {/* Form */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
              <div className="p-6 border-b border-gray-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white flex items-center">
                    <Gift className="w-6 h-6 mr-2" />
                    {editingProventoId ? 'Editar Provento' : 'Lançamento de Proventos'}
                  </h2>
                  {editingProventoId && (
                    <button
                      onClick={handleCancelEditProvento}
                      className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors flex items-center space-x-2"
                    >
                      <X className="w-4 h-4" />
                      <span>Cancelar</span>
                    </button>
                  )}
                </div>
              </div>
              
              <div className="p-4 sm:p-6 lg:p-8">
                <form onSubmit={handleProventoSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Tipo de Provento */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        <Tag className="w-4 h-4 inline mr-2" />
                        Tipo de Provento *
                      </label>
                      <select
                        value={proventoData.tipo_provento}
                        onChange={(e) => setProventoData({...proventoData, tipo_provento: e.target.value})}
                        className={`w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-700 border rounded-lg focus:outline-none focus:ring-2 transition-colors text-sm sm:text-base ${
                          proventoErrors.tipo_provento
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-gray-600 focus:ring-purple-500'
                        }`}
                      >
                        <option value="">Selecione o tipo de provento</option>
                        {tiposProventos.map(tipo => (
                          <option key={tipo.value} value={tipo.value}>
                            {tipo.label}
                          </option>
                        ))}
                      </select>
                      {proventoErrors.tipo_provento && (
                        <p className="mt-1 text-sm text-red-400">{proventoErrors.tipo_provento}</p>
                      )}
                    </div>

                    {/* Ativo */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        <BarChart3 className="w-4 h-4 inline mr-2" />
                        Ativo *
                      </label>
                      <select
                        value={proventoData.ativo}
                        onChange={(e) => setProventoData({...proventoData, ativo: e.target.value})}
                        className={`w-full px-4 py-3 bg-gray-700 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                          proventoErrors.ativo
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-gray-600 focus:ring-purple-500'
                        }`}
                      >
                        <option value="">Selecione o ativo</option>
                        {ativosUnicos.map(ativo => (
                          <option key={ativo} value={ativo}>{ativo}</option>
                        ))}
                      </select>
                      {proventoErrors.ativo && (
                        <p className="mt-1 text-sm text-red-400">{proventoErrors.ativo}</p>
                      )}
                    </div>

                    {/* Data */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        <Calendar className="w-4 h-4 inline mr-2" />
                        Data do Recebimento *
                      </label>
                      <input
                        type="date"
                        value={proventoData.data}
                        onChange={(e) => setProventoData({...proventoData, data: e.target.value})}
                        className={`w-full px-4 py-3 bg-gray-700 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                          proventoErrors.data
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-gray-600 focus:ring-purple-500'
                        }`}
                      />
                      {proventoErrors.data && (
                        <p className="mt-1 text-sm text-red-400">{proventoErrors.data}</p>
                      )}
                    </div>

                    {/* Valor */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        <DollarSign className="w-4 h-4 inline mr-2" />
                        Valor (R$) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={proventoData.valor}
                        onChange={(e) => setProventoData({...proventoData, valor: e.target.value})}
                        placeholder="Ex: 50.00"
                        className={`w-full px-4 py-3 bg-gray-700 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                          proventoErrors.valor
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-gray-600 focus:ring-purple-500'
                        }`}
                      />
                      {proventoErrors.valor && (
                        <p className="mt-1 text-sm text-red-400">{proventoErrors.valor}</p>
                      )}
                    </div>

                    {/* Quantidade */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        <Hash className="w-4 h-4 inline mr-2" />
                        Quantidade de Cotas/Ações
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={proventoData.quantidade}
                        onChange={(e) => setProventoData({...proventoData, quantidade: e.target.value})}
                        placeholder="Ex: 100"
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
                      />
                    </div>

                    {/* A Receber */}
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="a_receber"
                        checked={proventoData.a_receber}
                        onChange={(e) => setProventoData({...proventoData, a_receber: e.target.checked})}
                        className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
                      />
                      <label htmlFor="a_receber" className="text-sm font-medium text-gray-300">
                        <Receipt className="w-4 h-4 inline mr-2" />
                        Provento a receber
                      </label>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full py-4 px-6 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 bg-purple-600 hover:bg-purple-700 focus:ring-purple-500 ${
                      isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                    } focus:outline-none focus:ring-2`}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Processando...</span>
                      </>
                    ) : (
                      <>
                        {editingProventoId ? <Save className="w-5 h-5" /> : <PlusCircle className="w-5 h-5" />}
                        <span>{editingProventoId ? 'Salvar Alterações' : 'Adicionar Provento'}</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* Histórico de Operações com Proventos */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
              <div className="p-6 border-b border-gray-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white flex items-center">
                    <Gift className="w-6 h-6 mr-2 text-purple-400" />
                    Histórico de Operações com Proventos
                  </h2>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Filter className="w-4 h-4 text-gray-400" />
                      <select
                        value={filters.tipo_provento}
                        onChange={(e) => setFilters({...filters, tipo_provento: e.target.value})}
                        className="px-3 py-1 bg-gray-700 border border-gray-600 rounded text-sm"
                      >
                        <option value="">Todos os tipos</option>
                        {tiposProventos.map(tipo => (
                          <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
                        ))}
                      </select>
                    </div>
                    <select
                      value={filters.ativo}
                      onChange={(e) => setFilters({...filters, ativo: e.target.value})}
                      className="px-3 py-1 bg-gray-700 border border-gray-600 rounded text-sm"
                    >
                      <option value="">Todos os ativos</option>
                      {ativosUnicos.map(ativo => (
                        <option key={ativo} value={ativo}>{ativo}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      value={filters.ano}
                      onChange={(e) => setFilters({...filters, ano: parseInt(e.target.value)})}
                      className="px-3 py-1 bg-gray-700 border border-gray-600 rounded text-sm w-20"
                      min="2020"
                      max="2030"
                    />
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-300">Data</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-300">Tipo</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-300">Ativo</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-300">Quantidade</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-300">Valor</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-300">Status</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-300">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {proventosFiltrados.map((provento) => (
                      <tr key={provento.id} className="hover:bg-gray-700 transition-colors">
                        <td className="px-6 py-4 text-sm text-gray-300">
                          {new Date(provento.data + 'T12:00:00').toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-600 text-purple-100">
                            {tiposProventos.find(t => t.value === provento.tipo_provento)?.label || provento.tipo_provento}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-white font-medium">
                          {provento.ativo}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-300">
                          {provento.quantidade || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-emerald-400">
                          <div className="flex flex-col">
                            <span>R$ {(provento.valor * (provento.quantidade || 1)).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                            {provento.quantidade && provento.quantidade > 1 && (
                              <span className="text-xs text-gray-400">
                                R$ {provento.valor.toLocaleString('pt-BR', {minimumFractionDigits: 2})} × {provento.quantidade}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            provento.a_receber ? 'bg-orange-600 text-orange-100' : 'bg-green-600 text-green-100'
                          }`}>
                            {provento.a_receber ? 'A Receber' : 'Recebido'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleEditProvento(provento)}
                              className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 rounded transition-colors"
                              title="Editar"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteProvento(provento.id)}
                              className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded transition-colors"
                              title="Excluir"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {proventosFiltrados.length === 0 && (
                  <div className="p-8 text-center text-gray-400">
                    <Gift className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum provento encontrado com os filtros aplicados.</p>
                    <p className="text-sm mt-2">
                      Adicione seu primeiro provento usando o formulário acima.
                    </p>
                  </div>
                )}
              </div>

              {/* Resumo dos Proventos */}
              {proventosFiltrados.length > 0 && (
                <div className="p-6 border-t border-gray-700 bg-gray-750">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-300">Total Recebido</span>
                        <span className="text-lg font-bold text-green-400">
                          R$ {proventosFiltrados
                            .filter(p => !p.a_receber)
                            .reduce((sum, p) => sum + (p.valor * (p.quantidade || 1)), 0)
                            .toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                        </span>
                      </div>
                    </div>
                    
                    <div className="bg-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-300">A Receber</span>
                        <span className="text-lg font-bold text-orange-400">
                          R$ {proventosFiltrados
                            .filter(p => p.a_receber)
                            .reduce((sum, p) => sum + (p.valor * (p.quantidade || 1)), 0)
                            .toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                        </span>
                      </div>
                    </div>
                    
                    <div className="bg-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-300">Total de Operações</span>
                        <span className="text-lg font-bold text-purple-400">
                          {proventosFiltrados.length}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Lançamento de Derivativos */}
        {activeTab === 'derivativos' && (
          <div className="space-y-8">
            {/* Form */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
              <div className="p-6 border-b border-gray-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white flex items-center">
                    <Target className="w-6 h-6 mr-2 text-orange-400" />
                    {editingDerivativoId ? 'Editar Operação' : 'Derivativos - Opções de Compra e Venda'}
                  </h2>
                  {editingDerivativoId && (
                    <button
                      onClick={handleCancelEditDerivativo}
                      className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors flex items-center space-x-2"
                    >
                      <X className="w-4 h-4" />
                      <span>Cancelar</span>
                    </button>
                  )}
                </div>
              </div>
              
              <div className="p-8">
                <form onSubmit={handleDerivativoSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Tipo de Operação */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        <Activity className="w-4 h-4 inline mr-2" />
                        Tipo de Operação *
                      </label>
                      <select
                        value={derivativoData.tipo_operacao}
                        onChange={(e) => setDerivativoData({...derivativoData, tipo_operacao: e.target.value})}
                        className={`w-full px-4 py-3 bg-gray-700 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                          derivativoErrors.tipo_operacao
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-gray-600 focus:ring-orange-500'
                        }`}
                      >
                        <option value="">Selecione o tipo de operação</option>
                        {tiposOperacoes.map(tipo => (
                          <option key={tipo.value} value={tipo.value}>
                            {tipo.label}
                          </option>
                        ))}
                      </select>
                      {derivativoErrors.tipo_operacao && (
                        <p className="mt-1 text-sm text-red-400">{derivativoErrors.tipo_operacao}</p>
                      )}
                    </div>

                    {/* Tipo de Derivativo */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        <Target className="w-4 h-4 inline mr-2" />
                        Tipo de Derivativo *
                      </label>
                      <select
                        value={derivativoData.tipo_derivativo}
                        onChange={(e) => setDerivativoData({...derivativoData, tipo_derivativo: e.target.value})}
                        className={`w-full px-4 py-3 bg-gray-700 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                          derivativoErrors.tipo_derivativo
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-gray-600 focus:ring-orange-500'
                        }`}
                      >
                        <option value="">Selecione o tipo de derivativo</option>
                        {tiposDerivativo.map(tipo => (
                          <option key={tipo.value} value={tipo.value}>
                            {tipo.label}
                          </option>
                        ))}
                      </select>
                      {derivativoErrors.tipo_derivativo && (
                        <p className="mt-1 text-sm text-red-400">{derivativoErrors.tipo_derivativo}</p>
                      )}
                    </div>

                    {/* Ativo Subjacente */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        <BarChart3 className="w-4 h-4 inline mr-2" />
                        Ativo Subjacente *
                      </label>
                      <select
                        value={derivativoData.ativo_subjacente}
                        onChange={(e) => setDerivativoData({...derivativoData, ativo_subjacente: e.target.value})}
                        className={`w-full px-4 py-3 bg-gray-700 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                          derivativoErrors.ativo_subjacente
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-gray-600 focus:ring-orange-500'
                        }`}
                      >
                        <option value="">Selecione o ativo subjacente</option>
                        {ativosUnicos.map(ativo => (
                          <option key={ativo} value={ativo}>{ativo}</option>
                        ))}
                        {/* Adicionar ativos predefinidos de ações */}
                        {ativosPorTipo.acoes.map(ativo => (
                          <option key={ativo} value={ativo}>{ativo}</option>
                        ))}
                      </select>
                      {derivativoErrors.ativo_subjacente && (
                        <p className="mt-1 text-sm text-red-400">{derivativoErrors.ativo_subjacente}</p>
                      )}
                    </div>

                    {/* Código da Opção */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        <Tag className="w-4 h-4 inline mr-2" />
                        Código da Opção *
                      </label>
                      <input
                        type="text"
                        value={derivativoData.codigo_opcao}
                        onChange={(e) => setDerivativoData({...derivativoData, codigo_opcao: e.target.value.toUpperCase()})}
                        placeholder="Ex: PETRA25"
                        className={`w-full px-4 py-3 bg-gray-700 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                          derivativoErrors.codigo_opcao
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-gray-600 focus:ring-orange-500'
                        }`}
                      />
                      {derivativoErrors.codigo_opcao && (
                        <p className="mt-1 text-sm text-red-400">{derivativoErrors.codigo_opcao}</p>
                      )}
                    </div>

                    {/* Strike */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        <DollarSign className="w-4 h-4 inline mr-2" />
                        Strike (Preço de Exercício) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={derivativoData.strike}
                        onChange={(e) => setDerivativoData({...derivativoData, strike: e.target.value})}
                        placeholder="Ex: 25.00"
                        className={`w-full px-4 py-3 bg-gray-700 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                          derivativoErrors.strike
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-gray-600 focus:ring-orange-500'
                        }`}
                      />
                      {derivativoErrors.strike && (
                        <p className="mt-1 text-sm text-red-400">{derivativoErrors.strike}</p>
                      )}
                    </div>

                    {/* Data */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        <Calendar className="w-4 h-4 inline mr-2" />
                        Data da Operação *
                      </label>
                      <input
                        type="date"
                        value={derivativoData.data}
                        onChange={(e) => setDerivativoData({...derivativoData, data: e.target.value})}
                        className={`w-full px-4 py-3 bg-gray-700 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                          derivativoErrors.data
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-gray-600 focus:ring-orange-500'
                        }`}
                      />
                      {derivativoErrors.data && (
                        <p className="mt-1 text-sm text-red-400">{derivativoErrors.data}</p>
                      )}
                    </div>

                    {/* Quantidade */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        <Hash className="w-4 h-4 inline mr-2" />
                        Quantidade de Contratos *
                      </label>
                      <input
                        type="number"
                        step="1"
                        min="1"
                        value={derivativoData.quantidade}
                        onChange={(e) => setDerivativoData({...derivativoData, quantidade: e.target.value})}
                        placeholder="Ex: 10"
                        className={`w-full px-4 py-3 bg-gray-700 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                          derivativoErrors.quantidade
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-gray-600 focus:ring-orange-500'
                        }`}
                      />
                      {derivativoErrors.quantidade && (
                        <p className="mt-1 text-sm text-red-400">{derivativoErrors.quantidade}</p>
                      )}
                    </div>

                    {/* Preço por Contrato */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        <DollarSign className="w-4 h-4 inline mr-2" />
                        Preço por Contrato (R$) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={derivativoData.preco}
                        onChange={(e) => setDerivativoData({...derivativoData, preco: e.target.value})}
                        placeholder="Ex: 2.50"
                        className={`w-full px-4 py-3 bg-gray-700 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                          derivativoErrors.preco
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-gray-600 focus:ring-orange-500'
                        }`}
                      />
                      {derivativoErrors.preco && (
                        <p className="mt-1 text-sm text-red-400">{derivativoErrors.preco}</p>
                      )}
                    </div>

                    {/* Outros Custos */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        <div className="flex items-center">
                          <DollarSign className="w-4 h-4 inline mr-2" />
                          Outros Custos (R$)
                          <div className="relative ml-2">
                            <Info className="w-4 h-4 text-gray-400 cursor-help" />
                            <div className="absolute bottom-6 left-0 w-64 p-2 bg-gray-700 rounded-lg text-xs text-gray-300 opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
                              Taxas de corretagem, impostos, emolumentos, etc.
                            </div>
                          </div>
                        </div>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={derivativoData.outros_custos}
                        onChange={(e) => setDerivativoData({...derivativoData, outros_custos: e.target.value})}
                        placeholder="Ex: 5.00"
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors"
                      />
                    </div>

                    {/* Status */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        <Info className="w-4 h-4 inline mr-2" />
                        Status da Opção
                      </label>
                      <select
                        value={derivativoData.status}
                        onChange={(e) => setDerivativoData({...derivativoData, status: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors"
                      >
                        {statusOpcoes.map(status => (
                          <option key={status.value} value={status.value}>
                            {status.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Valor Total */}
                  <div className="bg-gray-700 rounded-lg p-6 border border-gray-600">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-medium text-gray-300">
                        Valor Total da Operação:
                      </span>
                      <span className="text-2xl font-bold text-orange-400">
                        R$ {calcularValorTotalDerivativo().toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                      </span>
                    </div>
                    {derivativoData.quantidade && derivativoData.preco && (
                      <div className="mt-2 text-sm text-gray-400">
                        {derivativoData.quantidade} contratos × R$ {parseFloat(derivativoData.preco).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                        {derivativoData.outros_custos && parseFloat(derivativoData.outros_custos) > 0 && (
                          <span> + R$ {parseFloat(derivativoData.outros_custos).toLocaleString('pt-BR', {minimumFractionDigits: 2})} (outros custos)</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full py-4 px-6 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 bg-orange-600 hover:bg-orange-700 focus:ring-orange-500 ${
                      isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                    } focus:outline-none focus:ring-2`}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Processando...</span>
                      </>
                    ) : (
                      <>
                        {editingDerivativoId ? <Save className="w-5 h-5" /> : <PlusCircle className="w-5 h-5" />}
                        <span>{editingDerivativoId ? 'Salvar Alterações' : 'Adicionar Operação'}</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* Lista de Operações */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
              <div className="p-6 border-b border-gray-700">
                <h2 className="text-xl font-bold text-white">
                  Histórico de Operações com Derivativos
                </h2>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-300">Data</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-300">Tipo</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-300">Operação</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-300">Ativo Subjacente</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-300">Código</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-300">Strike</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-300">Qtd</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-300">Preço</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-300">Status</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-300">Total</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-300">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {derivativos.map((derivativo) => (
                      <tr key={derivativo.id} className="hover:bg-gray-700 transition-colors">
                        <td className="px-6 py-4 text-sm text-gray-300">
                          {new Date(derivativo.data + 'T12:00:00').toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            derivativo.tipo_derivativo === 'call' 
                              ? 'bg-green-600 text-green-100' 
                              : 'bg-red-600 text-red-100'
                          }`}>
                            {derivativo.tipo_derivativo.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            derivativo.tipo_operacao === 'compra' 
                              ? 'bg-blue-600 text-blue-100' 
                              : 'bg-purple-600 text-purple-100'
                          }`}>
                            {derivativo.tipo_operacao.charAt(0).toUpperCase() + derivativo.tipo_operacao.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-white font-medium">
                          {derivativo.ativo_subjacente}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-300">
                          {derivativo.codigo_opcao}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-300">
                          <span className="font-medium text-yellow-400">
                            R$ {(derivativo.strike || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-300">
                          {derivativo.quantidade}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-300">
                          R$ {derivativo.preco.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            derivativo.status === 'aberta' 
                              ? 'bg-yellow-600 text-yellow-100' 
                              : derivativo.status === 'exercida'
                              ? 'bg-green-600 text-green-100'
                              : 'bg-gray-600 text-gray-100'
                          }`}>
                            {statusOpcoes.find(s => s.value === derivativo.status)?.label || derivativo.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-white">
                          R$ {derivativo.valor_total.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex items-center space-x-2">
                            <a
                              href={`https://opcoes.net.br/${derivativo.codigo_opcao}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-purple-400 hover:text-purple-300 hover:bg-purple-900/20 rounded transition-colors"
                              title={`Ver ${derivativo.codigo_opcao} no Opções.net.br`}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>
                            <button
                              onClick={() => handleEditDerivativo(derivativo)}
                              className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 rounded transition-colors"
                              title="Editar"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteDerivativo(derivativo.id)}
                              className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded transition-colors"
                              title="Excluir"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {derivativos.length === 0 && (
                  <div className="p-8 text-center text-gray-400">
                    <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma operação com derivativos registrada ainda.</p>
                    <p className="text-sm mt-2">
                      Adicione sua primeira operação usando o formulário acima.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Página de Carteira */}
        {activeTab === 'carteira' && (
          <div className="space-y-8">
            {/* Header da Carteira */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
              <div className="p-6 border-b border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-white flex items-center">
                      <PieChart className="w-6 h-6 mr-2 text-indigo-400" />
                      Ativos (Carteira)
                    </h2>
                    <p className="text-gray-400 mt-2">
                      Visão consolidada de todos os ativos com cálculo automático de lucros/prejuízos
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={updateStockPricesFromAPI}
                      disabled={isUpdatingPrices}
                      className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all duration-300 transform hover:scale-105 flex items-center space-x-2 shadow-lg"
                    >
                      {isUpdatingPrices ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      ) : (
                        <Activity className="w-5 h-5" />
                      )}
                      <span>{isUpdatingPrices ? 'Atualizando...' : 'Atualizar Cotações'}</span>
                    </button>
                    
                    <a
                      href="https://tekinf2025.github.io/brazilian_stock_tracker/pages/stock_market_dashboard.html"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg transition-all duration-300 transform hover:scale-105 flex items-center space-x-2 shadow-lg"
                    >
                      <BarChart3 className="w-5 h-5" />
                      <span>Dashboard B3</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>

              {/* Status de Atualização */}
              {priceUpdateMessage && (
                <div className="p-4 bg-blue-900/20 border-b border-gray-700">
                  <div className="flex items-center space-x-2">
                    <span className="text-blue-400 font-medium">{priceUpdateMessage}</span>
                  </div>
                </div>
              )}

              {/* Informações da Última Atualização */}
              <div className="p-4 bg-gray-750 border-b border-gray-700">
                <div className="flex items-center justify-between text-sm text-gray-400">
                  <div className="flex items-center space-x-4">
                    <span>📡 Última atualização: <strong className="text-gray-300">{formatLastUpdateTime()}</strong></span>
                    <span>|</span>
                    <span>🏛️ Fonte: <strong className="text-gray-300">brapi.dev (B3)</strong></span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={autoUpdateEnabled}
                        onChange={(e) => setAutoUpdateEnabled(e.target.checked)}
                        className="w-4 h-4 text-green-600 bg-gray-700 border-gray-600 rounded focus:ring-green-500"
                      />
                      <span className="text-gray-300">Auto-atualizar na Carteira (5min)</span>
                    </label>
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${autoUpdateEnabled ? 'bg-green-400' : 'bg-gray-500'}`}></div>
                      <span>API {autoUpdateEnabled ? 'Ativa' : 'Parada'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Filtros */}
              <div className="p-6 bg-gray-750 border-b border-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Busca por Ativo */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Buscar Ativo
                    </label>
                    <input
                      type="text"
                      value={carteiraFilters.busca}
                      onChange={(e) => setCarteiraFilters({...carteiraFilters, busca: e.target.value})}
                      placeholder="Ex: PETR4, BBDC4..."
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Filtro por Tipo */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Tipo de Ativo
                    </label>
                    <select
                      value={carteiraFilters.tipo_ativo}
                      onChange={(e) => setCarteiraFilters({...carteiraFilters, tipo_ativo: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Todos os tipos</option>
                      {tiposAtivos.map(tipo => (
                        <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Filtro por Período */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Período
                    </label>
                    <select
                      value={carteiraFilters.periodo}
                      onChange={(e) => setCarteiraFilters({...carteiraFilters, periodo: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Todos os períodos</option>
                      <option value="30dias">Últimos 30 dias</option>
                      <option value="6meses">Últimos 6 meses</option>
                      <option value="ano">Ano atual</option>
                    </select>
                  </div>

                  {/* Botão Limpar Filtros */}
                  <div className="flex items-end">
                    <button
                      onClick={() => setCarteiraFilters({ tipo_ativo: '', periodo: '', busca: '' })}
                      className="w-full px-3 sm:px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded text-xs sm:text-sm transition-colors"
                    >
                      Limpar Filtros
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabela da Carteira */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-700">
                    <tr>
                      <th 
                        className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-300 cursor-pointer hover:bg-gray-600 transition-colors"
                        onClick={() => handleSort('ativo')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Ativo</span>
                          {getSortIcon('ativo')}
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-sm font-medium text-gray-300 cursor-pointer hover:bg-gray-600 transition-colors"
                        onClick={() => handleSort('tipo_ativo')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Tipo</span>
                          {getSortIcon('tipo_ativo')}
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-sm font-medium text-gray-300 cursor-pointer hover:bg-gray-600 transition-colors"
                        onClick={() => handleSort('quantidadeTotal')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Qtd. Total</span>
                          {getSortIcon('quantidadeTotal')}
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-sm font-medium text-gray-300 cursor-pointer hover:bg-gray-600 transition-colors"
                        onClick={() => handleSort('precoMedio')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Preço Médio (R$)</span>
                          {getSortIcon('precoMedio')}
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-sm font-medium text-gray-300 cursor-pointer hover:bg-gray-600 transition-colors"
                        onClick={() => handleSort('valorAtual')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Valor Atual (R$)</span>
                          {getSortIcon('valorAtual')}
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-sm font-medium text-gray-300 cursor-pointer hover:bg-gray-600 transition-colors"
                        onClick={() => handleSort('valorTotalCompras')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Total Investido (R$)</span>
                          {getSortIcon('valorTotalCompras')}
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-sm font-medium text-gray-300 cursor-pointer hover:bg-gray-600 transition-colors"
                        onClick={() => handleSort('valorMercado')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Valor Mercado (R$)</span>
                          {getSortIcon('valorMercado')}
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-sm font-medium text-gray-300 cursor-pointer hover:bg-gray-600 transition-colors"
                        onClick={() => handleSort('valorTotalVendas')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Total Vendido (R$)</span>
                          {getSortIcon('valorTotalVendas')}
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-sm font-medium text-gray-300 cursor-pointer hover:bg-gray-600 transition-colors"
                        onClick={() => handleSort('lucroPrejuizo')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Lucro / Prejuízo (R$)</span>
                          {getSortIcon('lucroPrejuizo')}
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-sm font-medium text-gray-300 cursor-pointer hover:bg-gray-600 transition-colors"
                        onClick={() => handleSort('lucroPrejuizoLatente')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Lucro/Prejuízo Latente (R$)</span>
                          {getSortIcon('lucroPrejuizoLatente')}
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-sm font-medium text-gray-300 cursor-pointer hover:bg-gray-600 transition-colors"
                        onClick={() => handleSort('retornoPercentualLatente')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>% Valorização</span>
                          {getSortIcon('retornoPercentualLatente')}
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-sm font-medium text-gray-300 cursor-pointer hover:bg-gray-600 transition-colors"
                        onClick={() => handleSort('retornoPercentual')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>% Retorno Realizado</span>
                          {getSortIcon('retornoPercentual')}
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {getCarteiraData().map((item, index) => (
                      <tr key={`${item.ativo}-${index}`} className="hover:bg-gray-700 transition-colors">
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-white font-medium">
                          {item.ativo}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-300">
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-600 text-blue-100">
                            <span className="hidden md:inline">
                              {tiposAtivos.find(t => t.value === item.tipo_ativo)?.label || item.tipo_ativo}
                            </span>
                            <span className="md:hidden">
                              {(tiposAtivos.find(t => t.value === item.tipo_ativo)?.label || item.tipo_ativo).split(' ')[0]}
                            </span>
                          </span>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-300">
                          <div className="flex flex-col">
                            <span className="font-medium">{item.quantidadeTotal.toLocaleString('pt-BR', {maximumFractionDigits: 2})}</span>
                            <span className="text-xs text-gray-400">
                              C: {item.quantidadeComprada} | V: {item.quantidadeVendida}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-300">
                          R$ {item.precoMedio.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-300">
                          {editingValorAtivo === item.ativo ? (
                            <div className="flex items-center space-x-2">
                              <input
                                type="number"
                                step="0.01"
                                value={valorAtualTemp}
                                onChange={(e) => setValorAtualTemp(e.target.value)}
                                className="w-20 px-2 py-1 bg-gray-600 border border-gray-500 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                autoFocus
                              />
                              <button
                                onClick={() => handleSaveValorAtual(item.ativo)}
                                className="p-1 text-green-400 hover:text-green-300 transition-colors"
                                title="Salvar"
                              >
                                <Save className="w-3 h-3" />
                              </button>
                              <button
                                onClick={handleCancelEditValorAtual}
                                className="p-1 text-red-400 hover:text-red-300 transition-colors"
                                title="Cancelar"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <div className="flex flex-col">
                                <span className={item.valorAtual > 0 ? 'text-white font-medium' : 'text-gray-500'}>
                                  {item.valorAtual > 0 
                                    ? `R$ ${item.valorAtual.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`
                                    : 'Não informado'
                                  }
                                </span>
                                {item.tipo_ativo === 'acoes' && item.valorAtual > 0 && (
                                  <span className="text-xs text-emerald-400 flex items-center">
                                    <div className="w-1 h-1 bg-emerald-400 rounded-full mr-1"></div>
                                    API B3
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center space-x-1">
                                {item.tipo_ativo === 'acoes' && (
                                  <button
                                    onClick={() => updateSingleStockPrice(item.ativo)}
                                    disabled={updatingSingleStock === item.ativo}
                                    className="p-1 text-emerald-400 hover:text-emerald-300 disabled:text-gray-500 transition-colors"
                                    title="Atualizar cotação via API"
                                  >
                                    {updatingSingleStock === item.ativo ? (
                                      <div className="animate-spin rounded-full h-3 w-3 border border-emerald-400 border-t-transparent"></div>
                                    ) : (
                                      <Activity className="w-3 h-3" />
                                    )}
                                  </button>
                                )}
                                <button
                                  onClick={() => handleEditValorAtual(item.ativo, item.valorAtual)}
                                  className="p-1 text-blue-400 hover:text-blue-300 transition-colors"
                                  title="Editar valor manualmente"
                                >
                                  <Edit3 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-300">
                          R$ {item.valorTotalCompras.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-300">
                          <div className="flex flex-col">
                            <span className={`font-medium ${
                              item.valorMercado > 0 ? 'text-white' : 'text-gray-500'
                            }`}>
                              {item.valorMercado > 0 
                                ? `R$ ${item.valorMercado.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`
                                : 'Valor não definido'
                              }
                            </span>
                            {item.quantidadeTotal > 0 && item.valorAtual > 0 && (
                              <span className="text-xs text-gray-400">
                                {item.quantidadeTotal.toLocaleString('pt-BR', {maximumFractionDigits: 2})} × R$ {item.valorAtual.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-300">
                          R$ {item.valorTotalVendas.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium">
                          <span className={`${
                            item.lucroPrejuizo >= 0 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {item.lucroPrejuizo >= 0 ? '+' : ''}R$ {item.lucroPrejuizo.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium">
                          {item.quantidadeTotal > 0 && item.valorAtual > 0 ? (
                            <span className={`${
                              item.lucroPrejuizoLatente >= 0 ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {item.lucroPrejuizoLatente >= 0 ? '+' : ''}R$ {item.lucroPrejuizoLatente.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                            </span>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium">
                          {item.quantidadeTotal > 0 && item.valorAtual > 0 ? (
                            <span className={`${
                              item.retornoPercentualLatente >= 0 ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {item.retornoPercentualLatente >= 0 ? '+' : ''}{item.retornoPercentualLatente.toLocaleString('pt-BR', {minimumFractionDigits: 1})}%
                            </span>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium">
                          <span className={`${
                            item.retornoPercentual >= 0 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {item.retornoPercentual >= 0 ? '+' : ''}{item.retornoPercentual.toLocaleString('pt-BR', {minimumFractionDigits: 1})}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {getCarteiraData().length === 0 && (
                  <div className="p-8 text-center text-gray-400">
                    <PieChart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum ativo encontrado com os filtros aplicados.</p>
                    <p className="text-sm mt-2">
                      Realize algumas compras para ver os ativos em sua carteira.
                    </p>
                  </div>
                )}
              </div>

              {/* Resumo da Carteira */}
              {getCarteiraData().length > 0 && (
                <div className="p-6 border-t border-gray-700 bg-gray-750">
                  <h3 className="text-lg font-semibold text-white mb-4">Resumo da Carteira</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-300">Total Investido</span>
                        <span className="text-lg font-bold text-blue-400">
                          R$ {(() => {
                            const totalCompras = getCarteiraData().reduce((sum, item) => sum + item.valorTotalCompras, 0);
                            const totalVendas = getCarteiraData().reduce((sum, item) => sum + item.valorTotalVendas, 0);
                            const totalProventos = proventos.filter(p => !p.a_receber).reduce((sum, item) => sum + (item.valor * (item.quantidade || 1)), 0);
                            const derivativosRecebidos = derivativos
                              .filter(d => d.tipo_operacao === 'venda' && d.tipo_derivativo === 'call')
                              .reduce((sum, item) => sum + item.valor_total, 0);
                            
                            return (totalCompras - totalVendas - totalProventos - derivativosRecebidos)
                              .toLocaleString('pt-BR', {minimumFractionDigits: 2});
                          })()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="bg-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-300">Total Vendido</span>
                        <span className="text-lg font-bold text-purple-400">
                          R$ {getCarteiraData()
                            .reduce((sum, item) => sum + item.valorTotalVendas, 0)
                            .toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                        </span>
                      </div>
                    </div>
                    
                    <div className="bg-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-300">Total Compra</span>
                        <span className="text-lg font-bold text-green-400">
                          R$ {getCarteiraData()
                            .reduce((sum, item) => sum + item.valorTotalCompras, 0)
                            .toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                        </span>
                      </div>
                    </div>
                    
                    <div className="bg-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-300">Valor Mercado Total</span>
                        <span className="text-lg font-bold text-cyan-400">
                          R$ {getCarteiraData()
                            .filter(item => item.quantidadeTotal > 0 && item.valorAtual > 0)
                            .reduce((sum, item) => sum + item.valorMercado, 0)
                            .toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                        </span>
                      </div>
                    </div>
                    
                    <div className="bg-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-300">Lucro/Prejuízo</span>
                        <span className={`text-lg font-bold ${
                          (() => {
                            const valorMercado = getCarteiraData()
                              .filter(item => item.quantidadeTotal > 0 && item.valorAtual > 0)
                              .reduce((sum, item) => sum + item.valorMercado, 0);
                            
                            const totalCompras = getCarteiraData().reduce((sum, item) => sum + item.valorTotalCompras, 0);
                            const totalVendas = getCarteiraData().reduce((sum, item) => sum + item.valorTotalVendas, 0);
                            const totalProventos = proventos.filter(p => !p.a_receber).reduce((sum, item) => sum + (item.valor * (item.quantidade || 1)), 0);
                            const derivativosRecebidos = derivativos
                              .filter(d => d.tipo_operacao === 'venda' && d.tipo_derivativo === 'call')
                              .reduce((sum, item) => sum + item.valor_total, 0);
                            
                            const totalInvestido = totalCompras - totalVendas - totalProventos - derivativosRecebidos;
                            
                            return (valorMercado - totalInvestido) >= 0 ? 'text-green-400' : 'text-red-400';
                          })()
                        }`}>
                          {(() => {
                            const valorMercado = getCarteiraData()
                              .filter(item => item.quantidadeTotal > 0 && item.valorAtual > 0)
                              .reduce((sum, item) => sum + item.valorMercado, 0);
                            
                            const totalCompras = getCarteiraData().reduce((sum, item) => sum + item.valorTotalCompras, 0);
                            const totalVendas = getCarteiraData().reduce((sum, item) => sum + item.valorTotalVendas, 0);
                            const totalProventos = proventos.filter(p => !p.a_receber).reduce((sum, item) => sum + (item.valor * (item.quantidade || 1)), 0);
                            const derivativosRecebidos = derivativos
                              .filter(d => d.tipo_operacao === 'venda' && d.tipo_derivativo === 'call')
                              .reduce((sum, item) => sum + item.valor_total, 0);
                            
                            const totalInvestido = totalCompras - totalVendas - totalProventos - derivativosRecebidos;
                            const lucroPrejuizo = valorMercado - totalInvestido;
                            
                            return (lucroPrejuizo >= 0 ? '+' : '') + 'R$ ' + lucroPrejuizo.toLocaleString('pt-BR', {minimumFractionDigits: 2});
                          })()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="bg-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-300">Ativos na Carteira</span>
                        <span className="text-lg font-bold text-indigo-400">
                          {getCarteiraData().filter(item => item.quantidadeTotal > 0).length}
                        </span>
                      </div>
                    </div>
                    
                    <div className="bg-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-300">Cotações Atualizadas</span>
                        <span className="text-lg font-bold text-yellow-400">
                          {getCarteiraData().filter(item => item.quantidadeTotal > 0 && item.valorAtual > 0).length} / {getCarteiraData().filter(item => item.quantidadeTotal > 0).length}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Páginas de Compra e Venda */}
        {(activeTab === 'compra' || activeTab === 'venda') && (
          <div className="space-y-8">
            {/* Form */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
              <div className="p-6 border-b border-gray-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white flex items-center">
                    {activeTab === 'compra' ? (
                      <>
                        <TrendingUp className="w-6 h-6 mr-2 text-green-400" />
                        {editingId ? 'Editar Compra' : 'Compra de Ativos'}
                      </>
                    ) : (
                      <>
                        <TrendingDown className="w-6 h-6 mr-2 text-blue-400" />
                        {editingId ? 'Editar Venda' : 'Venda de Ativos'}
                      </>
                    )}
                  </h2>
                  {editingId && (
                    <button
                      onClick={handleCancelEdit}
                      className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors flex items-center space-x-2"
                    >
                      <X className="w-4 h-4" />
                      <span>Cancelar</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Tipo de Ativo */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        <Tag className="w-4 h-4 inline mr-2" />
                        Tipo de Ativo *
                      </label>
                      <select
                        value={formData.tipo_ativo}
                        onChange={(e) => handleInputChange('tipo_ativo', e.target.value)}
                        className={`w-full px-4 py-3 bg-gray-700 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                          errors.tipo_ativo
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-gray-600 focus:ring-blue-500'
                        }`}
                      >
                        <option value="">Selecione o tipo de ativo</option>
                        {tiposAtivos.map(tipo => (
                          <option key={tipo.value} value={tipo.value}>
                            {tipo.label}
                          </option>
                        ))}
                      </select>
                      {errors.tipo_ativo && (
                        <p className="mt-1 text-sm text-red-400">{errors.tipo_ativo}</p>
                      )}
                    </div>

                    {/* Ativo */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        <BarChart3 className="w-4 h-4 inline mr-2" />
                        Ativo *
                      </label>
                      <select
                        value={formData.ativo}
                        onChange={(e) => handleInputChange('ativo', e.target.value)}
                        disabled={!formData.tipo_ativo}
                        className={`w-full px-4 py-3 bg-gray-700 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                          errors.ativo
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-gray-600 focus:ring-blue-500'
                        } ${!formData.tipo_ativo ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <option value="">Selecione o ativo</option>
                        {formData.tipo_ativo && ativosPorTipo[formData.tipo_ativo]?.map(ativo => (
                          <option key={ativo} value={ativo}>
                            {ativo}
                          </option>
                        ))}
                      </select>
                      {errors.ativo && (
                        <p className="mt-1 text-sm text-red-400">{errors.ativo}</p>
                      )}
                    </div>

                    {/* Data */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        <Calendar className="w-4 h-4 inline mr-2" />
                        Data da {activeTab === 'compra' ? 'Compra' : 'Venda'} *
                      </label>
                      <input
                        type="date"
                        value={formData.data}
                        onChange={(e) => handleInputChange('data', e.target.value)}
                        className={`w-full px-4 py-3 bg-gray-700 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                          errors.data
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-gray-600 focus:ring-blue-500'
                        }`}
                      />
                      {errors.data && (
                        <p className="mt-1 text-sm text-red-400">{errors.data}</p>
                      )}
                    </div>

                    {/* Quantidade */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        <Hash className="w-4 h-4 inline mr-2" />
                        Quantidade *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.quantidade}
                        onChange={(e) => handleInputChange('quantidade', e.target.value)}
                        placeholder="Ex: 100"
                        className={`w-full px-4 py-3 bg-gray-700 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                          errors.quantidade
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-gray-600 focus:ring-blue-500'
                        }`}
                      />
                      {errors.quantidade && (
                        <p className="mt-1 text-sm text-red-400">{errors.quantidade}</p>
                      )}
                    </div>

                    {/* Preço por Unidade */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        <DollarSign className="w-4 h-4 inline mr-2" />
                        Preço por Unidade (R$) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.preco}
                        onChange={(e) => handleInputChange('preco', e.target.value)}
                        placeholder="Ex: 30.50"
                        className={`w-full px-4 py-3 bg-gray-700 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                          errors.preco
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-gray-600 focus:ring-blue-500'
                        }`}
                      />
                      {errors.preco && (
                        <p className="mt-1 text-sm text-red-400">{errors.preco}</p>
                      )}
                    </div>

                    {/* Outros Custos */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        <div className="flex items-center">
                          <DollarSign className="w-4 h-4 inline mr-2" />
                          Outros Custos (R$)
                          <div className="relative ml-2">
                            <Info className="w-4 h-4 text-gray-400 cursor-help" />
                            <div className="absolute bottom-6 left-0 w-64 p-2 bg-gray-700 rounded-lg text-xs text-gray-300 opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
                              Taxas de corretagem, impostos, emolumentos, etc.
                            </div>
                          </div>
                        </div>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.outros_custos}
                        onChange={(e) => handleInputChange('outros_custos', e.target.value)}
                        placeholder="Ex: 5.00"
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Valor Total */}
                  <div className="bg-gray-700 rounded-lg p-6 border border-gray-600">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-medium text-gray-300">
                        Valor Total da {activeTab === 'compra' ? 'Compra' : 'Venda'}:
                      </span>
                      <span className={`text-2xl font-bold ${
                        activeTab === 'compra' ? 'text-green-400' : 'text-blue-400'
                      }`}>
                        R$ {calcularValorTotal().toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                      </span>
                    </div>
                    {formData.quantidade && formData.preco && (
                      <div className="mt-2 text-sm text-gray-400">
                        {formData.quantidade} × R$ {parseFloat(formData.preco).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                        {formData.outros_custos && parseFloat(formData.outros_custos) > 0 && (
                          <span> + R$ {parseFloat(formData.outros_custos).toLocaleString('pt-BR', {minimumFractionDigits: 2})} (outros custos)</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full py-3 sm:py-4 px-4 sm:px-6 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 text-sm sm:text-base ${
                      activeTab === 'compra'
                        ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                        : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                    } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''} focus:outline-none focus:ring-2`}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Processando...</span>
                      </>
                    ) : (
                      <>
                        {editingId ? <Save className="w-5 h-5" /> : <PlusCircle className="w-5 h-5" />}
                        <span>
                          {editingId 
                            ? 'Salvar Alterações' 
                            : `Adicionar ${activeTab === 'compra' ? 'Compra' : 'Venda'}`
                          }
                        </span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* Lista de Transações */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
              <div className="p-6 border-b border-gray-700">
                <h2 className="text-xl font-bold text-white">
                  Histórico de {activeTab === 'compra' ? 'Compras' : 'Vendas'}
                </h2>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-300">Data</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-300">Tipo</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-300">Ativo</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-300">Qtd</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-300">Preço Unit.</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-300">Outros Custos</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-300">Total</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-300">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {(activeTab === 'compra' ? compras : vendas).map((item) => (
                      <tr key={item.id} className="hover:bg-gray-700 transition-colors">
                        <td className="px-6 py-4 text-sm text-gray-300">
                          {new Date(item.data + 'T12:00:00').toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-300">
                          {tiposAtivos.find(t => t.value === item.tipo_ativo)?.label || item.tipo_ativo}
                        </td>
                        <td className="px-6 py-4 text-sm text-white font-medium">
                          {item.ativo}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-300">
                          {item.quantidade}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-300">
                          R$ {item.preco.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-300">
                          R$ {item.outros_custos.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-white">
                          R$ {item.valor_total.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleEdit(item)}
                              className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 rounded transition-colors"
                              title="Editar"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded transition-colors"
                              title="Excluir"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {(activeTab === 'compra' ? compras : vendas).length === 0 && (
                  <div className="p-8 text-center text-gray-400">
                    <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma {activeTab === 'compra' ? 'compra' : 'venda'} registrada ainda.</p>
                    <p className="text-sm mt-2">
                      Adicione sua primeira transação usando o formulário acima.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Página de Configurações */}
        {activeTab === 'configuracoes' && (
          <div className="space-y-8">
            {/* Header da página */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
              <div className="p-6 border-b border-gray-700">
                <h2 className="text-xl font-bold text-white flex items-center">
                  <Settings className="w-6 h-6 mr-2 text-gray-400" />
                  Configurações
                </h2>
                <p className="text-gray-400 mt-2">
                  Gerencie seus dados com conexão ao banco Supabase
                </p>
              </div>

              {/* Status da Conexão */}
              <div className={`p-6 border-b border-gray-700 ${
                connectionStatus === 'connected' ? 'bg-green-900/20' : 
                connectionStatus === 'error' ? 'bg-red-900/20' : 'bg-blue-900/20'
              }`}>
                <div className="flex items-start space-x-3">
                  {connectionStatus === 'connected' && <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />}
                  {connectionStatus === 'error' && <XCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />}
                  {connectionStatus === 'connecting' && (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400 mt-0.5 flex-shrink-0"></div>
                  )}
                  <div>
                    <h3 className={`font-medium mb-2 ${
                      connectionStatus === 'connected' ? 'text-green-400' : 
                      connectionStatus === 'error' ? 'text-red-400' : 'text-blue-400'
                    }`}>
                      {connectionStatus === 'connected' && '🟢 Conectado ao Supabase'}
                      {connectionStatus === 'error' && '🔴 Erro de Conexão'}
                      {connectionStatus === 'connecting' && '🟡 Conectando...'}
                    </h3>
                    <p className={`text-sm ${
                      connectionStatus === 'connected' ? 'text-green-200' : 
                      connectionStatus === 'error' ? 'text-red-200' : 'text-blue-200'
                    }`}>
                      {connectionStatus === 'connected' && 'Seus dados estão sendo sincronizados com o banco de dados em tempo real.'}
                      {connectionStatus === 'error' && 'Não foi possível conectar ao banco de dados. Verifique a configuração.'}
                      {connectionStatus === 'connecting' && 'Estabelecendo conexão com o banco de dados...'}
                    </p>
                    {connectionStatus === 'error' && (
                      <button
                        onClick={loadDataFromSupabase}
                        disabled={isLoading}
                        className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg transition-colors text-sm font-medium flex items-center space-x-2"
                      >
                        {isLoading ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <Activity className="w-4 h-4" />
                        )}
                        <span>Tentar Reconectar</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Mensagens de Status */}
            {(exportMessage || importMessage) && (
              <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
                <div className="flex items-center space-x-2">
                  {exportMessage && exportMessage.includes('✅') && <CheckCircle className="w-5 h-5 text-green-400" />}
                  {importMessage && importMessage.includes('✅') && <CheckCircle className="w-5 h-5 text-green-400" />}
                  {(exportMessage && exportMessage.includes('❌')) || (importMessage && importMessage.includes('❌')) && <XCircle className="w-5 h-5 text-red-400" />}
                  <span className={`font-medium ${
                    (exportMessage && exportMessage.includes('✅')) || (importMessage && importMessage.includes('✅')) 
                      ? 'text-green-400' 
                      : 'text-red-400'
                  }`}>
                    {exportMessage || importMessage}
                  </span>
                </div>
              </div>
            )}

            {/* Seção de Exportação */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
              <div className="p-6 border-b border-gray-700">
                <h3 className="text-lg font-semibold text-white flex items-center">
                  <Download className="w-5 h-5 mr-2 text-green-400" />
                  📤 Exportar Dados (.CSV)
                </h3>
                <p className="text-gray-400 mt-2">
                  Baixe seus dados como arquivos CSV para backup ou análise externa
                </p>
              </div>

              <div className="p-6">
                <div className="mb-4 p-4 bg-blue-900/20 rounded-lg border border-blue-600">
                  <div className="flex items-center space-x-3">
                    <Settings className="w-5 h-5 text-blue-400" />
                    <div>
                      <p className="text-blue-400 font-medium">Dados sincronizados com Supabase</p>
                      <p className="text-blue-200 text-sm">
                        As exportações refletem os dados atuais salvos no banco de dados.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Testar Conexão */}
                  <button
                    onClick={testSupabaseConnection}
                    disabled={isLoading}
                    className="p-4 rounded-lg border border-yellow-600 bg-yellow-900/20 hover:bg-yellow-800/30 text-yellow-400 hover:text-yellow-300 transition-all duration-200 flex flex-col items-center space-y-2"
                  >
                    {isLoading ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-400"></div>
                    ) : (
                      <Shield className="w-6 h-6" />
                    )}
                    <span className="font-medium">Testar Conexão</span>
                    <span className="text-xs opacity-75">Verificar Supabase</span>
                  </button>

                  {/* Recarregar Dados */}
                  <button
                    onClick={loadDataFromSupabase}
                    disabled={isLoading}
                    className="p-4 rounded-lg border border-blue-600 bg-blue-900/20 hover:bg-blue-800/30 text-blue-400 hover:text-blue-300 transition-all duration-200 flex flex-col items-center space-y-2"
                  >
                    {isLoading ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
                    ) : (
                      <Activity className="w-6 h-6" />
                    )}
                    <span className="font-medium">Recarregar Dados</span>
                    <span className="text-xs opacity-75">Sincronizar com BD</span>
                  </button>

                  {/* Exportar Compras */}
                  <button
                    onClick={exportCompras}
                    disabled={isProcessing || compras.length === 0}
                    className={`p-4 rounded-lg border transition-all duration-200 flex flex-col items-center space-y-2 ${
                      compras.length === 0 
                        ? 'border-gray-600 bg-gray-700/50 text-gray-500 cursor-not-allowed' 
                        : 'border-green-600 bg-green-900/20 hover:bg-green-800/30 text-green-400 hover:text-green-300'
                    }`}
                  >
                    <TrendingUp className="w-6 h-6" />
                    <span className="font-medium">Exportar Compras</span>
                    <span className="text-xs opacity-75">{compras.length} registros</span>
                  </button>

                  {/* Exportar Vendas */}
                  <button
                    onClick={exportVendas}
                    disabled={isProcessing || vendas.length === 0}
                    className={`p-4 rounded-lg border transition-all duration-200 flex flex-col items-center space-y-2 ${
                      vendas.length === 0 
                        ? 'border-gray-600 bg-gray-700/50 text-gray-500 cursor-not-allowed' 
                        : 'border-blue-600 bg-blue-900/20 hover:bg-blue-800/30 text-blue-400 hover:text-blue-300'
                    }`}
                  >
                    <TrendingDown className="w-6 h-6" />
                    <span className="font-medium">Exportar Vendas</span>
                    <span className="text-xs opacity-75">{vendas.length} registros</span>
                  </button>

                  {/* Exportar Proventos */}
                  <button
                    onClick={exportProventos}
                    disabled={isProcessing || proventos.length === 0}
                    className={`p-4 rounded-lg border transition-all duration-200 flex flex-col items-center space-y-2 ${
                      proventos.length === 0 
                        ? 'border-gray-600 bg-gray-700/50 text-gray-500 cursor-not-allowed' 
                        : 'border-purple-600 bg-purple-900/20 hover:bg-purple-800/30 text-purple-400 hover:text-purple-300'
                    }`}
                  >
                    <Gift className="w-6 h-6" />
                    <span className="font-medium">Exportar Proventos</span>
                    <span className="text-xs opacity-75">{proventos.length} registros</span>
                  </button>

                  {/* Exportar Derivativos */}
                  <button
                    onClick={exportDerivativos}
                    disabled={isProcessing || derivativos.length === 0}
                    className={`p-4 rounded-lg border transition-all duration-200 flex flex-col items-center space-y-2 ${
                      derivativos.length === 0 
                        ? 'border-gray-600 bg-gray-700/50 text-gray-500 cursor-not-allowed' 
                        : 'border-orange-600 bg-orange-900/20 hover:bg-orange-800/30 text-orange-400 hover:text-orange-300'
                    }`}
                  >
                    <Target className="w-6 h-6" />
                    <span className="font-medium">Exportar Derivativos</span>
                    <span className="text-xs opacity-75">{derivativos.length} registros</span>
                  </button>

                  {/* Exportar Carteira Consolidada */}
                  <button
                    onClick={exportCarteiraConsolidada}
                    disabled={isProcessing}
                    className="p-4 rounded-lg border border-indigo-600 bg-indigo-900/20 hover:bg-indigo-800/30 text-indigo-400 hover:text-indigo-300 transition-all duration-200 flex flex-col items-center space-y-2"
                  >
                    <PieChart className="w-6 h-6" />
                    <span className="font-medium">Carteira Consolidada</span>
                    <span className="text-xs opacity-75">Análise completa</span>
                  </button>

                  {/* Backup Completo */}
                  <button
                    onClick={exportBackupCompleto}
                    disabled={isProcessing}
                    className="p-4 rounded-lg border border-yellow-600 bg-yellow-900/20 hover:bg-yellow-800/30 text-yellow-400 hover:text-yellow-300 transition-all duration-200 flex flex-col items-center space-y-2"
                  >
                    <FileDown className="w-6 h-6" />
                    <span className="font-medium">Backup Completo</span>
                    <span className="text-xs opacity-75">Todos os arquivos</span>
                  </button>
                </div>

                {isProcessing && (
                  <div className="mt-4 p-4 bg-blue-900/20 rounded-lg border border-blue-600">
                    <div className="flex items-center space-x-3">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400"></div>
                      <span className="text-blue-400">Processando exportação...</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Seção de Importação */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
              <div className="p-6 border-b border-gray-700">
                <h3 className="text-lg font-semibold text-white flex items-center">
                  <Upload className="w-5 h-5 mr-2 text-blue-400" />
                  📥 Importar Dados (.CSV)
                </h3>
                <p className="text-gray-400 mt-2">
                  Recarregue dados salvos em outro navegador ou dispositivo
                </p>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Importar Compras */}
                  <div className="p-4 rounded-lg border border-gray-600 bg-gray-700/50">
                    <div className="flex items-center space-x-3 mb-3">
                      <TrendingUp className="w-5 h-5 text-green-400" />
                      <span className="font-medium text-green-400">Importar Compras</span>
                    </div>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(e) => handleFileImport(e, 'compras')}
                      disabled={isProcessing}
                      className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-sm text-gray-300 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-green-600 file:text-white file:cursor-pointer hover:file:bg-green-700 disabled:opacity-50"
                    />
                    <p className="text-xs text-gray-400 mt-2">
                      Formato: tipo_ativo,ativo,data,quantidade,preco,outros_custos
                    </p>
                  </div>

                  {/* Importar Vendas */}
                  <div className="p-4 rounded-lg border border-gray-600 bg-gray-700/50">
                    <div className="flex items-center space-x-3 mb-3">
                      <TrendingDown className="w-5 h-5 text-blue-400" />
                      <span className="font-medium text-blue-400">Importar Vendas</span>
                    </div>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(e) => handleFileImport(e, 'vendas')}
                      disabled={isProcessing}
                      className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-sm text-gray-300 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-blue-600 file:text-white file:cursor-pointer hover:file:bg-blue-700 disabled:opacity-50"
                    />
                    <p className="text-xs text-gray-400 mt-2">
                      Formato: tipo_ativo,ativo,data,quantidade,preco,outros_custos
                    </p>
                  </div>

                  {/* Importar Proventos */}
                  <div className="p-4 rounded-lg border border-gray-600 bg-gray-700/50">
                    <div className="flex items-center space-x-3 mb-3">
                      <Gift className="w-5 h-5 text-purple-400" />
                      <span className="font-medium text-purple-400">Importar Proventos</span>
                    </div>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(e) => handleFileImport(e, 'proventos')}
                      disabled={isProcessing}
                      className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-sm text-gray-300 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-purple-600 file:text-white file:cursor-pointer hover:file:bg-purple-700 disabled:opacity-50"
                    />
                    <p className="text-xs text-gray-400 mt-2">
                      Formato: tipo_provento,ativo,data,valor,quantidade,a_receber
                    </p>
                  </div>

                  {/* Importar Derivativos */}
                  <div className="p-4 rounded-lg border border-gray-600 bg-gray-700/50">
                    <div className="flex items-center space-x-3 mb-3">
                      <Target className="w-5 h-5 text-orange-400" />
                      <span className="font-medium text-orange-400">Importar Derivativos</span>
                    </div>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(e) => handleFileImport(e, 'derivativos')}
                      disabled={isProcessing}
                      className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-sm text-gray-300 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-orange-600 file:text-white file:cursor-pointer hover:file:bg-orange-700 disabled:opacity-50"
                    />
                    <p className="text-xs text-gray-400 mt-2">
                      Formato: tipo_operacao,tipo_derivativo,ativo_subjacente,codigo_opcao,strike,data...
                    </p>
                  </div>
                </div>

                {isProcessing && (
                  <div className="mt-4 p-4 bg-blue-900/20 rounded-lg border border-blue-600">
                    <div className="flex items-center space-x-3">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400"></div>
                      <span className="text-blue-400">Processando importação...</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Seção de Limpeza de Dados */}
            <div className="bg-gray-800 rounded-xl border border-red-600 overflow-hidden">
              <div className="p-6 border-b border-red-600">
                <h3 className="text-lg font-semibold text-white flex items-center">
                  <Shield className="w-5 h-5 mr-2 text-red-400" />
                  🗑️ Zona de Perigo
                </h3>
                <p className="text-gray-400 mt-2">
                  Ações irreversíveis que podem resultar em perda de dados
                </p>
              </div>

              <div className="p-6 bg-red-900/10">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-red-400 font-medium">Limpar Todos os Dados</h4>
                    <p className="text-red-300 text-sm mt-1">
                      Remove permanentemente todos os dados salvos no navegador
                    </p>
                  </div>
                  <button
                    onClick={limparTodosDados}
                    disabled={isProcessing}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
                  >
                    🗑️ Limpar Tudo
                  </button>
                </div>
              </div>
            </div>

            {/* Informações Técnicas */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
              <div className="p-6 border-b border-gray-700">
                <h3 className="text-lg font-semibold text-white flex items-center">
                  <Info className="w-5 h-5 mr-2 text-gray-400" />
                  ℹ️ Informações Técnicas
                </h3>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-white font-medium mb-2">📊 Estatísticas dos Dados</h4>
                    <div className="space-y-2 text-sm text-gray-300">
                      <div className="flex justify-between">
                        <span>Compras registradas:</span>
                        <span className="text-green-400 font-medium">{compras.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Vendas registradas:</span>
                        <span className="text-blue-400 font-medium">{vendas.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Proventos registrados:</span>
                        <span className="text-purple-400 font-medium">{proventos.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Derivativos registrados:</span>
                        <span className="text-orange-400 font-medium">{derivativos.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Cotações salvas:</span>
                        <span className="text-cyan-400 font-medium">{Object.keys(valoresAtuais).length}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-white font-medium mb-2">🔧 Formato dos Arquivos CSV</h4>
                    <div className="space-y-2 text-sm text-gray-300">
                      <p>• <strong>Compras/Vendas:</strong> Dados de transações com ativos</p>
                      <p>• <strong>Proventos:</strong> Dividendos, JCP e rendimentos</p>
                      <p>• <strong>Derivativos:</strong> Operações com opções (calls/puts)</p>
                      <p>• <strong>Carteira:</strong> Análise consolidada por ativo</p>
                      <p className="text-amber-400 mt-3">
                        💡 <strong>Dica:</strong> Mantenha backups regulares dos seus dados
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvestmentManager;