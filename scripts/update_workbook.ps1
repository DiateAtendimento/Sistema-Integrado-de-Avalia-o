param(
  [Parameter(Mandatory = $true)]
  [string]$WorkbookPath,

  [Parameter(Mandatory = $true)]
  [string]$CsvPath
)

$ErrorActionPreference = 'Stop'

function Get-Worksheet($workbook, $name) {
  foreach ($sheet in $workbook.Worksheets) {
    if ($sheet.Name -eq $name) {
      return $sheet
    }
  }
  throw "Aba '$name' não encontrada."
}

function Read-CsvRows($path) {
  return Import-Csv -Path $path -Delimiter ';'
}

function Get-UniqueHeaders($baseHeaders, $additionalHeaders) {
  $ordered = New-Object System.Collections.Generic.List[string]
  foreach ($header in $baseHeaders + $additionalHeaders) {
    if ([string]::IsNullOrWhiteSpace($header)) {
      continue
    }
    if (-not $ordered.Contains($header)) {
      $ordered.Add($header)
    }
  }
  return $ordered
}

$rows = Read-CsvRows -Path $CsvPath
$exameCodes = $rows | Where-Object { $_.Formulario -eq 'Exame por Provas' } | Select-Object -ExpandProperty Codigo_Pergunta
$ccpCodes = $rows | Where-Object { $_.Formulario -eq 'CCP/CAP' } | Select-Object -ExpandProperty Codigo_Pergunta

$exameHeaders = @(
  'ID_Avaliacao', 'Data_Recebimento', 'Identificacao_Respondente', 'Entidade_Certificadora',
  'Tipo_Certificacao', 'Nivel_Certificacao', 'Modalidade_Prova', 'Data_Exame'
) + $exameCodes + @('Media_Geral_Exame', 'Flag_Critico')

$ccpHeaders = @(
  'ID_Avaliacao', 'Data_Recebimento', 'Identificacao_Respondente', 'Entidade_Certificadora',
  'Modalidade_CCP_CAP', 'Tipo_Certificacao', 'Data_Curso'
) + $ccpCodes + @('Media_Eixo1', 'Media_Eixo2', 'Media_Eixo3', 'Nota_Global_Ponderada')

$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false

try {
  $workbook = $excel.Workbooks.Open($WorkbookPath)

  $dictionarySheet = Get-Worksheet -workbook $workbook -name 'DICIONARIO_PERGUNTAS'
  $baseExameSheet = Get-Worksheet -workbook $workbook -name 'BASE_EXAME_PROVAS'
  $baseCcpSheet = Get-Worksheet -workbook $workbook -name 'BASE_CCP_CAP'

  $dictionarySheet.Cells.Clear()

  $headers = @('Formulario', 'Grupo', 'Bloco_Eixo', 'Nome_Bloco_Eixo', 'Codigo_Pergunta', 'Tipo_Campo', 'Obrigatoria', 'Acao_Condicional', 'Observacao')
  for ($col = 0; $col -lt $headers.Count; $col++) {
    $dictionarySheet.Cells.Item(1, $col + 1) = $headers[$col]
  }

  for ($rowIndex = 0; $rowIndex -lt $rows.Count; $rowIndex++) {
    $row = $rows[$rowIndex]
    $dictionarySheet.Cells.Item($rowIndex + 2, 1) = $row.Formulario
    $dictionarySheet.Cells.Item($rowIndex + 2, 2) = $row.Grupo
    $dictionarySheet.Cells.Item($rowIndex + 2, 3) = $row.Bloco_Eixo
    $dictionarySheet.Cells.Item($rowIndex + 2, 4) = $row.Nome_Bloco_Eixo
    $dictionarySheet.Cells.Item($rowIndex + 2, 5) = $row.Codigo_Pergunta
    $dictionarySheet.Cells.Item($rowIndex + 2, 6) = $row.Tipo_Campo
    $dictionarySheet.Cells.Item($rowIndex + 2, 7) = $row.Obrigatoria
    $dictionarySheet.Cells.Item($rowIndex + 2, 8) = $row.Acao_Condicional
    $dictionarySheet.Cells.Item($rowIndex + 2, 9) = $row.Observacao
  }

  $currentExameHeaders = @()
  $exameUsed = $baseExameSheet.UsedRange.Columns.Count
  for ($col = 1; $col -le $exameUsed; $col++) {
    $currentExameHeaders += [string]$baseExameSheet.Cells.Item(1, $col).Text
  }
  $finalExameHeaders = Get-UniqueHeaders -baseHeaders $exameHeaders -additionalHeaders $currentExameHeaders
  for ($col = 0; $col -lt $finalExameHeaders.Count; $col++) {
    $baseExameSheet.Cells.Item(1, $col + 1) = $finalExameHeaders[$col]
  }

  $currentCcpHeaders = @()
  $ccpUsed = $baseCcpSheet.UsedRange.Columns.Count
  for ($col = 1; $col -le $ccpUsed; $col++) {
    $currentCcpHeaders += [string]$baseCcpSheet.Cells.Item(1, $col).Text
  }
  $finalCcpHeaders = Get-UniqueHeaders -baseHeaders $ccpHeaders -additionalHeaders $currentCcpHeaders
  for ($col = 0; $col -lt $finalCcpHeaders.Count; $col++) {
    $baseCcpSheet.Cells.Item(1, $col + 1) = $finalCcpHeaders[$col]
  }

  $dictionarySheet.Columns.AutoFit() | Out-Null
  $baseExameSheet.Columns.AutoFit() | Out-Null
  $baseCcpSheet.Columns.AutoFit() | Out-Null

  $workbook.Save()
  $workbook.Close($true)
}
finally {
  if ($workbook) {
    [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($workbook)
  }
  $excel.Quit()
  [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($excel)
  [GC]::Collect()
  [GC]::WaitForPendingFinalizers()
}
