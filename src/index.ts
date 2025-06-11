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
                'Das aktuelle KfW-Förderprogramm besteht aus 4 Komponenten: Basisförderung, einkommensabhängige Zusatzförderung, Geschwindigkeitsbonus (bezieht sich auf den Zeitpunkt der Antragstellung) und Effizienzbonus (abhängig von der Heizungsanlage; hier nicht berücksichtigt).',
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
                'Um unser Ziel klimaneutral zu werden, erreichen zu können, müssen wir auch die Wärmeversorgung klimafreundlicher gestalten. Dazu gehören unter anderen aber vor allem die Erweiterung der Fernwärmenetze, inklusive die Erhöhung der Anschlussleistung, und die Masseninstallation von Wärmepumpen. Allerdings sind die Investitionskosten mit der Installation einer Wärmepumpe hoch im Vergleich zu konventionellen Heizungssystemen, auch wenn die Betriebskosten hingegen deutlich günstiger sind. Deswegen ist eine Analyse der individuellen Umstände der Bürgerinnen und Bürger notwendig, damit jede:r die richtige Entscheidung für sich treffen kann. Zusätzlich wären eventuell in vielen Fällen höhere Förderungsraten nötig, als im Moment vorgesehen. Das Ziel dieses Wirtschaftlichkeitsrechners ist, einen wirtschaftlichen Vergleich unterschiedlicher Heizungsoptionen zu ermöglichen.\nDer Wirtschaftlichkeitsrechner Wärmeplanung wurde in Zusammenarbeit zwischen der Universität Bremen, dem Landesamt GeoInformation Bremen und Virtual City Systems im Rahmen des Forschungsprojekts KnowUrHeat entwickelt. Die Berechnungsmethode basiert auf wissenschaftlichen Ergebnissen der Universität Bremen, die technische Umsetzung als VC Map Plugin wurde von Virtual City Systems realisiert. Die berechneten Ergebnisse dienen ausschließlich der Erstinformation. Sie beruhen auf den getätigten Nutzerangaben und wissenschaftlichen Annahmen und sind nicht rechtsverbindlich.',
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
            opex: {
              gasTitle: 'Gasheizung',
              aahpTitle: 'Luft-Luft Wärmepumpe',
              average: 'Durchschnittlicher Fall',
              best: 'Bester Fall',
              worst: 'Schlechtester Fall',
            },
            graphTitle: 'Kosten über die Zeit',
            graphTitleGas:
              'Gegenwartswert für die Gasheizung mit dem Startpunkt',
            graphTitle2: 'mit Rückbau nach',
            graphTitle3: 'Jahren',
            graphTitleAirAir:
              'Gegenwartswert für die Luft-Luft-Wärmepumpe für den Startpunkt',
            graphTitleAirWater:
              'Gegenwartswert für die Luft-Wasser-Wärmepumpe für den Startpunkt',
            graphTitleGround:
              'Gegenwartswert für die Grundwasser-Wärmepumpe für den Startpunkt',
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
              'Der Zeitwert des Geldes ist ein zentrales Konzept in der Finanzwirtschaft und beruht auf dem Prinzip, dass ein bestimmter Geldbetrag heute mehr wert ist als derselbe Betrag in der Zukunft. Bei Investitionsentscheidungen wird der Zeitwert des Geldes berücksichtigt, um Zahlungsflüsse auf den heutigen Zeitpunkt zu beziehen und damit vergleichbar zu machen. Der sogenannte Barwert (auch: Gegenwartswert) bezeichnet den Wert zukünftiger Zahlungen heute, abgezinst mit einem definierten Zinssatz. Unter der Annahme eines jährlichen Zinssatzes von',
            helpTextGraph2:
              '%, bezieht sich somit der Endbetrag auf den Geldbetrag, den Sie zum Anschaffungszeitpunkt zurücklegen müssen, um alle Kosten des gegebenen Heizgeräts über die angenommene Lebensdauer',
            helpTextGraph3:
              'zu decken. Die Berechnung schließt den Rückbau im letzten Nutzungsjahr mit ein.',
            helpTextCapex:
              'Die Tabelle zeigt eine wissenschaftliche Abschätzung der Investitionskosten pro Heizsystem, abhängig von der erforderlichen Kapazität des Heizsystems und zusätzlichen Aufwänden wie beispielsweise die Installation der Regeltechnik, Heizflächen oder Speicher. Die Anschaffungskosten umfassen sowohl den Preis des Gerätes, als auch die Kosten für Montage und Bodenarbeiten bei der Geothermie. Bei der Luft-Luft WP war eine weitere Aufteilung in Zusatzkosten aufgrund der geringen Datenlage nicht möglich, hier sind alle Kosten in den Investitionskosten enthalten. Unter Förderungen wird eine Ersteinschätzung zur potentiellen Förderung durch das aktuelle KfW-Förderprogramm entsprechend Ihrer Angaben abgebildet. Hier sind die Komponenten Basisförderung, die einkommensabhängige Zusatzförderung und der Klimageschwindigkeitsbonus abgebildet. Der Förderanspruch beträgt maximal 70 % der Investitionskosten bei einer maximal förderfähigen Investitionssumme von 30.000 €. Angaben zu potentiellen Förderungen dienen ausschließlich der Erstinformation und sind nicht rechtsverbindlich.\n' +
              '\n' +
              'Die verbleibende Investition ergibt sich aus der Differenz von Anschaffungskosten und Förderbeitrag.',
            helpTextOpex:
              'Die Betriebskosten setzen sich aus jährlich fixen, geschätzten Wartungskosten und den prognostizierten zukünftigen Preisen für Strom oder Gas zusammen. Da die Vorhersage von Energiepreisen mit großer Unsicherheit behaftet ist, diese jedoch einen entscheidenden Einfluss auf die Wirtschaftlichkeit einer Heizungsanlage haben, werden hier drei Szenarien betrachtet. Das Durchschnittsszenario bezieht sich auf die Strom- und Gaspreisprognose des Bundesministeriums für Wirtschaft und Klimaschutz (BMWK). Die Szenarien für den besten- und schlechtesten Fall beziehen sich auf unabhängige Studien und prognostizieren jeweils niedrigere oder höhere künftige Energiekosten. Beide Kostenanteile werden als Barwert (auch: Gegenwartswert) der entstehenden Kosten berücksichtigt. Dies bezeichnet den Wert zukünftiger Zahlungen zum heutigen Zeitpunkt, aufgrund der ökonomischen Annahme, dass Geld heute mehr wert ist als derselbe Betrag in der Zukunft.',
          },
          table: {
            SubsidiesHeader: 'Förderungen',
            SubsidiesHeaderTooltip:
              'Die Förderung setzt sich aus mehreren Komponenten zusammen, beträgt aber maximal 70%. Die maximal förderfähige Investitionssumme beträgt 30.000 €',
            basic: 'Basis',
            income: 'Einkommensabhängig',
            capex: 'Gesamtkosten',
            capexPerKwh: 'Gerätekosten entspr. Kapazität',
            equipment: 'Kosten für Zusatzgeräte',
            age: 'Klimageschwindigkeitsbonus',
            subsidiesTotal: 'Voraussichtliche Förderung',
            costTotal: 'Verbleibende Investition',
            investment: 'Anschaffung',
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
            remainingCost: 'Verbleibende Investition',
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
                'The current KfW subsidy programm consists of 4 components: Basic subsidy, income-dependent additional subsidy, speed bonus (relates to the time of application) and efficiency bonus (depending on the heating system; not considered here).',
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
                'In order to achieve our climate target of becoming climate-neutral, we must also make the heat supply more climate-friendly. This includes, but is not limited to, the expansion of district heating networks, including increasing the connected load, and the mass installation of heat pumps. However, the investment costs of installing a heat pump are high compared to conventional heating systems, even if the operating costs are significantly lower. It is therefore necessary to analyse the individual circumstances of citizens so that everyone can make the right decision for themselves. In addition, in many cases higher subsidy rates may be necessary than currently envisaged. The goal of the cost-effectiveness calculator is to show the comparison of different heating options.\nThe economic calculator heat planning has been developed in cooperation between University of Bremen, Land surveying office Bremen and Virtual City Systems as part of the KnowUrHeat research project. The calculation method is based on scientific results of the University of Bremen, the technical implementation as VC Map Plugin was realized by Virtual City Systems. Calculated results are for initial information only. They are based on the defined user inputs and scientific assumptions and are not legally binding.',
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
                'The current KfW subsidy programm consists of 4 components: Basic subsidy, income-dependent additional subsidy, speed bonus (relates to the time of application) and efficiency bonus (depending on the heating system - will be added later in the table of capital expenditure). Further information on potential subsidies are linked in the ressources section below.',
              tableAverage: 'Average Case',
              tableBest: 'Best Case',
              tableWorst: 'Worst Case',
              operationalText:
                'The operating costs consist of the energy costs and the maintenance costs.',
            },
            opex: {
              gasTitle: 'Gas Heater',
              aahpTitle: 'Air-Air Heatpump',
              average: 'Average case',
              best: 'Best case',
              worst: 'Worst case',
            },
            graphTitleGas:
              'Present value for the gas heater for the starting point',
            graphTitle2: 'with deconstruction after',
            graphTitle3: 'years',
            graphTitleAirAir:
              'Present value for the air-air heat pump for the starting point',
            graphTitleAirWater:
              'Present value for the air-water heat pump for the starting point',
            graphTitleGround:
              'Present value for the ground-water heat pump for the starting point',
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
              'The time value of money is a central concept in finance and is based on the principle that a certain amount of money is worth more today than the same amount in the future. When making investment decisions, the time value of money is taken into account in order to relate payment flows to the present and thus make them comparable. The so-called present value describes the value of future payments today, discounted at a defined interest rate. Assuming an annual interest rate of',
            helpTextGraph2:
              '%, the final amount therefore refers to the amount of money that you have to set aside at the time of purchase to cover all the costs of the given heater over the assumed service life.',
            helpTextGraph3:
              'The calculation includes the deconstruction in the last year of use.',
            helpTextCapex:
              'The table shows a scientific estimate of the capital expenditure per heating system, depending on the required capacity of the heating system and additional expenses such as the installation of control technology, heating surfaces or storage tanks. The acquisition costs include both the price of the appliance and the costs for installation and ground work in the case of geothermal energy. In the case of air-to-air heat pumps, a further breakdown into additional costs was not possible due to the limited data available; here, all costs are included in the device costs. An initial assessment of the potential subsidy from the current KfW subsidy program is shown under Subsidies according to your details. The components basic subsidy, the income-dependent additional subsidy and the climate speed bonus are shown here. The maximum subsidy entitlement is 70% of the investment costs with a maximum eligible investment sum of €30,000. Details of potential subsidies are for initial information purposes only and are not legally binding.\n' +
              '\n' +
              'The remaining investment is the difference between the acquisition costs and the subsidy.',
            helpTextOpex:
              'The operational expenses are made up of annual fixed, estimated maintenance costs and the forecast future prices for electricity or gas. As the prediction of energy prices is subject to great uncertainty, but these have a decisive influence on the economic efficiency of a heating system, three scenarios are considered here. The average scenario is based on the electricity and gas price forecast of the Federal Ministry of Economics and Climate Protection (BMWK). The best and worst case scenarios are based on independent studies and predict lower or higher future energy costs in each case. Both cost shares are taken into account as the present value of the costs incurred. This refers to the value of future payments at the present time, based on the economic assumption that money is worth more today than the same amount in the future.',
          },
          table: {
            SubsidiesHeader: 'Subsidies',
            capex: 'Total costs',
            capexPerKwh: 'Device costs for capacity',
            equipment: 'Auxiliary equipment costs',
            SubsidiesHeaderTooltip:
              'The subsidy is made up of several components, but amounts to a maximum of 70%. The maximum eligible investment amount is €30,000',
            basic: 'Basic',
            income: 'Income based',
            age: 'Climate speed bonus',
            subsidiesTotal: 'Estimated subsidies',
            costTotal: 'Remaining investment',
            investment: 'Acquisition',
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
            remainingCost: 'Remaining investment',
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
