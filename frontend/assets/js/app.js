function parseOptions(rows) {
  if (!Array.isArray(rows)) return [];
  return rows
    .map((item) => Object.values(item).find((value) => value && value.toString().trim()))
    .filter((value, index, self) => value && self.indexOf(value) === index)
    .sort((a, b) => a.toString().localeCompare(b.toString(), 'pt-BR'));
}

function createControlField(question, cadastroOptions) {
  const fieldName = question.Codigo_Pergunta || question.Nome_Bloco_Eixo || question.Grupo;
  const required = question.Obrigatoria && question.Obrigatoria.toString().toLowerCase() === 'sim';
  const label = question.Observacao || question.Codigo_Pergunta || question.Nome_Bloco_Eixo;
  const type = question.Tipo_Campo ? question.Tipo_Campo.toString().toLowerCase() : 'texto';
  const fieldWrapper = document.createElement('div');
  fieldWrapper.className = 'mb-3';
  const fieldLabel = document.createElement('label');
  fieldLabel.className = 'form-label';
  fieldLabel.textContent = label;
  fieldLabel.setAttribute('for', fieldName);

  if (type.includes('nota') || fieldName.toLowerCase().includes('b') && fieldName.includes('.')) {
    const select = document.createElement('select');
    select.className = 'form-select';
    select.id = fieldName;
    select.name = fieldName;
    if (!required) select.innerHTML = '<option value="">Selecione</option>';
    for (let i = 1; i <= 5; i += 1) {
      const option = document.createElement('option');
      option.value = i;
      option.textContent = i;
      select.appendChild(option);
    }
    if (required) select.required = true;
    fieldWrapper.appendChild(fieldLabel);
    fieldWrapper.appendChild(select);
    return fieldWrapper;
  }

  if (type.includes('select') || fieldName === 'Entidade_Certificadora' || fieldName === 'Tipo_Certificacao' || fieldName === 'Nivel_Certificacao' || fieldName === 'Modalidade_Prova' || fieldName === 'Modalidade_CCP_CAP') {
    const select = document.createElement('select');
    select.className = 'form-select';
    select.id = fieldName;
    select.name = fieldName;
    select.innerHTML = '<option value="">Selecione</option>';
    const options = cadastroOptions || [];
    options.forEach((optionValue) => {
      const option = document.createElement('option');
      option.value = optionValue;
      option.textContent = optionValue;
      select.appendChild(option);
    });
    if (required) select.required = true;
    fieldWrapper.appendChild(fieldLabel);
    fieldWrapper.appendChild(select);
    return fieldWrapper;
  }

  if (type.includes('texto') || type.includes('observacao') || fieldName.toLowerCase().includes('justificativa')) {
    const textarea = document.createElement('textarea');
    textarea.className = 'form-control';
    textarea.id = fieldName;
    textarea.name = fieldName;
    textarea.rows = 3;
    if (required) textarea.required = true;
    textarea.placeholder = 'Digite sua resposta...';
    fieldWrapper.appendChild(fieldLabel);
    fieldWrapper.appendChild(textarea);
    return fieldWrapper;
  }

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'form-control';
  input.id = fieldName;
  input.name = fieldName;
  input.placeholder = label;
  if (required) input.required = true;
  fieldWrapper.appendChild(fieldLabel);
  fieldWrapper.appendChild(input);
  return fieldWrapper;
}

function createBlockStep(blockKey, blockName, questions, cadastroOptions) {
  const step = document.createElement('div');
  step.className = 'form-step';
  step.dataset.step = blockKey;
  step.innerHTML = `
    <div class="block-card card p-3 mb-4">
      <div class="card-header">${blockName}</div>
      <div class="card-body"></div>
    </div>
  `;
  const container = step.querySelector('.card-body');
  questions.forEach((question) => {
    const inputWrapper = createControlField(question, cadastroOptions[question.Codigo_Pergunta]);
    if (question.Acao_Condicional && question.Acao_Condicional.toLowerCase().includes('justificativa')) {
      inputWrapper.classList.add('conditional-field');
      inputWrapper.dataset.conditional = blockKey;
      inputWrapper.style.display = 'none';
    }
    container.appendChild(inputWrapper);
  });
  return step;
}

function buildCadastroOptions(cadastros) {
  return {
    Entidade_Certificadora: parseOptions(cadastros.CAD_ENTIDADES_CERTIFICADORAS),
    Tipo_Certificacao: parseOptions(cadastros.CAD_TIPOS_CERTIFICACAO),
    Nivel_Certificacao: parseOptions(cadastros.CAD_NIVEIS_CERTIFICACAO),
    Modalidade_Prova: parseOptions(cadastros.CAD_MODALIDADE_PROVA),
    Modalidade_CCP_CAP: parseOptions(cadastros.CAD_MODALIDADE_CCP_CAP)
  };
}

function groupBy(array, key) {
  return array.reduce((acc, item) => {
    const group = item[key] || 'Sem bloco';
    if (!acc[group]) acc[group] = [];
    acc[group].push(item);
    return acc;
  }, {});
}

function updateProgress(currentIndex, total) {
  const progress = document.getElementById('form-progress');
  if (!progress) return;
  const percent = Math.round(((currentIndex + 1) / total) * 100);
  progress.style.width = `${percent}%`;
  progress.textContent = `${percent}%`;
}

function validateStep(step) {
  const inputs = Array.from(step.querySelectorAll('input, textarea, select')); 
  let valid = true;
  inputs.forEach((input) => {
    if (input.required && input.offsetParent !== null && !input.value.trim()) {
      input.classList.add('is-invalid');
      valid = false;
    } else {
      input.classList.remove('is-invalid');
    }
  });
  return valid;
}

function toggleConditionalFields(step, blockKey) {
  const fields = step.querySelectorAll(`.conditional-field[data-conditional="${blockKey}"]`);
  if (!fields.length) return;
  const values = Array.from(step.querySelectorAll('[name]')).filter((input) => {
    return input.name.includes(blockKey) === false ? true : true;
  });
  const blockScores = Array.from(step.querySelectorAll('select')).filter((input) => input.name.startsWith(blockKey));
  const shouldShow = Array.from(step.querySelectorAll('select')).some((select) => Number(select.value) > 0 && Number(select.value) <= 2);
  fields.forEach((field) => {
    field.style.display = shouldShow ? 'block' : 'none';
    const inner = field.querySelector('textarea, input');
    if (inner) {
      inner.required = shouldShow;
      if (!shouldShow) inner.value = '';
    }
  });
}

async function setupForm(formulario) {
  const form = document.getElementById('evaluation-form');
  const stepsContainer = document.getElementById('form-steps');
  const submitButton = document.getElementById('submit-form');
  const nextButton = document.getElementById('next-step');
  const prevButton = document.getElementById('prev-step');
  const messageContainer = document.getElementById('form-message');

  if (!form || !stepsContainer) return;

  try {
    const [definition, cadastros] = await Promise.all([
      apiGet(`/api/perguntas/${formulario}`),
      apiGet('/api/cadastros')
    ]);

    const cadastroOptions = buildCadastroOptions(cadastros);
    const questions = definition.perguntas || [];
    if (!questions.length) {
      showMessage(
        messageContainer,
        'Nenhuma pergunta foi encontrada para este formulário. Verifique o cadastro em DICIONARIO_PERGUNTAS.',
        'warning'
      );
      nextButton.disabled = true;
      prevButton.disabled = true;
      submitButton.disabled = true;
      return;
    }
    const grouped = groupBy(questions, 'Bloco_Eixo');
    const stepKeys = Object.keys(grouped);

    stepsContainer.innerHTML = '';
    stepKeys.forEach((stepKey) => {
      const blockName = grouped[stepKey][0]?.Nome_Bloco_Eixo || stepKey;
      const stepElement = createBlockStep(stepKey, blockName, grouped[stepKey], cadastroOptions);
      stepsContainer.appendChild(stepElement);
    });

    let currentStep = 0;
    const stepElements = Array.from(stepsContainer.querySelectorAll('.form-step'));
    const totalSteps = stepElements.length;

    function showStep(index) {
      stepElements.forEach((element, idx) => {
        element.classList.toggle('active', idx === index);
      });
      prevButton.style.display = index === 0 ? 'none' : 'inline-block';
      nextButton.style.display = index === totalSteps - 1 ? 'none' : 'inline-block';
      submitButton.classList.toggle('d-none', index !== totalSteps - 1);
      updateProgress(index, totalSteps);
    }

    stepsContainer.addEventListener('change', (event) => {
      const changed = event.target;
      const step = changed.closest('.form-step');
      if (!step) return;
      const blockKey = step.dataset.step;
      toggleConditionalFields(step, blockKey);
    });

    prevButton.addEventListener('click', () => {
      if (currentStep <= 0) return;
      currentStep -= 1;
      showStep(currentStep);
    });

    nextButton.addEventListener('click', () => {
      const step = stepElements[currentStep];
      if (!validateStep(step)) {
        showMessage(messageContainer, 'Preencha todos os campos obrigatórios antes de avançar.', 'danger');
        return;
      }
      messageContainer.innerHTML = '';
      if (currentStep < totalSteps - 1) {
        currentStep += 1;
        showStep(currentStep);
      }
    });

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const step = stepElements[currentStep];
      if (!validateStep(step)) {
        showMessage(messageContainer, 'Preencha os campos obrigatórios antes de enviar.', 'danger');
        return;
      }

      const formData = new FormData(form);
      const payload = {};
      for (const [key, value] of formData.entries()) {
        payload[key] = value;
      }

      const endpoint = formulario === 'exame-provas' ? '/api/respostas/exame' : '/api/respostas/ccp-cap';
      try {
        const result = await apiPost(endpoint, payload);
        showMessage(messageContainer, result.message || 'Avaliação enviada com sucesso.', 'success');
        form.reset();
        currentStep = 0;
        showStep(currentStep);
      } catch (error) {
        showMessage(messageContainer, error.message || 'Não foi possível enviar a avaliação.', 'danger');
      }
    });

    showStep(currentStep);
  } catch (error) {
    const container = document.getElementById('form-message');
    showMessage(container, error.message || 'Não foi possível carregar o formulário.', 'danger');
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const formulario = document.body.dataset.formulario;
  if (formulario) {
    setupForm(formulario);
  }
});
