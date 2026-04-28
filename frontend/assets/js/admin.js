let respostasState = {
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

function normalizeStatusLabel(status) {
  return status
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function formatNumericValue(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return value || '-';
  return numeric.toLocaleString('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2
  });
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

async function loadDashboard() {
  if (!(await requireAuth())) return;

  const cardsContainer = document.getElementById('dashboard-cards');
  const topEntidadesList = document.getElementById('top-entidades');

  try {
    const data = await apiGet('/api/admin/dashboard', getAdminHeaders());
    cardsContainer.innerHTML = '';

    const metrics = [
      { title: 'Avaliações totais', value: data.totalAvaliacoes },
      { title: 'Exames cadastrados', value: data.exameCount },
      { title: 'CCP/CAP cadastrados', value: data.ccpCount },
      { title: 'Respostas críticas', value: data.criticaCount }
    ];

    metrics.forEach((metric) => {
      const card = document.createElement('div');
      card.className = 'col-md-6 col-xl-3';
      card.innerHTML = `
        <div class="card metric-card">
          <div class="card-body">
            <h6 class="text-muted">${metric.title}</h6>
            <h3 class="mt-3 mb-0">${metric.value}</h3>
          </div>
        </div>
      `;
      cardsContainer.appendChild(card);
    });

    topEntidadesList.innerHTML = data.topEntidades.length
      ? data.topEntidades.map((item) => `
          <li class="list-group-item d-flex justify-content-between align-items-center">
            ${item.entidade}
            <span class="badge bg-primary rounded-pill">${item.total}</span>
          </li>
        `).join('')
      : '<li class="list-group-item text-muted">Nenhuma entidade registrada ainda.</li>';
  } catch (error) {
    redirectToLogin();
  }
}

function renderStatusBadge(item, type) {
  const status = getRowClassification(item, type);
  return `<span class="status-badge ${status.className}">${status.label}</span>`;
}

function updateResponseSummary(type, rows) {
  const target = document.getElementById(type === 'exame' ? 'summary-exame' : 'summary-ccp');
  if (!target) return;

  const criticalCount = rows.filter((item) => normalizeStatusLabel(getRowClassification(item, type).label) === 'critico').length;
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
  const viewportPadding = 16;
  const menuRect = menu.getBoundingClientRect();

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
  if (!key) {
    return `<span>${label}</span>`;
  }

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
    const isActive = Boolean(
      typeof activeFilter === 'object'
        ? activeFilter?.startDate || activeFilter?.endDate
        : activeFilter
    );

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
  if (format === 'number') return formatNumericValue(value);
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
  const fieldType = normalizeStatusLabel(String(meta?.Tipo_Campo || ''));
  if (fieldType.includes('radio') || fieldType.includes('nota') || fieldType.includes('escala')) {
    return 'score';
  }
  return 'text';
}

async function ensureQuestionMeta(type) {
  if (questionMetaCache[type]) return questionMetaCache[type];

  try {
    const formulario = type === 'exame' ? 'exame-provas' : 'ccp-cap';
    const rows = await apiGet(`/api/perguntas/${formulario}`);
    questionMetaCache[type] = rows || [];
  } catch (error) {
    questionMetaCache[type] = [];
  }

  return questionMetaCache[type];
}

function getBlockFallbackTitle(type, blockKey) {
  const exameTitles = {
    'B0': 'Identificação da avaliação',
    'B1': 'Organização e infraestrutura',
    'B2': 'Conduta e imparcialidade',
    'B3': 'Conteúdo e adequação',
    'B4': 'Integridade do processo',
    'B5': 'Bloco específico - provas online',
    'B6': 'Avaliação geral do exame'
  };

  const ccpTitles = {
    'E0': 'Identificação da avaliação',
    'E1': 'Avaliação institucional/regulatória',
    'E2': 'Avaliação pedagógica',
    'E3': 'Avaliação geral do curso'
  };

  return type === 'exame'
    ? (exameTitles[blockKey] || `Bloco ${blockKey}`)
    : (ccpTitles[blockKey] || `Eixo ${blockKey}`);
}

function buildQuestionSections(item, type, metaRows) {
  const renderedKeys = new Set();
  const blocks = new Map();

  metaRows.forEach((meta, index) => {
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
      return (
        key.startsWith('Justificativa') ||
        key === 'Avaliacao_Geral_Texto' ||
        key === 'Observacoes_Finais'
      );
    })
    .map(([key, value]) => ({
      label: formatDetailLabel(key),
      value
    }));

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
    const data = await apiGet('/api/admin/respostas', getAdminHeaders());
    respostasState.exame = data.exame || [];
    respostasState.ccp = data.ccp || [];
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
  if (logoutButton) {
    logoutButton.addEventListener('click', redirectToLogin);
  }

  const downloadButton = document.getElementById('download-planilha');
  if (downloadButton) {
    downloadButton.addEventListener('click', downloadPlanilhaAdmin);
  }

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
});
