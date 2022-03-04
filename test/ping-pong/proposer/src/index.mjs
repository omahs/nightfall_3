/**
Module that runs up as a proposer
*/
import config from 'config';
import logger from '../../../../common-files/utils/logger.mjs';
import Nf3 from '../../../../cli/lib/nf3.mjs';
import app from './app.mjs';

const { proposerEthereumSigningKey, optimistWsUrl, web3WsUrl, optimistBaseUrl } = config;
const { PROPOSER_PORT = '' } = process.env;

/**
Does the preliminary setup and starts listening on the websocket
*/
async function startProposer() {
  logger.info('Starting Proposer...');
  const nf3 = new Nf3(proposerEthereumSigningKey, {
    web3WsUrl,
    optimistApiUrl: optimistBaseUrl,
    optimistWsUrl,
  });
  await nf3.init(undefined, 'optimist');
  if (await nf3.healthcheck('optimist')) logger.info('Healthcheck passed');
  else throw new Error('Healthcheck failed');
  logger.info('Attempting to register proposer');
  // let's see if the proposer has been registered before
  const { proposers } = await nf3.getProposers(); // read proposer list from the blockchain
  // if not, let's register them
  if (proposers.length === 0) {
    await nf3.registerProposer();
    logger.info('Proposer registration complete');
  } else if (!proposers.map(p => p.thisAddress).includes(nf3.ethereumAddress)) {
    await nf3.registerProposer();
    logger.info('Proposer registration complete');
  } else {
    logger.warn('Proposer appears to be registered on the blockchain already');
    await nf3.registerProposerLocally();
  }
  if (PROPOSER_PORT !== '') {
    logger.debug('Proposer healthcheck up');
    app.listen(PROPOSER_PORT);
  }
  // TODO subscribe to layer 1 blocks and call change proposer
  nf3.startProposer();
  logger.info('Listening for incoming events');
}

startProposer();
