import { jsPDF, jsPDFOptions } from 'jspdf';
import { VcsUiApp } from '@vcmap/ui';
import { ComponentInternalInstance, computed } from 'vue';
import ApexCharts, { ApexOptions } from 'apexcharts';
import { v4 as uuidv4 } from 'uuid';
import autoTable from 'jspdf-autotable';
import { VCS_LOGO_PNG } from '../assets/images.js';
import { recolorTransparentImageAsync, transText } from './pdfHelper.js';
import {
  TITILIUMWEB_BOLD,
  TITILIUMWEB_REGULAR,
} from '../assets/titiliumweb.js';
import {
  cumulativeSum,
  HeaterCollection,
  Heater,
} from '../calculation/heatingCalculationHelper.js';
import { getGraphOptions } from '../optionsHelper.js';
import { MainDataType } from '../knowUrHeatOptions.js';
import { sumOverYears } from '../calculation/generalCalculationHelper.js';

function operationalCostData(
  years: number[],
  heatingSystem: Heater,
  selectedCase: string,
): (string | number)[][] {
  const dataLocal = [];

  // Define which yearly cost array to use
  let yearlyCostsToUse;
  if (selectedCase === 'worst') {
    yearlyCostsToUse = heatingSystem.yearlyCostsMax!;
  } else if (selectedCase === 'best') {
    yearlyCostsToUse = heatingSystem.yearlyCostsMin!;
  } else {
    yearlyCostsToUse = heatingSystem.yearlyCosts!;
  }

  for (let i = 1; i < 15; i++) {
    dataLocal.push([
      years[i],
      heatingSystem.costs.maintenance[i].toFixed(2),
      (yearlyCostsToUse[i] - heatingSystem.costs.maintenance[i]).toFixed(2),
      yearlyCostsToUse[i].toFixed(2),
    ]);
  }

  return dataLocal;
}

function totalOperationalCosts(
  heatingSystem: Heater,
  selectedCase: string,
): (string | number)[] {
  // Define which yearly cost array to use
  let yearlyCostsToUse;
  if (selectedCase === 'worst') {
    yearlyCostsToUse = heatingSystem.yearlyCostsMax!;
  } else if (selectedCase === 'best') {
    yearlyCostsToUse = heatingSystem.yearlyCostsMin!;
  } else {
    yearlyCostsToUse = heatingSystem.yearlyCosts!;
  }

  const years = heatingSystem.costs.removal.year - 1;
  return [
    'Total',
    sumOverYears(
      years,
      (year) => heatingSystem.costs.maintenance[year],
    ).toFixed(2),
    sumOverYears(
      years,
      (year) => yearlyCostsToUse[year] - heatingSystem.costs.maintenance[year],
    ).toFixed(2),
    sumOverYears(years, (year) => yearlyCostsToUse[year]).toFixed(2),
  ];
}

export async function createApexChartImageString(
  localApexOptions: ApexOptions,
): Promise<string> {
  const uuid: string = uuidv4();
  const hiddenElement = document.createElement('div');
  hiddenElement.id = uuid;
  document.body.appendChild(hiddenElement);

  if (localApexOptions.chart) {
    localApexOptions.chart.height = 1600;
    localApexOptions.chart.width = 1600;
    if (localApexOptions.chart.animations) {
      localApexOptions.chart.animations.enabled = false;
    }
    localApexOptions.stroke = {
      show: true,
      width: 6,
      colors: ['#1E90FF', '#32CD32', '#FFD700', '#FF6347'], // Use black for stroke
    };
    if (localApexOptions.xaxis) {
      Object.assign(localApexOptions.xaxis, {
        axisBorder: {
          show: true,
          color: '#000000', // Set axis border color to black
        },
        axisTicks: {
          show: true,
          color: '#000000', // Set axis ticks color to black
        },
        labels: {
          style: {
            fontSize: '28px',
            colors: '#000000', // Set x-axis labels color to black
          },
        },
      });
    }
    if (localApexOptions.yaxis) {
      Object.assign(localApexOptions.yaxis, {
        axisBorder: {
          show: true,
          color: '#000000', // Set axis border color to black
        },
        axisTicks: {
          show: true,
          color: '#000000', // Set axis ticks color to black
        },
        labels: {
          formatter(val: number): string {
            return new Intl.NumberFormat('de-DE', {
              style: 'currency',
              currency: 'EUR',
            }).format(val);
          },
          style: {
            fontSize: '28px',
            colors: '#000000', // Set x-axis labels color to black
          },
        },
      });
    }
    if (localApexOptions.legend) {
      Object.assign(localApexOptions.legend, {
        fontSize: '28px', // Adjust the size as needed
      });
    } else {
      localApexOptions.legend = {
        fontSize: '28px',
      };
    }

    // localApexOptions.chart.background = "#FFF"
    if (localApexOptions.theme) {
      localApexOptions.theme.mode = 'light';
    }
    if (localApexOptions.stroke) {
      localApexOptions.stroke.colors = [
        '#1E90FF',
        '#32CD32',
        '#FFD700',
        '#FF6347',
      ];
    }
  }

  const myChart = new ApexCharts(
    document.getElementById(uuid),
    localApexOptions,
  );

  await myChart.render();
  const uriObject = await myChart.dataURI();
  let uri = '';

  if ('imgURI' in uriObject) {
    uri = uriObject.imgURI;
  }

  document.body.removeChild(hiddenElement);
  myChart.destroy();
  return uri;
}

// eslint-disable-next-line import/prefer-default-export
export async function generatePDF(
  app: VcsUiApp,
  vm: ComponentInternalInstance | null,
  newResultValue: HeaterCollection,
  data: MainDataType,
  subsidiesObject: { [key: string]: number },
): Promise<void> {
  const grey = '#EBEBEB';
  const darkGrey2 = '#5E5E5E';
  const yellow = '#FFD600';
  const black = '#000000';
  const darkGrey = '#888888';

  const currentDate = new Intl.DateTimeFormat(app.locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date());

  const onPrimaryColor = '#fff'; // app.vuetify.theme.computedThemes.value.light.colors['on-primary'];
  const primaryColor =
    app.vuetify.theme.computedThemes.value.light.colors.primary;
  const firstPageImageString = await recolorTransparentImageAsync(
    VCS_LOGO_PNG,
    onPrimaryColor,
  );
  const lastPageImageString = await recolorTransparentImageAsync(
    VCS_LOGO_PNG,
    primaryColor,
  );

  const options: jsPDFOptions = {
    orientation: 'p',
    unit: 'mm',
    format: 'a4',
    putOnlyUsedFonts: true,
  };

  // eslint-disable-next-line new-cap
  const doc = new jsPDF(options);

  // standard variables
  doc.setFillColor(primaryColor);
  doc.addFileToVFS('TitilliumWeb-Regular.ttf', TITILIUMWEB_REGULAR);
  doc.addFont('TitilliumWeb-Regular.ttf', 'Titillium Web', 'normal');
  doc.addFileToVFS('TitilliumWeb-Bold.ttf', TITILIUMWEB_BOLD);
  doc.addFont('TitilliumWeb-Bold.ttf', 'Titillium Web', 'bold');

  // first page
  doc.rect(0, 0, 210, 200, 'F');
  doc.addImage(
    firstPageImageString,
    'png',
    15,
    15,
    195,
    112,
    undefined,
    'FAST',
  );
  doc.setFont('Titillium Web', 'bold');
  doc.setTextColor(onPrimaryColor);
  doc.setFontSize(80);
  doc.text(
    transText(vm, 'knowurheat.pdf.titlePage.title').toUpperCase(),
    20,
    190,
  );
  doc.setTextColor(darkGrey2);
  doc.setFontSize(45);
  doc.text(transText(vm, 'knowurheat.pdf.titlePage.subTitle1'), 20, 220);
  doc.text(transText(vm, 'knowurheat.pdf.titlePage.subTitle2'), 20, 240);
  doc.setDrawColor(yellow);
  doc.setLineWidth(1);
  doc.line(20, 250, 50, 250);
  doc.setFont('Titillium Web', 'normal');
  doc.setTextColor(134, 134, 134);
  doc.setFontSize(20);
  doc.setTextColor(primaryColor);
  doc.text(currentDate, 20, 265);

  // table page example Average Investment subsidies
  doc.addPage();
  doc.setDrawColor(yellow);
  doc.setLineWidth(1);
  doc.line(20, 25, 50, 25);
  doc.setTextColor(primaryColor);
  doc.setFontSize(16);
  doc.text(
    transText(vm, 'knowurheat.pdf.general.titleInvest').toUpperCase(),
    20,
    40,
  );
  doc.setTextColor(black);
  doc.text(transText(vm, 'knowurheat.pdf.result.revTitle'), 20, 55);
  doc.setFont('Titillium Web', 'bold');
  doc.setFontSize(12);
  doc.setFont('Titillium Web', 'normal');
  doc.setFillColor(grey);
  doc.rect(20, 70, 170, 33, 'F');
  doc.text(
    doc.splitTextToSize(transText(vm, 'knowurheat.pdf.result.revExpText'), 165),
    22,
    75,
    { lineHeightFactor: 1.5 },
  );

  autoTable(doc, {
    head: [
      [
        `${app.vueI18n.t('knowurheat.table.investment')}`,
        `${app.vueI18n.t('knowurheat.table.gasHeater')}`,
        `${app.vueI18n.t('knowurheat.table.airAir')}`,
        `${app.vueI18n.t('knowurheat.table.airWater')}`,
        `${app.vueI18n.t('knowurheat.table.geothermal')}`,
      ],
    ],
    body: [
      [
        `${app.vueI18n.t('knowurheat.table.capexPerKwh')}`,
        `${newResultValue.gasHeater.capexPerKwh.toFixed(2)} €`,
        `${newResultValue.airAirHP.capexPerKwh.toFixed(2)} €`,
        `${newResultValue.airWaterHP.capexPerKwh.toFixed(2)} €`,
        `${newResultValue.groundWaterHP.capexPerKwh.toFixed(2)} €`,
      ],
      [
        `${app.vueI18n.t('knowurheat.table.equipment')}`,
        `${newResultValue.gasHeater.equipment.toFixed(2)} €`,
        `${newResultValue.airAirHP.equipment.toFixed(2)} €`,
        `${newResultValue.airWaterHP.equipment.toFixed(2)} €`,
        `${newResultValue.groundWaterHP.equipment.toFixed(2)} €`,
      ],
    ],
    foot: [
      [
        `${app.vueI18n.t('knowurheat.table.capex')}`,
        `${newResultValue.gasHeater.capex.toFixed(2)} €`,
        `${newResultValue.airAirHP.capex.toFixed(2)} €`,
        `${newResultValue.airWaterHP.capex.toFixed(2)} €`,
        `${newResultValue.groundWaterHP.capex.toFixed(2)} €`,
      ],
    ],
    startY: 120,
    tableWidth: 170,
    headStyles: {
      overflow: 'linebreak',
      fillColor: primaryColor,
      fontSize: 8,
      textColor: onPrimaryColor,
    },
    footStyles: {
      overflow: 'linebreak',
      fillColor: darkGrey,
      fontSize: 8,
    },
    margin: {
      left: 20,
      bottom: 35,
    },
    bodyStyles: {
      overflow: 'visible',
      fontSize: 8,
    },
    columnStyles: {
      0: { cellWidth: 50 }, // First column (index 0) with a fixed width of 60
    },
  });

  autoTable(doc, {
    head: [
      [
        `${app.vueI18n.t('knowurheat.table.investment')}`,
        `${app.vueI18n.t('knowurheat.table.gasHeater')}`,
        `${app.vueI18n.t('knowurheat.table.airAir')}`,
        `${app.vueI18n.t('knowurheat.table.airWater')}`,
        `${app.vueI18n.t('knowurheat.table.geothermal')}`,
      ],
    ],
    body: [
      [
        `${app.vueI18n.t('knowurheat.table.basic')} [${subsidiesObject.basis}%]`,
        '0€',
        `${(newResultValue.airAirHP.capex * (subsidiesObject.basis / 100)).toFixed(2)} €`,
        `${(newResultValue.airWaterHP.capex * (subsidiesObject.basis / 100)).toFixed(2)} €`,
        `${(newResultValue.groundWaterHP.capex * (subsidiesObject.basis / 100)).toFixed(2)} €`,
      ],
      [
        `${app.vueI18n.t('knowurheat.table.age')} [${subsidiesObject.age}%]`,
        '0€',
        `${(newResultValue.airAirHP.capex * (subsidiesObject.age / 100)).toFixed(2)} €`,
        `${(newResultValue.airWaterHP.capex * (subsidiesObject.age / 100)).toFixed(2)} €`,
        `${(newResultValue.groundWaterHP.capex * (subsidiesObject.age / 100)).toFixed(2)} €`,
      ],
      [
        `${app.vueI18n.t('knowurheat.table.income')} [${subsidiesObject.income}%]`,
        '0€',
        `${(newResultValue.airAirHP.capex * (subsidiesObject.income / 100)).toFixed(2)} €`,
        `${(newResultValue.airWaterHP.capex * (subsidiesObject.income / 100)).toFixed(2)} €`,
        `${(newResultValue.groundWaterHP.capex * (subsidiesObject.income / 100)).toFixed(2)} €`,
      ],
    ],
    foot: [
      [
        `${app.vueI18n.t('knowurheat.table.subsidiesTotal')} [${subsidiesObject.totalSubsidies}%]`,
        '0€',
        `${(newResultValue.airAirHP.capex * (subsidiesObject.totalSubsidies / 100)).toFixed(2)} €`,
        `${(newResultValue.airWaterHP.capex * (subsidiesObject.totalSubsidies / 100)).toFixed(2)} €`,
        `${(newResultValue.groundWaterHP.capex * (subsidiesObject.totalSubsidies / 100)).toFixed(2)} €`,
      ],
    ],
    startY: 150,
    tableWidth: 170,
    headStyles: {
      overflow: 'linebreak',
      fillColor: primaryColor,
      fontSize: 8,
      textColor: onPrimaryColor,
    },
    footStyles: {
      overflow: 'linebreak',
      fillColor: darkGrey,
      fontSize: 8,
    },
    margin: {
      left: 20,
      bottom: 35,
    },
    bodyStyles: {
      overflow: 'visible',
      fontSize: 8,
    },
    columnStyles: {
      0: { cellWidth: 50 }, // First column (index 0) with a fixed width of 60
    },
    didDrawCell(tableData) {
      if (
        tableData.section === 'foot' &&
        tableData.row.index === tableData.table.foot.length - 1
      ) {
        const yPos = (tableData.cell.y ?? 0) + (tableData.cell.height ?? 0) + 2; // Default to 0 if undefined
        const rowHeight = tableData.row.height ?? 10; // Default height
        const startX = tableData.table.settings.margin.left ?? 20; // Default start position

        const rowData = [
          `${app.vueI18n.t('knowurheat.table.costTotal')}`,
          `${newResultValue.gasHeater.capex.toFixed(2)} €`,
          `${(newResultValue.airAirHP.capex * (1 - subsidiesObject.totalSubsidies / 100)).toFixed(2)} €`,
          `${(newResultValue.airWaterHP.capex * (1 - subsidiesObject.totalSubsidies / 100)).toFixed(2)} €`,
          `${(newResultValue.groundWaterHP.capex * (1 - subsidiesObject.totalSubsidies / 100)).toFixed(2)} €`,
        ];

        if (!tableData.table.columns || !tableData.table.columns.length) {
          return;
        }

        // Compute X positions manually by accumulating column widths
        let accumulatedX = startX;

        tableData.table.columns.forEach((column, i) => {
          const textValue = rowData[i] ?? '';
          const columnWidth = column?.width ?? 40;
          const xPos = accumulatedX + 2;
          const yText = yPos + rowHeight / 2;

          // Check for NaN values
          if (Number.isNaN(xPos) || Number.isNaN(yText)) {
            return;
          } else {
            // Set background color
            doc.setFillColor(primaryColor);
            doc.rect(xPos - 2, yPos - 1, columnWidth, rowHeight + 0.5, 'F'); // 'F' fills the rectangle

            doc.setTextColor(onPrimaryColor);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            // doc.text(textValue, xPos, yText, { align: 'center', baseline: 'middle' });
            doc.text(transText(vm, textValue), xPos, yText);
          }

          // Move to next column position
          accumulatedX += columnWidth;
        });
      }
    },
  });

  // Operational costs

  // GAS heater - opex
  const operationalCostsGasAverage = operationalCostData(
    data.Year,
    newResultValue.gasHeater,
    'average',
  );
  const operationalCostsGasAverageResult = totalOperationalCosts(
    newResultValue.gasHeater,
    'average',
  );
  const operationalCostsGasBest = operationalCostData(
    data.Year,
    newResultValue.gasHeater,
    'best',
  );
  const operationalCostsGasBestResult = totalOperationalCosts(
    newResultValue.gasHeater,
    'best',
  );
  const operationalCostsGasWorst = operationalCostData(
    data.Year,
    newResultValue.gasHeater,
    'worst',
  );
  const operationalCostsGasWorstResult = totalOperationalCosts(
    newResultValue.gasHeater,
    'worst',
  );

  doc.addPage();
  doc.setDrawColor(yellow);
  doc.setLineWidth(1);
  doc.line(20, 25, 50, 25);
  doc.setTextColor(primaryColor);
  doc.setFontSize(16);
  doc.text(
    transText(vm, 'knowurheat.pdf.general.titleOperational').toUpperCase(),
    20,
    40,
  );
  doc.setTextColor(black);
  doc.text(transText(vm, 'knowurheat.pdf.opex.gasTitle'), 20, 90);
  doc.setFont('Titillium Web', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(black);
  doc.setFont('Titillium Web', 'normal');
  doc.text(transText(vm, 'knowurheat.pdf.opex.average'), 20, 97);
  doc.setFontSize(12);
  doc.setFont('Titillium Web', 'normal');
  doc.setFillColor(grey);
  doc.rect(20, 50, 170, 33, 'F');
  doc.text(
    doc.splitTextToSize(
      transText(vm, 'knowurheat.pdf.result.operationalText'),
      165,
    ),
    22,
    55,
    { lineHeightFactor: 1.5 },
  );
  autoTable(doc, {
    head: [
      [
        `${app.vueI18n.t('knowurheat.table.year')}`,
        `${app.vueI18n.t('knowurheat.table.maintananceCost')}`,
        `${app.vueI18n.t('knowurheat.table.energyCost')}`,
        `${app.vueI18n.t('knowurheat.table.totalOpex')}`,
      ],
    ],
    body: operationalCostsGasAverage,
    foot: [operationalCostsGasAverageResult],
    startY: 105,
    tableWidth: 170,
    headStyles: {
      overflow: 'linebreak',
      fillColor: primaryColor,
      fontSize: 8,
      textColor: onPrimaryColor,
    },
    footStyles: {
      overflow: 'linebreak',
      fillColor: darkGrey,
      fontSize: 8,
    },
    margin: {
      left: 20,
      bottom: 35,
    },
    bodyStyles: {
      overflow: 'visible',
      fontSize: 8,
    },
    columnStyles: {
      0: { cellWidth: 50 }, // First column (index 0) with a fixed width of 60
    },
  });

  doc.addPage();
  doc.setDrawColor(yellow);
  doc.setLineWidth(1);
  doc.line(20, 25, 50, 25);
  doc.setTextColor(primaryColor);
  doc.setFontSize(16);
  doc.text(
    transText(vm, 'knowurheat.pdf.general.titleOperational').toUpperCase(),
    20,
    40,
  );
  doc.setTextColor(black);
  doc.text(transText(vm, 'knowurheat.pdf.opex.gasTitle'), 20, 55);
  doc.setFont('Titillium Web', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(black);
  doc.text(transText(vm, 'knowurheat.pdf.opex.best'), 20, 63);
  doc.setFont('Titillium Web', 'normal');
  doc.setFontSize(12);
  autoTable(doc, {
    head: [
      [
        `${app.vueI18n.t('knowurheat.table.year')}`,
        `${app.vueI18n.t('knowurheat.table.maintananceCost')}`,
        `${app.vueI18n.t('knowurheat.table.energyCost')}`,
        `${app.vueI18n.t('knowurheat.table.totalOpex')}`,
      ],
    ],
    body: operationalCostsGasBest,
    foot: [operationalCostsGasBestResult],
    startY: 72,
    tableWidth: 170,
    headStyles: {
      overflow: 'linebreak',
      fillColor: primaryColor,
      fontSize: 8,
      textColor: onPrimaryColor,
    },
    footStyles: {
      overflow: 'linebreak',
      fillColor: darkGrey,
      fontSize: 8,
    },
    margin: {
      left: 20,
      bottom: 35,
    },
    bodyStyles: {
      overflow: 'visible',
      fontSize: 8,
    },
    columnStyles: {
      0: { cellWidth: 50 }, // First column (index 0) with a fixed width of 60
    },
  });

  doc.addPage();
  doc.setDrawColor(yellow);
  doc.setLineWidth(1);
  doc.line(20, 25, 50, 25);
  doc.setTextColor(primaryColor);
  doc.setFontSize(16);
  doc.text(
    transText(vm, 'knowurheat.pdf.general.titleOperational').toUpperCase(),
    20,
    40,
  );
  doc.setTextColor(black);
  doc.text(transText(vm, 'knowurheat.pdf.opex.gasTitle'), 20, 55);
  doc.setFont('Titillium Web', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(black);
  doc.text(transText(vm, 'knowurheat.pdf.opex.worst'), 20, 63);
  doc.setFont('Titillium Web', 'normal');
  doc.setFontSize(12);
  autoTable(doc, {
    head: [
      [
        `${app.vueI18n.t('knowurheat.table.year')}`,
        `${app.vueI18n.t('knowurheat.table.maintananceCost')}`,
        `${app.vueI18n.t('knowurheat.table.energyCost')}`,
        `${app.vueI18n.t('knowurheat.table.totalOpex')}`,
      ],
    ],
    body: operationalCostsGasWorst,
    foot: [operationalCostsGasWorstResult],
    startY: 72,
    tableWidth: 170,
    headStyles: {
      overflow: 'linebreak',
      fillColor: primaryColor,
      fontSize: 8,
      textColor: onPrimaryColor,
    },
    footStyles: {
      overflow: 'linebreak',
      fillColor: darkGrey,
      fontSize: 8,
    },
    margin: {
      left: 20,
      bottom: 35,
    },
    bodyStyles: {
      overflow: 'visible',
      fontSize: 8,
    },
    columnStyles: {
      0: { cellWidth: 50 }, // First column (index 0) with a fixed width of 60
    },
  });

  // Air-Air
  const operationalCostsAAHPAverage = operationalCostData(
    data.Year,
    newResultValue.airAirHP,
    'average',
  );
  const operationalCostsAAHPAverageResult = totalOperationalCosts(
    newResultValue.airAirHP,
    'average',
  );
  const operationalCostsAAHPBest = operationalCostData(
    data.Year,
    newResultValue.airAirHP,
    'best',
  );
  const operationalCostsAAHPBestResult = totalOperationalCosts(
    newResultValue.airAirHP,
    'best',
  );
  const operationalCostsAAHPWorst = operationalCostData(
    data.Year,
    newResultValue.airAirHP,
    'worst',
  );
  const operationalCostsAAHPWorstResult = totalOperationalCosts(
    newResultValue.airAirHP,
    'worst',
  );

  doc.addPage();
  doc.setDrawColor(yellow);
  doc.setLineWidth(1);
  doc.line(20, 25, 50, 25);
  doc.setTextColor(primaryColor);
  doc.setFontSize(16);
  doc.text(
    transText(vm, 'knowurheat.pdf.general.titleOperational').toUpperCase(),
    20,
    40,
  );
  doc.setTextColor(black);
  doc.text(transText(vm, 'knowurheat.table.selectHeating.aahp'), 20, 90);
  doc.setFont('Titillium Web', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(black);
  doc.setFont('Titillium Web', 'normal');
  doc.text(transText(vm, 'knowurheat.pdf.opex.average'), 20, 97);
  doc.setFontSize(12);
  doc.setFont('Titillium Web', 'normal');
  doc.setFillColor(grey);
  doc.rect(20, 50, 170, 33, 'F');
  doc.text(
    doc.splitTextToSize(
      transText(vm, 'knowurheat.pdf.result.operationalText'),
      165,
    ),
    22,
    55,
    { lineHeightFactor: 1.5 },
  );
  autoTable(doc, {
    head: [
      [
        `${app.vueI18n.t('knowurheat.table.year')}`,
        `${app.vueI18n.t('knowurheat.table.maintananceCost')}`,
        `${app.vueI18n.t('knowurheat.table.energyCost')}`,
        `${app.vueI18n.t('knowurheat.table.totalOpex')}`,
      ],
    ],
    body: operationalCostsAAHPAverage,
    foot: [operationalCostsAAHPAverageResult],
    startY: 105,
    tableWidth: 170,
    headStyles: {
      overflow: 'linebreak',
      fillColor: primaryColor,
      fontSize: 8,
      textColor: onPrimaryColor,
    },
    footStyles: {
      overflow: 'linebreak',
      fillColor: darkGrey,
      fontSize: 8,
    },
    margin: {
      left: 20,
      bottom: 35,
    },
    bodyStyles: {
      overflow: 'visible',
      fontSize: 8,
    },
    columnStyles: {
      0: { cellWidth: 50 }, // First column (index 0) with a fixed width of 60
    },
  });

  doc.addPage();
  doc.setDrawColor(yellow);
  doc.setLineWidth(1);
  doc.line(20, 25, 50, 25);
  doc.setTextColor(primaryColor);
  doc.setFontSize(16);
  doc.text(
    transText(vm, 'knowurheat.pdf.general.titleOperational').toUpperCase(),
    20,
    40,
  );
  doc.setTextColor(black);
  doc.text(transText(vm, 'knowurheat.table.selectHeating.aahp'), 20, 55);
  doc.setFont('Titillium Web', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(black);
  doc.text(transText(vm, 'knowurheat.pdf.opex.best'), 20, 63);
  doc.setFont('Titillium Web', 'normal');
  doc.setFontSize(12);
  autoTable(doc, {
    head: [
      [
        `${app.vueI18n.t('knowurheat.table.year')}`,
        `${app.vueI18n.t('knowurheat.table.maintananceCost')}`,
        `${app.vueI18n.t('knowurheat.table.energyCost')}`,
        `${app.vueI18n.t('knowurheat.table.totalOpex')}`,
      ],
    ],
    body: operationalCostsAAHPBest,
    foot: [operationalCostsAAHPBestResult],
    startY: 72,
    tableWidth: 170,
    headStyles: {
      overflow: 'linebreak',
      fillColor: primaryColor,
      fontSize: 8,
      textColor: onPrimaryColor,
    },
    footStyles: {
      overflow: 'linebreak',
      fillColor: darkGrey,
      fontSize: 8,
    },
    margin: {
      left: 20,
      bottom: 35,
    },
    bodyStyles: {
      overflow: 'visible',
      fontSize: 8,
    },
    columnStyles: {
      0: { cellWidth: 50 }, // First column (index 0) with a fixed width of 60
    },
  });

  doc.addPage();
  doc.setDrawColor(yellow);
  doc.setLineWidth(1);
  doc.line(20, 25, 50, 25);
  doc.setTextColor(primaryColor);
  doc.setFontSize(16);
  doc.text(
    transText(vm, 'knowurheat.pdf.general.titleOperational').toUpperCase(),
    20,
    40,
  );
  doc.setTextColor(black);
  doc.text(transText(vm, 'knowurheat.table.selectHeating.aahp'), 20, 55);
  doc.setFont('Titillium Web', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(black);
  doc.text(transText(vm, 'knowurheat.pdf.opex.worst'), 20, 63);
  doc.setFont('Titillium Web', 'normal');
  doc.setFontSize(12);
  autoTable(doc, {
    head: [
      [
        `${app.vueI18n.t('knowurheat.table.year')}`,
        `${app.vueI18n.t('knowurheat.table.maintananceCost')}`,
        `${app.vueI18n.t('knowurheat.table.energyCost')}`,
        `${app.vueI18n.t('knowurheat.table.totalOpex')}`,
      ],
    ],
    body: operationalCostsAAHPWorst,
    foot: [operationalCostsAAHPWorstResult],
    startY: 72,
    tableWidth: 170,
    headStyles: {
      overflow: 'linebreak',
      fillColor: primaryColor,
      fontSize: 8,
      textColor: onPrimaryColor,
    },
    footStyles: {
      overflow: 'linebreak',
      fillColor: darkGrey,
      fontSize: 8,
    },
    margin: {
      left: 20,
      bottom: 35,
    },
    bodyStyles: {
      overflow: 'visible',
      fontSize: 8,
    },
    columnStyles: {
      0: { cellWidth: 50 }, // First column (index 0) with a fixed width of 60
    },
  });

  // Air-Water
  const operationalCostsAWHPAverage = operationalCostData(
    data.Year,
    newResultValue.airWaterHP,
    'average',
  );
  const operationalCostsAWHPAverageResult = totalOperationalCosts(
    newResultValue.airWaterHP,
    'average',
  );
  const operationalCostsAWHPBest = operationalCostData(
    data.Year,
    newResultValue.airWaterHP,
    'best',
  );
  const operationalCostsAWHPBestResult = totalOperationalCosts(
    newResultValue.airWaterHP,
    'best',
  );
  const operationalCostsAWHPWorst = operationalCostData(
    data.Year,
    newResultValue.airWaterHP,
    'worst',
  );
  const operationalCostsAWHPWorstResult = totalOperationalCosts(
    newResultValue.airWaterHP,
    'worst',
  );

  doc.addPage();
  doc.setDrawColor(yellow);
  doc.setLineWidth(1);
  doc.line(20, 25, 50, 25);
  doc.setTextColor(primaryColor);
  doc.setFontSize(16);
  doc.text(
    transText(vm, 'knowurheat.pdf.general.titleOperational').toUpperCase(),
    20,
    40,
  );
  doc.setTextColor(black);
  doc.text(transText(vm, 'knowurheat.table.selectHeating.awhp'), 20, 90);
  doc.setFont('Titillium Web', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(black);
  doc.setFont('Titillium Web', 'normal');
  doc.text(transText(vm, 'knowurheat.pdf.opex.average'), 20, 97);
  doc.setFontSize(12);
  doc.setFont('Titillium Web', 'normal');
  doc.setFillColor(grey);
  doc.rect(20, 50, 170, 33, 'F');
  doc.text(
    doc.splitTextToSize(
      transText(vm, 'knowurheat.pdf.result.operationalText'),
      165,
    ),
    22,
    55,
    { lineHeightFactor: 1.5 },
  );
  autoTable(doc, {
    head: [
      [
        `${app.vueI18n.t('knowurheat.table.year')}`,
        `${app.vueI18n.t('knowurheat.table.maintananceCost')}`,
        `${app.vueI18n.t('knowurheat.table.energyCost')}`,
        `${app.vueI18n.t('knowurheat.table.totalOpex')}`,
      ],
    ],
    body: operationalCostsAWHPAverage,
    foot: [operationalCostsAWHPAverageResult],
    startY: 105,
    tableWidth: 170,
    headStyles: {
      overflow: 'linebreak',
      fillColor: primaryColor,
      fontSize: 8,
      textColor: onPrimaryColor,
    },
    footStyles: {
      overflow: 'linebreak',
      fillColor: darkGrey,
      fontSize: 8,
    },
    margin: {
      left: 20,
      bottom: 35,
    },
    bodyStyles: {
      overflow: 'visible',
      fontSize: 8,
    },
    columnStyles: {
      0: { cellWidth: 50 }, // First column (index 0) with a fixed width of 60
    },
  });

  doc.addPage();
  doc.setDrawColor(yellow);
  doc.setLineWidth(1);
  doc.line(20, 25, 50, 25);
  doc.setTextColor(primaryColor);
  doc.setFontSize(16);
  doc.text(
    transText(vm, 'knowurheat.pdf.general.titleOperational').toUpperCase(),
    20,
    40,
  );
  doc.setTextColor(black);
  doc.text(transText(vm, 'knowurheat.table.selectHeating.awhp'), 20, 55);
  doc.setFont('Titillium Web', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(black);
  doc.text(transText(vm, 'knowurheat.pdf.opex.best'), 20, 63);
  doc.setFont('Titillium Web', 'normal');
  doc.setFontSize(12);
  autoTable(doc, {
    head: [
      [
        `${app.vueI18n.t('knowurheat.table.year')}`,
        `${app.vueI18n.t('knowurheat.table.maintananceCost')}`,
        `${app.vueI18n.t('knowurheat.table.energyCost')}`,
        `${app.vueI18n.t('knowurheat.table.totalOpex')}`,
      ],
    ],
    body: operationalCostsAWHPBest,
    foot: [operationalCostsAWHPBestResult],
    startY: 72,
    tableWidth: 170,
    headStyles: {
      overflow: 'linebreak',
      fillColor: primaryColor,
      fontSize: 8,
      textColor: onPrimaryColor,
    },
    footStyles: {
      overflow: 'linebreak',
      fillColor: darkGrey,
      fontSize: 8,
    },
    margin: {
      left: 20,
      bottom: 35,
    },
    bodyStyles: {
      overflow: 'visible',
      fontSize: 8,
    },
    columnStyles: {
      0: { cellWidth: 50 }, // First column (index 0) with a fixed width of 60
    },
  });

  doc.addPage();
  doc.setDrawColor(yellow);
  doc.setLineWidth(1);
  doc.line(20, 25, 50, 25);
  doc.setTextColor(primaryColor);
  doc.setFontSize(16);
  doc.text(
    transText(vm, 'knowurheat.pdf.general.titleOperational').toUpperCase(),
    20,
    40,
  );
  doc.setTextColor(black);
  doc.text(transText(vm, 'knowurheat.table.selectHeating.awhp'), 20, 55);
  doc.setFont('Titillium Web', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(black);
  doc.text(transText(vm, 'knowurheat.pdf.opex.worst'), 20, 63);
  doc.setFont('Titillium Web', 'normal');
  doc.setFontSize(12);
  autoTable(doc, {
    head: [
      [
        `${app.vueI18n.t('knowurheat.table.year')}`,
        `${app.vueI18n.t('knowurheat.table.maintananceCost')}`,
        `${app.vueI18n.t('knowurheat.table.energyCost')}`,
        `${app.vueI18n.t('knowurheat.table.totalOpex')}`,
      ],
    ],
    body: operationalCostsAWHPWorst,
    foot: [operationalCostsAWHPWorstResult],
    startY: 72,
    tableWidth: 170,
    headStyles: {
      overflow: 'linebreak',
      fillColor: primaryColor,
      fontSize: 8,
      textColor: onPrimaryColor,
    },
    footStyles: {
      overflow: 'linebreak',
      fillColor: darkGrey,
      fontSize: 8,
    },
    margin: {
      left: 20,
      bottom: 35,
    },
    bodyStyles: {
      overflow: 'visible',
      fontSize: 8,
    },
    columnStyles: {
      0: { cellWidth: 50 }, // First column (index 0) with a fixed width of 60
    },
  });

  // Ground Water

  const operationalCostsGWHPAverage = operationalCostData(
    data.Year,
    newResultValue.groundWaterHP,
    'average',
  );
  const operationalCostsGWHPAverageResult = totalOperationalCosts(
    newResultValue.groundWaterHP,
    'average',
  );
  const operationalCostsGWHPBest = operationalCostData(
    data.Year,
    newResultValue.groundWaterHP,
    'best',
  );
  const operationalCostsGWHPBestResult = totalOperationalCosts(
    newResultValue.groundWaterHP,
    'best',
  );
  const operationalCostsGWHPWorst = operationalCostData(
    data.Year,
    newResultValue.groundWaterHP,
    'worst',
  );
  const operationalCostsGWHPWorstResult = totalOperationalCosts(
    newResultValue.groundWaterHP,
    'worst',
  );

  doc.addPage();
  doc.setDrawColor(yellow);
  doc.setLineWidth(1);
  doc.line(20, 25, 50, 25);
  doc.setTextColor(primaryColor);
  doc.setFontSize(16);
  doc.text(
    transText(vm, 'knowurheat.pdf.general.titleOperational').toUpperCase(),
    20,
    40,
  );
  doc.setTextColor(black);
  doc.text(transText(vm, 'knowurheat.table.selectHeating.gwhp'), 20, 90);
  doc.setFont('Titillium Web', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(black);
  doc.setFont('Titillium Web', 'normal');
  doc.text(transText(vm, 'knowurheat.pdf.opex.average'), 20, 97);
  doc.setFontSize(12);
  doc.setFont('Titillium Web', 'normal');
  doc.setFillColor(grey);
  doc.rect(20, 50, 170, 33, 'F');
  doc.text(
    doc.splitTextToSize(
      transText(vm, 'knowurheat.pdf.result.operationalText'),
      165,
    ),
    22,
    55,
    { lineHeightFactor: 1.5 },
  );
  autoTable(doc, {
    head: [
      [
        `${app.vueI18n.t('knowurheat.table.year')}`,
        `${app.vueI18n.t('knowurheat.table.maintananceCost')}`,
        `${app.vueI18n.t('knowurheat.table.energyCost')}`,
        `${app.vueI18n.t('knowurheat.table.totalOpex')}`,
      ],
    ],
    body: operationalCostsGWHPAverage,
    foot: [operationalCostsGWHPAverageResult],
    startY: 105,
    tableWidth: 170,
    headStyles: {
      overflow: 'linebreak',
      fillColor: primaryColor,
      fontSize: 8,
      textColor: onPrimaryColor,
    },
    footStyles: {
      overflow: 'linebreak',
      fillColor: darkGrey,
      fontSize: 8,
    },
    margin: {
      left: 20,
      bottom: 35,
    },
    bodyStyles: {
      overflow: 'visible',
      fontSize: 8,
    },
    columnStyles: {
      0: { cellWidth: 50 }, // First column (index 0) with a fixed width of 60
    },
  });

  doc.addPage();
  doc.setDrawColor(yellow);
  doc.setLineWidth(1);
  doc.line(20, 25, 50, 25);
  doc.setTextColor(primaryColor);
  doc.setFontSize(16);
  doc.text(
    transText(vm, 'knowurheat.pdf.general.titleOperational').toUpperCase(),
    20,
    40,
  );
  doc.setTextColor(black);
  doc.text(transText(vm, 'knowurheat.table.selectHeating.gwhp'), 20, 55);
  doc.setFont('Titillium Web', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(black);
  doc.text(transText(vm, 'knowurheat.pdf.opex.best'), 20, 63);
  doc.setFont('Titillium Web', 'normal');
  doc.setFontSize(12);
  autoTable(doc, {
    head: [
      [
        `${app.vueI18n.t('knowurheat.table.year')}`,
        `${app.vueI18n.t('knowurheat.table.maintananceCost')}`,
        `${app.vueI18n.t('knowurheat.table.energyCost')}`,
        `${app.vueI18n.t('knowurheat.table.totalOpex')}`,
      ],
    ],
    body: operationalCostsGWHPBest,
    foot: [operationalCostsGWHPBestResult],
    startY: 72,
    tableWidth: 170,
    headStyles: {
      overflow: 'linebreak',
      fillColor: primaryColor,
      fontSize: 8,
      textColor: onPrimaryColor,
    },
    footStyles: {
      overflow: 'linebreak',
      fillColor: darkGrey,
      fontSize: 8,
    },
    margin: {
      left: 20,
      bottom: 35,
    },
    bodyStyles: {
      overflow: 'visible',
      fontSize: 8,
    },
    columnStyles: {
      0: { cellWidth: 50 }, // First column (index 0) with a fixed width of 60
    },
  });

  doc.addPage();
  doc.setDrawColor(yellow);
  doc.setLineWidth(1);
  doc.line(20, 25, 50, 25);
  doc.setTextColor(primaryColor);
  doc.setFontSize(16);
  doc.text(
    transText(vm, 'knowurheat.pdf.general.titleOperational').toUpperCase(),
    20,
    40,
  );
  doc.setTextColor(black);
  doc.text(transText(vm, 'knowurheat.table.selectHeating.gwhp'), 20, 55);
  doc.setFont('Titillium Web', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(black);
  doc.text(transText(vm, 'knowurheat.pdf.opex.worst'), 20, 63);
  doc.setFont('Titillium Web', 'normal');
  doc.setFontSize(12);
  autoTable(doc, {
    head: [
      [
        `${app.vueI18n.t('knowurheat.table.year')}`,
        `${app.vueI18n.t('knowurheat.table.maintananceCost')}`,
        `${app.vueI18n.t('knowurheat.table.energyCost')}`,
        `${app.vueI18n.t('knowurheat.table.totalOpex')}`,
      ],
    ],
    body: operationalCostsGWHPWorst,
    foot: [operationalCostsGWHPWorstResult],
    startY: 72,
    tableWidth: 170,
    headStyles: {
      overflow: 'linebreak',
      fillColor: primaryColor,
      fontSize: 8,
      textColor: onPrimaryColor,
    },
    footStyles: {
      overflow: 'linebreak',
      fillColor: darkGrey,
      fontSize: 8,
    },
    margin: {
      left: 20,
      bottom: 35,
    },
    bodyStyles: {
      overflow: 'visible',
      fontSize: 8,
    },
    columnStyles: {
      0: { cellWidth: 50 }, // First column (index 0) with a fixed width of 60
    },
  });

  // graph pages
  doc.addPage();

  const seriesStandard = computed(() => {
    const ghGraph = cumulativeSum(newResultValue.gasHeater.yearlyCosts!);
    const aahpGraph = cumulativeSum(newResultValue.airAirHP.yearlyCosts!);
    const awhpGraph = cumulativeSum(newResultValue.airWaterHP.yearlyCosts!);
    const gwhpGraph = cumulativeSum(newResultValue.groundWaterHP.yearlyCosts!);

    return [
      {
        name: transText(vm, 'knowurheat.graph.title.gas'),
        data: ghGraph,
      },
      {
        name: transText(vm, 'knowurheat.graph.title.airAir'),
        data: aahpGraph,
      },
      {
        name: transText(vm, 'knowurheat.graph.title.airWater'),
        data: awhpGraph,
      },
      {
        name: transText(vm, 'knowurheat.graph.title.groundWater'),
        data: gwhpGraph,
      },
    ];
  });

  const seriesBest = computed(() => {
    const bestGhGraph = [...newResultValue.gasHeater.yearlyCostsMin!];
    const bestAahpGraph = [...newResultValue.airAirHP.yearlyCostsMin!];
    const bestAwhpGraph = [...newResultValue.airWaterHP.yearlyCostsMin!];
    const bestGwhpGraph = [...newResultValue.groundWaterHP.yearlyCostsMin!];

    bestGhGraph[0] = newResultValue.gasHeater.yearlyCostsMin![0];
    bestAahpGraph[0] = newResultValue.airAirHP.yearlyCostsMin![0];
    bestAwhpGraph[0] = newResultValue.airWaterHP.yearlyCostsMin![0];
    bestGwhpGraph[0] = newResultValue.groundWaterHP.yearlyCostsMin![0];

    const ghGraph = cumulativeSum(bestGhGraph);
    const aahpGraph = cumulativeSum(bestAahpGraph);
    const awhpGraph = cumulativeSum(bestAwhpGraph);
    const gwhpGraph = cumulativeSum(bestGwhpGraph);

    return [
      {
        name: transText(vm, 'knowurheat.graph.title.gas'),
        data: ghGraph,
      },
      {
        name: transText(vm, 'knowurheat.graph.title.airAir'),
        data: aahpGraph,
      },
      {
        name: transText(vm, 'knowurheat.graph.title.airWater'),
        data: awhpGraph,
      },
      {
        name: transText(vm, 'knowurheat.graph.title.groundWater'),
        data: gwhpGraph,
      },
    ];
  });

  const seriesWorst = computed(() => {
    const worstGhGraph = [...newResultValue.gasHeater.yearlyCostsMax!];
    const worstAahpGraph = [...newResultValue.airAirHP.yearlyCostsMax!];
    const worstAwhpGraph = [...newResultValue.airWaterHP.yearlyCostsMax!];
    const worstGwhpGraph = [...newResultValue.groundWaterHP.yearlyCostsMax!];

    worstGhGraph[0] = newResultValue.gasHeater.yearlyCostsMax![0];
    worstAahpGraph[0] = newResultValue.airAirHP.yearlyCostsMax![0];
    worstAwhpGraph[0] = newResultValue.airWaterHP.yearlyCostsMax![0];
    worstGwhpGraph[0] = newResultValue.groundWaterHP.yearlyCostsMax![0];

    const ghGraph = cumulativeSum(worstGhGraph);
    const aahpGraph = cumulativeSum(worstAahpGraph);
    const awhpGraph = cumulativeSum(worstAwhpGraph);
    const gwhpGraph = cumulativeSum(worstGwhpGraph);

    return [
      {
        name: transText(vm, 'knowurheat.graph.title.gas'),
        data: ghGraph,
      },
      {
        name: transText(vm, 'knowurheat.graph.title.airAir'),
        data: aahpGraph,
      },
      {
        name: transText(vm, 'knowurheat.graph.title.airWater'),
        data: awhpGraph,
      },
      {
        name: transText(vm, 'knowurheat.graph.title.groundWater'),
        data: gwhpGraph,
      },
    ];
  });
  const localMoneyOverTimeOptions = getGraphOptions(data, app);
  localMoneyOverTimeOptions.series = seriesStandard.value;
  const imgRevenue = await createApexChartImageString(
    localMoneyOverTimeOptions,
  );
  const localMoneyOverTimeOptionsBest = getGraphOptions(data, app);
  localMoneyOverTimeOptionsBest.series = seriesBest.value;
  const imgRevenueBest = await createApexChartImageString(
    localMoneyOverTimeOptionsBest,
  );
  const localMoneyOverTimeOptionsWorst = getGraphOptions(data, app);
  localMoneyOverTimeOptionsWorst.series = seriesWorst.value;
  const imgRevenueWorst = await createApexChartImageString(
    localMoneyOverTimeOptionsWorst,
  );

  doc.setDrawColor(yellow);
  doc.setLineWidth(1);
  doc.line(20, 25, 50, 25);
  doc.setTextColor(primaryColor);
  doc.setFontSize(16);
  doc.text(
    transText(vm, 'knowurheat.pdf.general.titleAverage').toUpperCase(),
    20,
    40,
  );
  doc.setTextColor(black);
  doc.setFont('Titillium Web', 'normal');
  doc.setFontSize(12);
  doc.text(
    `${transText(
      vm,
      'knowurheat.pdf.graphTitleGas',
    )}: ${newResultValue.gasHeater.totalCost!.toFixed(2)} €`,
    20,
    55,
  );
  doc.text(
    `${transText(
      vm,
      'knowurheat.pdf.graphTitleAirAir',
    )}: ${newResultValue.airAirHP.totalCost!.toFixed(2)} €`,
    20,
    60,
  );
  doc.text(
    `${transText(
      vm,
      'knowurheat.pdf.graphTitleAirWater',
    )}: ${newResultValue.airWaterHP.totalCost!.toFixed(2)} €`,
    20,
    65,
  );
  doc.text(
    `${transText(
      vm,
      'knowurheat.pdf.graphTitleGround',
    )}: ${newResultValue.groundWaterHP.totalCost!.toFixed(2)} €`,
    20,
    70,
  );
  doc.addImage(imgRevenue, 'png', 20, 75, 170, 170, undefined, 'SLOW');

  doc.addPage();
  doc.setDrawColor(yellow);
  doc.setLineWidth(1);
  doc.line(20, 25, 50, 25);
  doc.setTextColor(primaryColor);
  doc.setFontSize(16);
  doc.text(
    transText(vm, 'knowurheat.pdf.general.titleBest').toUpperCase(),
    20,
    40,
  );
  doc.setTextColor(black);
  doc.setFont('Titillium Web', 'normal');
  doc.setFontSize(12);
  doc.text(
    `${transText(
      vm,
      'knowurheat.pdf.graphTitleGas',
    )}: ${newResultValue.gasHeater.totalCostBest!.toFixed(2)} €`,
    20,
    55,
  );
  doc.text(
    `${transText(
      vm,
      'knowurheat.pdf.graphTitleAirAir',
    )}: ${newResultValue.airAirHP.totalCostBest!.toFixed(2)} €`,
    20,
    60,
  );
  doc.text(
    `${transText(
      vm,
      'knowurheat.pdf.graphTitleAirWater',
    )}: ${newResultValue.airWaterHP.totalCostBest!.toFixed(2)} €`,
    20,
    65,
  );
  doc.text(
    `${transText(
      vm,
      'knowurheat.pdf.graphTitleGround',
    )}: ${newResultValue.groundWaterHP.totalCostBest!.toFixed(2)} €`,
    20,
    70,
  );
  doc.setFont('Titillium Web', 'normal');
  doc.setFontSize(12);
  doc.addImage(imgRevenueBest, 'png', 20, 75, 170, 170, undefined, 'SLOW');

  doc.addPage();
  doc.setDrawColor(yellow);
  doc.setLineWidth(1);
  doc.line(20, 25, 50, 25);
  doc.setTextColor(primaryColor);
  doc.setFontSize(16);
  doc.text(
    transText(vm, 'knowurheat.pdf.general.titleWorst').toUpperCase(),
    20,
    40,
  );
  doc.setTextColor(black);
  doc.setFont('Titillium Web', 'normal');
  doc.setFontSize(12);
  doc.text(
    `${transText(
      vm,
      'knowurheat.pdf.graphTitleGas',
    )}: ${newResultValue.gasHeater.totalCostWorst!.toFixed(2)} €`,
    20,
    55,
  );
  doc.text(
    `${transText(
      vm,
      'knowurheat.pdf.graphTitleAirAir',
    )}: ${newResultValue.airAirHP.totalCostWorst!.toFixed(2)} €`,
    20,
    60,
  );
  doc.text(
    `${transText(
      vm,
      'knowurheat.pdf.graphTitleAirWater',
    )}: ${newResultValue.airWaterHP.totalCostWorst!.toFixed(2)} €`,
    20,
    65,
  );
  doc.text(
    `${transText(
      vm,
      'knowurheat.pdf.graphTitleGround',
    )}: ${newResultValue.groundWaterHP.totalCostWorst!.toFixed(2)} €`,
    20,
    70,
  );
  doc.addImage(imgRevenueWorst, 'png', 20, 75, 170, 170, undefined, 'SLOW');

  // last page
  doc.addPage();
  doc.addImage(lastPageImageString, 'png', 100, 30, 110, 60, undefined, 'FAST');
  doc.setDrawColor(yellow);
  doc.setLineWidth(1);
  doc.line(20, 120, 50, 120);
  doc.setTextColor(primaryColor);
  doc.setFontSize(48);
  doc.setFont('Titillium Web', 'bold');
  doc.text(transText(vm, 'knowurheat.pdf.lastPage.title'), 20, 140);
  doc.setTextColor(black);
  doc.setFont('Titillium Web', 'normal');
  doc.setFontSize(10);
  doc.text(
    doc.splitTextToSize(
      transText(vm, 'knowurheat.pdf.lastPage.infoContent'),
      170,
    ),
    20,
    150,
    { lineHeightFactor: 1.5 },
  );

  // global
  const totalPages = doc.getNumberOfPages();
  doc.setFont('Titillium Web', 'normal');
  doc.setFontSize(12);
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setTextColor(darkGrey);
    if (i !== 1 && i !== totalPages) {
      doc.setFont('Titillium Web', 'normal');
      doc.text(`${i} / ${totalPages}`, 190, 285, { align: 'right' });
      doc.setFont('Titillium Web', 'bold');
      doc.text(transText(vm, 'knowurheat.pdf.footerLineOne'), 20, 280);
      doc.setFont('Titillium Web', 'normal');
      doc.text(transText(vm, 'knowurheat.pdf.footerLineTwo'), 20, 285);
    }
  }

  // save
  doc.save('knowUrHeat.pdf');
}
