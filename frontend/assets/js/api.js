const API_BASE_URL = window.API_BASE_URL || 'http://localhost:3000';

async function apiGet(path, extraHeaders = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...extraHeaders
    }
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Erro ao consultar a API');
  }
  return data;
}

async function apiPost(path, body, extraHeaders = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...extraHeaders
    },
    body: JSON.stringify(body)
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Erro ao salvar dados');
  }
  return data;
}

function setAuthToken(token) {
  localStorage.setItem('sia_admin_token', token);
}

function getAuthToken() {
  return localStorage.getItem('sia_admin_token');
}

function clearAuthToken() {
  localStorage.removeItem('sia_admin_token');
}

function showMessage(container, message, type = 'success') {
  if (!container) return;
  container.innerHTML = `<div class="alert alert-${type}" role="alert">${message}</div>`;
}

function formatNumber(value) {
  const number = Number(value);
  if (Number.isNaN(number)) return value || '-';
  return number.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function createTable(tableElement, rows, visibleColumns) {
  if (!tableElement) return;
  tableElement.innerHTML = '';
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  visibleColumns.forEach((col) => {
    const th = document.createElement('th');
    th.textContent = col.label;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  tableElement.appendChild(thead);

  const tbody = document.createElement('tbody');
  if (!rows || !rows.length) {
    const emptyRow = document.createElement('tr');
    emptyRow.innerHTML = `<td colspan="${visibleColumns.length}" class="text-center text-muted py-4">Nenhuma resposta localizada.</td>`;
    tbody.appendChild(emptyRow);
  } else {
    rows.forEach((item) => {
      const row = document.createElement('tr');
      visibleColumns.forEach((col) => {
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
  tableElement.appendChild(tbody);
}
