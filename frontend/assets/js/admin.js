let respostasState = {
  exame: [],
  ccp: [],
  filters: {
    exame: {},
    ccp: {}
  }
};

function getAdminHeaders() {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function redirectToLogin() {
  clearAuthToken();
  window.location.href = 'admin-login.html';
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

function createDetailCard(item) {
  return Object.entries(item)
    .map(([key, value]) => {
      let formattedValue = value || '-';
      if (key.toLowerCase().includes('data')) {
        formattedValue = formatAdminDate(value);
      } else if (
        key.startsWith('B') ||
        key.startsWith('E') ||
        key.startsWith('Media_') ||
        key === 'Nota_Global_Ponderada'
      ) {
        formattedValue = formatNumericValue(value);
      }

      return `<dt class="col-sm-4">${formatDetailLabel(key)}</dt><dd class="col-sm-8">${formattedValue}</dd>`;
    })
    .join('');
}

function buildDetailMarkup(item) {
  return `
    <div class="card-body">
      <div class="d-flex justify-content-between align-items-start gap-3">
        <div>
          <div class="response-panel-kicker mb-2">Resposta detalhada</div>
          <h5 class="mb-2">Detalhes da resposta</h5>
        </div>
        <button type="button" class="btn btn-sm btn-outline-secondary" onclick="closeRespostaDetalhe()" aria-label="Fechar detalhes">
          <i class="bi bi-x-lg"></i>
        </button>
      </div>
      <dl class="row mb-0">${createDetailCard(item)}</dl>
    </div>
  `;
}

function closeRespostaDetalhe() {
  document.getElementById('resposta-detalhe')?.remove();
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

function getFilterableColumns(type) {
  return type === 'exame'
    ? [
        { key: 'Entidade_Certificadora', label: 'Entidade' },
        { key: 'Tipo_Certificacao', label: 'Certificação' },
        { key: 'Data_Recebimento', label: 'Data' },
        { key: '_classificacao', label: 'Classificação' }
      ]
    : [
        { key: 'Entidade_Certificadora', label: 'Entidade' },
        { key: 'Modalidade_CCP_CAP', label: 'Modalidade' },
        { key: 'Data_Recebimento', label: 'Data' },
        { key: '_classificacao', label: 'Classificação' }
      ];
}

function getColumnValues(rows, key, type) {
  const values = rows
    .map((item) => {
      if (key === '_classificacao') return getRowClassification(item, type).label;
      if (key === 'Data_Recebimento') return formatAdminDate(item[key]);
      return item[key] || '-';
    })
    .filter((value, index, self) => value && self.indexOf(value) === index);

  return values.sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

function applyFilters(rows, type) {
  const activeFilters = respostasState.filters[type] || {};
  return rows.filter((item) => {
    return Object.entries(activeFilters).every(([key, value]) => {
      if (!value) return true;
      if (key === '_classificacao') {
        return getRowClassification(item, type).label === value;
      }
      if (key === 'Data_Recebimento') {
        return formatAdminDate(item[key]) === value;
      }
      return (item[key] || '') === value;
    });
  });
}

function closeAllFilterMenus() {
  document.querySelectorAll('.table-filter-menu-wrap').forEach((wrap) => wrap.remove());
  document.querySelectorAll('.table-filter-button').forEach((button) => button.classList.remove('active'));
}

function openColumnFilter(type, key, button) {
  closeAllFilterMenus();

  const rows = respostasState[type];
  const values = getColumnValues(rows, key, type);
  const currentValue = respostasState.filters[type]?.[key] || '';

  const wrapper = document.createElement('div');
  wrapper.className = 'table-filter-menu-wrap';
  wrapper.style.position = 'absolute';
  wrapper.style.right = '0';
  wrapper.style.top = '2.1rem';
  wrapper.style.zIndex = '20';

  const menu = document.createElement('div');
  menu.className = 'table-filter-menu';
  menu.innerHTML = `
    <label>${button.dataset.label}</label>
    <select class="form-select form-select-sm" id="filter-value-${type}-${key}">
      <option value="">Todos</option>
      ${values.map((value) => `<option value="${value}" ${currentValue === value ? 'selected' : ''}>${value}</option>`).join('')}
    </select>
    <div class="table-filter-actions">
      <button type="button" class="btn btn-sm btn-outline-secondary" data-action="clear">Limpar</button>
      <button type="button" class="btn btn-sm btn-primary" data-action="apply">Aplicar</button>
    </div>
  `;

  wrapper.appendChild(menu);
  button.parentNode.style.position = 'relative';
  button.parentNode.appendChild(wrapper);
  button.classList.add('active');

  menu.addEventListener('click', (event) => event.stopPropagation());

  menu.querySelector('[data-action="clear"]').addEventListener('click', () => {
    delete respostasState.filters[type][key];
    closeAllFilterMenus();
    renderResponsesTable(type);
  });

  menu.querySelector('[data-action="apply"]').addEventListener('click', () => {
    const value = menu.querySelector(`#filter-value-${type}-${key}`).value;
    if (!respostasState.filters[type]) respostasState.filters[type] = {};

    if (value) {
      respostasState.filters[type][key] = value;
    } else {
      delete respostasState.filters[type][key];
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
    const isActive = Boolean(respostasState.filters[type]?.[button.dataset.key]);
    button.classList.toggle('active', isActive);
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      const alreadyOpen = button.parentNode.querySelector('.table-filter-menu-wrap');
      if (alreadyOpen) {
        closeAllFilterMenus();
        return;
      }
      openColumnFilter(type, button.dataset.key, button);
    });
  });
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

async function showRespostaDetalhe(id) {
  if (!(await requireAuth())) return;

  try {
    const result = await apiGet(`/api/admin/respostas/${id}`, getAdminHeaders());
    let detailArea = document.getElementById('resposta-detalhe');

    if (!detailArea) {
      detailArea = document.createElement('section');
      detailArea.id = 'resposta-detalhe';
      detailArea.className = 'card response-panel mt-4';
      document.querySelector('main.container')?.appendChild(detailArea);
    }

    detailArea.innerHTML = buildDetailMarkup(result.resposta);
    detailArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
