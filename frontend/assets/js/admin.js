const respostasState = {
  exame: [],
  ccp: [],
  filters: {
    exame: {},
    ccp: {}
  }
};

const questionMetaCache = {
  exame: null,
  ccp: null
};

let analyticsCache = null;

const COMMENT_CATEGORY_RULES = [
  {
    key: 'comunicacao',
    label: 'Comunicação e orientação',
    keywords: ['comunica', 'orienta', 'clareza', 'inform', 'regra', 'edital', 'cronograma', 'anteced']
  },
  {
    key: 'infraestrutura',
    label: 'Infraestrutura e suporte',
    keywords: ['infraestrutura', 'ambiente', 'sala', 'equip', 'sistema', 'tecnic', 'conect', 'suporte', 'camera']
  },
  {
    key: 'avaliacao',
    label: 'Avaliação e processo',
    keywords: ['avali', 'processo', 'criter', 'fiscal', 'integridade', 'prova', 'aprendizagem', 'feedback']
  },
  {
    key: 'conteudo',
    label: 'Conteúdo e adequação',
    keywords: ['conteudo', 'conteúdo', 'quest', 'curric', 'didat', 'pedagog', 'docente', 'material']
  },
  {
    key: 'participacao',
    label: 'Participação e frequência',
    keywords: ['frequ', 'particip', 'presen', 'controle', 'assinatura']
  },
  {
    key: 'acesso',
    label: 'Acesso e preço',
    keywords: ['acesso', 'preco', 'preço', 'custo', 'valor', 'inscri', 'disponib']
  }
];

const NEGATIVE_WORDS = ['ruim', 'péss', 'pess', 'insatis', 'falha', 'erro', 'proble', 'precisa', 'demora', 'dific', 'inadequ', 'crit', 'deficien', 'ausencia'];
const POSITIVE_WORDS = ['bom', 'ótim', 'otim', 'excel', 'adequad', 'satis', 'positivo', 'eficient', 'claro', 'consistente'];

function getAdminHeaders() {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function redirectToLogin() {
  clearAuthToken();
  window.location.href = 'admin-login.html';
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizeText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function formatAdminDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (!Number.isNaN(date.getTime())) {
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  return value;
}

function formatShortDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('pt-BR');
}

function parseLocalDateInput(value, endOfDay = false) {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;
  return endOfDay
    ? new Date(year, month - 1, day, 23, 59, 59, 999)
    : new Date(year, month - 1, day, 0, 0, 0, 0);
}

function parseResponseDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDetailLabel(key) {
  return key
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .trim();
}

function formatNumericValue(value, digits = 2) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return value || '-';
  return numeric.toLocaleString('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: digits
  });
}

function formatPercent(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return '-';
  return `${numeric.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 1 })}%`;
}

function median(values) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

function stdDev(values, avg) {
  if (!values.length) return 0;
  const variance = values.reduce((acc, value) => acc + ((value - avg) ** 2), 0) / values.length;
  return Math.sqrt(variance);
}

function summarizeNumbers(values) {
  const numeric = values.map(Number).filter((value) => Number.isFinite(value));
  if (!numeric.length) {
    return {
      count: 0,
      average: 0,
      median: 0,
      stddev: 0,
      min: 0,
      max: 0
    };
  }
  const average = numeric.reduce((acc, value) => acc + value, 0) / numeric.length;
  return {
    count: numeric.length,
    average,
    median: median(numeric),
    stddev: stdDev(numeric, average),
    min: Math.min(...numeric),
    max: Math.max(...numeric)
  };
}

function getResponseType(item) {
  if (String(item.ID_Avaliacao || '').startsWith('EPP-') || Object.prototype.hasOwnProperty.call(item, 'Media_Geral_Exame')) {
    return 'exame';
  }
  return 'ccp';
}

function getRowAverage(item, type) {
  return type === 'exame'
    ? Number(item.Media_Geral_Exame)
    : Number(item.Nota_Global_Ponderada);
}

function hasCriticalScore(item) {
  return Object.entries(item).some(([key, value]) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return false;
    return (key.startsWith('B') || key.startsWith('E')) && numeric <= 2;
  });
}

function getRowClassification(item, type) {
  const average = getRowAverage(item, type);
  const hasCriticalFlag = item.Flag_Critico === 'VERDADEIRO';
  const lowScore = hasCriticalScore(item);

  if (hasCriticalFlag || lowScore || average <= 2.5) {
    return { label: 'Crítico', className: 'critico' };
  }
  if (average < 4.0) {
    return { label: 'Atenção', className: 'atencao' };
  }
  if (average < 4.5) {
    return { label: 'Adequado', className: 'adequado' };
  }
  return { label: 'Destaque', className: 'destaque' };
}

function renderStatusBadge(item, type) {
  const status = getRowClassification(item, type);
  return `<span class="status-badge ${status.className}">${status.label}</span>`;
}

async function requireAuth() {
  const token = getAuthToken();
  if (!token) {
    redirectToLogin();
    return false;
  }
  return true;
}

async function handleLogin() {
  const form = document.getElementById('login-form');
  const message = document.getElementById('login-message');
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    message.innerHTML = '';

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    try {
      const result = await apiPost('/api/admin/login', { username, password });
      setAuthToken(result.token);
      window.location.href = 'admin-dashboard.html';
    } catch (error) {
      showMessage(message, error.message || 'Credenciais inválidas.', 'danger');
    }
  });
}

async function fetchAdminResponses() {
  const data = await apiGet('/api/admin/respostas', getAdminHeaders());
  respostasState.exame = data.exame || [];
  respostasState.ccp = data.ccp || [];
  return respostasState;
}

async function ensureQuestionMeta(type) {
  if (questionMetaCache[type]) return questionMetaCache[type];

  try {
    const formulario = type === 'exame' ? 'exame-provas' : 'ccp-cap';
    const data = await apiGet(`/api/perguntas/${formulario}`);
    questionMetaCache[type] = Array.isArray(data?.perguntas) ? data.perguntas : [];
  } catch (error) {
    questionMetaCache[type] = [];
  }

  return questionMetaCache[type];
}

function buildMetaMap(metaRows) {
  return (metaRows || []).reduce((acc, row) => {
    if (row.Codigo_Pergunta) acc[row.Codigo_Pergunta] = row;
    return acc;
  }, {});
}

function getScoreEntries(item) {
  return Object.entries(item)
    .filter(([key, value]) => (key.startsWith('B') || key.startsWith('E')) && Number.isFinite(Number(value)))
    .map(([key, value]) => ({ key, value: Number(value) }));
}

function getCommentEntries(item, type) {
  const commentFields = Object.entries(item)
    .filter(([key, value]) => {
      if (!value) return false;
      return key.startsWith('Justificativa') || key === 'Avaliacao_Geral_Texto' || key === 'Observacoes_Finais';
    })
    .map(([key, value]) => ({
      key,
      value: String(value).trim(),
      type,
      entity: item.Entidade_Certificadora || 'Não informada',
      id: item.ID_Avaliacao || '-'
    }))
    .filter((entry) => entry.value);

  return commentFields;
}

function detectSentiment(text) {
  const normalized = normalizeText(text);
  const negativeScore = NEGATIVE_WORDS.reduce((acc, word) => acc + (normalized.includes(word) ? 1 : 0), 0);
  const positiveScore = POSITIVE_WORDS.reduce((acc, word) => acc + (normalized.includes(word) ? 1 : 0), 0);
  if (negativeScore > positiveScore) return 'Negativo';
  if (positiveScore > negativeScore) return 'Positivo';
  return 'Neutro';
}

function detectCommentCategory(text) {
  const normalized = normalizeText(text);
  const matched = COMMENT_CATEGORY_RULES.find((rule) => rule.keywords.some((keyword) => normalized.includes(keyword)));
  return matched ? matched.label : 'Qualidade geral';
}

function collectComments(rows, type) {
  return rows.flatMap((item) => getCommentEntries(item, type)).map((entry) => ({
    ...entry,
    sentiment: detectSentiment(entry.value),
    category: detectCommentCategory(entry.value)
  }));
}

function aggregateBy(rows, getLabel, getValue) {
  const map = new Map();
  rows.forEach((row) => {
    const label = getLabel(row) || 'Não informado';
    const value = Number(getValue(row));
    if (!Number.isFinite(value)) return;
    if (!map.has(label)) map.set(label, []);
    map.get(label).push(value);
  });
  return [...map.entries()]
    .map(([label, values]) => {
      const stats = summarizeNumbers(values);
      return {
        label,
        count: stats.count,
        average: stats.average,
        median: stats.median,
        stddev: stats.stddev,
        min: stats.min,
        max: stats.max
      };
    })
    .sort((a, b) => b.average - a.average);
}

function aggregateCommentsBy(entries, key) {
  const map = new Map();
  entries.forEach((entry) => {
    const label = entry[key] || 'Não informado';
    if (!map.has(label)) map.set(label, []);
    map.get(label).push(entry);
  });
  return [...map.entries()]
    .map(([label, items]) => ({ label, count: items.length, items }))
    .sort((a, b) => b.count - a.count);
}

function deriveBlockStats(rows, metaRows) {
  const metaMap = buildMetaMap(metaRows);
  const blockMap = new Map();

  rows.forEach((item) => {
    getScoreEntries(item).forEach((entry) => {
      const meta = metaMap[entry.key] || {};
      const blockName = meta.Nome_Bloco_Eixo || meta.Bloco_Eixo || entry.key.split('_')[0];
      if (!blockMap.has(blockName)) blockMap.set(blockName, []);
      blockMap.get(blockName).push(entry.value);
    });
  });

  return [...blockMap.entries()]
    .map(([label, values]) => {
      const stats = summarizeNumbers(values);
      return {
        label,
        count: stats.count,
        average: stats.average,
        median: stats.median,
        stddev: stats.stddev
      };
    })
    .sort((a, b) => a.average - b.average);
}

function collectTimeline(rows) {
  const dates = rows
    .map((item) => parseResponseDate(item.Data_Recebimento))
    .filter(Boolean)
    .sort((a, b) => a - b);
  return {
    start: dates[0] || null,
    end: dates[dates.length - 1] || null
  };
}

function summarizeType(rows, type, metaRows) {
  const averages = rows
    .map((item) => getRowAverage(item, type))
    .filter((value) => Number.isFinite(value));
  const stats = summarizeNumbers(averages);
  const comments = collectComments(rows, type);
  const sentiments = aggregateCommentsBy(comments, 'sentiment');
  const categories = aggregateCommentsBy(comments, 'category');
  const classifications = rows.reduce((acc, row) => {
    const label = getRowClassification(row, type).label;
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {});

  return {
    type,
    rows,
    count: rows.length,
    stats,
    comments,
    sentiments,
    categories,
    classifications,
    byEntity: aggregateBy(rows, (item) => item.Entidade_Certificadora, (item) => getRowAverage(item, type)),
    byLevel: type === 'exame'
      ? aggregateBy(rows, (item) => item.Nivel_Certificacao || 'Não informado', (item) => getRowAverage(item, type))
      : [],
    byModality: type === 'exame'
      ? aggregateBy(rows, (item) => item.Modalidade_Prova || 'Não informada', (item) => getRowAverage(item, type))
      : aggregateBy(rows, (item) => item.Modalidade_CCP_CAP || 'Não informada', (item) => getRowAverage(item, type)),
    byBlock: deriveBlockStats(rows, metaRows)
  };
}

function compareTypes(exame, ccp) {
  return [
    { label: 'Exame por Provas', average: exame.stats.average, count: exame.count },
    { label: 'CCP/CAP', average: ccp.stats.average, count: ccp.count }
  ];
}

function buildCriticalPoints(exame, ccp) {
  const points = [];
  const examWorstEntity = exame.byEntity[exame.byEntity.length - 1];
  const ccpWorstEntity = ccp.byEntity[ccp.byEntity.length - 1];
  const worstExamBlock = exame.byBlock[0];
  const worstCcpBlock = ccp.byBlock[0];
  const worstCategory = [...exame.categories, ...ccp.categories]
    .sort((a, b) => b.count - a.count)[0];

  if (ccpWorstEntity) {
    points.push({
      level: 'Crítico',
      title: `${ccpWorstEntity.label} em CCP/CAP`,
      detail: `Média ${formatNumericValue(ccpWorstEntity.average)} em ${ccpWorstEntity.count} resposta(s), com variabilidade ${formatNumericValue(ccpWorstEntity.stddev)}.`
    });
  }

  if (examWorstEntity) {
    points.push({
      level: 'Crítico',
      title: `${examWorstEntity.label} em Exame por Provas`,
      detail: `Média ${formatNumericValue(examWorstEntity.average)} em ${examWorstEntity.count} resposta(s), indicando necessidade de diagnóstico operacional.`
    });
  }

  if (worstExamBlock) {
    points.push({
      level: 'Atenção',
      title: `Bloco mais sensível do Exame: ${worstExamBlock.label}`,
      detail: `Média ${formatNumericValue(worstExamBlock.average)} com ${worstExamBlock.count} marcações.`
    });
  }

  if (worstCcpBlock) {
    points.push({
      level: 'Atenção',
      title: `Bloco mais sensível do CCP/CAP: ${worstCcpBlock.label}`,
      detail: `Média ${formatNumericValue(worstCcpBlock.average)} com ${worstCcpBlock.count} marcações.`
    });
  }

  if (worstCategory) {
    points.push({
      level: 'Monitoramento',
      title: `Tema recorrente: ${worstCategory.label}`,
      detail: `${worstCategory.count} comentário(s) associados a esse eixo qualitativo.`
    });
  }

  return points;
}

function buildRecommendations(criticalPoints) {
  return criticalPoints.slice(0, 5).map((point, index) => {
    if (point.title.includes('CCP/CAP')) {
      return {
        code: `R${index + 1}`,
        title: 'Revisão pedagógica e administrativa do CCP/CAP',
        detail: 'Auditar critérios de avaliação, comunicação prévia e desenho operacional do curso nas entidades com pior desempenho.'
      };
    }
    if (point.title.includes('Exame')) {
      return {
        code: `R${index + 1}`,
        title: 'Diagnóstico operacional do Exame por Provas',
        detail: 'Priorizar infraestrutura, clareza das orientações e consistência da experiência entre entidades.'
      };
    }
    if (point.title.includes('Tema recorrente')) {
      return {
        code: `R${index + 1}`,
        title: 'Plano de ação sobre comentários recorrentes',
        detail: 'Transformar os temas qualitativos mais frequentes em checklist de melhoria com responsáveis e prazo.'
      };
    }
    return {
      code: `R${index + 1}`,
      title: 'Monitoramento contínuo por bloco temático',
      detail: 'Usar indicadores por bloco/eixo para reavaliar os pontos com menor média e acompanhar a evolução semestral.'
    };
  });
}

function buildExecutiveSummary(analytics) {
  const { exame, ccp } = analytics;
  const comparisonGap = ccp.stats.average - exame.stats.average;
  const totalComments = exame.comments.length + ccp.comments.length;
  const negativeComments = [...exame.comments, ...ccp.comments].filter((item) => item.sentiment === 'Negativo').length;
  const criticalCount = Object.values(exame.classifications).reduce((acc, count) => acc + count, 0)
    ? (exame.classifications.Crítico || 0) + (ccp.classifications.Crítico || 0)
    : 0;

  return [
    `Esta análise consolida ${analytics.totalResponses} resposta(s) entre Exame por Provas e CCP/CAP, coletadas de ${analytics.periodLabel}.`,
    `No recorte quantitativo, o Exame apresenta média geral de ${formatNumericValue(exame.stats.average)} e o CCP/CAP registra ${formatNumericValue(ccp.stats.average)}, com diferença de ${formatNumericValue(Math.abs(comparisonGap))} ponto(s) entre os dois instrumentos.`,
    `O sistema identificou ${criticalCount} resposta(s) em faixa crítica e ${totalComments} comentário(s) abertos, dos quais ${negativeComments} foram lidos como predominantemente negativos pela classificação automática de sentimento.`,
    'Os dados indicam percepção mais favorável nos eixos de integridade e satisfação geral, enquanto comunicação, infraestrutura, avaliação e clareza operacional concentram os principais sinais de atenção.'
  ];
}

function buildConclusions(analytics) {
  const topExam = analytics.exame.byEntity[0];
  const topCcp = analytics.ccp.byEntity[0];
  const bottomExam = analytics.exame.byEntity[analytics.exame.byEntity.length - 1];
  const bottomCcp = analytics.ccp.byEntity[analytics.ccp.byEntity.length - 1];

  return [
    `O panorama atual é de qualidade moderada, com melhor percepção média em CCP/CAP (${formatNumericValue(analytics.ccp.stats.average)}) do que no Exame por Provas (${formatNumericValue(analytics.exame.stats.average)}).`,
    topExam && topCcp
      ? `Entre os destaques positivos, ${topExam.label} lidera no Exame e ${topCcp.label} lidera no CCP/CAP.`
      : 'Os melhores resultados concentram-se em poucas entidades, sugerindo oportunidade clara de transferência de boas práticas.',
    bottomExam && bottomCcp
      ? `Os menores desempenhos ficaram com ${bottomExam.label} no Exame e ${bottomCcp.label} no CCP/CAP, ambos exigindo ação estruturada.`
      : 'Os menores desempenhos exigem priorização gerencial e revisão de processos operacionais e pedagógicos.',
    'A recomendação central é tratar o relatório como instrumento contínuo de gestão, com revisão periódica dos indicadores, leitura sistemática dos comentários e comparação entre entidades.'
  ];
}

function createAnalytics(exameRows, ccpRows, metaExame, metaCcp) {
  const exame = summarizeType(exameRows, 'exame', metaExame);
  const ccp = summarizeType(ccpRows, 'ccp', metaCcp);
  const timeline = collectTimeline([...exameRows, ...ccpRows]);
  const criticalPoints = buildCriticalPoints(exame, ccp);
  const recommendations = buildRecommendations(criticalPoints);

  return {
    exame,
    ccp,
    comparison: compareTypes(exame, ccp),
    criticalPoints,
    recommendations,
    totalResponses: exame.count + ccp.count,
    period: timeline,
    periodLabel: timeline.start && timeline.end
      ? `${formatShortDate(timeline.start)} a ${formatShortDate(timeline.end)}`
      : 'período indisponível',
    executiveSummary: buildExecutiveSummary({
      exame,
      ccp,
      totalResponses: exame.count + ccp.count,
      periodLabel: timeline.start && timeline.end
        ? `${formatShortDate(timeline.start)} a ${formatShortDate(timeline.end)}`
        : 'período indisponível'
    }),
    conclusions: buildConclusions({ exame, ccp })
  };
}

async function loadAnalytics() {
  if (analyticsCache) return analyticsCache;
  await fetchAdminResponses();
  const [metaExame, metaCcp] = await Promise.all([
    ensureQuestionMeta('exame'),
    ensureQuestionMeta('ccp')
  ]);
  analyticsCache = createAnalytics(respostasState.exame, respostasState.ccp, metaExame, metaCcp);
  return analyticsCache;
}

function createMetricCards(container, metrics) {
  if (!container) return;
  container.innerHTML = metrics.map((metric) => `
    <div class="col-md-6 col-xl-3">
      <div class="card metric-card h-100">
        <div class="card-body">
          <h6 class="text-muted">${escapeHtml(metric.title)}</h6>
          <h3 class="mt-3 mb-2">${escapeHtml(metric.value)}</h3>
          <p class="metric-card-note mb-0">${escapeHtml(metric.note || '')}</p>
        </div>
      </div>
    </div>
  `).join('');
}

function renderTrendBars(items, formatter = (value) => formatNumericValue(value)) {
  if (!items.length) {
    return '<p class="text-muted mb-0">Sem dados suficientes para visualização.</p>';
  }
  const max = Math.max(...items.map((item) => Number(item.value) || 0), 1);
  return items.map((item) => `
    <div class="insight-bar-row">
      <div class="insight-bar-head">
        <span>${escapeHtml(item.label)}</span>
        <strong>${escapeHtml(formatter(item.value))}</strong>
      </div>
      <div class="insight-bar-track">
        <span class="insight-bar-fill" style="width:${Math.max(8, (Number(item.value) / max) * 100)}%"></span>
      </div>
    </div>
  `).join('');
}

function renderChartCard(title, description, items, formatter) {
  return `
    <article class="chart-card">
      <div class="chart-card-head">
        <h3>${escapeHtml(title)}</h3>
        <p>${escapeHtml(description)}</p>
      </div>
      <div class="chart-card-body">
        ${renderTrendBars(items, formatter)}
      </div>
    </article>
  `;
}

function renderListGroup(container, items, renderer) {
  if (!container) return;
  container.innerHTML = items.length ? items.map(renderer).join('') : '<p class="text-muted mb-0">Nenhum dado disponível.</p>';
}

function buildDashboardSummary(analytics) {
  const examWorst = analytics.exame.byEntity[analytics.exame.byEntity.length - 1];
  const ccpWorst = analytics.ccp.byEntity[analytics.ccp.byEntity.length - 1];
  return `
    <p>O painel consolida ${analytics.totalResponses} resposta(s) de ${analytics.periodLabel}. O Exame por Provas registrou média ${formatNumericValue(analytics.exame.stats.average)} e o CCP/CAP alcançou ${formatNumericValue(analytics.ccp.stats.average)}.</p>
    <p>Os principais focos de atenção recaem sobre ${escapeHtml(examWorst?.label || 'entidades com menor média no Exame')} e ${escapeHtml(ccpWorst?.label || 'entidades com menor média no CCP/CAP')}, além de comentários recorrentes sobre comunicação, avaliação e infraestrutura.</p>
  `;
}

async function loadDashboard() {
  if (!(await requireAuth())) return;

  try {
    const analytics = await loadAnalytics();
    createMetricCards(document.getElementById('dashboard-cards'), [
      { title: 'Avaliações totais', value: String(analytics.totalResponses), note: analytics.periodLabel },
      { title: 'Média Exame', value: formatNumericValue(analytics.exame.stats.average), note: `${analytics.exame.count} resposta(s)` },
      { title: 'Média CCP/CAP', value: formatNumericValue(analytics.ccp.stats.average), note: `${analytics.ccp.count} resposta(s)` },
      { title: 'Respostas críticas', value: String((analytics.exame.classifications.Crítico || 0) + (analytics.ccp.classifications.Crítico || 0)), note: 'faixa crítica consolidada' }
    ]);

    const topEntidades = [...analytics.exame.byEntity, ...analytics.ccp.byEntity]
      .reduce((acc, item) => {
        const current = acc.get(item.label) || { label: item.label, count: 0, weightedAverage: 0 };
        current.count += item.count;
        current.weightedAverage += item.average * item.count;
        acc.set(item.label, current);
        return acc;
      }, new Map());

    renderListGroup(
      document.getElementById('top-entidades'),
      [...topEntidades.values()].sort((a, b) => b.count - a.count).slice(0, 5),
      (item) => `
        <li class="list-group-item d-flex justify-content-between align-items-center">
          <div>
            <strong>${escapeHtml(item.label)}</strong>
            <div class="text-muted small">média consolidada ${formatNumericValue(item.weightedAverage / item.count)}</div>
          </div>
          <span class="badge bg-primary rounded-pill">${item.count}</span>
        </li>
      `
    );

    const summary = document.getElementById('dashboard-summary');
    if (summary) summary.innerHTML = buildDashboardSummary(analytics);

    const charts = document.getElementById('dashboard-charts');
    if (charts) {
      charts.innerHTML = [
        renderChartCard(
          'Média por entidade no Exame',
          'Comparativo das entidades certificadoras no Exame por Provas.',
          analytics.exame.byEntity.slice(0, 4).map((item) => ({ label: item.label, value: item.average }))
        ),
        renderChartCard(
          'Média por modalidade no CCP/CAP',
          'Diferença de percepção entre modalidades de curso.',
          analytics.ccp.byModality.slice(0, 4).map((item) => ({ label: item.label, value: item.average }))
        ),
        renderChartCard(
          'Classificação consolidada',
          'Distribuição de respostas por faixa de criticidade.',
          [
            { label: 'Crítico', value: (analytics.exame.classifications.Crítico || 0) + (analytics.ccp.classifications.Crítico || 0) },
            { label: 'Atenção', value: (analytics.exame.classifications.Atenção || 0) + (analytics.ccp.classifications.Atenção || 0) },
            { label: 'Adequado', value: (analytics.exame.classifications.Adequado || 0) + (analytics.ccp.classifications.Adequado || 0) },
            { label: 'Destaque', value: (analytics.exame.classifications.Destaque || 0) + (analytics.ccp.classifications.Destaque || 0) }
          ],
          (value) => String(value)
        )
      ].join('');
    }
  } catch (error) {
    redirectToLogin();
  }
}

function updateResponseSummary(type, rows) {
  const target = document.getElementById(type === 'exame' ? 'summary-exame' : 'summary-ccp');
  if (!target) return;

  const criticalCount = rows.filter((item) => normalizeText(getRowClassification(item, type).label) === 'critico').length;
  target.textContent = `${rows.length} resultado(s) • ${criticalCount} crítico(s)`;
}

function getColumnValues(rows, key, type) {
  const values = rows
    .map((item) => {
      if (key === '_classificacao') return getRowClassification(item, type).label;
      return item[key] || '-';
    })
    .filter((value, index, self) => value && self.indexOf(value) === index);

  return values.sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

function matchesDateRange(itemDate, filterValue) {
  if (!filterValue) return true;
  const responseDate = parseResponseDate(itemDate);
  if (!responseDate) return false;

  const start = parseLocalDateInput(filterValue.startDate);
  const end = parseLocalDateInput(filterValue.endDate, true);

  if (start && responseDate < start) return false;
  if (end && responseDate > end) return false;
  return true;
}

function applyFilters(rows, type) {
  const activeFilters = respostasState.filters[type] || {};
  return rows.filter((item) => {
    return Object.entries(activeFilters).every(([key, value]) => {
      if (!value || (typeof value === 'object' && !value.startDate && !value.endDate)) return true;

      if (key === '_classificacao') {
        return getRowClassification(item, type).label === value;
      }

      if (key === 'Data_Recebimento') {
        return matchesDateRange(item[key], value);
      }

      return (item[key] || '') === value;
    });
  });
}

function closeAllFilterMenus() {
  document.querySelectorAll('.table-filter-menu-wrap').forEach((wrap) => wrap.remove());
  document.querySelectorAll('.table-filter-button').forEach((button) => button.classList.remove('active'));
}

function buildDateFilterMarkup(type, key, currentValue) {
  return `
    <div class="table-filter-field">
      <label for="filter-start-${type}-${key}">Data inicial</label>
      <input type="date" class="form-control form-control-sm" id="filter-start-${type}-${key}" value="${currentValue?.startDate || ''}" />
    </div>
    <div class="table-filter-field">
      <label for="filter-end-${type}-${key}">Data final</label>
      <input type="date" class="form-control form-control-sm" id="filter-end-${type}-${key}" value="${currentValue?.endDate || ''}" />
    </div>
    <p class="table-filter-help">Use início, fim ou o intervalo completo. O filtro considera as datas-limite informadas.</p>
  `;
}

function buildSelectFilterMarkup(type, key, values, currentValue) {
  return `
    <div class="table-filter-field">
      <label for="filter-value-${type}-${key}">Seleção</label>
      <select class="form-select form-select-sm" id="filter-value-${type}-${key}">
        <option value="">Todos</option>
        ${values.map((value) => `<option value="${escapeHtml(value)}" ${currentValue === value ? 'selected' : ''}>${escapeHtml(value)}</option>`).join('')}
      </select>
    </div>
  `;
}

function getFilterMenuMarkup(type, key, currentValue) {
  if (key === 'Data_Recebimento') {
    return buildDateFilterMarkup(type, key, currentValue);
  }

  const values = getColumnValues(respostasState[type], key, type);
  return buildSelectFilterMarkup(type, key, values, currentValue);
}

function positionFilterMenu(wrapper, button) {
  const rect = button.getBoundingClientRect();
  const menu = wrapper.firstElementChild;
  const menuRect = menu.getBoundingClientRect();
  const viewportPadding = 16;

  let left = rect.right - menuRect.width;
  left = Math.max(viewportPadding, Math.min(left, window.innerWidth - menuRect.width - viewportPadding));

  let top = rect.bottom + 10;
  if (top + menuRect.height > window.innerHeight - viewportPadding) {
    top = Math.max(viewportPadding, rect.top - menuRect.height - 10);
  }

  wrapper.style.left = `${left}px`;
  wrapper.style.top = `${top}px`;
}

function openColumnFilter(type, key, button) {
  closeAllFilterMenus();

  const currentValue = respostasState.filters[type]?.[key] || (key === 'Data_Recebimento' ? { startDate: '', endDate: '' } : '');
  const wrapper = document.createElement('div');
  wrapper.className = 'table-filter-menu-wrap';
  wrapper.style.position = 'fixed';
  wrapper.style.zIndex = '1200';
  wrapper.dataset.type = type;
  wrapper.dataset.key = key;

  const menu = document.createElement('div');
  menu.className = 'table-filter-menu';
  menu.innerHTML = `
    <div class="table-filter-title">${escapeHtml(button.dataset.label)}</div>
    ${getFilterMenuMarkup(type, key, currentValue)}
    <div class="table-filter-actions">
      <button type="button" class="btn btn-sm btn-outline-secondary" data-action="clear">Limpar</button>
      <button type="button" class="btn btn-sm btn-primary" data-action="apply">Aplicar</button>
    </div>
  `;

  wrapper.appendChild(menu);
  document.body.appendChild(wrapper);
  positionFilterMenu(wrapper, button);
  button.classList.add('active');

  wrapper.addEventListener('click', (event) => event.stopPropagation());

  menu.querySelector('[data-action="clear"]').addEventListener('click', () => {
    delete respostasState.filters[type][key];
    closeAllFilterMenus();
    renderResponsesTable(type);
  });

  menu.querySelector('[data-action="apply"]').addEventListener('click', () => {
    if (!respostasState.filters[type]) respostasState.filters[type] = {};

    if (key === 'Data_Recebimento') {
      const startDate = menu.querySelector(`#filter-start-${type}-${key}`).value;
      const endDate = menu.querySelector(`#filter-end-${type}-${key}`).value;
      if (startDate || endDate) {
        respostasState.filters[type][key] = { startDate, endDate };
      } else {
        delete respostasState.filters[type][key];
      }
    } else {
      const value = menu.querySelector(`#filter-value-${type}-${key}`).value;
      if (value) {
        respostasState.filters[type][key] = value;
      } else {
        delete respostasState.filters[type][key];
      }
    }

    closeAllFilterMenus();
    renderResponsesTable(type);
  });
}

function buildColumnHeader(label, type, key) {
  if (!key) return `<span>${label}</span>`;

  return `
    <div class="table-filter-head">
      <span>${label}</span>
      <button type="button" class="table-filter-button" data-type="${type}" data-key="${key}" data-label="${label}" aria-label="Filtrar ${label}">
        <i class="bi bi-funnel"></i>
      </button>
    </div>
  `;
}

function buildResponseColumns(type) {
  if (type === 'exame') {
    return [
      { label: 'Entidade', key: 'Entidade_Certificadora', filterKey: 'Entidade_Certificadora' },
      { label: 'Certificação', key: 'Tipo_Certificacao', filterKey: 'Tipo_Certificacao' },
      { label: 'Data', value: (item) => formatAdminDate(item.Data_Recebimento), filterKey: 'Data_Recebimento' },
      { label: 'Média', value: (item) => formatNumericValue(item.Media_Geral_Exame) },
      { label: 'Classificação', value: (item) => renderStatusBadge(item, type), filterKey: '_classificacao' },
      { label: '', value: (item) => `<button class="table-action-icon" type="button" onclick="showRespostaDetalhe('${item.ID_Avaliacao}')" aria-label="Ver detalhes"><i class="bi bi-eye"></i></button>` }
    ];
  }

  return [
    { label: 'Entidade', key: 'Entidade_Certificadora', filterKey: 'Entidade_Certificadora' },
    { label: 'Modalidade', key: 'Modalidade_CCP_CAP', filterKey: 'Modalidade_CCP_CAP' },
    { label: 'Data', value: (item) => formatAdminDate(item.Data_Recebimento), filterKey: 'Data_Recebimento' },
    { label: 'Nota Global', value: (item) => formatNumericValue(item.Nota_Global_Ponderada) },
    { label: 'Classificação', value: (item) => renderStatusBadge(item, type), filterKey: '_classificacao' },
    { label: '', value: (item) => `<button class="table-action-icon" type="button" onclick="showRespostaDetalhe('${item.ID_Avaliacao}')" aria-label="Ver detalhes"><i class="bi bi-eye"></i></button>` }
  ];
}

function renderResponsesTable(type) {
  const table = document.getElementById(type === 'exame' ? 'table-exame' : 'table-ccp');
  if (!table) return;

  const rows = applyFilters(respostasState[type], type);
  const columns = buildResponseColumns(type);
  updateResponseSummary(type, rows);

  table.innerHTML = '';

  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  columns.forEach((col) => {
    const th = document.createElement('th');
    th.innerHTML = buildColumnHeader(col.label, type, col.filterKey);
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  if (!rows.length) {
    const emptyRow = document.createElement('tr');
    emptyRow.innerHTML = `<td colspan="${columns.length}" class="text-center text-muted py-4">Nenhuma resposta localizada.</td>`;
    tbody.appendChild(emptyRow);
  } else {
    rows.forEach((item) => {
      const row = document.createElement('tr');
      columns.forEach((col) => {
        const cell = document.createElement('td');
        if (typeof col.value === 'function') {
          cell.innerHTML = col.value(item);
        } else {
          cell.textContent = item[col.key] || '-';
        }
        row.appendChild(cell);
      });
      tbody.appendChild(row);
    });
  }
  table.appendChild(tbody);

  table.querySelectorAll('.table-filter-button').forEach((button) => {
    const activeFilter = respostasState.filters[type]?.[button.dataset.key];
    const isActive = Boolean(typeof activeFilter === 'object' ? activeFilter?.startDate || activeFilter?.endDate : activeFilter);
    button.classList.toggle('active', isActive);
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      const alreadyOpen = document.querySelector('.table-filter-menu-wrap');
      if (alreadyOpen && alreadyOpen.dataset.key === button.dataset.key && alreadyOpen.dataset.type === type) {
        closeAllFilterMenus();
        return;
      }
      openColumnFilter(type, button.dataset.key, button);
    });
  });
}

function getIdentificationFields(type) {
  if (type === 'exame') {
    return [
      { key: 'ID_Avaliacao', label: 'ID da avaliação' },
      { key: 'Data_Recebimento', label: 'Data de recebimento', format: 'date' },
      { key: 'Identificacao_Respondente', label: 'Identificação do respondente' },
      { key: 'Entidade_Certificadora', label: 'Entidade certificadora' },
      { key: 'Tipo_Certificacao', label: 'Tipo de certificação' },
      { key: 'Nivel_Certificacao', label: 'Nível da certificação' },
      { key: 'Modalidade_Prova', label: 'Modalidade da prova' },
      { key: 'Data_Exame', label: 'Data do exame', format: 'date' }
    ];
  }

  return [
    { key: 'ID_Avaliacao', label: 'ID da avaliação' },
    { key: 'Data_Recebimento', label: 'Data de recebimento', format: 'date' },
    { key: 'Identificacao_Respondente', label: 'Identificação do respondente' },
    { key: 'Entidade_Certificadora', label: 'Entidade certificadora' },
    { key: 'Modalidade_CCP_CAP', label: 'Modalidade CCP/CAP' },
    { key: 'Tipo_Certificacao', label: 'Tipo de certificação' },
    { key: 'Data_Curso', label: 'Data do curso', format: 'date' }
  ];
}

function getMetricFields(type) {
  if (type === 'exame') {
    return [
      { label: 'Classificação', render: (item) => renderStatusBadge(item, type) },
      { label: 'Média geral do exame', render: (item) => formatNumericValue(item.Media_Geral_Exame) },
      { label: 'Flag crítico', render: (item) => item.Flag_Critico || 'FALSO' }
    ];
  }

  return [
    { label: 'Classificação', render: (item) => renderStatusBadge(item, type) },
    { label: 'Média eixo 1', render: (item) => formatNumericValue(item.Media_Eixo1) },
    { label: 'Média eixo 2', render: (item) => formatNumericValue(item.Media_Eixo2) },
    { label: 'Média eixo 3', render: (item) => formatNumericValue(item.Media_Eixo3) },
    { label: 'Nota global ponderada', render: (item) => formatNumericValue(item.Nota_Global_Ponderada) }
  ];
}

function formatFieldValue(value, format) {
  if (!value) return '-';
  if (format === 'date') return formatAdminDate(value);
  return value;
}

function buildSummaryCard(label, value, isRich = false) {
  return `
    <article class="response-summary-card ${isRich ? 'rich' : ''}">
      <span class="response-summary-label">${escapeHtml(label)}</span>
      <div class="response-summary-value">${isRich ? value : escapeHtml(value)}</div>
    </article>
  `;
}

function detectQuestionType(meta) {
  const fieldType = normalizeText(String(meta?.Tipo_Campo || ''));
  if (fieldType.includes('radio') || fieldType.includes('nota') || fieldType.includes('escala')) {
    return 'score';
  }
  return 'text';
}

function getBlockFallbackTitle(type, blockKey) {
  const exameTitles = {
    B0: 'Identificação da avaliação',
    B1: 'Organização e infraestrutura',
    B2: 'Conduta e imparcialidade',
    B3: 'Conteúdo e adequação',
    B4: 'Integridade do processo',
    B5: 'Bloco específico - provas online',
    B6: 'Avaliação geral do exame'
  };

  const ccpTitles = {
    E0: 'Identificação da avaliação',
    E1: 'Avaliação institucional/regulatória',
    E2: 'Avaliação pedagógica',
    E3: 'Avaliação geral do curso'
  };

  return type === 'exame'
    ? (exameTitles[blockKey] || `Bloco ${blockKey}`)
    : (ccpTitles[blockKey] || `Eixo ${blockKey}`);
}

function buildQuestionSections(item, type, metaRows) {
  const safeMetaRows = Array.isArray(metaRows) ? metaRows : [];
  const renderedKeys = new Set();
  const blocks = new Map();

  safeMetaRows.forEach((meta, index) => {
    const code = meta.Codigo_Pergunta;
    if (!code || !Object.prototype.hasOwnProperty.call(item, code)) return;

    const rawValue = item[code];
    if (rawValue === '' || rawValue === null || typeof rawValue === 'undefined') return;

    renderedKeys.add(code);
    const blockKey = meta.Bloco_Eixo || code.split('_')[0];
    if (!blocks.has(blockKey)) {
      blocks.set(blockKey, {
        order: index,
        title: meta.Nome_Bloco_Eixo || getBlockFallbackTitle(type, blockKey),
        items: []
      });
    }

    blocks.get(blockKey).items.push({
      code,
      label: meta.Observacao || formatDetailLabel(code),
      value: rawValue,
      kind: detectQuestionType(meta)
    });
  });

  const narrativeItems = Object.entries(item)
    .filter(([key, value]) => {
      if (!value) return false;
      if (renderedKeys.has(key)) return false;
      return key.startsWith('Justificativa') || key === 'Avaliacao_Geral_Texto' || key === 'Observacoes_Finais';
    })
    .map(([key, value]) => ({ label: formatDetailLabel(key), value }));

  return {
    blocks: [...blocks.entries()]
      .sort((a, b) => a[1].order - b[1].order)
      .map(([blockKey, data]) => ({ blockKey, ...data })),
    narrativeItems
  };
}

function buildQuestionAnswerItem(entry) {
  const isScore = entry.kind === 'score' && Number.isFinite(Number(entry.value));
  return `
    <article class="response-answer-item ${isScore ? 'score' : 'text'}">
      <div class="response-answer-text">
        <span class="response-answer-code">${escapeHtml(entry.code)}</span>
        <h4>${escapeHtml(entry.label)}</h4>
      </div>
      <div class="response-answer-value">
        ${isScore
          ? `<span class="response-score-badge">${formatNumericValue(entry.value)}</span>`
          : `<div class="response-answer-copy">${escapeHtml(entry.value)}</div>`}
      </div>
    </article>
  `;
}

function buildNarrativeItem(entry) {
  return `
    <article class="response-narrative-item">
      <h4>${escapeHtml(entry.label)}</h4>
      <p>${escapeHtml(entry.value)}</p>
    </article>
  `;
}

function buildQuestionSectionsMarkup(sections) {
  const blockMarkup = sections.blocks.map((block) => `
    <section class="response-detail-section">
      <div class="response-detail-section-head">
        <div class="response-panel-kicker">Bloco</div>
        <h3>${escapeHtml(block.title)}</h3>
      </div>
      <div class="response-answer-list">
        ${block.items.map(buildQuestionAnswerItem).join('')}
      </div>
    </section>
  `).join('');

  const narrativeMarkup = sections.narrativeItems.length
    ? `
      <section class="response-detail-section">
        <div class="response-detail-section-head">
          <div class="response-panel-kicker">Comentários</div>
          <h3>Justificativas e observações</h3>
        </div>
        <div class="response-narrative-list">
          ${sections.narrativeItems.map(buildNarrativeItem).join('')}
        </div>
      </section>
    `
    : '';

  return `${blockMarkup}${narrativeMarkup}`;
}

async function buildDetailModalMarkup(item) {
  const type = getResponseType(item);
  const metaRows = await ensureQuestionMeta(type);
  const summaryFields = getIdentificationFields(type);
  const metricFields = getMetricFields(type);
  const status = getRowClassification(item, type);
  const sections = buildQuestionSections(item, type, metaRows);

  const summaryMarkup = summaryFields
    .map((field) => buildSummaryCard(field.label, formatFieldValue(item[field.key], field.format)))
    .join('');

  const metricMarkup = metricFields
    .map((field) => buildSummaryCard(field.label, field.render(item), field.label === 'Classificação'))
    .join('');

  return `
    <div class="response-modal-backdrop" data-close-modal="true">
      <div class="response-modal-card" role="dialog" aria-modal="true" aria-labelledby="response-modal-title">
        <div class="response-modal-header">
          <div>
            <div class="response-panel-kicker mb-2">${type === 'exame' ? 'Exame por Provas' : 'CCP/CAP'}</div>
            <h2 id="response-modal-title">Detalhes da resposta</h2>
            <p class="response-modal-subtitle">Leitura estruturada da avaliação, com identificação, métricas e respostas por bloco.</p>
          </div>
          <div class="response-modal-topbar">
            <span class="status-badge ${status.className}">${status.label}</span>
            <button type="button" class="response-modal-close" aria-label="Fechar detalhes" onclick="closeRespostaDetalheModal()">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>
        </div>
        <div class="response-modal-body">
          <section class="response-detail-section">
            <div class="response-detail-section-head">
              <div class="response-panel-kicker">Identificação</div>
              <h3>Informações principais</h3>
            </div>
            <div class="response-summary-grid">
              ${summaryMarkup}
            </div>
          </section>

          <section class="response-detail-section">
            <div class="response-detail-section-head">
              <div class="response-panel-kicker">Resultado</div>
              <h3>Métricas da avaliação</h3>
            </div>
            <div class="response-summary-grid compact">
              ${metricMarkup}
            </div>
          </section>

          ${buildQuestionSectionsMarkup(sections)}
        </div>
      </div>
    </div>
  `;
}

async function loadRespostas() {
  if (!(await requireAuth())) return;

  try {
    await fetchAdminResponses();
    respostasState.filters = { exame: {}, ccp: {} };
    renderResponsesTable('exame');
    renderResponsesTable('ccp');
  } catch (error) {
    redirectToLogin();
  }
}

function closeRespostaDetalheModal() {
  document.getElementById('response-detail-modal')?.remove();
  document.body.classList.remove('modal-open');
}

async function showRespostaDetalhe(id) {
  if (!(await requireAuth())) return;

  try {
    const result = await apiGet(`/api/admin/respostas/${id}`, getAdminHeaders());
    closeRespostaDetalheModal();

    const modal = document.createElement('div');
    modal.id = 'response-detail-modal';
    modal.innerHTML = await buildDetailModalMarkup(result.resposta);
    document.body.appendChild(modal);
    document.body.classList.add('modal-open');

    modal.querySelector('[data-close-modal="true"]').addEventListener('click', (event) => {
      if (event.target.dataset.closeModal === 'true') {
        closeRespostaDetalheModal();
      }
    });
  } catch (error) {
    alert(error.message || 'Não foi possível carregar o detalhe da resposta.');
  }
}

function buildAlertCards(analytics) {
  return [
    {
      title: 'Entidades críticas',
      value: String(
        [analytics.exame.byEntity, analytics.ccp.byEntity]
          .flat()
          .filter((item) => item.average <= 2.5).length
      ),
      note: 'média até 2,5'
    },
    {
      title: 'Comentários negativos',
      value: String(
        [...analytics.exame.comments, ...analytics.ccp.comments]
          .filter((item) => item.sentiment === 'Negativo').length
      ),
      note: 'classificação heurística'
    },
    {
      title: 'Blocos sensíveis',
      value: String(
        [...analytics.exame.byBlock, ...analytics.ccp.byBlock]
          .filter((item) => item.average <= 3).length
      ),
      note: 'média até 3,0'
    }
  ];
}

async function loadAlertasPage() {
  if (!(await requireAuth())) return;

  try {
    const analytics = await loadAnalytics();
    createMetricCards(document.getElementById('alert-cards'), buildAlertCards(analytics));

    const entityContainer = document.getElementById('alert-entities');
    renderListGroup(
      entityContainer,
      [
        ...analytics.exame.byEntity.map((item) => ({ ...item, source: 'Exame por Provas' })),
        ...analytics.ccp.byEntity.map((item) => ({ ...item, source: 'CCP/CAP' }))
      ]
        .filter((item) => item.average <= 3.2)
        .sort((a, b) => a.average - b.average)
        .slice(0, 8),
      (item) => `
        <article class="alert-list-item">
          <div class="alert-list-top">
            <strong>${escapeHtml(item.label)}</strong>
            <span class="status-badge ${item.average <= 2.5 ? 'critico' : 'atencao'}">${item.source}</span>
          </div>
          <p>Média ${formatNumericValue(item.average)} em ${item.count} resposta(s).</p>
        </article>
      `
    );

    const responseContainer = document.getElementById('alert-responses');
    renderListGroup(
      responseContainer,
      [...respostasState.exame, ...respostasState.ccp]
        .filter((item) => getRowClassification(item, getResponseType(item)).label === 'Crítico')
        .sort((a, b) => getRowAverage(a, getResponseType(a)) - getRowAverage(b, getResponseType(b)))
        .slice(0, 8),
      (item) => {
        const type = getResponseType(item);
        return `
          <article class="alert-list-item">
            <div class="alert-list-top">
              <strong>${escapeHtml(item.ID_Avaliacao || '-')}</strong>
              ${renderStatusBadge(item, type)}
            </div>
            <p>${escapeHtml(item.Entidade_Certificadora || 'Não informada')} • média ${formatNumericValue(getRowAverage(item, type))}</p>
          </article>
        `;
      }
    );

    const commentContainer = document.getElementById('alert-comments');
    const categoryItems = [...analytics.exame.categories, ...analytics.ccp.categories]
      .reduce((acc, item) => {
        const current = acc.get(item.label) || { label: item.label, count: 0 };
        current.count += item.count;
        acc.set(item.label, current);
        return acc;
      }, new Map());

    renderListGroup(
      commentContainer,
      [...categoryItems.values()].sort((a, b) => b.count - a.count).slice(0, 8),
      (item) => `
        <article class="alert-list-item">
          <div class="alert-list-top">
            <strong>${escapeHtml(item.label)}</strong>
            <span class="alert-chip">${item.count}</span>
          </div>
          <p>Tema recorrente nos comentários abertos, com potencial impacto na percepção institucional.</p>
        </article>
      `
    );
  } catch (error) {
    redirectToLogin();
  }
}

function buildNarrativeParagraphs(paragraphs) {
  return paragraphs.map((text) => `<p>${escapeHtml(text)}</p>`).join('');
}

function buildQuantitativeNarrative(title, summary, worstBlock, topEntity, bottomEntity) {
  const paragraphs = [summary];
  if (topEntity) {
    paragraphs.push(`${topEntity.label} registra o melhor desempenho agregado, com média ${formatNumericValue(topEntity.average)} em ${topEntity.count} resposta(s).`);
  }
  if (bottomEntity) {
    paragraphs.push(`${bottomEntity.label} apresenta o menor desempenho agregado, com média ${formatNumericValue(bottomEntity.average)} e desvio padrão ${formatNumericValue(bottomEntity.stddev)}.`);
  }
  if (worstBlock) {
    paragraphs.push(`O bloco temático mais sensível é ${worstBlock.label}, cuja média foi ${formatNumericValue(worstBlock.average)}.`);
  }
  return `
    <div class="report-copy-block">
      <h3>${escapeHtml(title)}</h3>
      ${buildNarrativeParagraphs(paragraphs)}
    </div>
  `;
}

function buildQualitativeNarrative(analytics) {
  const allComments = [...analytics.exame.comments, ...analytics.ccp.comments];
  const bySentiment = aggregateCommentsBy(allComments, 'sentiment');
  const byCategory = aggregateCommentsBy(allComments, 'category');
  const paragraphs = [
    `Foram coletados ${allComments.length} comentário(s) abertos. A distribuição automática por sentimento aponta ${bySentiment.map((item) => `${item.label}: ${item.count}`).join(', ')}.`,
    `Os temas mais recorrentes concentram-se em ${byCategory.slice(0, 3).map((item) => item.label.toLowerCase()).join(', ')}.`,
    'A leitura qualitativa sugere que os comentários críticos estão menos associados à integridade do processo e mais ligados à clareza operacional, experiência do respondente e desenho pedagógico.'
  ];
  return buildNarrativeParagraphs(paragraphs);
}

function buildCriticalPointsMarkup(points) {
  return points.map((point) => `
    <article class="report-list-item">
      <div class="report-list-top">
        <strong>${escapeHtml(point.title)}</strong>
        <span class="status-badge ${point.level === 'Crítico' ? 'critico' : point.level === 'Atenção' ? 'atencao' : 'adequado'}">${escapeHtml(point.level)}</span>
      </div>
      <p>${escapeHtml(point.detail)}</p>
    </article>
  `).join('');
}

function buildRecommendationsMarkup(recommendations) {
  return recommendations.map((recommendation) => `
    <article class="report-list-item">
      <div class="report-list-top">
        <strong>${escapeHtml(recommendation.code)} • ${escapeHtml(recommendation.title)}</strong>
      </div>
      <p>${escapeHtml(recommendation.detail)}</p>
    </article>
  `).join('');
}

async function loadRelatoriosPage() {
  if (!(await requireAuth())) return;

  try {
    const analytics = await loadAnalytics();

    const reportPeriod = document.getElementById('report-period');
    if (reportPeriod) reportPeriod.textContent = analytics.periodLabel;

    const executiveSummary = document.getElementById('report-executive-summary');
    if (executiveSummary) executiveSummary.innerHTML = buildNarrativeParagraphs(analytics.executiveSummary);

    createMetricCards(document.getElementById('report-summary-cards'), [
      { title: 'Respondentes totais', value: String(analytics.totalResponses), note: analytics.periodLabel },
      { title: 'Média geral Exame', value: formatNumericValue(analytics.exame.stats.average), note: `desvio ${formatNumericValue(analytics.exame.stats.stddev)}` },
      { title: 'Média geral CCP/CAP', value: formatNumericValue(analytics.ccp.stats.average), note: `desvio ${formatNumericValue(analytics.ccp.stats.stddev)}` },
      { title: 'Comentários coletados', value: String(analytics.exame.comments.length + analytics.ccp.comments.length), note: 'base qualitativa' }
    ]);

    const chartGrid = document.getElementById('report-chart-grid');
    if (chartGrid) {
      chartGrid.innerHTML = [
        renderChartCard('Gráfico 01 - Exame por Entidade', 'Média das entidades certificadoras no Exame.', analytics.exame.byEntity.map((item) => ({ label: item.label, value: item.average }))),
        renderChartCard('Gráfico 02 - Exame por Nível', 'Comparativo por nível de certificação.', analytics.exame.byLevel.map((item) => ({ label: item.label, value: item.average }))),
        renderChartCard('Gráfico 03 - Exame por Modalidade', 'Percepção por modalidade da prova.', analytics.exame.byModality.map((item) => ({ label: item.label, value: item.average }))),
        renderChartCard('Gráfico 04 - Exame por Blocos', 'Média por bloco temático do Exame.', analytics.exame.byBlock.map((item) => ({ label: item.label, value: item.average }))),
        renderChartCard('Gráfico 05 - CCP/CAP por Entidade', 'Média das entidades certificadoras em CCP/CAP.', analytics.ccp.byEntity.map((item) => ({ label: item.label, value: item.average }))),
        renderChartCard('Gráfico 06 - CCP/CAP por Modalidade', 'Comparativo por modalidade de curso.', analytics.ccp.byModality.map((item) => ({ label: item.label, value: item.average }))),
        renderChartCard('Gráfico 07 - CCP/CAP por Blocos', 'Média por bloco/eixo temático do CCP/CAP.', analytics.ccp.byBlock.map((item) => ({ label: item.label, value: item.average }))),
        renderChartCard('Gráfico 08 - Sentimentos Exame', 'Distribuição de comentários do Exame.', analytics.exame.sentiments.map((item) => ({ label: item.label, value: item.count })), (value) => String(value)),
        renderChartCard('Gráfico 09 - Sentimentos CCP/CAP', 'Distribuição de comentários do CCP/CAP.', analytics.ccp.sentiments.map((item) => ({ label: item.label, value: item.count })), (value) => String(value)),
        renderChartCard('Gráfico 10 - Categorias Exame', 'Categorias de comentários do Exame.', analytics.exame.categories.map((item) => ({ label: item.label, value: item.count })), (value) => String(value)),
        renderChartCard('Gráfico 11 - Categorias CCP/CAP', 'Categorias de comentários do CCP/CAP.', analytics.ccp.categories.map((item) => ({ label: item.label, value: item.count })), (value) => String(value)),
        renderChartCard('Gráfico 12 - Comparação Geral', 'Comparação entre os dois instrumentos.', analytics.comparison.map((item) => ({ label: item.label, value: item.average })))
      ].join('');
    }

    const quantExame = document.getElementById('report-quant-exame');
    if (quantExame) {
      quantExame.innerHTML = buildQuantitativeNarrative(
        'Leitura do Exame por Provas',
        `O Exame por Provas registrou média ${formatNumericValue(analytics.exame.stats.average)}, mediana ${formatNumericValue(analytics.exame.stats.median)} e desvio padrão ${formatNumericValue(analytics.exame.stats.stddev)}.`,
        analytics.exame.byBlock[0],
        analytics.exame.byEntity[0],
        analytics.exame.byEntity[analytics.exame.byEntity.length - 1]
      );
    }

    const quantCcp = document.getElementById('report-quant-ccp');
    if (quantCcp) {
      quantCcp.innerHTML = buildQuantitativeNarrative(
        'Leitura do CCP/CAP',
        `O CCP/CAP registrou média ${formatNumericValue(analytics.ccp.stats.average)}, mediana ${formatNumericValue(analytics.ccp.stats.median)} e desvio padrão ${formatNumericValue(analytics.ccp.stats.stddev)}.`,
        analytics.ccp.byBlock[0],
        analytics.ccp.byEntity[0],
        analytics.ccp.byEntity[analytics.ccp.byEntity.length - 1]
      );
    }

    const qualitative = document.getElementById('report-qualitative');
    if (qualitative) qualitative.innerHTML = buildQualitativeNarrative(analytics);

    const critical = document.getElementById('report-critical-points');
    if (critical) critical.innerHTML = buildCriticalPointsMarkup(analytics.criticalPoints);

    const recommendations = document.getElementById('report-recommendations');
    if (recommendations) recommendations.innerHTML = buildRecommendationsMarkup(analytics.recommendations);

    const conclusions = document.getElementById('report-conclusions');
    if (conclusions) conclusions.innerHTML = buildNarrativeParagraphs(analytics.conclusions);
  } catch (error) {
    redirectToLogin();
  }
}

async function downloadPlanilhaAdmin() {
  if (!(await requireAuth())) return;

  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/download-planilha`, {
      method: 'GET',
      headers: {
        ...getAdminHeaders()
      }
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Não foi possível baixar a planilha.');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SIA-${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    alert(error.message || 'Não foi possível baixar a planilha.');
  }
}

window.addEventListener('click', () => {
  closeAllFilterMenus();
});

window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeAllFilterMenus();
    closeRespostaDetalheModal();
  }
});

window.addEventListener('resize', () => {
  closeAllFilterMenus();
});

window.addEventListener('scroll', () => {
  closeAllFilterMenus();
}, true);

window.addEventListener('DOMContentLoaded', () => {
  const logoutButton = document.getElementById('logout-button');
  if (logoutButton) logoutButton.addEventListener('click', redirectToLogin);

  const downloadButton = document.getElementById('download-planilha');
  if (downloadButton) downloadButton.addEventListener('click', downloadPlanilhaAdmin);

  if (document.getElementById('login-form')) {
    handleLogin();
    return;
  }

  if (!getAuthToken()) {
    redirectToLogin();
    return;
  }

  if (document.getElementById('dashboard-cards')) {
    loadDashboard();
  }

  if (document.getElementById('table-exame')) {
    loadRespostas();
  }

  if (document.getElementById('alert-cards')) {
    loadAlertasPage();
  }

  if (document.getElementById('report-summary-cards')) {
    loadRelatoriosPage();
  }
});
