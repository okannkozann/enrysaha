import { ServiceBox } from '@/types';
import * as XLSX from 'xlsx';

/* ── Ranges matching the screenshot ── */
export const INVESTMENT_RANGES = [
  { key: '<15', label: 'x<15', test: (d: number) => d < 15 },
  { key: '15-30', label: '15<=x<30', test: (d: number) => d >= 15 && d < 30 },
  { key: '30-45', label: '30<=x<45', test: (d: number) => d >= 30 && d < 45 },
  { key: '45-60', label: '45<=x<60', test: (d: number) => d >= 45 && d < 60 },
  { key: '60-75', label: '60<=x<75', test: (d: number) => d >= 60 && d < 75 },
  { key: '75-90', label: '75<=x<90', test: (d: number) => d >= 75 && d < 90 },
  { key: '>=90', label: '90<=x', test: (d: number) => d >= 90 },
] as const;

/* ── Standard districts order matching the template in the screenshot ── */
export const DEFAULT_DISTRICTS = [
  'KORKUTELİ',
  'DÖŞEMEALTI',
  'KEPEZ',
  'AKSU',
  'MURATPAŞA',
  'KONYAALTI',
  'SERİK',
  'ELMALI',
  'ALANYA',
];

/**
 * Normalizes text to Turkish uppercase for robust district matching
 */
export function normalizeDistrict(d?: string): string {
  if (!d) return 'DİĞER';
  const clean = d.trim().toLocaleUpperCase('tr-TR');
  // Handle common variants
  if (clean.includes('KORKUTEL')) return 'KORKUTELİ';
  if (clean.includes('DOSEMEALTI') || clean.includes('DÖŞEMEALTI')) return 'DÖŞEMEALTI';
  if (clean.includes('KEPEZ')) return 'KEPEZ';
  if (clean.includes('AKSU')) return 'AKSU';
  if (clean.includes('MURATPASA') || clean.includes('MURATPAŞA')) return 'MURATPAŞA';
  if (clean.includes('KONYAALTI')) return 'KONYAALTI';
  if (clean.includes('SERIK') || clean.includes('SERİK')) return 'SERİK';
  if (clean.includes('ELMALI')) return 'ELMALI';
  if (clean.includes('ALANYA')) return 'ALANYA';
  return clean;
}

/**
 * Determines whether a service box belongs to the "YAPILABİLİR" table.
 * Kural: Servis kutuları sayfasında durumu "BOŞ" olan kutular YAPILABİLİR tablosuna işlenir.
 */
export function isBoxYapilabilir(box: ServiceBox): boolean {
  if (!box.lastStatus) return true;
  const s = box.lastStatus.trim().toLowerCase();
  return s === '' || s === 'boş' || s === 'bos' || s === '-';
}

export interface SummaryRow {
  district: string;
  counts: Record<string, number>;
  total: number;
}

export interface InvestmentDataMatrices {
  districts: string[];
  totalRows: SummaryRow[];
  totalColSums: Record<string, number>;
  totalGrandTotal: number;
  yapilabilirRows: SummaryRow[];
  yapilabilirColSums: Record<string, number>;
  yapilabilirGrandTotal: number;
}

/**
 * Calculates the TOPLAM and YAPILABİLİR matrices for all districts & ranges
 */
export function calculateInvestmentMatrices(boxes: ServiceBox[]): InvestmentDataMatrices {
  // Discover all unique districts in data
  const dataDistricts = new Set<string>();
  boxes.forEach((b) => {
    dataDistricts.add(normalizeDistrict(b.district));
  });

  // Keep standard districts in exact order, then append any extras found in data
  const orderedDistricts: string[] = [...DEFAULT_DISTRICTS];
  dataDistricts.forEach((d) => {
    if (!orderedDistricts.includes(d)) {
      orderedDistricts.push(d);
    }
  });

  // Initialize matrix accumulators
  const totalMap: Record<string, Record<string, number>> = {};
  const yapilabilirMap: Record<string, Record<string, number>> = {};

  orderedDistricts.forEach((d) => {
    totalMap[d] = {};
    yapilabilirMap[d] = {};
    INVESTMENT_RANGES.forEach((r) => {
      totalMap[d][r.key] = 0;
      yapilabilirMap[d][r.key] = 0;
    });
  });

  // Populate counts
  boxes.forEach((box) => {
    const dist = normalizeDistrict(box.district);
    const isYap = isBoxYapilabilir(box);
    const days = box.waitingDays || 0;

    const matchedRange = INVESTMENT_RANGES.find((r) => r.test(days));
    if (matchedRange && totalMap[dist]) {
      totalMap[dist][matchedRange.key] = (totalMap[dist][matchedRange.key] || 0) + 1;
      if (isYap && yapilabilirMap[dist]) {
        yapilabilirMap[dist][matchedRange.key] = (yapilabilirMap[dist][matchedRange.key] || 0) + 1;
      }
    }
  });

  // Build rows & totals
  const totalColSums: Record<string, number> = {};
  const yapilabilirColSums: Record<string, number> = {};
  INVESTMENT_RANGES.forEach((r) => {
    totalColSums[r.key] = 0;
    yapilabilirColSums[r.key] = 0;
  });

  let totalGrandTotal = 0;
  let yapilabilirGrandTotal = 0;

  const totalRows: SummaryRow[] = orderedDistricts.map((district) => {
    let rowSum = 0;
    const counts: Record<string, number> = {};
    INVESTMENT_RANGES.forEach((r) => {
      const val = totalMap[district]?.[r.key] || 0;
      counts[r.key] = val;
      rowSum += val;
      totalColSums[r.key] += val;
    });
    totalGrandTotal += rowSum;
    return { district, counts, total: rowSum };
  });

  const yapilabilirRows: SummaryRow[] = orderedDistricts.map((district) => {
    let rowSum = 0;
    const counts: Record<string, number> = {};
    INVESTMENT_RANGES.forEach((r) => {
      const val = yapilabilirMap[district]?.[r.key] || 0;
      counts[r.key] = val;
      rowSum += val;
      yapilabilirColSums[r.key] += val;
    });
    yapilabilirGrandTotal += rowSum;
    return { district, counts, total: rowSum };
  });

  return {
    districts: orderedDistricts,
    totalRows,
    totalColSums,
    totalGrandTotal,
    yapilabilirRows,
    yapilabilirColSums,
    yapilabilirGrandTotal,
  };
}

/**
 * Escapes characters for XML
 */
function escapeXml(str: any): string {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Generates and downloads the styled XML SpreadsheetML (.xls) matching the user's design
 */
export function exportInvestmentTemplateStyled(boxes: ServiceBox[], customFilename?: string): void {
  const data = calculateInvestmentMatrices(boxes);

  const filename =
    customFilename ||
    `Yatirim_Izleme_Sablonu_${new Date().toISOString().slice(0, 10)}.xls`;

  // XML Header & Styles
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
  <Title>Yatırım İzleme Şablonu</Title>
  <Subject>Servis Kutuları Bekleme ve İmalat Analizi</Subject>
  <Author>Enerya Yapım Ofis</Author>
  <Created>${new Date().toISOString()}</Created>
 </DocumentProperties>
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Borders/>
   <Font ss:FontName="Calibri" x:CharSet="162" ss:Size="10" ss:Color="#000000"/>
   <Interior/>
   <NumberFormat/>
   <Protection/>
  </Style>
  <!-- Main Blue Header Style (Exact visual from image) -->
  <Style ss:ID="HeaderBlue">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#0B3C61"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#0B3C61"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#0B3C61"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#0B3C61"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="10" ss:Color="#FFFFFF" ss:Bold="1"/>
   <Interior ss:Color="#0B3C61" ss:Pattern="Solid"/>
  </Style>
  <!-- District Name Cell -->
  <Style ss:ID="DistrictCell">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center" ss:Indent="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D1D5DB"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D1D5DB"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D1D5DB"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D1D5DB"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="10" ss:Color="#111827"/>
  </Style>
  <!-- Data Number Cell -->
  <Style ss:ID="NumCell">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D1D5DB"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D1D5DB"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D1D5DB"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D1D5DB"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="10" ss:Color="#111827"/>
   <NumberFormat ss:Format="#,##0"/>
  </Style>
  <!-- Row Total Cell -->
  <Style ss:ID="RowTotalCell">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D1D5DB"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D1D5DB"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D1D5DB"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D1D5DB"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="10" ss:Color="#111827" ss:Bold="1"/>
   <NumberFormat ss:Format="#,##0"/>
  </Style>
  <!-- Bottom Total Label Cell -->
  <Style ss:ID="BottomTotalLabel">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center" ss:Indent="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#111827"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#111827"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#111827"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#111827"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="10" ss:Color="#000000" ss:Bold="1"/>
  </Style>
  <!-- Bottom Total Number Cell -->
  <Style ss:ID="BottomTotalNum">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#111827"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#111827"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#111827"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#111827"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="10" ss:Color="#000000" ss:Bold="1"/>
   <NumberFormat ss:Format="#,##0"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="Yatırım İzleme">
  <Table ss:DefaultRowHeight="20">
   <!-- Left Table Columns (A-I) -->
   <Column ss:Index="1" ss:Width="110"/>
   <Column ss:Index="2" ss:Width="65" ss:Span="6"/>
   <Column ss:Index="9" ss:Width="70"/>
   <!-- Separator Column (J) -->
   <Column ss:Index="10" ss:Width="30"/>
   <!-- Right Table Columns (K-S) -->
   <Column ss:Index="11" ss:Width="110"/>
   <Column ss:Index="12" ss:Width="65" ss:Span="6"/>
   <Column ss:Index="19" ss:Width="70"/>
`;

  // 1. Header Row
  xml += `   <Row ss:Height="24">
    <!-- Left Table Header: TOPLAM -->
    <Cell ss:StyleID="HeaderBlue"><Data ss:Type="String">TOPLAM</Data></Cell>
    <Cell ss:StyleID="HeaderBlue"><Data ss:Type="String">x&lt;15</Data></Cell>
    <Cell ss:StyleID="HeaderBlue"><Data ss:Type="String">15&lt;=x&lt;30</Data></Cell>
    <Cell ss:StyleID="HeaderBlue"><Data ss:Type="String">30&lt;=x&lt;45</Data></Cell>
    <Cell ss:StyleID="HeaderBlue"><Data ss:Type="String">45&lt;=x&lt;60</Data></Cell>
    <Cell ss:StyleID="HeaderBlue"><Data ss:Type="String">60&lt;=x&lt;75</Data></Cell>
    <Cell ss:StyleID="HeaderBlue"><Data ss:Type="String">75&lt;=x&lt;90</Data></Cell>
    <Cell ss:StyleID="HeaderBlue"><Data ss:Type="String">90&lt;=x</Data></Cell>
    <Cell ss:StyleID="HeaderBlue"><Data ss:Type="String">Toplam</Data></Cell>
    <!-- Spacer -->
    <Cell><Data ss:Type="String"></Data></Cell>
    <!-- Right Table Header: YAPILABİLİR -->
    <Cell ss:StyleID="HeaderBlue"><Data ss:Type="String">YAPILABİLİR</Data></Cell>
    <Cell ss:StyleID="HeaderBlue"><Data ss:Type="String">x&lt;15</Data></Cell>
    <Cell ss:StyleID="HeaderBlue"><Data ss:Type="String">15&lt;=x&lt;30</Data></Cell>
    <Cell ss:StyleID="HeaderBlue"><Data ss:Type="String">30&lt;=x&lt;45</Data></Cell>
    <Cell ss:StyleID="HeaderBlue"><Data ss:Type="String">45&lt;=x&lt;60</Data></Cell>
    <Cell ss:StyleID="HeaderBlue"><Data ss:Type="String">60&lt;=x&lt;75</Data></Cell>
    <Cell ss:StyleID="HeaderBlue"><Data ss:Type="String">75&lt;=x&lt;90</Data></Cell>
    <Cell ss:StyleID="HeaderBlue"><Data ss:Type="String">90&lt;=x</Data></Cell>
    <Cell ss:StyleID="HeaderBlue"><Data ss:Type="String">Toplam</Data></Cell>
   </Row>
`;

  // 2. Data Rows (for each district)
  for (let i = 0; i < data.districts.length; i++) {
    const tRow = data.totalRows[i];
    const yRow = data.yapilabilirRows[i];

    xml += `   <Row ss:Height="20">
    <!-- Left: District & Values -->
    <Cell ss:StyleID="DistrictCell"><Data ss:Type="String">${escapeXml(tRow.district)}</Data></Cell>
`;
    INVESTMENT_RANGES.forEach((r) => {
      xml += `    <Cell ss:StyleID="NumCell"><Data ss:Type="Number">${tRow.counts[r.key] || 0}</Data></Cell>\n`;
    });
    xml += `    <Cell ss:StyleID="RowTotalCell"><Data ss:Type="Number">${tRow.total}</Data></Cell>
    <!-- Spacer Column -->
    <Cell><Data ss:Type="String"></Data></Cell>
    <!-- Right: District & Values -->
    <Cell ss:StyleID="DistrictCell"><Data ss:Type="String">${escapeXml(yRow.district)}</Data></Cell>
`;
    INVESTMENT_RANGES.forEach((r) => {
      xml += `    <Cell ss:StyleID="NumCell"><Data ss:Type="Number">${yRow.counts[r.key] || 0}</Data></Cell>\n`;
    });
    xml += `    <Cell ss:StyleID="RowTotalCell"><Data ss:Type="Number">${yRow.total}</Data></Cell>
   </Row>
`;
  }

  // 3. Bottom Summary Row
  xml += `   <Row ss:Height="22">
    <!-- Left Bottom: TOPLAM -->
    <Cell ss:StyleID="BottomTotalLabel"><Data ss:Type="String">TOPLAM</Data></Cell>
`;
  INVESTMENT_RANGES.forEach((r) => {
    xml += `    <Cell ss:StyleID="BottomTotalNum"><Data ss:Type="Number">${data.totalColSums[r.key] || 0}</Data></Cell>\n`;
  });
  xml += `    <Cell ss:StyleID="BottomTotalNum"><Data ss:Type="Number">${data.totalGrandTotal}</Data></Cell>
    <!-- Spacer -->
    <Cell><Data ss:Type="String"></Data></Cell>
    <!-- Right Bottom: TOPLAM -->
    <Cell ss:StyleID="BottomTotalLabel"><Data ss:Type="String">TOPLAM</Data></Cell>
`;
  INVESTMENT_RANGES.forEach((r) => {
    xml += `    <Cell ss:StyleID="BottomTotalNum"><Data ss:Type="Number">${data.yapilabilirColSums[r.key] || 0}</Data></Cell>\n`;
  });
  xml += `    <Cell ss:StyleID="BottomTotalNum"><Data ss:Type="Number">${data.yapilabilirGrandTotal}</Data></Cell>
   </Row>
  </Table>
 </Worksheet>
</Workbook>`;

  // Trigger browser download with Excel MIME type
  const blob = new Blob([xml], {
    type: 'application/vnd.ms-excel;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 200);
}

/**
 * Secondary option: Generates a standard .xlsx file via SheetJS
 */
export function exportInvestmentTemplateXLSX(boxes: ServiceBox[], customFilename?: string): void {
  const data = calculateInvestmentMatrices(boxes);

  const filename =
    customFilename ||
    `Yatirim_Izleme_Sablonu_${new Date().toISOString().slice(0, 10)}.xlsx`;

  // Build 2D AoA (Array of Arrays)
  const aoa: any[][] = [];

  // Header row
  const header = [
    'TOPLAM',
    'x<15',
    '15<=x<30',
    '30<=x<45',
    '45<=x<60',
    '60<=x<75',
    '75<=x<90',
    '90<=x',
    'Toplam',
    '', // Spacer
    'YAPILABİLİR',
    'x<15',
    '15<=x<30',
    '30<=x<45',
    '45<=x<60',
    '60<=x<75',
    '75<=x<90',
    '90<=x',
    'Toplam',
  ];
  aoa.push(header);

  // District rows
  for (let i = 0; i < data.districts.length; i++) {
    const t = data.totalRows[i];
    const y = data.yapilabilirRows[i];

    const row = [
      t.district,
      ...INVESTMENT_RANGES.map((r) => t.counts[r.key] || 0),
      t.total,
      '', // Spacer
      y.district,
      ...INVESTMENT_RANGES.map((r) => y.counts[r.key] || 0),
      y.total,
    ];
    aoa.push(row);
  }

  // Bottom row
  const bottomRow = [
    'TOPLAM',
    ...INVESTMENT_RANGES.map((r) => data.totalColSums[r.key] || 0),
    data.totalGrandTotal,
    '', // Spacer
    'TOPLAM',
    ...INVESTMENT_RANGES.map((r) => data.yapilabilirColSums[r.key] || 0),
    data.yapilabilirGrandTotal,
  ];
  aoa.push(bottomRow);

  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // Set column widths
  ws['!cols'] = [
    { wch: 15 }, // TOPLAM
    { wch: 10 }, { wch: 11 }, { wch: 11 }, { wch: 11 }, { wch: 11 }, { wch: 11 }, { wch: 10 },
    { wch: 10 }, // Toplam
    { wch: 4 },  // Spacer
    { wch: 15 }, // YAPILABİLİR
    { wch: 10 }, { wch: 11 }, { wch: 11 }, { wch: 11 }, { wch: 11 }, { wch: 11 }, { wch: 10 },
    { wch: 10 }, // Toplam
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Yatırım İzleme');

  XLSX.writeFile(wb, filename);
}

