// FGLair API, (c) 2020 Ryan Beggs, MIT License

// Portions of this software adapted from the homebridge-thermostat project
// https://github.com/PJCzx/homebridge-thermostat/
// Licensed under Apache 2.0

var Service, Characteristic, HbAPI;

module.exports = function (homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    HbAPI = homebridge;
    homebridge.registerAccessory("homebridge-fujitsu", "FGLairThermostat", Thermostat);
};

const OPERATION_MODE = { "off":0, "auto":2, "cool":3, "dry":4, "fan_only":5, "heat":6, 0:"off", 2:"auto", 3:"cool", 4:"dry", 5:"fan_only", 6:"heat"}

const HK_MODE = { 0:"off", 1:"heat", 2:"cool", 3:"auto"}

function Thermostat(log, config) {
    this.log = log;

    this.name = config.name;
    this.manufacturer = "Fujitsu General Ltd.";
    this.model = config.model || "DefaultModel";
    this.serial = config.serial || '';
    this.token = config.token || "";
    this.region = config.region || 'us'
    this.temperatureDisplayUnits = config.temperatureDisplayUnits || 0;
	this.deviceIndex = config.deviceIndex || 0;

    this.currentHumidity = config.currentHumidity || false;
    this.targetHumidity = config.targetHumidity || false;
    this.interval = config.interval*1000 || 10000;
    this.userName = config.username || '';
    this.password = config.password || '';
    this.temperatureDisplayUnits = config.temperatureDisplayUnits || 0;
    this.targetTemperature = 20;
    this.keyTargetTemperature = 0;
    this.currentTemperature = 20;

    this.targetHeatingCoolingState = 6;
    this.keyCurrentHeatingCoolingState = 0;
    this.currentHeatingCoolingState = 6;

    this.deviceProperties = [];

    this.log(this.name);
    this.service = new Service.Thermostat(this.name);
    this.api = require('./fglairAPI.js')
    this.api.setLog(this.log);
    this.api.setToken(this.token);
    this.api.setRegion(this.region);

    that = this;

    this.api.getAuth(this.userName ,this.password, (err, token) =>
    {
        this.token = token;

        this.api.getDevices(token, (err,data) =>
        {
            if( err)
            {
               //TODO:  Do something...
            }
            else
            {

                this.serial = data[this.deviceIndex]; //Only one thermostat is supported
                this.updateAll(that);
                setInterval( this.updateAll, this.interval, that );
            }
        });

    });
}

Thermostat.prototype.updateAll = function(ctx)
{
    ctx.api.getDeviceProp(ctx.serial, (err,properties) =>
    {   if(err)
        {
            ctx.log("Update Properties: " + err.message);
        }
        else
        {
            properties.forEach( (prop) =>
            {
                //this.log(prop['property']['name']);
                if( prop['property']['name'] == 'adjust_temperature' )
                {
                    ctx.targetTemperature = parseInt(prop['property']['value'])/10
                    ctx.currentTemperature = ctx.targetTemperature;
                    //ctx.log("[" + ctx.serial + "] Got Temperature: "+ ctx.targetTemperature + ":" + ctx.currentTemperature);
                    ctx.service.updateCharacteristic(Characteristic.TargetTemperature, ctx.targetTemperature);
                    ctx.service.updateCharacteristic(Characteristic.CurrentTemperature, ctx.currentTemperature);
                    this.keyTargetTemperature = prop['property']['key'];
                }
                else if( prop['property']['name'] == 'operation_mode' )
                {
                    let mode = OPERATION_MODE[prop['property']['value']];
                    switch(mode)
                    {
                        case "off":
                            ctx.targetHeatingCoolingState = Characteristic.TargetHeatingCoolingState.OFF;
                            break;
                        case "auto":
                            ctx.targetHeatingCoolingState = Characteristic.TargetHeatingCoolingState.AUTO;
                            break;
                        case "heat":
                            ctx.targetHeatingCoolingState = Characteristic.TargetHeatingCoolingState.HEAT;
                            break;
                        case "cool":
                        case "fan":
                        case "dry":
                            ctx.targetHeatingCoolingState = Characteristic.TargetHeatingCoolingState.COOL;
                            break;
                        default:
                            ctx.targetHeatingCoolingState = Characteristic.TargetHeatingCoolingState.OFF;
                            break;
                    }

                    this.keyCurrentHeatingCoolingState = prop['property']['key'];

                    //ctx.log("[" + ctx.serial + "] Got HeatingCooling State: "+ ctx.targetHeatingCoolingState);
                    ctx.service.updateCharacteristic(Characteristic.CurrentHeatingCoolingState, ctx.currentHeatingCoolingState);
                    ctx.service.updateCharacteristic(Characteristic.TargetHeatingCoolingState, ctx.targetHeatingCoolingState);

                }
            }); //end of foreach
            ctx.log("[" + ctx.serial + "] temp: " + ctx.targetTemperature + "C, mode: " + HK_MODE[ctx.targetHeatingCoolingState]);
        }

    });
};

Thermostat.prototype.getCurrentHeatingCoolingState = function(cb) {
    cb(null, this.currentHeatingCoolingState);
};

Thermostat.prototype.getTargetHeatingCoolingState = function(cb) {
    cb(null, this.targetHeatingCoolingState);
};

Thermostat.prototype.setTargetHeatingCoolingState = function(val, cb) {

	let fgl_val = OPERATION_MODE[HK_MODE[val]];
	this.log("Setting Target Mode to " + fgl_val + ":" +HK_MODE[val]);
    this.service.updateCharacteristic(Characteristic.TargetHeatingCoolingState, val);
    this.service.updateCharacteristic(Characteristic.CurrentHeatingCoolingState, val);
    this.api.setDeviceProp(this.keyCurrentHeatingCoolingState, fgl_val, (err) =>
    {
        cb(err);
    })

};

Thermostat.prototype.getCurrentTemperature = function(cb) {
	//this.log("Current "+this.currentTemperature);
	cb(null, this.currentTemperature);
};

Thermostat.prototype.getTargetTemperature = function(cb) {
	//this.log("Target "+this.targetTemperature);
	cb(null, this.targetTemperature);
};

Thermostat.prototype.setTargetTemperature = function(val, cb) {
	this.log("Setting Temperature to " + val);
    this.api.setDeviceProp(this.keyTargetTemperature, Math.round(val) * 10, (err) =>
    {
    	this.service.updateCharacteristic(Characteristic.TargetTemperature, Math.round(val));
        cb(err);
    });


};

Thermostat.prototype.getTemperatureDisplayUnits = function(cb) {
    cb(null, this.temperatureDisplayUnits);
};

Thermostat.prototype.setTemperatureDisplayUnits = function(val, cb) {
	this.log(val);
    this.temperatureDisplayUnits = val;
    cb();
};

Thermostat.prototype.getName = function(cb) {
    cb(null, this.name);
};

Thermostat.prototype.getServices = function () {
    this.informationService = new Service.AccessoryInformation();
    this.informationService
        .setCharacteristic(Characteristic.Manufacturer, this.manufacturer)
        .setCharacteristic(Characteristic.Model, this.model);

    this.service
        .getCharacteristic(Characteristic.CurrentHeatingCoolingState)
        .on('get', this.getCurrentHeatingCoolingState.bind(this));

    this.service
        .getCharacteristic(Characteristic.TargetHeatingCoolingState)
        .on('get', this.getTargetHeatingCoolingState.bind(this))
        .on('set', this.setTargetHeatingCoolingState.bind(this));

    this.service
        .getCharacteristic(Characteristic.CurrentTemperature)
        .on('get', this.getCurrentTemperature.bind(this));

    this.service
        .getCharacteristic(Characteristic.TargetTemperature)
        .on('get', this.getTargetTemperature.bind(this))
        .on('set', this.setTargetTemperature.bind(this));

    this.service
        .getCharacteristic(Characteristic.TemperatureDisplayUnits)
        .on('get', this.getTemperatureDisplayUnits.bind(this))
        .on('set', this.setTemperatureDisplayUnits.bind(this));

    this.service
        .getCharacteristic(Characteristic.Name)
        .on('get', this.getName.bind(this));

	return [this.informationService, this.service];
};
