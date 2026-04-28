param(
  [string]$ApiBase = "https://sistema-integrado-de-avalia-o.onrender.com",
  [int]$ExameCount = 15,
  [int]$CcpCount = 15
)

$ErrorActionPreference = "Stop"

function Invoke-JsonPost {
  param(
    [string]$Url,
    [hashtable]$Body
  )

  $json = $Body | ConvertTo-Json -Depth 5 -Compress
  return Invoke-RestMethod -Uri $Url -Method Post -ContentType "application/json" -Body $json
}

function New-ExamePayload {
  param([int]$Index)

  $entidades = @("ABIPEM", "APIMEC", "INSTITUTO TOTUM")
  $tipos = @("Dirigente de unidade gestora do RPPS", "Conselho Deliberativo e Fiscal", "Responsável pela Gestão das Aplicações do RPPS ou Comitê de Investimentos")
  $niveis = @("Básico", "Intermediário", "Avançado")
  $modalidades = @("Presencial", "Online (remota)")
  $modalidade = $modalidades[$Index % $modalidades.Count]
  $isCritical = ($Index % 4 -eq 0)

  $payload = [ordered]@{
    Entidade_Certificadora = $entidades[$Index % $entidades.Count]
    Tipo_Certificacao = $tipos[$Index % $tipos.Count]
    Nivel_Certificacao = $niveis[$Index % $niveis.Count]
    Modalidade_Prova = $modalidade
    Data_Exame = (Get-Date).AddDays(-($Index + 2)).ToString("yyyy-MM-dd")
  }

  foreach ($key in @("B1_1.1","B1_1.2","B1_1.3","B1_1.4","B1_1.5","B2_2.1","B2_2.2","B2_2.3","B2_2.4","B3_3.1","B3_3.2","B3_3.3","B3_3.4","B3_3.5","B4_4.1","B4_4.2","B4_4.3","B4_4.4","B6_6.1.1","B6_6.1.2","B6_6.1.3")) {
    $payload[$key] = if ($isCritical -and ($key -match "B1_|B2_|B3_")) { 2 } else { (3 + ($Index % 3)) }
  }

  if ($modalidade -eq "Online (remota)") {
    foreach ($key in @("B5_5.1","B5_5.2","B5_5.3","B5_5.4","B5_5.5","B5_5.6","B5_5.7","B5_5.8","B5_5.9","B5_5.10","B5_5.11")) {
      $payload[$key] = if ($isCritical -and ($Index % 2 -eq 0)) { 2 } else { 4 }
    }
  }

  $payload["Justificativa_Bloco1"] = if ($isCritical) { "Infraestrutura e orientações iniciais precisam de melhoria." } else { "" }
  $payload["Justificativa_Bloco2"] = if ($isCritical) { "Aplicação das regras gerou percepções de inconsistência." } else { "" }
  $payload["Justificativa_Bloco3"] = if ($isCritical) { "Conteúdo e clareza das questões podem ser aprimorados." } else { "" }
  $payload["Justificativa_Bloco4"] = if ($isCritical) { "Fiscalização e integridade do processo merecem atenção." } else { "" }
  $payload["Justificativa_Bloco5"] = if ($modalidade -eq "Online (remota)" -and $isCritical) { "Controles da prova remota poderiam ser mais claros e consistentes." } else { "" }
  $payload["Justificativa_Bloco6"] = ""
  $payload["Avaliacao_Geral_Texto"] = if ($isCritical) { "Experiência regular, com pontos objetivos de melhoria no processo." } else { "Experiência positiva, com processo bem conduzido e confiável." }
  $payload["Observacoes_Finais"] = if ($Index % 5 -eq 0) { "Sugere-se reforçar comunicação operacional antes da prova." } else { "" }

  return $payload
}

function New-CcpPayload {
  param([int]$Index)

  $entidades = @("ABIPEM", "ANASPS", "ICDS", "INSTITUTO TOTUM")
  $modalidades = @("CCP", "CAP")
  $tipos = @(
    "Dirigentes de unidade gestora do RPPS - Avançado",
    "Conselho Deliberativo e Fiscal - Intermediário",
    "Responsável pela Gestão das Aplicações do RPPS ou Comitê de Investimentos - Avançado"
  )
  $isCritical = ($Index % 4 -eq 1)

  $payload = [ordered]@{
    Entidade_Certificadora = $entidades[$Index % $entidades.Count]
    Modalidade_CCP_CAP = $modalidades[$Index % $modalidades.Count]
    Tipo_Certificacao = $tipos[$Index % $tipos.Count]
    Data_Curso = (Get-Date).AddDays(-($Index + 4)).ToString("yyyy-MM-dd")
  }

  foreach ($key in @(
    "E1_1.1","E1_1.2","E1_1.3","E1_2.1","E1_2.2","E1_2.3","E1_3.1","E1_3.2","E1_3.3",
    "E1_4.1","E1_4.2","E1_4.3","E1_5.1","E1_5.2","E1_5.3","E1_5.4","E1_6.1","E1_6.2",
    "E1_7.1","E1_7.2","E1_7.3","E1_8.1","E1_8.2","E1_8.3","E2_1.1","E2_1.2","E2_1.3",
    "E2_1.4","E2_1.5","E2_2.1","E2_2.2","E2_3.1","E2_3.2","E2_3.3","E3_3.1.1","E3_3.1.2","E3_3.1.3"
  )) {
    $payload[$key] = if ($isCritical -and ($key -match "^E1_|^E2_")) { 2 } else { (3 + ($Index % 3)) }
  }

  $payload["Justificativa_E1_Bloco1"] = if ($isCritical) { "Regras do processo poderiam ser comunicadas com mais clareza." } else { "" }
  $payload["Justificativa_E1_Bloco2"] = if ($isCritical) { "Controle de participação e critérios de frequência geraram dúvidas." } else { "" }
  $payload["Justificativa_E1_Bloco3"] = if ($isCritical) { "Avaliações de aprendizagem precisam de maior transparência." } else { "" }
  $payload["Justificativa_E1_Bloco4"] = if ($isCritical) { "Verificação de autenticidade e restrições técnicas devem ser reforçadas." } else { "" }
  $payload["Justificativa_E1_Bloco5"] = if ($isCritical) { "Conteúdo programático e atualização normativa poderiam evoluir." } else { "" }
  $payload["Justificativa_E1_Bloco6"] = if ($isCritical) { "Comunicação sobre o corpo docente pode melhorar." } else { "" }
  $payload["Justificativa_E1_Bloco7"] = if ($isCritical) { "Percepção de imparcialidade pode ser aprimorada." } else { "" }
  $payload["Justificativa_E1_Bloco8"] = if ($isCritical) { "Política de preços e critérios de acesso merecem revisão." } else { "" }
  $payload["Justificativa_E2_Bloco1"] = if ($isCritical) { "Qualidade e adequação pedagógica precisam de ajustes." } else { "" }
  $payload["Justificativa_E2_Bloco2"] = if ($isCritical) { "Desempenho pedagógico do corpo docente pode ser mais consistente." } else { "" }
  $payload["Justificativa_E2_Bloco3"] = if ($isCritical) { "Infraestrutura e suporte não atenderam plenamente à expectativa." } else { "" }
  $payload["Justificativa_E3_Bloco1"] = ""
  $payload["Avaliacao_Geral_Texto"] = if ($isCritical) { "Curso regular, com necessidade de evolução institucional e pedagógica." } else { "Curso bem estruturado, com boa condução e aderência ao objetivo proposto." }
  $payload["Observacoes_Finais"] = if ($Index % 6 -eq 0) { "Sugere-se ampliar exemplos práticos e reforçar comunicação prévia." } else { "" }

  return $payload
}

$results = [ordered]@{
  exame = @()
  ccp = @()
}

for ($i = 0; $i -lt $ExameCount; $i++) {
  $payload = New-ExamePayload -Index $i
  $response = Invoke-JsonPost -Url "$ApiBase/api/respostas/exame" -Body $payload
  $results.exame += $response.id
}

for ($i = 0; $i -lt $CcpCount; $i++) {
  $payload = New-CcpPayload -Index $i
  $response = Invoke-JsonPost -Url "$ApiBase/api/respostas/ccp-cap" -Body $payload
  $results.ccp += $response.id
}

$results | ConvertTo-Json -Depth 4
