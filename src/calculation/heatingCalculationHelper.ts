import { CapexConfig, CapexEquipment } from '../knowUrHeatOptions.js';

type HeaterCosts = {
  carrier: number[];
  maintenance: number[];
  removal: {
    year: number;
    cost: number;
  };
};

export type Heater = {
  capex: number;
  capexBest: number;
  capexWorst: number;
  capexPerKwh: number;
  capexPerKwhBest: number;
  capexPerKwhWorst: number;
  equipment: number;
  equipmentBest: number;
  equipmentWorst: number;
  copOrEfficiency: number;
  copOrEfficiencyBest: number;
  copOrEfficiencyWorst: number;
  costs: HeaterCosts;
  costsBest: HeaterCosts;
  costsWorst: HeaterCosts;
  yearlyCosts?: number[];
  yearlyCostsMax?: number[];
  yearlyCostsMin?: number[];
  totalCost?: number;
  totalCostBest?: number;
  totalCostWorst?: number;
  totalCostEol?: number;
  totalCostEolBest?: number;
  totalCostEolWorst?: number;
  subsidies: number;
};

export type HeaterCollection = {
  gasHeater: Heater;
  airAirHP: Heater;
  airWaterHP: Heater;
  groundWaterHP: Heater;
};

type DataFrameArray = {
  [key: string]: number[] | number | { year: number; cost: number };
};
type DataFrameNumber = {
  [key: string]: number;
};
type DataFrameObject = {
  [key: string]: { year: number; cost: number };
};

const multiply = (arr: number[]): number =>
  arr.reduce((acc, val) => acc * val, 1);

function calculateYearlyCosts(
  capex: number,
  subsidies: number,
  copOrEfficiency: number,
  costs: HeaterCosts,
  heatDemand: number[],
  interestRates: number[],
  maxApplicableSubsidies: number,
): number[] {
  const subsidisable = Math.min(maxApplicableSubsidies, capex);
  const residual = capex - subsidisable;
  const yearlyCosts = [
    Number((subsidisable * (1 - subsidies) + residual).toFixed(2)),
  ];

  for (let i = 1; i <= costs.removal.year; i++) {
    if (i === costs.removal.year) {
      const cost =
        ((heatDemand[i] * costs.carrier[i]) / copOrEfficiency +
          costs.maintenance[i] +
          costs.removal.cost) /
        multiply(interestRates.slice(1, i + 1));
      yearlyCosts.push(Number(cost.toFixed(2)));
    } else {
      const cost =
        ((heatDemand[i] * costs.carrier[i]) / copOrEfficiency +
          costs.maintenance[i]) /
        multiply(interestRates.slice(1, i + 1));
      yearlyCosts.push(Number(cost.toFixed(2)));
    }
  }
  return yearlyCosts;
}

function calculateTotalCost(yearlyCosts: number[]): number {
  return yearlyCosts.reduce((sum, cost) => sum + cost, 0);
}

function calculateTotalCostEol(
  totalCost: number,
  interestRates: number[],
): number {
  return totalCost * multiply(interestRates.slice(1, 16));
}

export function cumulativeSum(arr: number[]): number[] {
  return arr.reduce((acc: number[], value: number, index: number) => {
    acc.push((acc[index - 1] || 0) + value);
    return acc;
  }, []);
}

function capacityCalc(
  demand: number,
  copOrEfficiency: number,
  fullLoadHours = 1752,
): number {
  /**
   * Return the heater's capacity.
   *
   * This is the capacity needed to fulfill the demand, given the
   * supplied full load hours, which default to 20% of a year, i.e.
   * 1752 of 8760 hours.
   */
  if (Array.isArray(copOrEfficiency)) {
    return demand / fullLoadHours / copOrEfficiency[0];
  }
  return demand / fullLoadHours / copOrEfficiency;
}

function capexCalc(
  capexRawData: CapexEquipment,
  heatDemand: number,
  copOrEfficiency: number,
): { capex: number; capexPerKwh: number; equipment: number } {
  const capacity = capacityCalc(heatDemand, copOrEfficiency);

  const capexPerKW =
    capexRawData.capexPerKwh.factor *
    capacity ** (capexRawData.capexPerKwh.exponent + 1);

  const equipmentPerKW =
    capexRawData.equipment.factor * capacity ** capexRawData.equipment.exponent;

  return {
    capex: capexPerKW + equipmentPerKW,
    capexPerKwh: capexPerKW,
    equipment: equipmentPerKW,
  };
}

function createHeater(
  df: DataFrameArray | DataFrameNumber | DataFrameObject,
  capexRawData: CapexEquipment,
  heatDemand: number,
  type: string,
  carrier: number[],
  carrierBest: number[],
  carrierWorst: number[],
  subsidies = 0,
): Heater {
  let copOrEfficiency: number;

  if (Array.isArray(df[`COP ${type}`])) {
    copOrEfficiency = df[`COP ${type}`] as number[][0];
  } else if (Array.isArray(df[`Efficiency ${type}`])) {
    copOrEfficiency = df[`Efficiency ${type}`] as number[][0];
  } else {
    copOrEfficiency =
      (df[`COP ${type}`] as number) || (df[`Efficiency ${type}`] as number);
  }

  let copOrEfficiencyBest: number;
  if (df[`COP ${type} best`] || df[`Efficiency ${type} best`]) {
    copOrEfficiencyBest =
      (df[`COP ${type} best`] as number) ||
      (df[`Efficiency ${type} best`] as number);
  } else {
    copOrEfficiencyBest =
      (df[`COP ${type}`] as number) || (df[`Efficiency ${type}`] as number);
  }

  let copOrEfficiencyWorst: number;

  if (df[`COP ${type} worst`] || df[`Efficiency ${type} worst`]) {
    copOrEfficiencyWorst =
      (df[`COP ${type} worst`] as number) ||
      (df[`Efficiency ${type} worst`] as number);
  } else {
    copOrEfficiencyWorst =
      (df[`COP ${type}`] as number) || (df[`Efficiency ${type}`] as number);
  }

  const { capex, capexPerKwh, equipment } = capexCalc(
    capexRawData,
    heatDemand,
    copOrEfficiency,
  );

  const {
    capex: capexBest,
    capexPerKwh: capexPerKwhBest,
    equipment: equipmentBest,
  } = capexCalc(capexRawData, heatDemand, copOrEfficiencyBest);

  const {
    capex: capexWorst,
    capexPerKwh: capexPerKwhWorst,
    equipment: equipmentWorst,
  } = capexCalc(capexRawData, heatDemand, copOrEfficiencyWorst);

  const costs = {
    carrier: carrier.map((cents) => cents / 100),
    maintenance: (Array.isArray(df[`Maintenance costs ${type}`])
      ? df[`Maintenance costs ${type}`]
      : Array(19).fill(df[`Maintenance costs ${type}`])) as number[],
    removal: df[`Deconstruction costs ${type}`] as {
      year: number;
      cost: number;
    },
  };

  const costsBest = {
    carrier: carrierBest.map((cents) => cents / 100),
    maintenance: ((): number[] => {
      if (Array.isArray(df[`Maintenance costs ${type} best`])) {
        return df[`Maintenance costs ${type} best`] as number[];
      } else if (df[`Maintenance costs ${type} best`]) {
        return Array(19).fill(df[`Maintenance costs ${type} best`]) as number[];
      } else if (Array.isArray(df[`Maintenance costs ${type}`])) {
        return df[`Maintenance costs ${type}`] as number[];
      } else {
        return Array(19).fill(df[`Maintenance costs ${type}`]) as number[];
      }
    })(),
    removal: df[`Deconstruction costs ${type}`] as {
      year: number;
      cost: number;
    },
  };

  const costsWorst = {
    carrier: carrierWorst.map((cents) => cents / 100),
    maintenance: ((): number[] => {
      if (Array.isArray(df[`Maintenance costs ${type} worst`])) {
        return df[`Maintenance costs ${type} worst`] as number[];
      } else if (df[`Maintenance costs ${type} worst`]) {
        return Array(19).fill(
          df[`Maintenance costs ${type} worst`],
        ) as number[];
      } else if (Array.isArray(df[`Maintenance costs ${type}`])) {
        return df[`Maintenance costs ${type}`] as number[];
      } else {
        return Array(19).fill(df[`Maintenance costs ${type}`]) as number[];
      }
    })(),
    removal: df[`Deconstruction costs ${type}`] as {
      year: number;
      cost: number;
    },
  };

  return {
    capex,
    capexBest,
    capexWorst,
    capexPerKwh,
    capexPerKwhBest,
    capexPerKwhWorst,
    equipment,
    equipmentBest,
    equipmentWorst,
    copOrEfficiency,
    copOrEfficiencyBest,
    copOrEfficiencyWorst,
    costs,
    costsBest,
    costsWorst,
    subsidies,
  };
}

// eslint-disable-next-line import/prefer-default-export
export function main(
  df: DataFrameArray,
  capexData: CapexConfig,
  heatDemand: number,
  subsidies: number,
  maxApplicableSubsidies = 30000,
): HeaterCollection {
  const heatDemandArray = Array(19).fill(heatDemand);

  let interestRates;
  if (!Array.isArray(df['Rate of interest'])) {
    interestRates = Array(16).fill(
      1 + (df['Rate of interest'] as number) / 100,
    );
  } else {
    interestRates = df['Rate of interest'].map((rate) => 1 + rate / 100);
  }

  let interestRatesBest;
  if (df['Rate of interest best']) {
    if (!Array.isArray(df['Rate of interest best'])) {
      interestRatesBest = Array(16).fill(
        1 + (df['Rate of interest best'] as number) / 100,
      );
    } else {
      interestRatesBest = df['Rate of interest best'].map(
        (rate) => 1 + rate / 100,
      );
    }
  } else if (!Array.isArray(df['Rate of interest'])) {
    interestRatesBest = Array(16).fill(
      1 + (df['Rate of interest'] as number) / 100,
    );
  } else {
    interestRatesBest = df['Rate of interest'].map((rate) => 1 + rate / 100);
  }

  let interestRatesWorst;
  if (df['Rate of interest worst']) {
    if (!Array.isArray(df['Rate of interest worst'])) {
      interestRatesWorst = Array(16).fill(
        1 + (df['Rate of interest worst'] as number) / 100,
      );
    } else {
      interestRatesWorst = df['Rate of interest worst'].map(
        (rate) => 1 + rate / 100,
      );
    }
  } else if (!Array.isArray(df['Rate of interest'])) {
    interestRatesWorst = Array(16).fill(
      1 + (df['Rate of interest'] as number) / 100,
    );
  } else {
    interestRatesWorst = df['Rate of interest'].map((rate) => 1 + rate / 100);
  }

  const localSubsidies = subsidies / 100;

  const gasHeater = createHeater(
    df,
    capexData.gas,
    heatDemand,
    'GH',
    df['Gas price'] as number[],
    df['Gas price best'] as number[],
    df['Gas price worst'] as number[],
    0,
  );
  gasHeater.yearlyCosts = calculateYearlyCosts(
    gasHeater.capex,
    gasHeater.subsidies,
    gasHeater.copOrEfficiency,
    gasHeater.costs,
    heatDemandArray,
    interestRates,
    maxApplicableSubsidies,
  );
  gasHeater.yearlyCostsMin = calculateYearlyCosts(
    gasHeater.capexBest,
    gasHeater.subsidies,
    gasHeater.copOrEfficiencyBest,
    gasHeater.costsBest,
    heatDemandArray,
    interestRatesBest,
    maxApplicableSubsidies,
  );
  gasHeater.yearlyCostsMax = calculateYearlyCosts(
    gasHeater.capexWorst,
    gasHeater.subsidies,
    gasHeater.copOrEfficiencyWorst,
    gasHeater.costsWorst,
    heatDemandArray,
    interestRatesWorst,
    maxApplicableSubsidies,
  );
  gasHeater.totalCost = calculateTotalCost(gasHeater.yearlyCosts);
  gasHeater.totalCostBest = calculateTotalCost(gasHeater.yearlyCostsMin);
  gasHeater.totalCostWorst = calculateTotalCost(gasHeater.yearlyCostsMax);
  gasHeater.totalCostEol = calculateTotalCostEol(
    gasHeater.totalCost,
    interestRates,
  );
  gasHeater.totalCostEolBest = calculateTotalCostEol(
    gasHeater.totalCostBest,
    interestRatesBest,
  );
  gasHeater.totalCostEolWorst = calculateTotalCostEol(
    gasHeater.totalCostWorst,
    interestRatesWorst,
  );

  const airAirHP = createHeater(
    df,
    capexData.aahp,
    heatDemand,
    'air-air HP',
    df['Electricity price'] as number[],
    df['Electricity price best'] as number[],
    df['Electricity price worst'] as number[],
    localSubsidies,
  );
  airAirHP.yearlyCosts = calculateYearlyCosts(
    airAirHP.capex,
    airAirHP.subsidies,
    airAirHP.copOrEfficiency,
    airAirHP.costs,
    heatDemandArray,
    interestRates,
    maxApplicableSubsidies,
  );
  airAirHP.yearlyCostsMin = calculateYearlyCosts(
    airAirHP.capexBest,
    airAirHP.subsidies,
    airAirHP.copOrEfficiencyBest,
    airAirHP.costsBest,
    heatDemandArray,
    interestRatesBest,
    maxApplicableSubsidies,
  );
  airAirHP.yearlyCostsMax = calculateYearlyCosts(
    airAirHP.capexWorst,
    airAirHP.subsidies,
    airAirHP.copOrEfficiencyWorst,
    airAirHP.costsWorst,
    heatDemandArray,
    interestRatesWorst,
    maxApplicableSubsidies,
  );
  airAirHP.totalCost = calculateTotalCost(airAirHP.yearlyCosts);
  airAirHP.totalCostBest = calculateTotalCost(airAirHP.yearlyCostsMin);
  airAirHP.totalCostWorst = calculateTotalCost(airAirHP.yearlyCostsMax);

  airAirHP.totalCostEol = calculateTotalCostEol(
    airAirHP.totalCost,
    interestRates,
  );
  airAirHP.totalCostEolBest = calculateTotalCostEol(
    airAirHP.totalCostBest,
    interestRatesBest,
  );
  airAirHP.totalCostEolWorst = calculateTotalCostEol(
    airAirHP.totalCostWorst,
    interestRatesWorst,
  );

  const airWaterHP = createHeater(
    df,
    capexData.awhp,
    heatDemand,
    'air-water HP',
    df['Electricity price'] as number[],
    df['Electricity price best'] as number[],
    df['Electricity price worst'] as number[],
    localSubsidies,
  );
  airWaterHP.yearlyCosts = calculateYearlyCosts(
    airWaterHP.capex,
    airWaterHP.subsidies,
    airWaterHP.copOrEfficiency,
    airWaterHP.costs,
    heatDemandArray,
    interestRates,
    maxApplicableSubsidies,
  );
  airWaterHP.yearlyCostsMin = calculateYearlyCosts(
    airWaterHP.capexBest,
    airWaterHP.subsidies,
    airWaterHP.copOrEfficiencyBest,
    airWaterHP.costsBest,
    heatDemandArray,
    interestRatesBest,
    maxApplicableSubsidies,
  );
  airWaterHP.yearlyCostsMax = calculateYearlyCosts(
    airWaterHP.capexWorst,
    airWaterHP.subsidies,
    airWaterHP.copOrEfficiencyWorst,
    airWaterHP.costsWorst,
    heatDemandArray,
    interestRatesWorst,
    maxApplicableSubsidies,
  );
  airWaterHP.totalCost = calculateTotalCost(airWaterHP.yearlyCosts);
  airWaterHP.totalCostBest = calculateTotalCost(airWaterHP.yearlyCostsMin);
  airWaterHP.totalCostWorst = calculateTotalCost(airWaterHP.yearlyCostsMax);
  airWaterHP.totalCostEol = calculateTotalCostEol(
    airWaterHP.totalCost,
    interestRates,
  );
  airWaterHP.totalCostEolBest = calculateTotalCostEol(
    airWaterHP.totalCostBest,
    interestRatesBest,
  );
  airWaterHP.totalCostEolWorst = calculateTotalCostEol(
    airWaterHP.totalCostWorst,
    interestRatesWorst,
  );

  const groundWaterHP = createHeater(
    df,
    capexData.gwhp,
    heatDemand,
    'ground-water HP',
    df['Electricity price'] as number[],
    df['Electricity price best'] as number[],
    df['Electricity price worst'] as number[],
    localSubsidies,
  );
  groundWaterHP.yearlyCosts = calculateYearlyCosts(
    groundWaterHP.capex,
    groundWaterHP.subsidies,
    groundWaterHP.copOrEfficiency,
    groundWaterHP.costs,
    heatDemandArray,
    interestRates,
    maxApplicableSubsidies,
  );
  groundWaterHP.yearlyCostsMin = calculateYearlyCosts(
    groundWaterHP.capexBest,
    groundWaterHP.subsidies,
    groundWaterHP.copOrEfficiencyBest,
    groundWaterHP.costsBest,
    heatDemandArray,
    interestRatesBest,
    maxApplicableSubsidies,
  );
  groundWaterHP.yearlyCostsMax = calculateYearlyCosts(
    groundWaterHP.capexWorst,
    groundWaterHP.subsidies,
    groundWaterHP.copOrEfficiencyWorst,
    groundWaterHP.costsWorst,
    heatDemandArray,
    interestRatesWorst,
    maxApplicableSubsidies,
  );
  groundWaterHP.totalCost = calculateTotalCost(groundWaterHP.yearlyCosts);
  groundWaterHP.totalCostBest = calculateTotalCost(
    groundWaterHP.yearlyCostsMin,
  );
  groundWaterHP.totalCostWorst = calculateTotalCost(
    groundWaterHP.yearlyCostsMax,
  );
  groundWaterHP.totalCostEol = calculateTotalCostEol(
    groundWaterHP.totalCost,
    interestRates,
  );
  groundWaterHP.totalCostEolBest = calculateTotalCostEol(
    groundWaterHP.totalCostBest,
    interestRatesBest,
  );
  groundWaterHP.totalCostEolWorst = calculateTotalCostEol(
    groundWaterHP.totalCostWorst,
    interestRatesWorst,
  );

  return { gasHeater, airAirHP, airWaterHP, groundWaterHP };
}
