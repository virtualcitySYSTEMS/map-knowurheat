import { ApexOptions } from 'apexcharts';
import { VcsUiApp } from '@vcmap/ui';
import { MainDataType } from './knowUrHeatOptions.js';

export type DeepPartial<T> = T extends object
  ? { [K in keyof T]?: DeepPartial<T[K]> }
  : T;

// eslint-disable-next-line import/prefer-default-export
export function getGraphOptions(
  data: MainDataType,
  app: VcsUiApp,
): ApexOptions {
  return {
    chart: {
      id: 'costChart',
      type: 'line',
      animations: { enabled: true },
      background: 'rgba(0, 0, 0, 0)', // Transparent background
      toolbar: {
        tools: {
          download: true, // Retain toolbar for downloads
        },
      },
    },
    dataLabels: {
      enabled: false, // Disable data labels
    },
    plotOptions: {},
    colors: ['#1E90FF', '#32CD32', '#FFD700', '#FF6347'], // Adjust to preferred cost colors
    xaxis: {
      categories: data.Year, // Years as categories
    },
    yaxis: {
      labels: {
        formatter(val: number): string {
          return new Intl.NumberFormat('de-DE', {
            style: 'currency',
            currency: 'EUR',
          }).format(val);
        },
      },
      axisBorder: {
        show: true,
      },
      axisTicks: {
        show: true,
      },
    },
    tooltip: {
      y: {
        formatter(val: number): string {
          return new Intl.NumberFormat('de-DE', {
            style: 'currency',
            currency: 'EUR',
          }).format(val);
        },
      },
    },
    theme: {
      mode: app.vuetify.theme.current.value.dark ? 'dark' : 'light',
    },
    grid: {
      show: false, // Hide grid for a cleaner look
    },
    legend: {
      position: 'top',
      horizontalAlign: 'left',
      offsetY: 14,
      labels: {
        useSeriesColors: true, // Match colors to series
      },
    },
    stroke: {
      show: true,
      width: 1,
      colors: ['#1E90FF', '#32CD32', '#FFD700', '#FF6347'], // Use black for stroke
    },
  };
}

export function deepMerge<T extends Record<string, unknown>>(
  defaultObject: Partial<T>,
  changeObject: Partial<T>,
): T {
  const merged: Partial<T> = { ...defaultObject };
  const keys = new Set([
    ...Object.keys(defaultObject),
    ...Object.keys(changeObject),
  ]) as Set<keyof T>;

  for (const key of keys) {
    const value1 = defaultObject[key];
    const value2 = changeObject[key];

    if (
      typeof value1 === 'object' &&
      typeof value2 === 'object' &&
      !Array.isArray(value1) &&
      value1 !== null &&
      !Array.isArray(value2) &&
      value2 !== null
    ) {
      merged[key] = deepMerge(value1, value2) as T[typeof key];
    } else if (value2 !== undefined) {
      merged[key] = value2 as T[typeof key];
    }
  }
  return merged as T;
}

export function deepDiff<T extends Record<string, unknown>>(
  defaultObject: Partial<T>,
  changeObject: Partial<T>,
): Partial<T> {
  const differences: Partial<T> = {} as Partial<T>;
  const keys = new Set<keyof T>([
    ...Object.keys(defaultObject),
    ...Object.keys(changeObject),
  ]);

  for (const key of keys) {
    const value1 = defaultObject[key];
    const value2 = changeObject[key];

    if (
      typeof value1 === 'object' &&
      typeof value2 === 'object' &&
      !Array.isArray(value1) &&
      value1 !== null &&
      !Array.isArray(value2) &&
      value2 !== null
    ) {
      const nestedDifferences = deepDiff(value1, value2);
      if (Object.keys(nestedDifferences).length > 0) {
        differences[key] = nestedDifferences as T[typeof key];
      }
    } else if (Array.isArray(value1) && Array.isArray(value2)) {
      if (
        value1.length !== value2.length ||
        JSON.stringify(value1) !== JSON.stringify(value2)
      ) {
        differences[key] = value2 as T[keyof T];
      }
    } else if (
      value2 !== undefined &&
      typeof value1 !== 'function' &&
      typeof value2 !== 'function' &&
      value1 !== value2
    ) {
      differences[key] = value2 as T[keyof T];
    }
  }
  return differences;
}
