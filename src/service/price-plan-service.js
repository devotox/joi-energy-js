'use strict'

const ElectricityReadingService = require('./electricity-reading-service')
const ElectricityReading = require('../domain/electricity-reading')
const pricePlanRepository = require('../repository/price-plan-repository')
const TimeConverter = require('../service/time-converter')

class PricePlanService {

    constructor() {
        this.electricityReadingService = new ElectricityReadingService()
    }

    getListOfSpendAgainstEachPricePlanFor(smartMeterId) {
        let readings = this.electricityReadingService.retrieveReadingsFor(smartMeterId)
        if (readings.length < 1) return []
        let average = this.calculateAverageReading(readings)
        let timeElapsed = this.calculateTimeElapsed(readings)

        // usage in kWh = average reading * usage time
        let consumedEnergy = average * timeElapsed // should be multiplied
        // console.log('Consumed Energy', consumedEnergy, ' | ', average * timeElapsed, ' | ', average)
        // console.log(readings)

        // cost = tariff unit price * usage
        let pricePlans = pricePlanRepository.get()
        return this.cheapestPlansFirst(pricePlans).map(pricePlan => {
            let cost = {}
            cost[pricePlan.name] = consumedEnergy * pricePlan.unitRate 
            return cost;
        })
    }

    getUsageData(smartMeterId, pricePlan) {
        let readings = this.electricityReadingService.retrieveReadingsFor(smartMeterId)
        if (!readings.length) return { cost: 0 }

        let average = this.calculateAverageReading(readings)
        let timeElapsed = this.calculateTimeElapsed(readings)

        // usage in kWh = average reading * usage time
        let consumedEnergy = average * timeElapsed // should be multiplied
        console.log('Consumed Energy', consumedEnergy, ' | ', average * timeElapsed, ' | ', average)

        let plan = pricePlanRepository.get().find(p => p.name === pricePlan)
        let cost = plan.unitRate * consumedEnergy

        return {
            consumedEnergy,
            pricePlan,
            cost: cost.toFixed(2)
        }
    }

    cheapestPlansFirst(pricePlans) {
        return pricePlans.sort((planA, planB) => planA.unitRate - planB.unitRate)
    }

    // average reading in kW = (eR[1].reading + eR[2].reading) / 2 
    calculateAverageReading(readings) {
        let sum = readings.map(r=>r.reading).reduce((p,c) => p+c, 0)
        return sum / readings.length          
    }

    // usage time in hours = eR[2].time - eR[1].time
    calculateTimeElapsed(readings) {
        let min = Math.min.apply(null, readings.map(r=>r.time))
        let max = Math.max.apply(null, readings.map(r=>r.time))
        return TimeConverter.timeElapsedInHours(min, max);
    }
}

module.exports = PricePlanService