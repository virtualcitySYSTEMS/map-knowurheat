import {
  ButtonLocation,
  createToggleAction,
  PluginConfigEditor,
  VcsPlugin,
  VcsUiApp,
  WindowSlot,
} from '@vcmap/ui';
import { mapVersion, name, version } from '../package.json';
import KnowUrHeatWizard from './KnowUrHeatWizard.vue';
import heatingIcon from './heatingIcon.js';
import getDefaultOptions, { PluginConfig } from './knowUrHeatOptions.js';
import { deepDiff, deepMerge, DeepPartial } from './optionsHelper.js';

type PluginState = Record<never, never>;

export type KnowUrHeatPlugin = VcsPlugin<DeepPartial<PluginConfig>, never> & {
  readonly config: PluginConfig;
};

export default function plugin(
  configInput: DeepPartial<PluginConfig>,
): KnowUrHeatPlugin {
  const config = deepMerge(getDefaultOptions(), configInput) as PluginConfig;
  return {
    get name(): string {
      return name;
    },
    get version(): string {
      return version;
    },
    get config(): PluginConfig {
      return config;
    },
    get mapVersion(): string {
      return mapVersion;
    },
    initialize(vcsUiApp: VcsUiApp, state?: PluginState): Promise<void> {
      const svgFileIcon = heatingIcon;
      const knowUrHeatComponent = {
        id: 'knowUrHeatWizardID',
        component: KnowUrHeatWizard,
        slot: WindowSlot.DYNAMIC_LEFT,
        state: {
          headerIcon: svgFileIcon,
          headerTitle: 'KnowUrHeat',
          // infoUrlCallback: vcsUiApp.getHelpUrlCallback(
          //   '/tools/knowUrHeat.html',
          // ),
        },
        position: { width: '400px' },
      };

      const { action } = createToggleAction(
        {
          name: 'knowUrHeatWizardAction',
          title: 'knowurheat.title',
          icon: svgFileIcon,
        },
        knowUrHeatComponent,
        vcsUiApp.windowManager,
        name,
      );

      vcsUiApp.navbarManager.add(
        {
          id: action.name,
          action,
        },
        name,
        ButtonLocation.TOOL,
      );

      // eslint-disable-next-line no-console
      console.log(
        'Called before loading the rest of the current context. Passed in the containing Vcs UI App ',
        vcsUiApp,
        state,
      );
      return Promise.resolve();
    },
    onVcsAppMounted(vcsUiApp: VcsUiApp): void {
      // eslint-disable-next-line no-console
      console.log(
        'Called when the root UI component is mounted and managers are ready to accept components',
        vcsUiApp,
      );
    },
    getDefaultOptions,
    toJSON(): DeepPartial<PluginConfig> {
      return deepDiff(getDefaultOptions(), config);
    },
    i18n: {
      de: {
        knowurheat: {
          title: 'KnowUrHeat',
          wizard: {
            next: 'Weiter',
            age: 'Alter der aktuellen Heizungsanlage',
            links: 'Links',
            gasBill: 'Gasrechnung',
            gasPrice: 'Gaspreis',
            gasBillSelect: 'Gasrechnung statt Verbrauch angeben',
            oilBill: 'Ölrechnung',
            oilPrice: 'Ölpreis',
            oilBillSelect: 'Ölrechnung statt Verbrauch angeben',
            heatDemand: 'Heizbedarf',
            headingLocation: 'Standort',
            headingHeatDemand: 'Heizbedarf',
            subsidiesHeading: 'Förderberechtigung',
            headingCurrentHeatingSystem: 'Aktuelle Heizungsanlage',
            headerHouseholdIncome: 'Zu versteuerndes Haushaltseinkommen',
            state: 'Status',
            functional: 'Funktional',
            dysfunctional: 'Dysfunktional',
            other: 'Andere',
            income: 'Zu versteuerndes Haushaltseinkommen',
            thresholdA: 'über 40.000 € / Jahr',
            thresholdB: 'unter 40.000 € / Jahr',
            calculateResults: 'Ergebnisse berechnen',
            result: 'Ergebnisse',
            showResults: 'Ergebnisse anzeigen',
            heatDemandError: 'Heizbedarf muss größer als 0 sein',
            gasPriceError: 'Gaspreis muss größer als 0 sein',
            gasBillError: 'Gasrechnung muss größer als 0 sein',
            oilPriceError: 'Ölpreis muss größer als 0 sein',
            oilBillError: 'Ölrechnung muss größer als 0 sein',
            ageError: 'Alter muss größer als 0 sein',
            graph: 'Zeitwert des Geldes',
            table: 'Ergebnisse in Tabelle',
            tableOexp: 'Betriebskosten',
            tableCexp: 'Investitionskosten',
            printPDF: 'PDF erstellen',
            currentHeatingSystem: 'Altanlage',
            ageLess1: 'weniger als 20 Jahre alt',
            ageMore1: 'mehr als 20 Jahre alt',
            subsidies: 'Voraussichtliche Förderung:',
            yearOfAppl: 'Antizipiertes Antragsjahr',
            currentHeating: {
              gas: 'Gasheizung',
              oil: 'Ölheizung',
            },
            help: {
              subsidies:
                'Das aktuelle KfW-Förderprogramm besteht aus 4 Komponenten: Basisförderung, einkommensabhängige Zusatzförderung, Geschwindigkeitsbonus (bezieht sich auf den Zeitpunkt der Antragstellung) und Effizienzbonus (abhängig von der Heizungsanlage - wird später in der Tabelle der Investitionskosten hinzugefügt)',
              subsidies2:
                'Weitere Informationen zu möglichen Förderungen sind im Ressourcenbereich unten verlinkt.',
            },
          },
          graph: {
            title: {
              gas: 'Gasheizung Kosten (€)',
              airAir: 'Luft-Luft-Wärmepumpe Kosten (€)',
              airWater: 'Luft-Wasser-Wärmepumpe Kosten (€)',
              groundWater: 'Grundwasser-Wärmepumpe Kosten (€)',
            },
          },
          pdf: {
            titlePage: {
              title: 'Bericht',
              subTitle1: 'Wirtschaftlichkeitsrechner',
              subTitle2: 'Wärmeplanung',
            },
            overviewPage: {
              title: 'Übersicht',
              totalCost: 'Gesamtkosten',
              totalSavings: 'Gesamtersparnisse',
              thirdColumn: 'Test',
            },
            lastPage: {
              title: 'Informationen',
              infoContent:
                'Die Ergebnisse basieren auf den eingegebenen Daten und können von den tatsächlichen Ergebnissen abweichen.',
            },
            general: {
              subTitle: 'Rentabilität für Wärmepumpen',
              titleAverage: 'Durchschnittliche Entwicklung des Geldes',
              titleBest: 'Beste Entwicklung des Geldes',
              titleWorst: 'Schlechteste Entwicklung des Geldes',
              titleInvest: 'Wirtschaftlichkeitsrechner Wärmeplanung',
              titleOperational: 'Betriebskosten',
            },
            result: {
              revTitle: 'Investitionskosten pro System',
              revExpText:
                'Das aktuelle KfW-Förderprogramm besteht aus 4 Komponenten: Basisförderung, einkommensabhängige Zusatzförderung, Schnelligkeitsbonus (bezieht sich auf den Zeitpunkt der Antragstellung) und Effizienzbonus (abhängig vom Heizsystem - wird später in der Investitionstabelle ergänzt). Weitere Informationen zu möglichen Förderungen sind im Abschnitt Ressourcen unten verlinkt.',
              tableAverage: 'Durchschnittlicher Fall',
              tableBest: 'Bester Fall',
              tableWorst: 'Schlechtester Fall',
              operationalText:
                'Die Betriebskosten setzen sich aus den Energiekosten und den Wartungskosten zusammen.',
            },
            footerLineOne: 'Musterstadt',
            footerLineTwo: 'Musterstraße 1, 00000 Musterstadt',
            opex: {
              gasTitle: 'Gasheizung',
              aahpTitle: 'Luft-Luft Wärmepumpe',
              average: 'Durchschnittlicher Fall',
              best: 'Bester Fall',
              worst: 'Schlechtester Fall',
            },
            graphTitle: 'Kosten über die Zeit',
            graphTitleGas:
              'Zeitkostenwert für die Gasheizung für den Startpunkt',
            graphTitleAirAir:
              'Zeitkostenwert für die Luft-Luft-Wärmepumpe für den Startpunkt',
            graphTitleAirWater:
              'Zeitkostenwert für die Luft-Wasser-Wärmepumpe für den Startpunkt',
            graphTitleGround:
              'Zeitkostenwert für die Grundwasser-Wärmepumpe für den Startpunkt',
          },
          results: {
            table: 'Tabelle',

            graph: 'Zeitwert des Geldes',
            capex: 'Investitionskosten',
            opex: 'Betriebskosten',
            heading: 'Ergebnisse',
            best: 'Bester Fall',
            worst: 'Schlechtester Fall',
            average: 'Durchschnitt',
            select: 'Ergebnis anzeigen',
            helpTextGraph:
              'Der Graph zeigt die Zeitwert des Geldes. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren,',
            helpTextCapex:
              'Die Tabelle zeigt eine wissenschaftliche Abschätzung der Investitionskosten pro Heizsystem, abhängig von der erforderlichen Kapazität des Heizsystems und zusätzlichen Aufwänden wie beispielsweise die Installation der Regeltechnik, Heizflächen oder Speicher. Die Investitionskosten umfassen sowohl den Preis des Gerätes, als auch die Kosten für Montage und Bodenarbeiten bei der Geothermie. Bei der Luft-Luft WP war eine weitere Aufteilung in Zusatzkosten aufgrund der geringen Datenlage nicht möglich, hier sind alle Kosten in den Investitionskosten enthalten.',
            helpTextOpex:
              'Die Betriebskosten setzen sich aus jährlich fixen, geschätzten Wartungskosten und den prognostizierten zukünftigen Preisen für Strom oder Gas zusammen. Da die Vorhersage von Energiepreisen mit großer Unsicherheit behaftet ist, diese jedoch einen entscheidenden Einfluss auf die Wirtschaftlichkeit einer Heizungsanlage haben, werden hier drei Szenarien betrachtet. Das Durchschnittsszenario bezieht sich auf die Strom- und Gaspreisprognose des Bundesministeriums für Wirtschaft und Klimaschutz (BMWK). Die Szenarien für den besten- und schlechtesten Fall beziehen sich auf unabhängige Studien und prognostizieren jeweils niedrigere oder höhere künftige Energiekosten.',
          },
          table: {
            SubsidiesHeader: 'Förderungen',
            SubsidiesHeaderTooltip:
              'Die Förderung setzt sich aus mehreren Komponenten zusammen, beträgt aber maximal 70%. Die maximal förderfähige Investitionssumme beträgt 30.000 €',
            basic: 'Basis',
            income: 'Einkommensabhängig',
            capex: 'Gesamtkapex',
            capexPerKwh: 'Gerätekosten entspr. Kapazität',
            equipment: 'Kosten für Zusatzgeräte',
            age: 'Klimageschwindigkeitsbonus',
            subsidiesTotal: 'Voraussichtliche Förderung',
            costTotal: 'Gesamtkosten',
            investment: 'Investition',
            gasHeater: 'Gasheizung',
            gasHeaterTooltip: 'Gasheizung',
            airAir: 'Luft-Luft WP',
            airAirTooltip: 'Luft-Luft Wärmepumpe',
            airWater: 'Luft-Wasser WP',
            airWaterTooltip: 'Luft-Wasser Wärmepumpe',
            geothermal: 'Geothermie WP',
            geothermalTooltip: 'Geothermie Wärmepumpe',
            energyCost: 'Energiekosten',
            energyCostTooltip: 'Energiekosten',
            totalOpex: 'Gesamtbetriebskosten',
            totalOpexTooltip: 'Gesamtbetriebskosten',
            maintananceCost: 'Wartungskosten',
            maintananceCostTooltip: 'Wartungskosten',
            year: 'Jahr',
            type: 'Typ',
            remainingCost: 'Verbleibende Kosten',
            selectHeating: {
              gas: 'Gasheizung',
              aahp: 'Luft-Luft-Wärmepumpe',
              awhp: 'Luft-Wasser-Wärmepumpe',
              gwhp: 'Geothermie-Wärmepumpe',
            },
          },
        },
      },
      en: {
        knowurheat: {
          title: 'KnowUrHeat',
          wizard: {
            next: 'Next',
            age: 'Age of current heating system',
            links: 'Links',
            gasBill: 'Gas bill',
            gasPrice: 'Gas price',
            gasBillSelect: 'Specify gas bill instead of consumption',
            oilBill: 'Oil bill',
            oilPrice: 'Oil price',
            oilBillSelect: 'Specify oil bill instead of consumption',
            heatDemand: 'Heat demand',
            headingLocation: 'Location',
            headingHeatDemand: 'Heat demand',
            subsidiesHeading: 'Entitlement to subsidies',
            headingCurrentHeatingSystem: 'Current heating system',
            headerHouseholdIncome: 'Taxable household income',
            state: 'State',
            functional: 'Functional',
            dysfunctional: 'Dysfunctional',
            other: 'Other',
            income: 'Taxable household income',
            thresholdA: 'above 40.000 € / year',
            thresholdB: 'below 40.000 € / year',
            calculateResults: 'Calculate results',
            result: 'Results',
            showResults: 'Show results',
            heatDemandError: 'Heat demand must be greater than 0',
            gasPriceError: 'Gas price must be greater than 0',
            gasBillError: 'Gas bill must be greater than 0',
            oilPriceError: 'Oil price must be greater than 0',
            oilBillError: 'Oil bill must be greater than 0',
            ageError: 'Age must be greater than 0',
            graph: 'Time value of the money',
            table: 'Results in table',
            tableOexp: 'Operating expenses',
            tableCexp: 'Capital expenditure',
            printPDF: 'Create PDF',
            currentHeatingSystem: 'Legacy heating system',
            ageLess1: 'less than 20 years old',
            ageMore1: 'more than 20 years old',
            subsidies: 'Estimated subsidies:',
            yearOfAppl: 'Anticipated year of application',
            currentHeating: {
              gas: 'Gas heating',
              oil: 'Oil heating',
            },
            help: {
              subsidies:
                'The current KfW funding programm consists of 4 components: Basic subsidy, income-dependent additional subsidy, speed bonus (relates to the time of application) and efficiency bonus (depending on the heating system - will be added later in the table of capital expenditure)',
              subsidies2:
                'Further information on potential subsidies are linked in the ressources section below.',
            },
          },
          graph: {
            title: {
              gas: 'Gas Heating Cost (€)',
              airAir: 'Air-Air Heat Pump Cost (€)',
              airWater: 'Air-Water Heat Pump Cost (€)',
              groundWater: 'Ground-Water Heat Pump Cost (€)',
            },
          },
          pdf: {
            titlePage: {
              title: 'Report',
              subTitle1: 'Economic calculator',
              subTitle2: 'Heat planning',
            },
            overviewPage: {
              title: 'Overview',
              totalCost: 'Total cost',
              totalSavings: 'total savings',
              thirdColumn: 'Test',
            },
            lastPage: {
              title: 'Information',
              infoContent:
                'The results are based on the entered data and may differ from the actual results.',
            },
            general: {
              subTitle: 'Rentability for Heat Pumps',
              titleAverage: 'Average time value for money',
              titleBest: 'Best time value for money',
              titleWorst: 'Worst time value for money',
              titleInvest: 'Economic calculator heat planning',
              titleOperational: 'Operating expenses',
            },
            result: {
              revTitle: 'Investment Costs per System',
              revExpText:
                'The current KfW funding programm consists of 4 components: Basic subsidy, income-dependent additional subsidy, speed bonus (relates to the time of application) and efficiency bonus (depending on the heating system - will be added later in the table of capital expenditure). Further information on potential subsidies are linked in the ressources section below.',
              tableAverage: 'Average Case',
              tableBest: 'Best Case',
              tableWorst: 'Worst Case',
              operationalText:
                'The operating costs consist of the energy costs and the maintenance costs.',
            },
            footerLineOne: 'Samplecity',
            footerLineTwo: 'Samplestreet 1, 00000 Samplecity',
            opex: {
              gasTitle: 'Gas Heater',
              aahpTitle: 'Air-Air Heatpump',
              average: 'Average case',
              best: 'Best case',
              worst: 'Worst case',
            },
            graphTitleGas:
              'Time cost value for the gas heater for the starting point',
            graphTitleAirAir:
              'Time cost value for the air-air heat pump for the starting point',
            graphTitleAirWater:
              'Time cost value for the air-water heat pump for the starting point',
            graphTitleGround:
              'Time cost value for the ground-water heat pump for the starting point',
          },
          results: {
            table: 'Table',
            graph: 'Time value of the money',
            capex: 'Capital expenditure',
            opex: 'Operating expenses',
            heading: 'Results',
            best: 'Best case',
            worst: 'Worst case',
            average: 'Average',
            select: 'View result',
            helpTextGraph:
              'The graph shows the costs over time. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren,',
            helpTextCapex:
              'The table shows a scientific estimate of the investment costs per heating system, depending on the required capacity of the heating system and additional expenses such as the installation of control technology, heating surfaces or storage tanks. The investment costs include both the price of the appliance and the costs for installation and ground work in the case of geothermal energy. In the case of air-to-air heat pumps, a further breakdown into additional costs was not possible due to the limited data available; here, all costs are included in the investment costs.',
            helpTextOpex:
              'The operating costs are made up of annual fixed, estimated maintenance costs and the forecast future prices for electricity or gas. As the prediction of energy prices is subject to great uncertainty, but these have a decisive influence on the economic efficiency of a heating system, three scenarios are considered here. The average scenario is based on the electricity and gas price forecast of the Federal Ministry of Economics and Climate Protection (BMWK). The best and worst case scenarios are based on independent studies and predict lower or higher future energy costs in each case.',
          },
          table: {
            SubsidiesHeader: 'Subsidies',
            capex: 'Total capex',
            capexPerKwh: 'Device costs for capacity',
            equipment: 'Auxiliary equipment costs',
            SubsidiesHeaderTooltip:
              'The subsidy is made up of several components, but amounts to a maximum of 70%. The maximum eligible investment amount is €30,000',
            basic: 'Basic',
            income: 'Income based',
            age: 'Climate speed bonus',
            subsidiesTotal: 'Estimated subsidies',
            costTotal: 'Total costs',
            investment: 'Investment',
            gasHeater: 'Gas heater',
            gasHeaterTooltip: 'Gas heater',
            airAir: 'Air-to-Air HP',
            airAirTooltip: 'Air-to-Air heat pump',
            airWater: 'Air-to-Water HP',
            airWaterTooltip: 'Air-to-Water heat pump',
            geothermal: 'Geothermal HP',
            geothermalTooltip: 'Geothermal heat pump',
            energyCost: 'Energy costs',
            energyCostTooltip: 'Energy costs',
            totalOpex: 'Total operating expenses',
            totalOpexTooltip: 'Total operating expenses',
            maintananceCost: 'Maintenance costs',
            maintananceCostTooltip: 'Maintenance costs',
            year: 'Year',
            type: 'Type',
            remainingCost: 'Remaining expenses',
            selectHeating: {
              gas: 'Gas heater',
              aahp: 'Air-Air Heat Pump',
              awhp: 'Air-Water Heat Pump',
              gwhp: 'Ground-Water Heat Pump',
            },
          },
        },
      },
    },
    /**
     * components for configuring the plugin and/ or custom items defined by the plugin
     */
    getConfigEditors(): PluginConfigEditor<object>[] {
      return [];
    },
    destroy(): void {
      // eslint-disable-next-line no-console
      console.log('hook to cleanup');
    },
  };
}
