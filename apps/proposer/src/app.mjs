/* ignore unused exports */
/* eslint-disable import/no-unresolved */

import express from 'express';
import bodyParser from 'body-parser';
import config from 'config';
import cors from 'cors';
import fileUpload from 'express-fileupload';
import { proposer, contracts } from './routes/index.mjs';
import startProposer from './proposer.mjs';
import Nf3 from '../cli/lib/nf3.mjs';

const PROPOSER_PORT = process.env.PROPOSER_PORT || 8092;

const environment = config.ENVIRONMENTS[process.env.ENVIRONMENT] || config.ENVIRONMENTS.localhost;

console.log(environment);

const app = express();
const nf3 = new Nf3(process.env.PROPOSER_KEY, environment);

app.set('nf3', nf3);

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

app.use(cors());
app.use(bodyParser.json({ limit: '2mb' }));
app.use(bodyParser.urlencoded({ limit: '2mb', extended: true }));
app.use(
  fileUpload({
    createParentPath: true,
  }),
);

app.get('/healthcheck', (req, res) => res.sendStatus(200));
app.use('/proposer', proposer);
app.use('/contract-address', contracts);
if (!PROPOSER_PORT) throw new Error('Please specify a proposer port');

app.listen(PROPOSER_PORT);

startProposer(nf3, environment.proposerBaseUrl);

/* ignore unused exports */
export default app;
