'use strict'

const express = require('express')
const router = express.Router()
const ElectricityReadingService = require('../service/electricity-reading-service')
const InvalidJsonException = require('../service/invalid-json-exception')
const PricePlanService = require('../service/price-plan-service')
const AccountService = require('../service/account-service')


router.post('/store', function(req, res) {
    let electricityReadingService = new ElectricityReadingService()
    try {
        electricityReadingService.storeReading(req.body)
        res.status(200).send(req.body)
    } catch (e) {
        res.status(500).send(e)        
    }
})

router.get('/read/:smartMeterId', function(req, res) {
    let electricityReadingService = new ElectricityReadingService()
    let smartMeterId = req.params.smartMeterId
    let readings = electricityReadingService.retrieveReadingsFor(smartMeterId)
    if (readings.length < 1) {
        res.status(404).send('')
    } else {
        res.status(200).send(electricityReadingService.retrieveReadingsFor(smartMeterId))
    }    
})

router.get('/read/:smartMeterId/usage', function(req, res) {
   const smartMeterId = req.params.smartMeterId
    const pricePlanService = new PricePlanService()
    const accountService = new AccountService();
    const pricePlan = accountService.getPricePlan(smartMeterId);
    
    if (!pricePlan) {
        res.status(404).send(`No tariff found for the smart meter ${smartMeterId}`)
    } else {
        let response = pricePlanService.getUsageData(smartMeterId, pricePlan)
        res.status(200).send(response)
    }
})

module.exports = router