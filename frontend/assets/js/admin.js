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
      card.innerHTML = `<div class="card metric-card"><div class="card-body"><h6 class="text-muted">${metric.title}</h6><h3 class="mt-3 mb-0">${metric.value}</h3></div></div>`;
      cardsContainer.appendChild(card);
    });

    topEntidadesList.innerHTML = data.topEntidades.length
      ? data.topEntidades.map((item) => `<li class="list-group-item d-flex justify-content-between align-items-center">${item.entidade}<span class="badge bg-primary rounded-pill">${item.total}</span></li>`).join('')
      : '<li class="list-group-item text-muted">Nenhuma entidade registrada ainda.</li>';
  } catch (error) {
    redirectToLogin();
  }
}

function createDetailCard(item) {
  return Object.entries(item)
    .map(([key, value]) => {
      const formattedValue = key.toLowerCase().includes('data') ? formatAdminDate(value) : (value || '-');
      return `<dt class="col-sm-4">${formatDetailLabel(key)}</dt><dd class="col-sm-8">${formattedValue}</dd>`;
    })
    .join('');
}

function buildDetailMarkup(item) {
  return `
    <div class="card-body">
      <div class="d-flex justify-content-between align-items-start gap-3">
        <h5 class="mb-3">Detalhes da resposta</h5>
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

async function loadRespostas() {
  if (!(await requireAuth())) return;
  const tableExame = document.getElementById('table-exame');
  const tableCcp = document.getElementById('table-ccp');

  try {
    const data = await apiGet('/api/admin/respostas', getAdminHeaders());
    const exameColumns = [
      { label: 'Entidade', key: 'Entidade_Certificadora' },
      { label: 'Certificação', key: 'Tipo_Certificacao' },
      { label: 'Data', value: (item) => formatAdminDate(item.Data_Recebimento) },
      { label: 'Média', key: 'Media_Geral_Exame' },
      { label: 'Ação', value: (item) => `<button class="btn btn-sm btn-outline-primary" onclick="showRespostaDetalhe('${item.ID_Avaliacao}')"><i class="bi bi-eye"></i>Ver</button>` }
    ];
    const ccpColumns = [
      { label: 'Entidade', key: 'Entidade_Certificadora' },
      { label: 'Modalidade', key: 'Modalidade_CCP_CAP' },
      { label: 'Data', value: (item) => formatAdminDate(item.Data_Recebimento) },
      { label: 'Nota Global', key: 'Nota_Global_Ponderada' },
      { label: 'Ação', value: (item) => `<button class="btn btn-sm btn-outline-primary" onclick="showRespostaDetalhe('${item.ID_Avaliacao}')"><i class="bi bi-eye"></i>Ver</button>` }
    ];

    createTable(tableExame, data.exame, exameColumns);
    createTable(tableCcp, data.ccp, ccpColumns);
  } catch (error) {
    redirectToLogin();
  }
}

async function showRespostaDetalhe(id) {
  if (!(await requireAuth())) return;
  try {
    const result = await apiGet(`/api/admin/respostas/${id}`, getAdminHeaders());
    const detailArea = document.getElementById('resposta-detalhe');
    if (!detailArea) {
      const container = document.createElement('div');
      container.id = 'resposta-detalhe';
      container.className = 'mt-4 card detail-card';
      document.querySelector('main.container')?.appendChild(container);
      container.innerHTML = buildDetailMarkup(result.resposta);
    } else {
      detailArea.innerHTML = buildDetailMarkup(result.resposta);
    }
    document.getElementById('resposta-detalhe')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (error) {
    alert(error.message || 'Não foi possível carregar o detalhe da resposta.');
  }
}

async function loadAlertas() {
  if (!(await requireAuth())) return;
  const container = document.getElementById('alertas-list');
  try {
    const data = await apiGet('/api/admin/alertas', getAdminHeaders());
    container.innerHTML = '';
    const buildCard = (title, rows) => {
      const card = document.createElement('div');
      card.className = 'col-lg-6';
      card.innerHTML = `
        <div class="card h-100">
          <div class="card-body">
            <h5 class="card-title">${title}</h5>
            ${rows.length ? '<ul class="list-group list-group-flush">' + rows.slice(0, 5).map((item) => `<li class="list-group-item"><strong>${item.ID_Avaliacao || '-'}:</strong> ${item.Entidade_Certificadora || item.Modalidade_CCP_CAP || '-'} <span class="badge bg-danger ms-2">Crítico</span></li>`).join('') + '</ul>' : '<p class="text-muted">Sem alertas nesta categoria.</p>'}
          </div>
        </div>`;
      return card;
    };
    container.appendChild(buildCard('Exames críticos', data.exameCriticas || []));
    container.appendChild(buildCard('CCP/CAP críticos', data.ccpCriticas || []));
    container.appendChild(buildCard('Comentários críticos', data.comentarioCritico || []));
  } catch (error) {
    redirectToLogin();
  }
}

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
  if (document.getElementById('alertas-list')) {
    loadAlertas();
  }
});
