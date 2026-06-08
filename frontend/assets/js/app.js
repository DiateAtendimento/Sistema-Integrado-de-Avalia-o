const THANK_YOU_MESSAGE = 'A Comissão de Certificação Profissional dos RPPS agradece sua valiosa colaboração na avaliação dos cursos de capacitação profissional e do exame por provas. Sua participação é essencial para o aprimoramento contínuo do processo de certificação e para o fortalecimento da qualificação dos profissionais que atuam nos RPPS.';

const FIELD_LABEL_OVERRIDES = {
  'ccp-cap': {
    Identificacao_Respondente: 'Identificação (opcional)',
    Entidade_Certificadora: 'Entidade Certificadora',
    Modalidade_CCP_CAP: 'Modalidade de Certificação',
    Tipo_Certificacao: 'Tipo de Certificação',
    Data_Curso: 'Data de realização do curso',
    Avaliacao_Geral_Texto: 'Considerando os blocos anteriores, forneça uma avaliação geral do curso.',
    Observacoes_Finais: 'Observações finais'
  },
  'exame-provas': {
    Identificacao_Respondente: 'Identificação (opcional)',
    Entidade_Certificadora: 'Entidade Certificadora',
    Tipo_Certificacao: 'Tipo de Certificação realizada',
    Nivel_Certificacao: 'Nível da Certificação',
    Modalidade_Prova: 'Realização da prova',
    Data_Exame: 'Data de realização do exame',
    Avaliacao_Geral_Texto: 'Considerando os blocos anteriores, forneça uma avaliação geral do exame.',
    Observacoes_Finais: 'Observações finais'
  }
};

const BLOCK_NAME_OVERRIDES = {
  'ccp-cap': {
    'Identificacao da avaliacao': 'Identificação da avaliação',
    'Transparencia e regras do processo': 'Transparência e regras do processo',
    'Controle de participacao e frequencia': 'Controle de participação e frequência',
    'Avaliacoes de aprendizagem': 'Avaliações de aprendizagem',
    'Integridade e autenticidade das avaliacoes': 'Integridade e autenticidade das avaliações',
    'Conformidade do conteudo programatico': 'Conformidade do conteúdo programático',
    'Conformidade do corpo docente': 'Conformidade do corpo docente',
    'Imparcialidade e ausencia de promocao comercial': 'Imparcialidade e ausência de promoção comercial',
    'Politica de precos e acesso': 'Política de preços e acesso',
    'Qualidade e adequacao do conteudo': 'Qualidade e adequação do conteúdo',
    'Corpo docente - desempenho pedagogico': 'Corpo docente - desempenho pedagógico',
    'Entidade certificadora': 'Entidade certificadora',
    'Avaliacao geral do curso': 'Avaliação geral do curso',
    'Observacoes finais': 'Observações finais'
  },
  'exame-provas': {
    'Identificacao da avaliacao': 'Identificação da avaliação',
    'Organizacao e infraestrutura': 'Organização e infraestrutura',
    'Conduta e imparcialidade': 'Conduta e imparcialidade',
    'Conteudo e adequacao': 'Conteúdo e adequação',
    'Integridade do processo': 'Integridade do processo',
    'Bloco especifico - provas online': 'Bloco específico - provas online',
    'Avaliacao geral do exame': 'Avaliação geral do exame',
    'Observacoes finais': 'Observações finais'
  }
};

const SELECT_OPTION_OVERRIDES = {
  Entidade_Certificadora: ['ABIPEM', 'ANASPS', 'ICDS', 'Instituto Totum'],
  Modalidade_CCP_CAP: ['Curso de Capacitação Profissional', 'Curso de Atualização Profissional'],
  Modalidade_Prova: ['Presencial', 'Online (remota)'],
  ccpCapTipoCertificacao: [
    'Conselhos - Intermediário',
    'Dirigente - Avançado',
    'Gestor de Recursos e Comitê de Investimento - Avançado'
  ],
  exameTipoCertificacao: [
    'Conselhos',
    'Dirigente',
    'Gestor de Recursos e Membros do Comitê'
  ],
  Nivel_Certificacao: ['Básico', 'Intermediário', 'Avançado']
};

const TEXT_REPLACEMENTS = new Map([
  ['descricao objetiva e fundamentada do fato observado', 'Descrição objetiva e fundamentada de fato observado'],
  ['considerando os blocos anteriores, forneca uma avaliacao geral do exame.', 'Considerando os blocos anteriores, forneça uma avaliação geral do exame.'],
  ['considerando os blocos anteriores, forneca uma avaliacao geral do curso.', 'Considerando os blocos anteriores, forneça uma avaliação geral do curso.'],
  ['item nao obrigatorio. caso deseje, este e um espaco livre para sua manifestacao sobre o exame ou para sugestoes de melhoria da qualidade do exame.', 'Observações finais'],
  ['item nao obrigatorio. caso deseje, este e um espaco livre para sua manifestacao sobre o curso ou para sugestoes de melhoria de sua qualidade.', 'Observações finais'],
  ['nao houve falhas tecnicas relevantes durante o exame.', 'Não houve falhas técnicas relevantes durante o exame.'],
  ['as orientacoes iniciais foram claras e suficientes.', 'As orientações iniciais foram claras e suficientes.'],
  ['nao houve tratamento diferenciado entre candidatos.', 'Não houve tratamento diferenciado entre candidatos.'],
  ['o sigilo das informacoes foi preservado.', 'O sigilo das informações foi preservado.'],
  ['o conteudo da prova estava compativel com o edital.', 'O conteúdo da prova estava compatível com o edital.'],
  ['as questoes estavam redigidas com clareza, sem erros materiais evidentes.', 'As questões estavam redigidas com clareza, sem erros materiais evidentes.'],
  ['o nivel de dificuldade foi compativel com a certificacao pretendida.', 'O nível de dificuldade foi compatível com a certificação pretendida.'],
  ['o exame avaliou os conhecimentos e habilidades esperadas para a certificacao.', 'O exame avaliou os conhecimentos e habilidades esperadas para a certificação.'],
  ['o tempo disponivel para realizacao do exame foi suficiente.', 'O tempo disponível para realização do exame foi suficiente.'],
  ['o modelo de aplicacao adotado garantiu igualdade de condicoes entre os candidatos.', 'O modelo de aplicação adotado garantiu igualdade de condições entre os candidatos.'],
  ['houve fiscalizacao adequada durante todo o exame.', 'Houve fiscalização adequada durante todo o exame.'],
  ['o processo adotado dificultou praticas indevidas.', 'O processo adotado dificultou práticas indevidas.'],
  ['confio na credibilidade do processo de certificacao realizado.', 'Confio na credibilidade do processo de certificação realizado.'],
  ['minha identidade foi verificada de forma rigorosa antes do inicio da prova.', 'Minha identidade foi verificada de forma rigorosa antes do início da prova.'],
  ['foi exigida apresentacao de documento oficial com foto.', 'Foi exigida apresentação de documento oficial com foto.'],
  ['houve registro de imagem (foto ou video) para confirmacao de identidade.', 'Houve registro de imagem (foto ou vídeo) para confirmação de identidade.'],
  ['permaneci com camera ativa durante toda a realizacao da prova.', 'Permaneci com câmera ativa durante toda a realização da prova.'],
  ['fui informado previamente sobre a gravacao de video e/ou audio.', 'Fui informado previamente sobre a gravação de vídeo e/ou áudio.'],
  ['o sistema monitorou minha atividade na tela durante o exame.', 'O sistema monitorou minha atividade na tela durante o exame.'],
  ['o sistema emitiu alertas ou bloqueios em caso de troca de tela ou janela.', 'O sistema emitiu alertas ou bloqueios em caso de troca de tela ou janela.'],
  ['houve fiscalizacao efetiva durante todo o periodo da prova.', 'Houve fiscalização efetiva durante todo o período da prova.'],
  ['foi exigida visualizacao previa do ambiente antes do inicio da prova.', 'Foi exigida visualização prévia do ambiente antes do início da prova.'],
  ['nao foi permitido o uso de dispositivos paralelos nao autorizados.', 'Não foi permitido o uso de dispositivos paralelos não autorizados.'],
  ['as regras sobre conduta e uso de materiais foram claras na modalidade online.', 'As regras sobre conduta e uso de materiais foram claras na modalidade online.'],
  ['considero que o exame foi conduzido de forma tecnica e profissional.', 'Considero que o exame foi conduzido de forma técnica e profissional.'],
  ['a entidade demonstrou capacidade tecnica para aplicacao do exame.', 'A entidade demonstrou capacidade técnica para aplicação do exame.'],
  ['nao houve alteracoes inesperadas nas regras apos o inicio do curso.', 'Não houve alterações inesperadas nas regras após o início do curso.'],
  ['as condicoes para emissao do certificado estiveram vinculadas ao cumprimento das regras estabelecidas.', 'As condições para emissão do certificado estiveram vinculadas ao cumprimento das regras estabelecidas.'],
  ['o sistema exigiu participacao efetiva nas aulas.', 'O sistema exigiu participação efetiva nas aulas.'],
  ['nao foi possivel concluir o curso sem o cumprimento das exigencias minimas.', 'Não foi possível concluir o curso sem o cumprimento das exigências mínimas.'],
  ['foram aplicadas avaliacoes ao longo do curso para aferir a aprendizagem de forma progressiva.', 'Foram aplicadas avaliações ao longo do curso para aferir a aprendizagem de forma progressiva.'],
  ['houve alteracoes das questoes entre as turmas ou entre as tentativas realizadas.', 'Houve alterações das questões entre as turmas ou entre as tentativas realizadas.'],
  ['as questoes foram distribuidas de forma coerente nos respectivos modulos.', 'As questões foram distribuídas de forma coerente nos respectivos módulos.'],
  ['nao foi possivel repetir indefinidamente a mesma questao.', 'Não foi possível repetir indefinidamente a mesma questão.'],
  ['houve verificacao de identidade do participante.', 'Houve verificação de identidade do participante.'],
  ['o ambiente impos restricoes tecnicas adequadas.', 'O ambiente impôs restrições técnicas adequadas.'],
  ['nao foram observadas fragilidades que permitissem a realizacao da prova por terceiros.', 'Não foram observadas fragilidades que permitissem a realização da prova por terceiros.'],
  ['o conteudo do curso correspondeu ao programa previamente divulgado.', 'O conteúdo do curso correspondeu ao programa previamente divulgado.'],
  ['nao foram observadas questoes desatualizadas ou incompativeis com a legislacao vigente.', 'Não foram observadas questões desatualizadas ou incompatíveis com a legislação vigente.'],
  ['o nivel de exigencia foi compativel com a certificacao realizada.', 'O nível de exigência foi compatível com a certificação realizada.'],
  ['a duracao dos modulos e do curso foi adequada ao conteudo programatico.', 'A duração dos módulos e do curso foi adequada ao conteúdo programático.'],
  ['os professores do curso sao os mesmos divulgados anteriormente.', 'Os professores do curso são os mesmos divulgados anteriormente.'],
  ['alteracoes no corpo docente foram comunicadas previamente aos alunos e/ou a comissao de certificacao.', 'Alterações no corpo docente foram comunicadas previamente aos alunos e/ou à Comissão de Certificação.'],
  ['o conteudo foi apresentado de forma tecnica e imparcial.', 'O conteúdo foi apresentado de forma técnica e imparcial.'],
  ['nao houve divulgacao de produtos sem finalidade educativa.', 'Não houve divulgação de produtos sem finalidade educativa.'],
  ['nao houve inducao de preferencia sem fundamentacao tecnica objetiva.', 'Não houve indução de preferência sem fundamentação técnica objetiva.'],
  ['valores informados previamente de forma clara.', 'Valores informados previamente de forma clara.'],
  ['criterios aplicados de forma objetiva e isonomica.', 'Critérios aplicados de forma objetiva e isonômica.'],
  ['politicas de bolsas divulgadas com criterios claros.', 'Políticas de bolsas divulgadas com critérios claros.'],
  ['aderencia ao conteudo programatico divulgado.', 'Aderência ao conteúdo programático divulgado.'],
  ['atualizacao compativel com a legislacao vigente.', 'Atualização compatível com a legislação vigente.'],
  ['coerencia do material didatico.', 'Coerência do material didático.'],
  ['coerencia das avaliacoes com o conteudo trabalhado.', 'Coerência das avaliações com o conteúdo trabalhado.'],
  ['o curso proporcionou os conhecimentos e habilidades esperados.', 'O curso proporcionou os conhecimentos e habilidades esperados.'],
  ['dominio tecnico do conteudo ministrado.', 'Domínio técnico do conteúdo ministrado.'],
  ['respostas as duvidas de forma clara e fundamentada.', 'Respostas às dúvidas de forma clara e fundamentada.'],
  ['estabilidade da plataforma durante aulas e avaliacoes.', 'Estabilidade da plataforma durante aulas e avaliações.'],
  ['suporte tecnico prestado de forma tempestiva.', 'Suporte técnico prestado de forma tempestiva.'],
  ['canais de comunicacao acessiveis e funcionais.', 'Canais de comunicação acessíveis e funcionais.'],
  ['considero que o curso foi conduzido de forma tecnica e profissional.', 'Considero que o curso foi conduzido de forma técnica e profissional.'],
  ['a entidade demonstrou capacidade tecnica para realizacao do curso.', 'A entidade demonstrou capacidade técnica para realização do curso.']
]);

function parseOptions(rows) {
  if (!Array.isArray(rows)) return [];
  return rows
    .filter((item) => {
      const ativo = item.ativo || item.Ativo;
      return !ativo || ativo.toString().trim().toUpperCase() === 'SIM';
    })
    .map((item) => item.nome || item.Nome || Object.values(item).find((value) => value && value.toString().trim()))
    .filter((value, index, self) => value && self.indexOf(value) === index)
    .sort((a, b) => a.toString().localeCompare(b.toString(), 'pt-BR'));
}

function normalizeText(value) {
  return (value || '')
    .toString()
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function prettifyText(value) {
  const text = (value || '').toString().trim();
  if (!text) return text;
  return TEXT_REPLACEMENTS.get(normalizeText(text)) || text;
}

function getFieldLabel(formulario, question) {
  const fieldName = question.Codigo_Pergunta || question.Nome_Bloco_Eixo || question.Grupo;
  const override = FIELD_LABEL_OVERRIDES[formulario]?.[fieldName];
  return prettifyText(override || question.Observacao || question.Codigo_Pergunta || question.Nome_Bloco_Eixo);
}

function getBlockName(formulario, rawBlockName, fallback) {
  const override = BLOCK_NAME_OVERRIDES[formulario]?.[rawBlockName];
  return prettifyText(override || rawBlockName || fallback);
}

function getSelectOptions(fieldName, formulario, cadastroOptions) {
  if (fieldName === 'Entidade_Certificadora') return SELECT_OPTION_OVERRIDES.Entidade_Certificadora;
  if (fieldName === 'Modalidade_CCP_CAP') return SELECT_OPTION_OVERRIDES.Modalidade_CCP_CAP;
  if (fieldName === 'Modalidade_Prova') return SELECT_OPTION_OVERRIDES.Modalidade_Prova;
  if (fieldName === 'Tipo_Certificacao' && formulario === 'ccp-cap') return SELECT_OPTION_OVERRIDES.ccpCapTipoCertificacao;
  if (fieldName === 'Tipo_Certificacao' && formulario === 'exame-provas') return SELECT_OPTION_OVERRIDES.exameTipoCertificacao;
  if (fieldName === 'Nivel_Certificacao') return SELECT_OPTION_OVERRIDES.Nivel_Certificacao;

  const options = cadastroOptions[fieldName] || [];
  if (fieldName === 'Nivel_Certificacao') {
    return options.filter((option) => !normalizeText(option).includes('sem nivel'));
  }
  return options;
}

function ensureFormState(stepsContainer, type, title, description, animationSrc) {
  let state = document.getElementById(`form-state-${type}`);
  if (state) return state;
  state = document.createElement('div');
  state.id = `form-state-${type}`;
  state.className = `form-state form-state-${type}`;
  state.innerHTML = `
    <div class="form-state-card">
      <lottie-player src="${animationSrc}" background="transparent" speed="1" ${type === 'loading' ? 'loop autoplay' : 'autoplay'}></lottie-player>
      <div class="form-state-copy">
        <div class="form-state-kicker">${type === 'loading' ? 'Preparando' : 'Concluído'}</div>
        <h3>${title}</h3>
        <p>${description}</p>
      </div>
    </div>
  `;
  stepsContainer.parentNode.insertBefore(state, stepsContainer);
  return state;
}

function updateFormState(type, title, description) {
  const state = document.getElementById(`form-state-${type}`);
  if (!state) return;
  const kicker = state.querySelector('.form-state-kicker');
  const heading = state.querySelector('h3');
  const text = state.querySelector('p');
  if (kicker) kicker.textContent = type === 'loading' ? 'Preparando' : 'Concluído';
  if (heading) heading.textContent = title;
  if (text) text.textContent = description;
}

function setFormState(stepsContainer, type) {
  const loadingState = document.getElementById('form-state-loading');
  const successState = document.getElementById('form-state-success');
  [loadingState, successState].filter(Boolean).forEach((state) => state.classList.remove('active'));
  stepsContainer.style.display = type ? 'none' : '';
  if (type === 'loading' && loadingState) loadingState.classList.add('active');
  if (type === 'success' && successState) successState.classList.add('active');
}

function scrollToFormTop() {
  const header = document.querySelector('.site-header');
  const card = document.querySelector('.evaluation-card');
  const target = card || header;
  if (!target) return;
  const top = target.getBoundingClientRect().top + window.scrollY - 24;
  window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
}

function createControlField(formulario, question, cadastroOptions) {
  const fieldName = question.Codigo_Pergunta || question.Nome_Bloco_Eixo || question.Grupo;
  const required = question.Obrigatoria && question.Obrigatoria.toString().toLowerCase() === 'sim';
  const label = getFieldLabel(formulario, question);
  const type = question.Tipo_Campo ? question.Tipo_Campo.toString().toLowerCase() : 'texto';
  const fieldWrapper = document.createElement('div');
  fieldWrapper.className = 'mb-3';
  const fieldLabel = document.createElement('label');
  fieldLabel.className = 'form-label';
  fieldLabel.textContent = label;
  fieldLabel.setAttribute('for', fieldName);

  if (type.includes('nota') || fieldName.toLowerCase().includes('b') && fieldName.includes('.')) {
    const ratingGroup = document.createElement('div');
    ratingGroup.className = 'rating-group';
    ratingGroup.dataset.name = fieldName;
    if (required) ratingGroup.dataset.required = 'true';
    fieldWrapper.appendChild(fieldLabel);

    for (let i = 1; i <= 5; i += 1) {
      const optionLabel = document.createElement('label');
      optionLabel.className = 'rating-option';

      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.className = 'rating-option-input';
      radio.name = fieldName;
      radio.value = i;
      radio.id = `${fieldName}_${i}`;
      if (required) radio.dataset.required = 'true';

      const badge = document.createElement('span');
      badge.className = 'rating-option-badge';
      badge.textContent = i;

      const helper = document.createElement('span');
      helper.className = 'rating-option-helper';
      helper.textContent = ['Discordo totalmente', 'Discordo parcialmente', 'Neutro', 'Concordo parcialmente', 'Concordo totalmente'][i - 1];

      optionLabel.appendChild(radio);
      optionLabel.appendChild(badge);
      optionLabel.appendChild(helper);
      ratingGroup.appendChild(optionLabel);
    }

    fieldWrapper.appendChild(ratingGroup);
    const note = document.createElement('div');
    note.className = 'rating-scale-note';
    note.textContent = '1 = discordo totalmente, 5 = concordo totalmente';
    fieldWrapper.appendChild(note);
    return fieldWrapper;
  }

  if (type.includes('select') || fieldName === 'Entidade_Certificadora' || fieldName === 'Tipo_Certificacao' || fieldName === 'Nivel_Certificacao' || fieldName === 'Modalidade_Prova' || fieldName === 'Modalidade_CCP_CAP') {
    const select = document.createElement('select');
    select.className = 'form-select';
    select.id = fieldName;
    select.name = fieldName;
    select.innerHTML = '<option value="">Selecione</option>';
    const options = getSelectOptions(fieldName, formulario, cadastroOptions);
    options.forEach((optionValue) => {
      const option = document.createElement('option');
      option.value = optionValue;
      option.textContent = prettifyText(optionValue);
      select.appendChild(option);
    });
    if (required) select.required = true;
    fieldWrapper.appendChild(fieldLabel);
    fieldWrapper.appendChild(select);
    return fieldWrapper;
  }

  if (fieldName === 'Data_Exame' || fieldName === 'Data_Curso') {
    const input = document.createElement('input');
    input.type = 'date';
    input.className = 'form-control';
    input.id = fieldName;
    input.name = fieldName;
    if (required) input.required = true;
    fieldWrapper.appendChild(fieldLabel);
    fieldWrapper.appendChild(input);
    return fieldWrapper;
  }

  if (type.includes('texto') || type.includes('observacao') || fieldName.toLowerCase().includes('justificativa')) {
    const textarea = document.createElement('textarea');
    textarea.className = 'form-control';
    textarea.id = fieldName;
    textarea.name = fieldName;
    textarea.rows = fieldName === 'Observacoes_Finais' || fieldName === 'Avaliacao_Geral_Texto' ? 4 : 3;
    if (required) textarea.required = true;
    textarea.placeholder = fieldName.toLowerCase().includes('justificativa')
      ? 'Descrição objetiva e fundamentada de fato observado'
      : 'Digite sua resposta...';
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

function createBlockStep(formulario, blockKey, blockName, questions, cadastroOptions) {
  const step = document.createElement('div');
  step.className = 'form-step';
  step.dataset.step = blockKey;
  if (questions.some((question) => (question.Acao_Condicional || '').includes('Modalidade_Prova = Online'))) {
    step.dataset.requiresOnline = 'true';
  }
  step.innerHTML = `
    <div class="block-card card p-3 mb-4">
      <div class="card-header">${blockName}</div>
      <div class="card-body"></div>
    </div>
  `;
  const container = step.querySelector('.card-body');
  questions.forEach((question) => {
    const inputWrapper = createControlField(formulario, question, cadastroOptions);
    const isJustificationField =
      (question.Codigo_Pergunta || '').toLowerCase().includes('justificativa') ||
      (question.Tipo_Campo || '').toLowerCase().includes('texto');
    if (isJustificationField && question.Acao_Condicional && question.Acao_Condicional.toLowerCase().includes('justificativa')) {
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

function groupQuestionsByStep(array) {
  const groups = [];
  const map = new Map();
  array.forEach((item, index) => {
    const uniqueKey = `${item.Grupo || 'Sem grupo'}::${item.Bloco_Eixo || 'Sem bloco'}::${item.Nome_Bloco_Eixo || `Bloco ${index + 1}`}`;
    if (!map.has(uniqueKey)) {
      const group = {
        key: uniqueKey,
        rawBlockName: item.Nome_Bloco_Eixo || item.Bloco_Eixo || 'Sem bloco',
        questions: []
      };
      map.set(uniqueKey, group);
      groups.push(group);
    }
    map.get(uniqueKey).questions.push(item);
  });
  return groups;
}

function reorderQuestions(questions) {
  const items = [...questions];
  const generalTextIndex = items.findIndex((question) => question.Codigo_Pergunta === 'Avaliacao_Geral_Texto');
  if (generalTextIndex > -1) {
    const [generalText] = items.splice(generalTextIndex, 1);
    items.push(generalText);
  }
  return items;
}

function updateProgress(currentIndex, total) {
  const progress = document.getElementById('form-progress');
  if (!progress) return;
  if (!total) {
    progress.style.width = '0%';
    progress.textContent = '0%';
    return;
  }
  const percent = Math.round(((currentIndex + 1) / total) * 100);
  progress.style.width = `${percent}%`;
  progress.textContent = `${percent}%`;
}

function validateStep(step) {
  const inputs = Array.from(step.querySelectorAll('input, textarea, select'));
  let valid = true;
  const checkedRadioNames = new Set();

  inputs.forEach((input) => {
    if (input.type === 'radio' && input.checked) {
      checkedRadioNames.add(input.name);
    }
  });

  inputs.forEach((input) => {
    if (input.type === 'radio') return;
    if (input.required && input.offsetParent !== null && !input.value.trim()) {
      input.classList.add('is-invalid');
      valid = false;
    } else {
      input.classList.remove('is-invalid');
    }
  });

  const ratingGroups = Array.from(step.querySelectorAll('.rating-group[data-required="true"]'));
  ratingGroups.forEach((group) => {
    const groupName = group.dataset.name;
    const isChecked = checkedRadioNames.has(groupName);
    group.classList.toggle('is-invalid', !isChecked);
    if (!isChecked) valid = false;
  });

  return valid;
}

function toggleConditionalFields(step, blockKey) {
  const fields = step.querySelectorAll(`.conditional-field[data-conditional="${blockKey}"]`);
  if (!fields.length) return;
  const shouldShow = Array.from(step.querySelectorAll('.rating-option-input:checked')).some((input) => Number(input.value) > 0 && Number(input.value) <= 2);
  fields.forEach((field) => {
    field.style.display = shouldShow ? 'block' : 'none';
    const inner = field.querySelector('textarea, input');
    if (inner) {
      inner.required = shouldShow;
      if (!shouldShow) inner.value = '';
    }
  });
}

function resetConditionalFields(stepsContainer) {
  stepsContainer.querySelectorAll('.conditional-field').forEach((field) => {
    field.style.display = 'none';
    const inner = field.querySelector('textarea, input');
    if (inner) {
      inner.required = false;
      inner.value = '';
    }
  });
}

function setButtonsDisabled(buttons, disabled) {
  buttons.forEach((button) => {
    if (button) button.disabled = disabled;
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
    ensureFormState(
      stepsContainer,
      'loading',
      'Carregando formulário',
      'Estamos preparando as perguntas para você.',
      'https://assets5.lottiefiles.com/packages/lf20_usmfx6bp.json'
    );
    ensureFormState(
      stepsContainer,
      'success',
      'Avaliação enviada',
      THANK_YOU_MESSAGE,
      'https://assets3.lottiefiles.com/packages/lf20_jbrw3hcz.json'
    );
    setFormState(stepsContainer, 'loading');

    const [definition, cadastros] = await Promise.all([
      apiGet(`/api/perguntas/${formulario}`),
      apiGet('/api/cadastros')
    ]);

    const cadastroOptions = buildCadastroOptions(cadastros);
    const questions = definition.perguntas || [];
    if (!questions.length) {
      showMessage(messageContainer, 'Nenhuma pergunta foi encontrada para este formulário. Verifique o cadastro em DICIONARIO_PERGUNTAS.', 'warning');
      nextButton.disabled = true;
      prevButton.disabled = true;
      submitButton.disabled = true;
      setFormState(stepsContainer, null);
      return;
    }

    const groupedSteps = groupQuestionsByStep(questions);

    stepsContainer.innerHTML = '';
    groupedSteps.forEach((stepGroup) => {
      const blockName = getBlockName(formulario, stepGroup.rawBlockName, stepGroup.key);
      const stepElement = createBlockStep(formulario, stepGroup.key, blockName, reorderQuestions(stepGroup.questions), cadastroOptions);
      stepsContainer.appendChild(stepElement);
    });
    resetConditionalFields(stepsContainer);
    setFormState(stepsContainer, null);

    let currentStep = 0;
    const stepElements = Array.from(stepsContainer.querySelectorAll('.form-step'));

    function getVisibleSteps() {
      return stepElements.filter((element) => !element.classList.contains('d-none'));
    }

    function syncConditionalSteps() {
      const modalidade = form.querySelector('[name="Modalidade_Prova"]')?.value || '';
      const isOnline = normalizeText(modalidade).includes('online');
      stepElements.forEach((element) => {
        if (element.dataset.requiresOnline !== 'true') return;
        element.classList.toggle('d-none', !isOnline);
        if (!isOnline) {
          element.querySelectorAll('input, textarea, select').forEach((input) => {
            if (input.type === 'radio' || input.type === 'checkbox') {
              input.checked = false;
            } else {
              input.value = '';
            }
            input.classList.remove('is-invalid');
          });
          element.querySelectorAll('.rating-group').forEach((group) => group.classList.remove('is-invalid'));
        }
      });
    }

    function showStep(index) {
      const visibleSteps = getVisibleSteps();
      const totalSteps = visibleSteps.length;
      if (!totalSteps) {
        prevButton.style.display = 'none';
        nextButton.style.display = 'none';
        submitButton.classList.add('d-none');
        updateProgress(0, 0);
        return;
      }

      const safeIndex = Math.max(0, Math.min(index, totalSteps - 1));
      currentStep = safeIndex;
      stepElements.forEach((element) => element.classList.remove('active'));
      visibleSteps[safeIndex].classList.add('active');
      prevButton.style.display = safeIndex === 0 ? 'none' : 'inline-block';
      nextButton.style.display = safeIndex === totalSteps - 1 ? 'none' : 'inline-block';
      submitButton.classList.toggle('d-none', safeIndex !== totalSteps - 1);
      updateProgress(safeIndex, totalSteps);
    }

    stepsContainer.addEventListener('change', (event) => {
      const changed = event.target;
      const step = changed.closest('.form-step');
      if (!step) return;
      const blockKey = step.dataset.step;
      toggleConditionalFields(step, blockKey);
      if (changed.name === 'Modalidade_Prova') {
        syncConditionalSteps();
        showStep(currentStep);
      }
    });

    prevButton.addEventListener('click', () => {
      if (currentStep <= 0) return;
      currentStep -= 1;
      messageContainer.innerHTML = '';
      showStep(currentStep);
      scrollToFormTop();
    });

    nextButton.addEventListener('click', () => {
      const step = getVisibleSteps()[currentStep];
      if (!validateStep(step)) {
        showMessage(messageContainer, 'Preencha todos os campos obrigatórios antes de avançar.', 'danger');
        return;
      }
      messageContainer.innerHTML = '';
      if (currentStep < getVisibleSteps().length - 1) {
        currentStep += 1;
        showStep(currentStep);
        scrollToFormTop();
      }
    });

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const step = getVisibleSteps()[currentStep];
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
        setButtonsDisabled([prevButton, nextButton, submitButton], true);
        updateFormState('loading', 'Enviando avaliação', 'Estamos registrando sua resposta. Aguarde alguns instantes.');
        setFormState(stepsContainer, 'loading');
        scrollToFormTop();
        const result = await apiPost(endpoint, payload);
        showMessage(messageContainer, result.message || 'Avaliação enviada com sucesso.', 'success');
        form.reset();
        resetConditionalFields(stepsContainer);
        currentStep = 0;
        syncConditionalSteps();
        showStep(currentStep);
        updateFormState('success', 'Avaliação enviada', THANK_YOU_MESSAGE);
        setFormState(stepsContainer, 'success');
        window.setTimeout(() => {
          setFormState(stepsContainer, null);
          showStep(0);
          setButtonsDisabled([prevButton, nextButton, submitButton], false);
          scrollToFormTop();
        }, 8000);
      } catch (error) {
        setFormState(stepsContainer, null);
        setButtonsDisabled([prevButton, nextButton, submitButton], false);
        showMessage(messageContainer, error.message || 'Não foi possível enviar a avaliação.', 'danger');
      }
    });

    syncConditionalSteps();
    showStep(currentStep);
  } catch (error) {
    const container = document.getElementById('form-message');
    setFormState(stepsContainer, null);
    showMessage(container, error.message || 'Não foi possível carregar o formulário.', 'danger');
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const formulario = document.body.dataset.formulario;
  if (formulario) {
    setupForm(formulario);
  }
});
