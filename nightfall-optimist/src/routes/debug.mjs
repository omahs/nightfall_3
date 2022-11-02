import express from 'express';
import axios from 'axios';
import config from 'config';
import {
  submitTransactionEnable,
  submitTransaction,
} from '../event-handlers/transaction-submitted.mjs';
import { getDebugCounters } from '../services/debug-counters.mjs';
import { findAndDeleteAllBufferedTransactions } from '../services/database.mjs';

const { txWorkerUrl, txWorkerCount } = config.TX_WORKER_PARAMS;

const router = express.Router();

router.get('/counters', async (req, res, next) => {
  try {
    const counters = getDebugCounters();
    res.json({ counters });
  } catch (err) {
    next(err);
  }
});

router.post('/tx-submitted-enable', async (req, res) => {
  const { enable } = req.body;

  // If we enable  submitTransactions, we process al events in the buffer
  if (enable) {
    submitTransactionEnable(true);
    const transactions = await findAndDeleteAllBufferedTransactions();

    if (txWorkerCount) {
      transactions.forEach(async tx =>
        axios
          .get(`${txWorkerUrl}/tx-submitted`, {
            params: {
              tx,
              proposerFlag: false,
              enable: true,
            },
          })
          .catch(function (error) {
            if (error.request) {
              submitTransaction(tx, false, true);
            }
          }),
      );
    } else {
      transactions.forEach(async tx => submitTransaction(tx, false, true));
    }
  } else {
    submitTransactionEnable(false);
  }
  res.sendStatus(200);
});

export default router;
