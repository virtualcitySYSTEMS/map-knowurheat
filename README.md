# knowurheat

> Part of the [VC Map Project](https://github.com/virtualcitySYSTEMS/map-ui)

The KnowUrHeat Plugin provides the user with the possibility to calculate the cost of different heating systems based on the user's heat demand.

## Configuration overview for `knowUrHeat`

This configuration file defines all essential data and parameters required by the `knowUrHeat` plugin. It includes project metadata, external references, heating types, subsidy rules, investment cost models (CAPEX), energy prices, and various performance/financial assumptions.

### Project metadata

- **`name`** : Project identifier. Default is `"knowUrHeat"`.

---

### External links (optional)

Defines related URLs with their display names. In the user interface, these links are listed at the bottom of the wizard as references to external ressources.

_Config example:_

```json
"links": [
  {
    "name": "Projekt Info Link",
    "url": "https://www.link.de"
  },
  ...
]
```

---

### Initial heating systems

Lists the heating systems to be considered for replacement. Currently supported heating systems include gas and oil.

_Config example:_

```json
"initialHeatingDemolition": [
  { "name": "Gas" },
  { "name": "Oil" }
]
```

---

### Subsidy configuration

Specification of input parameters for calculation of individual components of the KfW subsidy program.

_Config example:_

```json
"subsidies": {
  "baseSubsidyPercentage": 30,
  "ageThreshold": 20,
  "ageSubsidyPercentage": 20,
  "incomeThreshold": 40000,
  "incomeSubsidyPercentage": 30,
  "maxSubsidyPercentage": 70,
  "maxSubsidyValue": 30000
}
```

Parameters:

- **`baseSubsidyPercentage`**: Standard subsidy percentage value applicable to all private individuals.
- **`ageThreshold`**: Age (in years) of the previous heating system to qualify for an additional subsidy.
- **`ageSubsidyPercentage`**: Percentage value of additional subsidy that is applied if the `ageThreshold` is met by the heating system to be replaced.
- **`incomeThreshold`**: Maximum household income (in euro) to qualify for an additional income-based subsidy.
- **`incomeSubsidyPercentage`**: Percentage value of additional subsidy for low-income households.
- **`maxSubsidyPercentage`**: Upper limit for total subsidy entitlement (as a percentage value).
- **`maxSubsidyValue`**: Maximum acquisition cost (in euro) that the total subsidy can be applied to.

---

### CAPEX (capital expenditure) model

Defines installation and equipment cost scaling functions per technology as basis for the capital expenditure calculation of the heating systems to be considered for comparison.

_Config example:_

```json
"capexData": {
  "gas": {
    "capexPerKwh": { "factor": 3304.8, "exponent": -0.673 },
    "equipment": { "factor": 748.01, "exponent": 0.5733 }
  },
  ...
}
```

Technologies supported:

- **`gas`**: gas heater
- **`awhp`**: air-water heat pump
- **`gwhp`**: ground-water heat pump
- **`aahp`**: air-air heat pump

Each includes the following parameters:

- **`capexPerKwh`**: A cost function to estimate investment cost based on kWh.
- **`equipment`**: A cost function to estimate equipment cost.

---

### Main financial and technical data

Defines base data per technology for the operational expenditure and time value of money caluclations of the heating systems to be considered for comparison.

_Config example:_

```json
"mainData": {
  "Year": [2024, 2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034, 2035, 2036, 2037, 2038, 2039, 2040, 2041, 2042],
  "Maintenance costs GH": [100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100],
  ...
  "Deconstruction costs GH": { "year": 15, "cost": 1000 },
  ...
  "Gas price": [11.87, 12.11, 12.27, 12.34, 12.42, 12.64, 12.86, 13.1, 13.35, 13.73, 14.24, 14.4, 14.81, 15.23, 15.67, 16.11, 16.56, 16.54, 16.53],
  "Gas price best": [11.87, 7.18, 7.42, 7.65, 7.89, 8.13, 8.37, 8.55, 8.73, 8.91, 9.09, 9.27, 9.46, 9.64, 9.82, 10, 10.18, 10.27, 10.36],
  "Gas price worst": [11.87, 10.7, 11.02, 11.34, 11.66, 11.98, 12.3, 12.8, 13.3, 13.8, 14.3, 14.8, 15.3, 15.8, 16.3, 16.8, 17.3, 17.62, 17.94],
  ...
  "Fuel Oil price": 9.736,
  "SEER OH": 0.7,
  "Efficiency GH": 0.8,
  "COP air-air HP": 4,
  ...
  "Rate of interest": [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4]
}
```

General parameters:

- **`Year`**: Label for each year of the reference period defined as an array.

Cost parameters:

- **`Maintenance costs <heater type>`**: Defines maintanance costs (€/year) per technology for each year of the reference period as an array. Heater types supported: GH (gas heater), air-air HP (air-air heat pump), air-water HP (air-water hear pump), ground-water HP (ground-water heat pump).
- **`Deconstruction costs <heater type>`**: Defines year of deconstruction and deconstruction costs per technology as an object of fixed values. Heater types supported: GH (gas heater), air-air HP (air-air heat pump), air-water HP (air-water hear pump), ground-water HP (ground-water heat pump).
  - **`year`**: Number of years after which the technology is deconstructed
  - **`cost`**: Cost of deconstruction (€)
- **`<Energy type> price`**: Defines energy price projections (€/kWh) per energy type for each year of the reference period as an array for the average case scenario. Energy types supported: Gas, Electricity.
- **`<Energy type> price best`**: Defines energy price projections (€/kWh) per energy type for each year of the reference period as an array for the best case scenario. Energy types supported: Gas, Electricity.
- **`<Energy type> price worst`**: Defines energy price projections (€/kWh) per energy type for each year of the reference period as an array for the worst case scenario. Energy types supported: Gas, Electricity.
- **`Fuel Oil price`**: Defines the assumed oil price used for reverse calculation of the energy demand based on the oil bill.

Technical performance parameters:

- **`SEER OH`**: Seasonal Energy Efficiency Ratio, defines the efficiancy value for Oil Heating.
- **`Efficiency GH`**: Efficiency value of Gas Heating
- **`COP <heat pump type>`**: Coefficient of Performance, defines the efficiency value for heat pumps. Heat pump types supported: air-air HP (air-air heat pump), air-water HP (air-water hear pump), ground-water HP (ground-water heat pump).

Financial parameters:

- **`Rate of interest`**: Defines the projected interest rate (%) for each year of the reference period as an array.
