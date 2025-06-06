# knowurheat

> Part of the [VC Map Project](https://github.com/virtualcitySYSTEMS/map-ui)

The KnowUrHeat Plugin provides the user with the possibility to calculate the cost of different heating systems based on the user's heat demand.

## Configuration Overview for `knowUrHeat`

This configuration file defines all essential data and parameters required by the `knowUrHeat` plugin. It includes project metadata, external references, heating types, subsidy rules, investment cost models (CAPEX), energy prices, and various performance/financial assumptions.

### Project Metadata

- **`name`**  
  Project identifier.  
  Default: `"knowUrHeat"`

---

### External Links

```json
"links": [
  {
    "name": "Projekt Info Link",
    "url": "https://www.link.de"
  },
  ...
]
```

Defines related URLs with their display names. These Links are listed at the bottom of the Wizard.

---

### Initial Heating Systems

```json
"initialHeatingDemolition": [
  { "name": "Gas" },
  { "name": "Oil" }
]
```

Lists the heating systems to be considered for replacement.

---

### Subsidy Configuration

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

- **`baseSubsidyPercentage`**: Standard subsidy percentage applied to all.
- **`ageThreshold`**: Age (in years) of the previous heating system to qualify for an additional subsidy.
- **`ageSubsidyPercentage`**: Additional subsidy that is applied to the new heating system if the `ageThreshold` is met.
- **`incomeThreshold`**: Maximum income to qualify for an additional income-based subsidy.
- **`incomeSubsidyPercentage`**: Additional subsidy for low-income households.
- **`maxSubsidyPercentage`**: Upper cap for total subsidy (as a percentage).
- **`maxSubsidyValue`**: Maximum Cost that the total subsidy can be applied to.

---

### CAPEX (Capital Expenditure) Model

```json
"capexData": {
  "gas": {
    "capexPerKwh": { "factor": 3304.8, "exponent": -0.673 },
    "equipment": { "factor": 748.01, "exponent": 0.5733 }
  },
  ...
}
```

Defines installation and equipment cost scaling per technology:

Technologies supported:

- `gas`
- `awhp` (air-water heat pump)
- `gwhp` (ground-water heat pump)
- `aahp` (air-air heat pump)

Each includes:

- **`capexPerKwh`**: A cost function to estimate investment cost based on kWh
- **`equipment`**: Equipment cost modeled similarly

---

### Main Financial and Technical Data

```json
"mainData": {
  "Year": [2024, 2025, ...],
  "Maintenance costs <type>": [values...],
  "Deconstruction costs <type>": { "year": 15, "cost": <value> },
  ...
}
```

Includes:

#### Maintenance Costs (€/year)

- `"Maintenance costs GH"` – Gas heater
- `"Maintenance costs air-air HP"` – Air-Air Heat Pump
- `"Maintenance costs air-water HP"` – Air-Water Heat Pump
- `"Maintenance costs ground-water HP"` – Ground-Water Heat Pump

#### Deconstruction Costs

- Fixed year and cost for dismantling each technology (e.g. `"Deconstruction costs GH"`)

#### Energy Prices (€/kWh)

Each with **average**, **best-case**, and **worst-case** projections over time. They are given as arrays for the entire period:

- `"Gas price"`
- `"Gas price best"`
- `"Gas price worst"`
- `"Electricity price"`
- ...
- `"Fuel Oil price"` (single value)

#### Technical Performance

These values are used to calculate the efficiency of the heating systems and are given as a single value:

- `"SEER OH"`: Seasonal Energy Efficiency Ratio for Oil Heating
- `"Efficiency GH"`: Efficiency of Gas Heating
- `"COP air-air HP"`: Coefficient of Performance
- `"COP air-water HP"`
- `"COP ground-water HP"`

#### Rate of Interest

- Fixed interest rate list for all years (e.g., `4%` over the 19-year span)
- `"Rate of interest": [
  4, 4, ...
]` described as an array of values for each year'

---
