<script setup lang="ts">
  import { computed, defineProps, getCurrentInstance, inject, ref } from 'vue';
  import {
    VCard,
    VRow,
    VCol,
    VTooltip,
    VDivider,
    VBtnToggle,
  } from 'vuetify/components';
  import {
    VcsLabel,
    VcsSelect,
    VcsFormSection,
    VcsFormattedNumber,
    VcsDataTable,
    VcsFormButton,
    VcsUiApp,
  } from '@vcmap/ui';
  import VueApexCharts from 'vue3-apexcharts';
  import { ApexOptions } from 'apexcharts';
  import {
    CapexConfig,
    MainDataType,
    SubsidiesConfig,
  } from './knowUrHeatOptions.js';
  import {
    cumulativeSum,
    HeaterCollection,
  } from './calculation/heatingCalculationHelper.js';
  import { transText } from './pdf/pdfHelper.js';
  import {
    roundUpToNiceNumber,
    sumOverYears,
    toPercentage,
  } from './calculation/generalCalculationHelper.js';

  interface SubsidyData {
    header: string;
    gh: number;
    aahp: number;
    awhp: number;
    gwhp: number;
  }

  const app = inject('vcsApp') as VcsUiApp;
  const props = defineProps<{
    modelValue: HeaterCollection;
    mainData: MainDataType;
    subsidies: SubsidiesConfig;
    capexData: CapexConfig;
    subsidiesObject: { [key: string]: number };
    graphOptions: ApexOptions;
    initialPage: string;
    tableType: string;
  }>();

  const { graphOptions } = props;

  const selectedGraphTable = ref(props.initialPage);

  const helpText = computed(() => {
    if (selectedGraphTable.value === 'graph') {
      return 'knowurheat.results.helpTextGraph';
    } else if (selectedGraphTable.value === 'cexp') {
      return 'knowurheat.results.helpTextCapex';
    } else if (selectedGraphTable.value === 'oexp') {
      return 'knowurheat.results.helpTextOpex';
    }
    return '';
  });

  const selectGrapTable = [
    { title: 'knowurheat.results.capex', value: 'cexp' },
    { title: 'knowurheat.results.opex', value: 'oexp' },
    { title: 'knowurheat.results.graph', value: 'graph' },
  ];

  const vm = getCurrentInstance();
  const selectedCase = ref('average');

  const selectHeatingSystem = [
    { title: 'knowurheat.table.selectHeating.gas', value: 'gasHeater' },
    { title: 'knowurheat.table.selectHeating.aahp', value: 'airAirHP' },
    { title: 'knowurheat.table.selectHeating.awhp', value: 'airWaterHP' },
    { title: 'knowurheat.table.selectHeating.gwhp', value: 'groundWaterHP' },
  ];
  const selectedHeatingSystem = ref('airAirHP');

  // Table headers
  const headersCapital = [
    {
      title: `${app.vueI18n.t('knowurheat.table.investment')}`,
      key: 'cost',
      sortable: false,
    },
    {
      title: `${app.vueI18n.t('knowurheat.table.gasHeater')}`,
      key: 'gh',
      toolTip: `${app.vueI18n.t('knowurheat.table.gasHeaterTooltip')}`,
      sortable: false,
    },
    {
      title: `${app.vueI18n.t('knowurheat.table.airAir')}`,
      key: 'aahp',
      toolTip: `${app.vueI18n.t('knowurheat.table.airAirTooltip')}`,
      sortable: false,
    },
    {
      title: `${app.vueI18n.t('knowurheat.table.airWater')}`,
      key: 'awhp',
      toolTip: `${app.vueI18n.t('knowurheat.table.airWaterTooltip')}`,
      sortable: false,
    },
    {
      title: `${app.vueI18n.t('knowurheat.table.geothermal')}`,
      key: 'gwhp',
      toolTip: `${app.vueI18n.t('knowurheat.table.geothermalTooltip')}`,
      sortable: false,
    },
  ];

  const headersCapitalSubsidy = [
    {
      title: `${app.vueI18n.t('knowurheat.table.SubsidiesHeader')}`,
      toolTip: `${app.vueI18n.t('knowurheat.table.SubsidiesHeaderTooltip')}`,
      key: 'cost',
      sortable: false,
    },
    {
      title: `${app.vueI18n.t('knowurheat.table.gasHeater')}`,
      key: 'gh',
      toolTip: `${app.vueI18n.t('knowurheat.table.gasHeaterTooltip')}`,
      sortable: false,
    },
    {
      title: `${app.vueI18n.t('knowurheat.table.airAir')}`,
      key: 'aahp',
      toolTip: `${app.vueI18n.t('knowurheat.table.airAirTooltip')}`,
      sortable: false,
    },
    {
      title: `${app.vueI18n.t('knowurheat.table.airWater')}`,
      key: 'awhp',
      toolTip: `${app.vueI18n.t('knowurheat.table.airWaterTooltip')}`,
      sortable: false,
    },
    {
      title: `${app.vueI18n.t('knowurheat.table.geothermal')}`,
      key: 'gwhp',
      toolTip: `${app.vueI18n.t('knowurheat.table.geothermalTooltip')}`,
      sortable: false,
    },
  ];

  const headersOperational = [
    {
      title: `${app.vueI18n.t('knowurheat.table.year')}`,
      key: 'year',
      sortable: false,
    },
    {
      title: `${app.vueI18n.t('knowurheat.table.maintananceCost')}`,
      key: 'mcost',
      toolTip: `${app.vueI18n.t('knowurheat.table.maintananceCostTooltip')}`,
      sortable: false,
    },
    {
      title: `${app.vueI18n.t('knowurheat.table.energyCost')}`,
      key: 'ecost',
      toolTip: `${app.vueI18n.t('knowurheat.table.energyCostTooltip')}`,
      sortable: false,
    },
    {
      title: `${app.vueI18n.t('knowurheat.table.totalOpex')}`,
      key: 'tocost',
      toolTip: `${app.vueI18n.t('knowurheat.table.totalOpexTooltip')}`,
      sortable: false,
    },
  ];

  const initialInvestData = computed(() => {
    const dataLocal = [];

    dataLocal.push({
      cost: `${app.vueI18n.t('knowurheat.table.capexPerKwh')}`,
      gh: props.modelValue.gasHeater.capexPerKwh,
      aahp: props.modelValue.airAirHP.capexPerKwh,
      awhp: props.modelValue.airWaterHP.capexPerKwh,
      gwhp: props.modelValue.groundWaterHP.capexPerKwh,
    });
    dataLocal.push({
      cost: `${app.vueI18n.t('knowurheat.table.equipment')}`,
      gh: props.modelValue.gasHeater.equipment,
      aahp: props.modelValue.airAirHP.equipment,
      awhp: props.modelValue.airWaterHP.equipment,
      gwhp: props.modelValue.groundWaterHP.equipment,
    });

    return dataLocal;
  });

  function calculateSubsidy(subsidyPercentage: number, capex: number): number {
    return capex * toPercentage(subsidyPercentage);
  }

  const initialSubsidiesData = computed(() => {
    const dataLocal: SubsidyData[] = [];

    const { basis, age, income } = props.subsidiesObject;
    const { airAirHP, airWaterHP, groundWaterHP } = props.modelValue;

    const subsidyTypes = [
      { label: 'basic', value: basis },
      { label: 'age', value: age },
      { label: 'income', value: income },
    ];

    subsidyTypes.forEach(({ label, value }) => {
      if (value > 0) {
        dataLocal.push({
          header: `${app.vueI18n.t(`knowurheat.table.${label}`)} [${value}%]`,
          gh: 0,
          aahp: calculateSubsidy(value, airAirHP.capex),
          awhp: calculateSubsidy(value, airWaterHP.capex),
          gwhp: calculateSubsidy(value, groundWaterHP.capex),
        });
      }
    });

    return dataLocal;
  });

  const totalSubsidies = computed(() => {
    return {
      gh: 0,
      aahp:
        props.modelValue.airAirHP.capex *
        toPercentage(props.subsidiesObject.totalSubsidies),
      awhp:
        props.modelValue.airWaterHP.capex *
        toPercentage(props.subsidiesObject.totalSubsidies),
      gwhp:
        props.modelValue.groundWaterHP.capex *
        toPercentage(props.subsidiesObject.totalSubsidies),
    };
  });

  const operationalCostData = computed(() => {
    const years = props.mainData.Year;
    const dataLocal = [];
    const heatingSystem =
      props.modelValue[selectedHeatingSystem.value as keyof HeaterCollection];

    // Define which yearly cost array to use
    let yearlyCostsToUse;
    if (selectedCase.value === 'worst') {
      yearlyCostsToUse = heatingSystem.yearlyCostsMax!;
    } else if (selectedCase.value === 'best') {
      yearlyCostsToUse = heatingSystem.yearlyCostsMin!;
    } else {
      yearlyCostsToUse = heatingSystem.yearlyCosts!;
    }

    for (let i = 1; i < heatingSystem.costs.removal.year; i++) {
      dataLocal.push({
        year: years[i],
        mcost: heatingSystem.maintananceCostsInterestRate![i],
        ecost:
          yearlyCostsToUse[i] - heatingSystem.maintananceCostsInterestRate![i],
        tocost: yearlyCostsToUse[i],
      });
    }

    return dataLocal;
  });

  const totalOperationalCosts = computed(() => {
    const heatingSystem =
      props.modelValue[selectedHeatingSystem.value as keyof HeaterCollection];

    // Define which yearly cost array to use
    let yearlyCostsToUse;
    if (selectedCase.value === 'worst') {
      yearlyCostsToUse = heatingSystem.yearlyCostsMax!;
    } else if (selectedCase.value === 'best') {
      yearlyCostsToUse = heatingSystem.yearlyCostsMin!;
    } else {
      yearlyCostsToUse = heatingSystem.yearlyCosts!;
    }

    const years = heatingSystem.costs.removal.year - 1;

    return {
      mcost: sumOverYears(
        years,
        (year) => heatingSystem.maintananceCostsInterestRate![year],
      ),

      ecost: sumOverYears(
        years,
        (year) =>
          yearlyCostsToUse[year] -
          heatingSystem.maintananceCostsInterestRate![year],
      ),

      tocost: sumOverYears(years, (year) => yearlyCostsToUse[year]),
    };
  });

  // ApexCharts series and options
  const series = computed(() => {
    let ghGraph;
    let aahpGraph;
    let awhpGraph;
    let gwhpGraph;

    if (selectedCase.value === 'best') {
      const bestGhGraph = [...props.modelValue.gasHeater.yearlyCostsMin!];
      const bestAahpGraph = [...props.modelValue.airAirHP.yearlyCostsMin!];
      const bestAwhpGraph = [...props.modelValue.airWaterHP.yearlyCostsMin!];
      const bestGwhpGraph = [...props.modelValue.groundWaterHP.yearlyCostsMin!];

      bestGhGraph[0] = props.modelValue.gasHeater.yearlyCostsMin![0];
      bestAahpGraph[0] = props.modelValue.airAirHP.yearlyCostsMin![0];
      bestAwhpGraph[0] = props.modelValue.airWaterHP.yearlyCostsMin![0];
      bestGwhpGraph[0] = props.modelValue.groundWaterHP.yearlyCostsMin![0];

      ghGraph = cumulativeSum(bestGhGraph);
      aahpGraph = cumulativeSum(bestAahpGraph);
      awhpGraph = cumulativeSum(bestAwhpGraph);
      gwhpGraph = cumulativeSum(bestGwhpGraph);
    } else if (selectedCase.value === 'worst') {
      const worstGhGraph = [...props.modelValue.gasHeater.yearlyCostsMax!];
      const worstAahpGraph = [...props.modelValue.airAirHP.yearlyCostsMax!];
      const worstAwhpGraph = [...props.modelValue.airWaterHP.yearlyCostsMax!];
      const worstGwhpGraph = [
        ...props.modelValue.groundWaterHP.yearlyCostsMax!,
      ];

      worstGhGraph[0] = props.modelValue.gasHeater.yearlyCostsMax![0];
      worstAahpGraph[0] = props.modelValue.airAirHP.yearlyCostsMax![0];
      worstAwhpGraph[0] = props.modelValue.airWaterHP.yearlyCostsMax![0];
      worstGwhpGraph[0] = props.modelValue.groundWaterHP.yearlyCostsMax![0];

      ghGraph = cumulativeSum(worstGhGraph);
      aahpGraph = cumulativeSum(worstAahpGraph);
      awhpGraph = cumulativeSum(worstAwhpGraph);
      gwhpGraph = cumulativeSum(worstGwhpGraph);
    } else {
      ghGraph = cumulativeSum(props.modelValue.gasHeater.yearlyCosts!);
      aahpGraph = cumulativeSum(props.modelValue.airAirHP.yearlyCosts!);
      awhpGraph = cumulativeSum(props.modelValue.airWaterHP.yearlyCosts!);
      gwhpGraph = cumulativeSum(props.modelValue.groundWaterHP.yearlyCosts!);
    }

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

  const maxYAxisValue = computed(() => {
    // Get cumulative sums for each heating type across all cases
    const bestGhGraph = cumulativeSum(
      props.modelValue.gasHeater.yearlyCostsMin!,
    );
    const worstGhGraph = cumulativeSum(
      props.modelValue.gasHeater.yearlyCostsMax!,
    );
    const normalGhGraph = cumulativeSum(
      props.modelValue.gasHeater.yearlyCosts!,
    );

    const bestAahpGraph = cumulativeSum(
      props.modelValue.airAirHP.yearlyCostsMin!,
    );
    const worstAahpGraph = cumulativeSum(
      props.modelValue.airAirHP.yearlyCostsMax!,
    );
    const normalAahpGraph = cumulativeSum(
      props.modelValue.airAirHP.yearlyCosts!,
    );

    const bestAwhpGraph = cumulativeSum(
      props.modelValue.airWaterHP.yearlyCostsMin!,
    );
    const worstAwhpGraph = cumulativeSum(
      props.modelValue.airWaterHP.yearlyCostsMax!,
    );
    const normalAwhpGraph = cumulativeSum(
      props.modelValue.airWaterHP.yearlyCosts!,
    );

    const bestGwhpGraph = cumulativeSum(
      props.modelValue.groundWaterHP.yearlyCostsMin!,
    );
    const worstGwhpGraph = cumulativeSum(
      props.modelValue.groundWaterHP.yearlyCostsMax!,
    );
    const normalGwhpGraph = cumulativeSum(
      props.modelValue.groundWaterHP.yearlyCosts!,
    );

    // Collect all values from all cases and all heating types
    const allValues = [
      ...bestGhGraph,
      ...worstGhGraph,
      ...normalGhGraph,
      ...bestAahpGraph,
      ...worstAahpGraph,
      ...normalAahpGraph,
      ...bestAwhpGraph,
      ...worstAwhpGraph,
      ...normalAwhpGraph,
      ...bestGwhpGraph,
      ...worstGwhpGraph,
      ...normalGwhpGraph,
    ];

    const maxValue = Math.max(...allValues);
    return roundUpToNiceNumber(maxValue);
  });

  if (Array.isArray(graphOptions.yaxis)) {
    graphOptions.yaxis[0] = {
      ...graphOptions.yaxis[0],
      max: maxYAxisValue.value,
    };
  } else {
    graphOptions.yaxis = {
      ...graphOptions.yaxis,
      max: maxYAxisValue.value,
    };
  }
</script>

<template>
  <v-card>
    <VcsFormSection
      heading="knowurheat.results.heading"
      :help-text="helpText"
      class="pa-4"
    >
      <v-row no-gutters class="pt-2">
        <v-col cols="4">
          <VcsLabel for="SelectTableGraph">{{
            $t('knowurheat.results.select')
          }}</VcsLabel></v-col
        >
        <v-col cols="6">
          <VcsSelect
            id="SelectTableGraph"
            :items="selectGrapTable"
            v-model="selectedGraphTable"
          />
        </v-col>
      </v-row>
      <v-row no-gutters v-if="selectedGraphTable === 'oexp'">
        <v-col cols="4">
          <VcsLabel for="selectHeatingSystem"
            >{{ $t('knowurheat.table.type') }}:</VcsLabel
          ></v-col
        >
        <v-col cols="6">
          <VcsSelect
            id="selectHeatingSystem"
            :items="selectHeatingSystem"
            v-model="selectedHeatingSystem"
          />
        </v-col>
      </v-row>
      <v-row no-gutters class="px-0 py-3" v-if="selectedGraphTable === 'cexp'">
        <v-col class="d-flex justify-center">
          <vcs-data-table
            :items="initialInvestData"
            v-model="initialInvestData"
            item-key="year"
            :headers="headersCapital"
            density="compact"
            :show-select="false"
            :single-select="false"
            :show-searchbar="false"
            :items-per-page="10"
            class="full-width-table"
          >
            <!-- Header tooltips -->
            <template
              v-for="(header, index) in headersCapital"
              #[`header.${header.key}`]
            >
              <span :key="index">
                {{ header.title }}
                <v-tooltip
                  location="bottom"
                  v-if="header.toolTip !== undefined"
                  activator="parent"
                  :text="$st(header.toolTip)"
                  max-width="300"
                />
              </span>
            </template>

            <!-- Row items -->
            <template #item="{ item }">
              <tr>
                <td style="width: 200px">{{ item.cost }}</td>
                <td
                  v-for="(key, index) in ['gh', 'aahp', 'awhp', 'gwhp']"
                  :key="index"
                  style="text-align: right; width: 125px"
                >
                  <VcsFormattedNumber
                    :model-value="item[key]"
                    unit="€"
                    :fraction-digits="2"
                  />
                </td>
              </tr>
            </template>
            <!-- Footer totals -->
            <template #body.append>
              <tr class="font-weight-bold text--primary">
                <td>{{ $t('knowurheat.table.costTotal') }}</td>
                <td
                  v-for="(key, index) in [
                    'gasHeater',
                    'airAirHP',
                    'airWaterHP',
                    'groundWaterHP',
                  ]"
                  :key="index"
                  style="text-align: right; width: 125px"
                >
                  <VcsFormattedNumber
                    :model-value="
                      props.modelValue[key as keyof HeaterCollection]?.capex
                    "
                    unit="€"
                    :fraction-digits="2"
                  />
                </td>
              </tr>
            </template>
          </vcs-data-table>
        </v-col>
      </v-row>
      <v-row no-gutters class="px-0 py-3" v-if="selectedGraphTable === 'cexp'">
        <v-col class="d-flex justify-center">
          <vcs-data-table
            :items="initialSubsidiesData"
            v-model="initialSubsidiesData"
            item-key="year"
            :headers="headersCapitalSubsidy"
            density="compact"
            :show-select="false"
            :single-select="false"
            :show-searchbar="false"
            :items-per-page="10"
            class="full-width-table"
          >
            <!-- Header tooltips -->
            <template
              v-for="(header, index) in headersCapitalSubsidy"
              #[`header.${header.key}`]
            >
              <span :key="index">
                {{ header.title }}
                <v-tooltip
                  location="bottom"
                  v-if="header.toolTip !== undefined"
                  activator="parent"
                  :text="$st(header.toolTip)"
                  max-width="300"
                />
              </span>
            </template>
            <!-- Row items -->
            <template #item="{ item }">
              <tr>
                <td style="width: 200px">{{ item.header }}</td>
                <td
                  v-for="key in ['gh', 'aahp', 'awhp', 'gwhp']"
                  :key="key"
                  style="text-align: right !important; width: 125px"
                >
                  <VcsFormattedNumber
                    :model-value="item[key]"
                    unit="€"
                    :fraction-digits="2"
                    class="text-right"
                  />
                </td>
              </tr>
            </template>
            <!-- Footer totals -->
            <template #body.append>
              <tr class="font-weight-bold text--primary">
                <td>
                  {{ $t('knowurheat.table.subsidiesTotal') }} [{{
                    subsidiesObject.totalSubsidies
                  }}%]
                </td>
                <td
                  v-for="key in ['gh', 'aahp', 'awhp', 'gwhp']"
                  :key="key"
                  style="text-align: right !important; width: 125px"
                >
                  <VcsFormattedNumber
                    :model-value="
                      (totalSubsidies as Record<string, number>)[key]
                    "
                    unit="€"
                    :fraction-digits="2"
                    class="text-right"
                  />
                </td>
              </tr>
              <tr class="font-weight-bold text--primary color">
                <td>
                  {{ $t('knowurheat.table.remainingCost') }}
                </td>
                <td
                  v-for="[shortKey, fullKey] in Object.entries({
                    gh: 'gasHeater',
                    aahp: 'airAirHP',
                    awhp: 'airWaterHP',
                    gwhp: 'groundWaterHP',
                  })"
                  :key="shortKey"
                  style="text-align: right !important; width: 125px"
                >
                  <VcsFormattedNumber
                    :model-value="
                      (modelValue as Record<string, any>)[fullKey].capex -
                      (totalSubsidies as Record<string, number>)[shortKey]
                    "
                    unit="€"
                    :fraction-digits="2"
                    class="text-right"
                  />
                </td>
              </tr>
            </template>
          </vcs-data-table>
        </v-col>
      </v-row>
      <v-row no-gutters class="px-0 py-3" v-if="selectedGraphTable === 'oexp'">
        <v-col class="d-flex justify-center">
          <vcs-data-table
            :items="operationalCostData"
            v-model="operationalCostData"
            item-key="year"
            :headers="headersOperational"
            density="compact"
            :show-select="false"
            :single-select="false"
            :show-searchbar="false"
            :items-per-page="15"
            class="full-width-table"
          >
            <!-- Header tooltips -->
            <template
              v-for="(header, index) in headersOperational"
              #[`header.${header.key}`]
            >
              <span :key="index">
                {{ header.title }}
                <v-tooltip
                  location="bottom"
                  v-if="header.toolTip !== undefined"
                  activator="parent"
                  :text="$st(header.toolTip)"
                  max-width="300"
                />
              </span>
            </template>
            <!-- Row items -->
            <template #item="{ item }">
              <tr>
                <td>{{ item.year }}</td>
                <td
                  v-for="(key, index) in ['mcost', 'ecost', 'tocost']"
                  :key="index"
                >
                  <VcsFormattedNumber
                    :model-value="item[key]"
                    unit="€"
                    :fraction-digits="2"
                  />
                </td>
              </tr>
            </template>
            <!-- Footer totals -->
            <template #body.append>
              <tr class="font-weight-bold text--primary">
                <td>Total</td>
                <td
                  v-for="(key, index) in ['mcost', 'ecost', 'tocost']"
                  :key="index"
                >
                  <VcsFormattedNumber
                    :model-value="
                      totalOperationalCosts[
                        key as keyof typeof totalOperationalCosts
                      ]
                    "
                    unit="€"
                    :fraction-digits="2"
                  />
                </td>
              </tr>
            </template>
          </vcs-data-table>
        </v-col>
      </v-row>
      <v-row no-gutters class="px-0 py-3" v-if="selectedGraphTable === 'graph'">
        <v-col class="justify-center">
          <VueApexCharts
            type="line"
            :options="graphOptions"
            :series="series"
            height="500"
          />
          <v-divider />
        </v-col>
      </v-row>
      <v-row
        no-gutters
        v-if="selectedGraphTable === 'graph' || selectedGraphTable === 'oexp'"
        class="pt-2 d-flex justify-center"
      >
        <v-btn-toggle v-model="selectedCase" mandatory>
          <VcsFormButton value="best">{{
            $t('knowurheat.results.best')
          }}</VcsFormButton>
          <VcsFormButton value="average">{{
            $t('knowurheat.results.average')
          }}</VcsFormButton>
          <VcsFormButton value="worst">{{
            $t('knowurheat.results.worst')
          }}</VcsFormButton>
        </v-btn-toggle>
      </v-row>
    </VcsFormSection></v-card
  >
</template>

<style lang="scss" scoped>
  .full-width-table {
    width: 100%;
  }
  .apexcharts-legend {
    margin-right: 25px;
  }
  .color {
    color: rgb(var(--v-theme-primary)) !important;
  }
</style>
