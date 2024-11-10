/**
 * Author: Professor Krasso
 * Date: 8/14/24
 * File: index.js
 * Description: Apre sales report API for the sales reports
 */

'use strict';

const express = require('express');
const { mongo } = require('../../../utils/mongo');

const router = express.Router();

/**
 * @description
 *
 * GET /regions
 *
 * Fetches a list of distinct sales regions.
 *
 * Example:
 * fetch('/regions')
 *  .then(response => response.json())
 *  .then(data => console.log(data));
 */
router.get('/regions', (req, res, next) => {
  try {
    mongo (async db => {
      const regions = await db.collection('sales').distinct('region');
      res.send(regions);
    }, next);
  } catch (err) {
    console.error('Error getting regions: ', err);
    next(err);
  }
});

/**
 * @description
 *
 * GET /regions/:region
 *
 * Fetches sales data for a specific region, grouped by salesperson.
 *
 * Example:
 * fetch('/regions/north')
 *  .then(response => response.json())
 *  .then(data => console.log(data));
 */
router.get('/regions/:region', (req, res, next) => {
  try {
    mongo (async db => {
      const salesReportByRegion = await db.collection('sales').aggregate([
        { $match: { region: req.params.region } },
        {
          $group: {
            _id: '$salesperson',
            totalSales: { $sum: '$amount'}
          }
        },
        {
          $project: {
            _id: 0,
            salesperson: '$_id',
            totalSales: 1
          }
        },
        {
          $sort: { salesperson: 1 }
        }
      ]).toArray();
      res.send(salesReportByRegion);
    }, next);
  } catch (err) {
    console.error('Error getting sales data for region: ', err);
    next(err);
  }
});

/**
 * GET /api/reports/sales/customer/:customer
 * Define the route to get sales data by customer
 */
router.get('/customer/:customer', async (req, res, next) => {
  const { customer } = req.params;
  try {
    const salesData = await fetchSalesDataByCustomer(customer);
    if (!salesData || salesData.length === 0) {
      return res.status(200).json([]);
    }
    res.status(200).json(salesData);
  } catch (error) {
    console.error('Error fetching sales data:', error);
    res.status(500).json({
      message: 'Error fetching sales data', // Expected error message
      error: error // Include the error object or details
    });
  }
});


// Function to fetch sales data for specific customer
async function fetchSalesDataByCustomer(customer) {
  return mongo(async (db) => {
    return db.collection('sales').find({ customer }).toArray();
  });
}

module.exports = router;