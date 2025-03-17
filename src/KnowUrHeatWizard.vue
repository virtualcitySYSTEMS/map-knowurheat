<script setup lang="ts">
  import {
    VcsButton,
    VcsCheckbox,
    VcsFormButton,
    VcsFormSection,
    VcsLabel,
    VcsRadio,
    VcsSelect,
    VcsTextField,
    VcsUiApp,
    VcsWizard,
    VcsWizardStep,
  } from '@vcmap/ui';
  import { onUnmounted, ref, inject, computed, getCurrentInstance } from 'vue';
  import {
    VRow,
    VCol,
    VSheet,
    VDialog,
    VIcon,
    VDivider,
  } from 'vuetify/components';
  import ResultVisualization from './ResultVisualization.vue';
  import SearchComponent from './search/SearchComponent.vue';
  import {
    HeaterCollection,
    main,
  } from './calculation/heatingCalculationHelper.js';
  import { generatePDF } from './pdf/generatePDF.js';
  import { getGraphOptions } from './optionsHelper.js';
  import {
    getSubsidies,
    toPercentage,
  } from './calculation/generalCalculationHelper.js';
  import { name } from '../package.json';
  import { KnowUrHeatPlugin } from './index.js';

  const app = inject<VcsUiApp>('vcsApp')!;

  const plugin = app.plugins.getByKey(name) as KnowUrHeatPlugin;
  const { links } = plugin.config;
  const { data } = plugin.config;

  const gasBillSelect = ref(false);
  const oilBillSelect = ref(false);
  const heatDemand = ref(0);
  const gasBill = ref(0);
  const gasPrice = ref(data.mainData['Gas price'][0]);
  const oilBill = ref(0);
  const oilPrice = ref(data.mainData['Fuel Oil price']);
  const selectedHousholdIncome = ref();
  const selectedAgeOption = ref();
  const pluginState = ref({
    step: 1,
  });
  const stepOrder = {
    LOCATION: 1,
    HEATDEMAND: 2,
    HEATINGSYSTEM: 3,
    RESULT: 4,
  };
  const vm = getCurrentInstance();
  const resultDialogVisible = ref(false);
  let newResultValues: HeaterCollection;
  const initialTableGraph = ref('graph');
  const initialTableType = ref('oexp');

  const selectCurrentHeating = ref(
    data.initialHeatingDemolition.map((item) => ({
      title: `knowurheat.wizard.currentHeating.${item.name.toLowerCase()}`,
      value: item.name.toLowerCase(),
    })),
  );
  const selectedCurrentHeating = ref('gas');

  const subsidies = computed(() =>
    getSubsidies(selectedAgeOption.value, selectedHousholdIncome.value, data),
  );

  const subsidyObject = computed(() => {
    return {
      age:
        selectedAgeOption.value === 1
          ? 0
          : (data.subsidies?.ageSubsidyPercentage ?? 20),
      income:
        selectedHousholdIncome.value === 1
          ? 0
          : (data.subsidies?.incomeSubsidyPercentage ?? 30),
      basis: data.subsidies?.baseSubsidyPercentage ?? 30,
      totalSubsidies: subsidies.value,
      maxSubsidyPercentage: data.subsidies?.maxSubsidyPercentage ?? 70,
      maxSubsidyValue: data.subsidies?.maxSubsidyValue ?? 30000,
    };
  });

  const ageSubsidyItems = [
    {
      label: 'knowurheat.wizard.ageLess1',
      value: 1,
    },
    {
      label: 'knowurheat.wizard.ageMore1',
      value: 2,
    },
  ];

  const incomeSubsidyItems = [
    {
      label: `knowurheat.wizard.thresholdA`,
      value: 1,
    },
    {
      label: 'knowurheat.wizard.thresholdB',
      value: 2,
    },
  ];

  const searchRef = ref(null);

  onUnmounted(() => {
    // Call the clear function from the search component
    app?.search.clearResults();
  });

  const openLink = (url: string): void => {
    window.open(url, '_blank');
  };

  const updateHeatDemand = (): void => {
    const efficiencyGH = Array.isArray(data.mainData['Efficiency GH'])
      ? data.mainData['Efficiency GH'][0]
      : data.mainData['Efficiency GH'];
    gasBill.value = parseFloat(
      (toPercentage(heatDemand.value * gasPrice.value) / efficiencyGH).toFixed(
        2,
      ),
    );
  };

  const updateGasBill = (): void => {
    const efficiencyGH = Array.isArray(data.mainData['Efficiency GH'])
      ? data.mainData['Efficiency GH'][0]
      : data.mainData['Efficiency GH'];
    heatDemand.value = parseFloat(
      ((gasBill.value * efficiencyGH) / toPercentage(gasPrice.value)).toFixed(
        2,
      ),
    );
  };
  const updateOilBill = (): void => {
    heatDemand.value = parseFloat(
      (
        (oilBill.value * data.mainData['SEER OH']) /
        toPercentage(oilPrice.value)
      ).toFixed(2),
    );
  };

  const updateGasPrice = (): void => {
    const efficiencyGH = Array.isArray(data.mainData['Efficiency GH'])
      ? data.mainData['Efficiency GH'][0]
      : data.mainData['Efficiency GH'];
    heatDemand.value = parseFloat(
      ((gasBill.value * efficiencyGH) / toPercentage(gasPrice.value)).toFixed(
        2,
      ),
    );
  };

  const updateOilPrice = (): void => {
    heatDemand.value = parseFloat(
      (
        (oilBill.value * data.mainData['SEER OH']) /
        toPercentage(oilPrice.value)
      ).toFixed(2),
    );
  };

  // Calculate results and move to the next step
  const calculateResults = (): void => {
    newResultValues = main(
      data.mainData,
      data.capexData,
      heatDemand.value,
      subsidies.value,
      data.subsidies?.maxSubsidyValue,
    );
  };

  const options = getGraphOptions(data.mainData, app);

  const validatePositiveNumber = (errorMessage: string) => {
    return (v: string | number): boolean | string => {
      const num = Number(v);
      return (!Number.isNaN(num) && num > 0) || errorMessage;
    };
  };
</script>

<template>
  <v-sheet class="pb-2">
    <VcsWizard v-model.number="pluginState.step" :linear="true">
      <VcsWizardStep
        :step="stepOrder.LOCATION"
        heading="knowurheat.wizard.headingLocation"
        editable
        v-model.number="pluginState.step"
      >
        <SearchComponent ref="searchRef" />
      </VcsWizardStep>
      <VcsWizardStep
        :step="stepOrder.HEATDEMAND"
        heading="knowurheat.wizard.headingHeatDemand"
        editable
        v-model.number="pluginState.step"
      >
        <v-row no-gutters>
          <v-col cols="6">
            <VcsLabel required>
              {{ $st('knowurheat.wizard.currentHeatingSystem') }}
            </VcsLabel>
          </v-col>
          <v-col>
            <VcsSelect
              id="SelectCurrentHeating"
              :items="selectCurrentHeating"
              v-model="selectedCurrentHeating"
              :rules="[(v: object) => !!v || 'Selection is required']"
            >
            </VcsSelect>
          </v-col>
        </v-row>
        <v-row no-gutters>
          <v-col cols="6">
            <VcsLabel
              required
              :disabled="
                (gasBillSelect && selectedCurrentHeating === 'gas') ||
                (oilBillSelect && selectedCurrentHeating === 'oil')
              "
              html-for="headDemandTextField"
            >
              {{ $st('knowurheat.wizard.heatDemand') }}
            </VcsLabel>
          </v-col>
          <v-col class="pa-0">
            <VcsTextField
              id="headDemandTextField"
              :disabled="
                (gasBillSelect && selectedCurrentHeating === 'gas') ||
                (oilBillSelect && selectedCurrentHeating === 'oil')
              "
              unit="kWh"
              v-model.number="heatDemand"
              @blur="updateHeatDemand"
              :decimals="2"
              :min="0"
              type="number"
              :rules="[
                validatePositiveNumber(
                  $st('knowurheat.wizard.heatDemandError'),
                ),
              ]"
            />
          </v-col>
        </v-row>

        <v-row no-gutters>
          <v-col class="pa-0">
            <VcsCheckbox
              v-if="selectedCurrentHeating === 'gas'"
              label="knowurheat.wizard.gasBillSelect"
              v-model="gasBillSelect"
            />
            <VcsCheckbox
              v-if="selectedCurrentHeating === 'oil'"
              label="knowurheat.wizard.oilBillSelect"
              v-model="oilBillSelect"
            />
          </v-col>
        </v-row>
        <v-row
          v-if="gasBillSelect && selectedCurrentHeating === 'gas'"
          no-gutters
        >
          <v-col cols="6">
            <VcsLabel
              :disabled="selectedCurrentHeating !== 'gas'"
              html-for="gasBillTextField"
            >
              {{ $st('knowurheat.wizard.gasPrice') }}
            </VcsLabel>
          </v-col>
          <v-col class="pa-0">
            <VcsTextField
              :disabled="true"
              id="gasBillTextField"
              v-model.number="gasPrice"
              :decimals="2"
              unit="ct/kWh"
              :min="0"
              @blur="updateGasPrice"
              type="number"
              :rules="[
                validatePositiveNumber($st('knowurheat.wizard.gasPriceError')),
              ]"
            />
          </v-col>
        </v-row>
        <v-row
          v-if="gasBillSelect && selectedCurrentHeating === 'gas'"
          no-gutters
        >
          <v-col cols="6">
            <VcsLabel required html-for="gasBillTextField">
              {{ $st('knowurheat.wizard.gasBill') }}
            </VcsLabel>
          </v-col>
          <v-col class="pa-0">
            <VcsTextField
              id="gasBillTextField"
              @blur="updateGasBill"
              v-model.number="gasBill"
              :min="0"
              :decimals="2"
              unit="€"
              type="number"
              :rules="[
                validatePositiveNumber($st('knowurheat.wizard.gasBillError')),
              ]"
            />
          </v-col>
        </v-row>
        <v-row
          v-if="oilBillSelect && selectedCurrentHeating === 'oil'"
          no-gutters
        >
          <v-col cols="6">
            <VcsLabel
              :disabled="selectedCurrentHeating !== 'oil'"
              html-for="oilBillTextField"
            >
              {{ $st('knowurheat.wizard.oilPrice') }}
            </VcsLabel>
          </v-col>
          <v-col class="pa-0">
            <VcsTextField
              :disabled="true"
              id="oilBillTextField"
              v-model.number="oilPrice"
              :decimals="2"
              unit="ct/kWh"
              :min="0"
              @blur="updateOilPrice"
              type="number"
              :rules="[
                validatePositiveNumber($st('knowurheat.wizard.oilPriceError')),
              ]"
            />
          </v-col>
        </v-row>
        <v-row
          v-if="oilBillSelect && selectedCurrentHeating === 'oil'"
          no-gutters
        >
          <v-col cols="6">
            <VcsLabel required html-for="oilBillTextField">
              {{ $st('knowurheat.wizard.oilBill') }}
            </VcsLabel>
          </v-col>
          <v-col class="pa-0">
            <VcsTextField
              id="oilBillTextField"
              @blur="updateOilBill"
              v-model.number="oilBill"
              :min="0"
              :decimals="2"
              unit="€"
              type="number"
              :rules="[
                validatePositiveNumber($st('knowurheat.wizard.oilBillError')),
              ]"
            />
          </v-col>
        </v-row>
      </VcsWizardStep>
      <VcsWizardStep
        :step="stepOrder.HEATINGSYSTEM"
        heading="knowurheat.wizard.subsidiesHeading"
        :disabled="!(heatDemand && selectedCurrentHeating && heatDemand > 0)"
        v-model.number="pluginState.step"
        :editable="!!(heatDemand && selectedCurrentHeating && heatDemand > 0)"
      >
        <template #help>
          {{ $st('knowurheat.wizard.help.subsidies') }}
          <br /><br />
          {{ $st('knowurheat.wizard.help.subsidies2') }}
        </template>
        <v-row no-gutters>
          <VcsLabel required class="font-weight-bold" html-for="ageTextField">
            {{ $st('knowurheat.wizard.age') }}
          </VcsLabel>
        </v-row>
        <v-row no-gutters>
          <VcsRadio :items="ageSubsidyItems" v-model="selectedAgeOption" />
        </v-row>
        <v-row no-gutters>
          <VcsLabel required class="font-weight-bold">
            {{ $st('knowurheat.wizard.income') }}
          </VcsLabel>
        </v-row>
        <v-row no-gutters>
          <VcsRadio
            :items="incomeSubsidyItems"
            v-model="selectedHousholdIncome"
          />
        </v-row>
        <v-divider></v-divider>
        <v-row no-gutters class="mt-1">
          <v-col>
            <VcsLabel class="font-weight-bold color">
              {{ $st('knowurheat.wizard.subsidies') }}
            </VcsLabel>
          </v-col>
          <v-col class="d-flex justify-end">
            <VcsLabel class="color"> {{ subsidies }} % </VcsLabel>
          </v-col>
        </v-row>
      </VcsWizardStep>
      <VcsWizardStep
        :step="stepOrder.RESULT"
        heading="knowurheat.wizard.result"
        :disabled="!selectedAgeOption || !selectedHousholdIncome"
        v-model.number="pluginState.step"
        :editable="!(!selectedAgeOption || !selectedHousholdIncome)"
        @click="
          !(!selectedAgeOption || !selectedHousholdIncome) && calculateResults()
        "
      >
        <v-row
          class="mr-2 results pointer"
          no-gutters
          @click="
            resultDialogVisible = true;
            initialTableGraph = 'cexp';
          "
        >
          <v-col class="d-flex" cols="11">
            <VcsLabel class="pl-0 pointer">
              {{ $st('knowurheat.wizard.tableCexp') }}</VcsLabel
            >
          </v-col>
          <v-col class="d-flex justify-end align-right" cols="1">
            <v-icon> mdi-table-large </v-icon>
          </v-col> </v-row
        ><v-row
          class="mr-2 results pointer"
          no-gutters
          @click="
            resultDialogVisible = true;
            initialTableGraph = 'oexp';
          "
        >
          <v-col class="d-flex" cols="11">
            <VcsLabel class="pl-0 pointer">
              {{ $st('knowurheat.wizard.tableOexp') }}</VcsLabel
            >
          </v-col>
          <v-col class="d-flex justify-end align-right" cols="1">
            <v-icon> mdi-table-large </v-icon>
          </v-col>
        </v-row>
        <v-row
          class="mr-2 results pointer"
          no-gutters
          @click="
            resultDialogVisible = true;
            initialTableGraph = 'graph';
          "
        >
          <v-col class="d-flex" cols="11">
            <VcsLabel class="pl-0 pointer">
              {{ $st('knowurheat.wizard.graph') }}</VcsLabel
            >
          </v-col>
          <v-col class="d-flex justify-end align-right" cols="1">
            <v-icon> mdi-chart-bell-curve-cumulative </v-icon>
          </v-col>
        </v-row>
        <VcsFormButton
          variant="filled"
          class="print-button"
          @click="
            generatePDF(app!, vm, newResultValues, data.mainData, subsidyObject)
          "
        >
          {{ $st('knowurheat.wizard.printPDF') }}
        </VcsFormButton>
      </VcsWizardStep>
      <v-dialog v-model="resultDialogVisible" width="800">
        <ResultVisualization
          :model-value="newResultValues"
          :graph-options="options"
          :main-data="data.mainData"
          :subsidies="data.subsidies"
          :capex-data="data.capexData"
          :subsidies-object="subsidyObject"
          :initial-page="initialTableGraph"
          :table-type="initialTableType"
          @close="resultDialogVisible = false"
        />
      </v-dialog>
    </VcsWizard>
    <VcsFormSection
      v-if="links && links.length > 0"
      heading="knowurheat.wizard.links"
      :expandable="true"
    >
      <v-row
        v-for="(link, index) in links"
        :key="index"
        class="mx-2 mt-2 results pointer"
        no-gutters
      >
        <v-col class="d-flex" cols="11">
          <VcsLabel class="pl-0 pointer">
            {{ link.name }}
          </VcsLabel>
        </v-col>
        <v-col class="d-flex justify-end align-right" cols="1">
          <VcsButton
            class="pt-1"
            icon="mdi-open-in-new"
            @click.stop="openLink(link.url)"
          ></VcsButton>
        </v-col>
      </v-row>
    </VcsFormSection>
  </v-sheet>
</template>

<style lang="scss" scoped>
  .results {
    &:hover {
      color: rgb(var(--v-theme-primary)) !important;
    }
  }
  .pointer {
    &:hover {
      cursor: pointer;
    }
  }
  .print-button {
    float: right;
  }
  .color {
    color: rgb(var(--v-theme-primary)) !important;
  }
</style>
