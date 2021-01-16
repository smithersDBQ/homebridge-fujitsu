# homebridge-fujitsu
## Homebridge plug in for Fujistu Mini Split

**Warning** this plugin this is currently experimental, use at your own risk!

## Installation

1. Install [homebridge](https://github.com/nfarina/homebridge#installation-details)
2. Install this plugin: `npm install -g homebridge-fujitsu`
3. Edit your `config.json` file (See below).

```json
"accessories": [
    {
        "accessory": "FGLairThermostat",
        "name": "Fujitsu Mini Spit",
        "username": "FGLAIR USERNAME",
        "password": "FGLAIR PASSWORD",
        "interval": 30
    },
]
```
| Key | Description |
| --- | --- |
| `accessory` | Must be `FGLairThermostat` |
| `name` | Name to appear in the Home app |
| `username` | FGLair Username |
| `password` | FGLair Password |
| `deviceIndex` _(optional)_ | The index of the device this plugin will control (in the order in which you added them to your FGLair account) |
| `model` _(optional)_ | Appears under "Model" for your accessory in the Home app |
| `interval` _(optional)_ | Polling time for thermostat (Default: 60 sec.) |
| `region` _(optional)_ | Region for thermostat, change for China & E.U. (Default: "us") |

## New Features
- Works with multiple air conditioner heads.  Click "Add accessory" from plug in settings to add a second unit.

## Current limitations
- Timeout on token is not enabled, when token is invalid the API will re-authenticate.
- Auth. Token is not cached (Future Release)
- Previous thermostat state is not cached (Future Release)

## Contributions
Portions of this software adapted from the projects listed below.  A huge thank you, for all their work.

- The pyfujitsu project under Apache License
Copyright (c) 2018 Mmodarre https://github.com/Mmodarre/pyfujitsu

- The homebridge-dummy-thermostat under the Unlicense
https://github.com/X1ZOR/homebridge-dummy-thermostat
