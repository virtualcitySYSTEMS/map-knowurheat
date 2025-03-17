// eslint-disable-next-line import/prefer-default-export
export function getSubsidies(
  selectedAgeOption: number,
  selectedHousholdIncome: number,
  data: {
    subsidies?: {
      baseSubsidyPercentage?: number;
      ageSubsidyPercentage?: number;
      incomeSubsidyPercentage?: number;
      maxSubsidyPercentage?: number;
    };
  },
): number {
  let subsidy = data.subsidies?.baseSubsidyPercentage || 30;

  if (selectedAgeOption === 2) {
    subsidy += data.subsidies?.ageSubsidyPercentage || 20;
  }
  if (selectedHousholdIncome === 2) {
    subsidy += data.subsidies?.incomeSubsidyPercentage || 30;
  }

  return Math.min(subsidy, data.subsidies?.maxSubsidyPercentage || 70);
}

export function toPercentage(value: number): number {
  return Number(value / 100);
}

export function sumOverYears(
  years: number,
  valueGetter: (year: number) => number | undefined,
): number {
  let total = 0;
  for (let year = 1; year <= years; year++) {
    total += valueGetter(year) || 0;
  }
  return total;
}
