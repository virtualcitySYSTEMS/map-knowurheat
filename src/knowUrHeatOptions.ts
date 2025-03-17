export type MainDataType = {
  Year: number[];
  'Maintenance costs GH': number[];
  'Maintenance costs air-air HP': number[];
  'Maintenance costs air-water HP': number[];
  'Maintenance costs ground-water HP': number[];
  'Deconstruction costs GH': { year: number; cost: number };
  'Deconstruction costs air-air HP': { year: number; cost: number };
  'Deconstruction costs air-water HP': { year: number; cost: number };
  'Deconstruction costs ground-water HP': { year: number; cost: number };
  'Gas price': number[];
  'Electricity price': number[];
  'Gas price best': number[];
  'Electricity price best': number[];
  'Gas price worst': number[];
  'Electricity price worst': number[];
  'Fuel Oil price': number;
  'SEER OH': number;
  'Efficiency GH': number[] | number;
  'COP air-air HP': number[] | number;
  'COP air-water HP': number[] | number;
  'COP ground-water HP': number[] | number;
  'Rate of interest': number[] | number;
};

export type SubsidiesConfig = {
  baseSubsidyPercentage?: number;
  ageThreshold?: number;
  ageSubsidyPercentage?: number;
  incomeThreshold?: number;
  incomeSubsidyPercentage?: number;
  maxSubsidyPercentage?: number;
  maxSubsidyValue?: number;
};

export type CapexEquipment = {
  capexPerKwh: { factor: number; exponent: number };
  equipment: { factor: number; exponent: number };
};

export type CapexConfig = {
  gas: CapexEquipment;
  awhp: CapexEquipment;
  gwhp: CapexEquipment;
  aahp: CapexEquipment;
};

export type PluginConfig = {
  links?: { name: string; url: string }[];
  data: {
    initialHeatingDemolition: { name: string }[];
    subsidies: SubsidiesConfig;
    mainData: MainDataType;
    capexData: CapexConfig;
  };
};

export default (): PluginConfig => ({
  links: [],
  data: {
    initialHeatingDemolition: [
      {
        name: 'Gas',
      },
      {
        name: 'Oil',
      },
    ],
    subsidies: {
      baseSubsidyPercentage: 30,
      ageThreshold: 20,
      ageSubsidyPercentage: 20,
      incomeThreshold: 40000,
      incomeSubsidyPercentage: 30,
      maxSubsidyPercentage: 70,
      maxSubsidyValue: 30000,
    },
    capexData: {
      gas: {
        capexPerKwh: { factor: 3304.8, exponent: -0.673 },
        equipment: { factor: 748.01, exponent: 0.5733 },
      },
      awhp: {
        capexPerKwh: { factor: 3891.5, exponent: -0.425 },
        equipment: { factor: 581.42, exponent: 0.9775 },
      },
      gwhp: {
        capexPerKwh: { factor: 11269, exponent: -0.665 },
        equipment: { factor: 581.42, exponent: 0.9775 },
      },
      aahp: {
        capexPerKwh: { factor: 4222.92, exponent: 0.94 },
        equipment: { factor: 0, exponent: 1 },
      },
    },
    mainData: {
      Year: [
        2024, 2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034, 2035,
        2036, 2037, 2038, 2039, 2040, 2041, 2042,
      ],
      'Maintenance costs GH': [
        100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100,
        100, 100, 100, 100, 100,
      ],
      'Maintenance costs air-air HP': [
        50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50,
        50,
      ],
      'Maintenance costs air-water HP': [
        75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75,
        75,
      ],
      'Maintenance costs ground-water HP': [
        100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100,
        100, 100, 100, 100, 100,
      ],
      'Deconstruction costs GH': { year: 15, cost: 1000 },
      'Deconstruction costs air-air HP': { year: 15, cost: 1500 },
      'Deconstruction costs air-water HP': { year: 15, cost: 2000 },
      'Deconstruction costs ground-water HP': { year: 15, cost: 2500 },
      'Gas price': [
        12.07, 12.11, 12.27, 12.34, 12.42, 12.64, 12.86, 13.1, 13.35, 13.73,
        14.24, 14.4, 14.81, 15.23, 15.67, 16.11, 16.56, 16.54, 16.53,
      ],
      'Electricity price': [
        30, 30, 30.15, 30.3, 30.45, 30.6, 30.76, 30.91, 31.07, 31.22, 31.38,
        31.53, 31.69, 31.85, 32.01, 32.17, 32.33, 32.49, 32.65,
      ],
      'Gas price best': [
        11.87, 7.18, 7.42, 7.65, 7.89, 8.13, 8.37, 8.55, 8.73, 8.91, 9.09, 9.27,
        9.46, 9.64, 9.82, 10, 10.18, 10.27, 10.36,
      ],
      'Electricity price best': [
        23, 25.7, 26.36, 27.02, 27.68, 28.34, 29, 29.12, 29.24, 29.36, 29.48,
        29.6, 29.62, 29.64, 29.66, 29.68, 29.7, 29.38, 29.06,
      ],
      'Gas price worst': [
        11.87, 10.7, 11.02, 11.34, 11.66, 11.98, 12.3, 12.8, 13.3, 13.8, 14.3,
        14.8, 15.3, 15.8, 16.3, 16.8, 17.3, 17.62, 17.94,
      ],
      'Electricity price worst': [
        41.02, 41, 41.62, 42.24, 42.87, 43.52, 44.17, 44.83, 45.5, 46.19, 46.88,
        47.58, 48.3, 49.02, 49.76, 50.5, 51.26, 52.03, 40.27,
      ],
      'Fuel Oil price': 9.736,
      'SEER OH': 0.7,
      'Efficiency GH': 0.8,
      'COP air-air HP': 4,
      'COP air-water HP': 4.5,
      'COP ground-water HP': 5,
      'Rate of interest': [
        4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4,
      ],
    },
  },
});
