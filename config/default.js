function configureAWSBucket() {
  const bucket = process.env.S3_WALLET_BUCKET || 'nightfallv3';
  const mode = process.env.REACT_APP_MODE; // options are 'local', 'internal', 'preprod', 'production', 'staging', and 'testnet'
  if (mode === 'local') return bucket;
  return `${bucket}-${mode}`;
}

function getDefaultX509Params() {
  return {
    RSA_TRUST_ROOTS: [
      // test root
      {
        modulus:
          '0x00c6cdaeb44c7b8fe697a3b8a269799176078ae3cb065010f55a1f1a839ff203b1e785d6782eb9c04e0e1cf63ec7ef21c6d3201c818647b8cea476112463caa8339f03e678212f0214c4a50de21cabc8001ef269eef4930fcd1dd2911ba40d505fcee5508bd91a79aadc70cc33c77be14908b1c32f880a8bb8e2d863838cfa6bd444c47dd30f78650caf1dd947adcf48b427536d294240d40335eaee5db31399b04b3893936cc41c04602b713603526a1e003112bf213e6f5a99830fa821783340c46597e481e1ee4c0c6b3aca32628b70886a396d737537bcfae5ba51dfd6add1728aa6bde5aeb8c27289fb8e911569a41c3e3f48b9b2671c673faac7f085a195',
        exponent: 65537,
        authorityKeyIdentifier: '0xef355558d6fdee0d5d02a22d078e057b74644e5f',
      },
      // entrust/digicert mock root
      {
        modulus:
          '0x00ba84b672db9e0c6be299e93001a776ea32b895411ac9da614e5872cffef68279bf7361060aa527d8b35fd3454e1c72d64e32f2728a0ff78319d06a808000451eb0c7e79abf1257271ca3682f0a87bd6a6b0e5e65f31c77d5d4858d7021b4b332e78ba2d5863902b1b8d247cee4c949c43ba7defb547d57bef0e86ec279b23a0b55e250981632135c2f7856c1c294b3f25ae4279a9f24d7c6ecd09b2582e3ccc2c445c58c977a066b2a119fa90a6e483b6fdbd4111942f78f07bff5535f9c3ef4172ce669ac4e324c6277eab7e8e5bb34bc198bae9c51e7b77eb553b13322e56dcf703c1afae29b67b683f48da5af624c4de058ac64341203f8b68d946324a471',
        exponent: 65537,
        authorityKeyIdentifier: '0x6a72267ad01eef7de73b6951d46c8d9f901266ab',
      },
    ],
    // the certificatePoliciesOIDs and the extendedKeyUseageOIDS should contain the full tlv encoding (not just the value)
    certificatePoliciesOIDs: [
      // test
      [
        '0x06032a0304000000000000000000000000000000000000000000000000000000',
        '0x06032d0607000000000000000000000000000000000000000000000000000000',
      ],
      // mock
      [
        '0x06096086480186fd6c0315000000000000000000000000000000000000000000',
        '0x060a6086480186fd6c0315020000000000000000000000000000000000000000',
      ],
      // mock
      ['0x060a6086480186fa6c0a01060000000000000000000000000000000000000000'],
    ],
    extendedKeyUsageOIDs: [
      // test
      [
        '0x06082b0601050507030300000000000000000000000000000000000000000000',
        '0x06082b0601050507030400000000000000000000000000000000000000000000',
        '0x06082b0601050507030800000000000000000000000000000000000000000000',
      ],
      // mock
      ['0x06082b0601050507030300000000000000000000000000000000000000000000'],
      // mock
      [
        '0x06096086480186fa6b280b000000000000000000000000000000000000000000',
        '0x060a2b0601040182370a030c0000000000000000000000000000000000000000',
      ],
    ],
  };
}

function getLiveX509Params() {
  return {
    RSA_TRUST_ROOTS: [
      // Entrust G2 root
      {
        modulus:
          '0x00ba84b672db9e0c6be299e93001a776ea32b895411ac9da614e5872cffef68279bf7361060aa527d8b35fd3454e1c72d64e32f2728a0ff78319d06a808000451eb0c7e79abf1257271ca3682f0a87bd6a6b0e5e65f31c77d5d4858d7021b4b332e78ba2d5863902b1b8d247cee4c949c43ba7defb547d57bef0e86ec279b23a0b55e250981632135c2f7856c1c294b3f25ae4279a9f24d7c6ecd09b2582e3ccc2c445c58c977a066b2a119fa90a6e483b6fdbd4111942f78f07bff5535f9c3ef4172ce669ac4e324c6277eab7e8e5bb34bc198bae9c51e7b77eb553b13322e56dcf703c1afae29b67b683f48da5af624c4de058ac64341203f8b68d946324a471',
        exponent: 65537,
        authorityKeyIdentifier: '0x6a72267ad01eef7de73b6951d46c8d9f901266ab',
      },
      // Entrust 2048 root
      {
        modulus:
          '0x00ad4d4ba91286b2eaa320071516642a2b4bd1bf0b4a4d8eed8076a567b77840c07342c868c0db532bdd5eb8769835938b1a9d7c133a0e1f5bb71ecfe524141eb181a98d7db8cc6b4b03f1020cdcaba54024007f7494a19d0829b3880bf587779d55cde4c37ed76a64ab851486955b9732506f3dc8ba660ce3fcbdb849c176894919fdc0a8bd89a3672fc69fbc711960b82de92cc99076667b94e2af78d665535d3cd69cb2cf2903f92fa450b2d448ce0532558afdb2644c0ee4980775db7fdfb9085560853029f97b48a46986e3353f1e865d7a7a15bdef008e1522541700902693bc0e496891bff847d39d9542c10e4ddf6f26cfc3182162664370d6d5c007e1',
        exponent: 65537,
        authorityKeyIdentifier: '0x55e481d11180bed889b908a331f9a1240916b970',
      },
      // EY 4096 root
      {
        modulus:
          '0x00f2d3e67057da14c9245d2dbacb52dd8de93f5d1a7c2ebc523cd22681b3fa098f21c3a3662de98fc45f6962958e37bc603f9805e2a5de300fc604ff6633facd705ef1787eeac66a69c32fa932b56f2d26be758bcfe5451f80e799a6ed5ed704dadf2481e3998069f2c1dc207d8f9828cd24a85f31e7162ed56c0797e82dec8e8341b6cd3a7aac0b03ca1b9fd8a1e370fe8bc5c26e30d9f790521f829d8946dd4001ca295d83cc315b31083156ad9df834be615a633611d949e4aa7041be5ae81d42b3cf8306860886bf9e0f274012fd149a25c712f880637ff33a9aadcb637accce4f85241c46675aca8d07660c03576d294b7f09997139e26a9f9cb00ce652a403e3509b5ab24d7d950537d8cd652a716678d5c78c961ba6dbd892104b891e1dec68a472055d2e5d525ad6005e60fdd0065d3062e62d720320b9c05e7a16dde3bbb898d2c45d1266b37a91bcde0f4159df56fd3aff795f8e77f63b68252735e788923f50f11592e07e7a5e8b5c220d7249d1874fcdcfd1a7bd3ea52d0a5fb9545a6398dd21e966c05dc269e4dbe5e95b0935361cef525403727d02f13a7701c8f3b3e69806b09b19912bd58e8cb9eb0a0274ebe682f94cb2f3de97e3e3b79161ab05a1ab6bfc3807760102a27e8a38a2dddcfbc2aad789a4f60cf37bb473b213c6203a82982a7478964fccfa662bf1dbf44b3ef8bbf2f38c942e972815c1424b',
        exponent: 65537,
        authorityKeyIdentifier: '0x148e058f14da7f94e7b0e5dd232885c4dbc9f722',
      },
      {
        // DigiCert High Assurance EV Root CA
        modulus:
          '0x00c6cce573e6fbd4bbe52d2d32a6dfe5813fc9cd2549b6712ac3d5943467a20a1cb05f69a640b1c4b7b28fd098a4a941593ad3dc94d63cdb7438a44acc4d2582f74aa5531238eef3496d71917e63b6aba65fc3a484f84f6251bef8c5ecdb3892e306e508910cc4284155fbcb5a89157e71e835bf4d72093dbe3a38505b77311b8db3c724459aa7ac6d00145a04b7ba13eb510a984141224e656187814150a6795c89de194a57d52ee65d1c532c7e98cd1a0616a46873d03404135ca171d35a7c55db5e64e13787305604e511b4298012f1793988a202117c2766b788b778f2ca0aa838ab0a64c2bf665d9584c1a1251e875d1a500b2012cc41bb6e0b5138b84bcb',
        exponent: 65537,
        authorityKeyIdentifier: '0xb13ec36903f8bf4701d498261a0802ef63642bc3',
      },
    ],
    // the certificatePoliciesOIDs and the extendedKeyUseageOIDS should contain the full tlv encoding (not just the value)
    certificatePoliciesOIDs: [
      // Entrust EV code signer (OID Group 0)
      [
        '0x060a6086480186fa6c0a01020000000000000000000000000000000000000000',
        '0x060567810c010300000000000000000000000000000000000000000000000000',
      ],
      // Entrust EV Document Signer (OID Group 1)
      ['0x060a6086480186fa6c0a01060000000000000000000000000000000000000000'],
      // EY end user
      ['0x060a2b060104018f752a01020000000000000000000000000000000000000000'],
      // Digicert EV code signer
      ['0x060567810c010300000000000000000000000000000000000000000000000000'],
    ],
    extendedKeyUsageOIDs: [
      // Entrust EV code signer (OID Group 0)
      ['0x06082b0601050507030300000000000000000000000000000000000000000000'],
      // Entrust EV Document Signer (OID Group 1)
      [
        '0x06096086480186fa6b280b000000000000000000000000000000000000000000',
        '0x060a2b0601040182370a030c0000000000000000000000000000000000000000',
      ],
      // EY end user
      ['0x060a2b060104018f752a01010000000000000000000000000000000000000000'],
      // Digicert EV code signer (code siging OID)
      ['0x06082b0601050507030300000000000000000000000000000000000000000000'],
    ],
  };
}

module.exports = {
  COMMITMENTS_DB: process.env.COMMITMENTS_DB || 'nightfall_commitments',
  OPTIMIST_DB: process.env.OPTIMIST_DB || 'optimist_data',
  PROPOSER_COLLECTION: 'proposers',
  CHALLENGER_COLLECTION: 'challengers',
  TRANSACTIONS_COLLECTION: 'transactions',
  SUBMITTED_BLOCKS_COLLECTION: 'blocks',
  INVALID_BLOCKS_COLLECTION: 'invalid_blocks',
  COMMIT_COLLECTION: 'commits',
  COMMITMENTS_COLLECTION: 'commitments',
  TIMBER_COLLECTION: 'timber',
  CIRCUIT_COLLECTION: 'circuit_storage',
  CIRCUIT_HASH_COLLECTION: 'circuit_hash_storage',
  KEYS_COLLECTION: 'keys',
  CONTRACT_ARTIFACTS: '/app/build/contracts',
  EXCLUDE_DIRS: 'common',
  MAX_QUEUE: 10,
  TIMBER_HEIGHT: 32,
  TXHASH_TREE_HEIGHT: 5,
  CONFIRMATION_POLL_TIME: 1000,
  CONFIRMATIONS: process.env.CONFIRMATIONS || 12,
  DEFAULT_ACCOUNT_NUM: 10,
  HASH_TYPE: 'poseidon',
  TXHASH_TREE_HASH_TYPE: 'keccak256',
  STATE_GENESIS_BLOCK: process.env.STATE_GENESIS_BLOCK,
  CIRCUITS_HOME: process.env.CIRCUITS_HOME || '/app/circuits/',
  ALWAYS_DO_TRUSTED_SETUP: process.env.ALWAYS_DO_TRUSTED_SETUP || false,
  LOG_LEVEL: process.env.LOG_LEVEL || 'debug',
  LOG_HTTP_PAYLOAD_ENABLED: process.env.LOG_HTTP_PAYLOAD_ENABLED || 'true',
  LOG_HTTP_FULL_DATA: process.env.LOG_HTTP_FULL_DATA || 'false',
  BLOCKCHAIN_WS_HOST: process.env.BLOCKCHAIN_WS_HOST || 'blockchain',
  BLOCKCHAIN_PORT: process.env.BLOCKCHAIN_PORT || 8546,
  MONGO_URL: process.env.MONGO_URL || 'mongodb://localhost:27017/',
  PROTOCOL: process.env.PROTOCOL || 'http://', // connect to circom worker microservice like this
  WEBSOCKET_PORT: process.env.WEBSOCKET_PORT || 8080,
  WEBSOCKET_PING_TIME: 15000,
  CIRCOM_WORKER_HOST: process.env.CIRCOM_WORKER_HOST || 'worker',
  DEPLOY_MOCKED_SANCTIONS_CONTRACT: process.env.DEPLOY_MOCKED_SANCTIONS_CONTRACT,
  FEE_L2_TOKEN_ID: process.env.FEE_L2_TOKEN_ID || 'MATIC',
  RABBITMQ_HOST: process.env.RABBITMQ_HOST || 'amqp://rabbitmq',
  RABBITMQ_PORT: process.env.RABBITMQ_PORT || 5672,
  ENABLE_QUEUE: process.env.ENABLE_QUEUE || 1,
  OPTIMIST_HOST: process.env.OPTIMIST_HOST || 'optimist',
  OPTIMIST_PORT: process.env.OPTIMIST_PORT || 80,
  CLIENT_MONGO_URL: process.env.CLIENT_MONGO_URL || 'mongodb://mongodb:27017',
  ENVIRONMENT: process.env.ENVIRONMENT || 'localhost',
  OPTIMIST_MONGO_URL: process.env.OPTIMIST_MONGO_URL || 'mongodb://mongodb:27017',
  IS_CHALLENGER: process.env.IS_CHALLENGER || 'true',
  ETH_NETWORK: process.env.ETH_NETWORK || 'blockchain',
  WHITELISTING: process.env.WHITELISTING,
  UPGRADE_CONTRACTS: process.env.UPGRADE_CONTRACTS,
  SANCTIONS_CONTRACT_ADDRESS: '0x40C57923924B5c5c5455c48D93317139ADDaC8fb',
  MULTISIG: {
    SIGNATURE_THRESHOLD: process.env.MULTISIG_SIGNATURE_THRESHOLD || 2, // number of signatures needed to perform an admin task
    APPROVERS: process.env.MULTISIG_APPROVERS
      ? process.env.MULTISIG_APPROVERS.split(',')
      : [
          '0x9C8B2276D490141Ae1440Da660E470E7C0349C63',
          '0xfeEDA3882Dd44aeb394caEEf941386E7ed88e0E0',
          '0xfCb059A4dB5B961d3e48706fAC91a55Bad0035C9',
          '0x4789FD18D5d71982045d85d5218493fD69F55AC4',
          '0xb9e9997dF5b3ac021AB3B29C64F3c339A2546816',
        ],
  },
  BLOCKCHAIN_URL:
    process.env.BLOCKCHAIN_URL ||
    `ws://${process.env.BLOCKCHAIN_WS_HOST}:${process.env.BLOCKCHAIN_PORT}${
      process.env.BLOCKCHAIN_PATH || ''
    }`,
  ETH_PRIVATE_KEY: process.env.ETH_PRIVATE_KEY, // owner's/deployer's private key
  ETH_ADDRESS: process.env.ETH_ADDRESS,
  WEB3_OPTIONS: {
    gas: process.env.GAS || 8000000,
    gasPrice: process.env.GAS_PRICE || '20000000000',
    from: process.env.FROM_ADDRESS || process.env.ETH_ADDRESS,
  },
  WEB3_PROVIDER_OPTIONS: {
    clientConfig: {
      // Useful to keep a connection alive
      keepalive: true,
      // Keep keepalive interval small so that socket doesn't die
      keepaliveInterval: 1500,
    },
    timeout: 0,
    reconnect: {
      auto: true,
      delay: 5000, // ms
      maxAttempts: 120,
      onTimeout: false,
    },
  },
  PROVING_SCHEME: process.env.PROVING_SCHEME || 'groth16',
  BACKEND: process.env.BACKEND || 'bellman',
  CURVE: process.env.CURVE || 'bn128',

  MINIMUM_TRANSACTION_SLOTS: 16,
  MAX_BLOCK_SIZE: Number(process.env.MAX_BLOCK_SIZE) || 50000,
  RETRIES: Number(process.env.AUTOSTART_RETRIES) || 100,
  VK_IDS: {
    deposit: {
      numberNullifiers: 0,
      numberCommitments: 1,
      isEscrowRequired: true,
      isWithdrawing: false,
    },
    depositfee: {
      numberNullifiers: 2,
      numberCommitments: 2,
      isEscrowRequired: true,
      isWithdrawing: false,
    },
    transfer: {
      numberNullifiers: 4,
      numberCommitments: 3,
      isEscrowRequired: false,
      isWithdrawing: false,
    },
    withdraw: {
      numberNullifiers: 4,
      numberCommitments: 2,
      isEscrowRequired: false,
      isWithdrawing: true,
    },
    tokenise: {
      numberNullifiers: 2,
      numberCommitments: 2,
      isEscrowRequired: false,
      isWithdrawing: false,
    },
    burn: {
      numberNullifiers: 3,
      numberCommitments: 2,
      isEscrowRequired: false,
      isWithdrawing: false,
    },
    transform: {
      numberNullifiers: 4,
      numberCommitments: 6,
      isEscrowRequired: false,
      isWithdrawing: false,
    },
  }, // used as an enum to mirror the Shield contracts enum for vk types. The keys of this object must correspond to a 'folderpath' (the .zok file without the '.zok' bit)
  DEPLOYMENT_FILES_URL: {
    CIRCUIT_FILES_URL: process.env.CIRCUIT_FILES_URL,
    CONTRACT_FILES_URL: process.env.CONTRACT_FILES_URL,
  },
  PROPOSER_MAX_BLOCK_PERIOD_MILIS: Number(process.env.PROPOSER_MAX_BLOCK_PERIOD_MILIS) || 0,
  ENVIRONMENTS: {
    mainnet: {
      name: 'Mainnet',
      chainId: 1,
      clientApiUrl: '',
      optimistApiUrl: '',
      optimistWsUrl: '',
      web3WsUrl: '',
    },
    mumbai: {
      name: 'mumbai',
      chainId: 80001,
      clientApiUrl: process.env.CLIENT_HOST
        ? `http://${process.env.CLIENT_HOST}:${process.env.CLIENT_PORT}`
        : 'http://localhost:8080',
      optimistApiUrl: process.env.OPTIMIST_HOST
        ? `http://${process.env.OPTIMIST_HOST}:${process.env.OPTIMIST_PORT}`
        : 'http://localhost:8081',
      optimistWsUrl: process.env.OPTIMIST_HOST
        ? `ws://${process.env.OPTIMIST_HOST}:${process.env.OPTIMIST_WS_PORT}`
        : 'ws://localhost:8082',
      proposerBaseUrl: process.env.PROPOSER_HOST
        ? `http://${process.env.PROPOSER_HOST}:${process.env.PROPOSER_PORT}`
        : 'http://localhost:8092',
      adversarialOptimistApiUrl: 'http://localhost:8088',
      adversarialOptimistWsUrl: 'ws://localhost:8089',
      adversarialClientApiUrl: 'http://localhost:8093',
      adversarialClientWsUrl: 'ws://localhost:8094',
      web3WsUrl: process.env.BLOCKCHAIN_URL,
      PROPOSER_KEY: process.env.PROPOSER_KEY,
      CHALLENGER_KEY: process.env.CHALLENGER_KEY,
    },
    polygonPos: {
      name: 'polygonPos',
      chainId: 137,
      clientApiUrl: process.env.CLIENT_HOST
        ? `http://${process.env.CLIENT_HOST}:${process.env.CLIENT_PORT}`
        : 'http://localhost:8080',
      optimistApiUrl: process.env.OPTIMIST_HOST
        ? `http://${process.env.OPTIMIST_HOST}:${process.env.OPTIMIST_PORT}`
        : 'http://localhost:8081',
      optimistWsUrl: process.env.OPTIMIST_HOST
        ? `ws://${process.env.OPTIMIST_HOST}:${process.env.OPTIMIST_WS_PORT}`
        : 'ws://localhost:8082',
      proposerBaseUrl: process.env.PROPOSER_HOST
        ? `http://${process.env.PROPOSER_HOST}:${process.env.PROPOSER_PORT}`
        : 'http://localhost:8092',
      adversarialOptimistApiUrl: 'http://localhost:8088',
      adversarialOptimistWsUrl: 'ws://localhost:8089',
      adversarialClientApiUrl: 'http://localhost:8093',
      adversarialClientWsUrl: 'ws://localhost:8094',
      web3WsUrl: process.env.BLOCKCHAIN_URL,
      PROPOSER_KEY: process.env.PROPOSER_KEY,
      CHALLENGER_KEY: process.env.CHALLENGER_KEY,
    },
    localhost: {
      name: 'Localhost',
      chainId: 1337,
      clientApiUrl: process.env.CLIENT_HOST
        ? `http://${process.env.CLIENT_HOST}:${process.env.CLIENT_PORT}`
        : 'http://localhost:8080',
      optimistApiUrl: process.env.OPTIMIST_HOST
        ? `http://${process.env.OPTIMIST_HOST}:${process.env.OPTIMIST_PORT}`
        : 'http://localhost:8081',
      optimistWsUrl: process.env.OPTIMIST_HOST
        ? `ws://${process.env.OPTIMIST_HOST}:${process.env.OPTIMIST_WS_PORT}`
        : 'ws://localhost:8082',
      proposerBaseUrl: process.env.PROPOSER_HOST
        ? `http://${process.env.PROPOSER_HOST}:${process.env.PROPOSER_PORT}`
        : 'http://localhost:8092',
      adversarialOptimistApiUrl: 'http://localhost:8088',
      adversarialOptimistWsUrl: 'ws://localhost:8089',
      adversarialClientApiUrl: 'http://localhost:8093',
      adversarialClientWsUrl: 'ws://localhost:8094',
      web3WsUrl:
        // eslint-disable-next-line no-nested-ternary
        process.env.BLOCKCHAIN_WS_HOST && process.env.BLOCKCHAIN_PORT
          ? `ws://${process.env.BLOCKCHAIN_WS_HOST}:${process.env.BLOCKCHAIN_PORT}${
              process.env.BLOCKCHAIN_PATH || ''
            }`
          : process.env.BLOCKCHAIN_WS_HOST
          ? `wss://${process.env.BLOCKCHAIN_WS_HOST}`
          : 'ws://localhost:8546',
      PROPOSER_KEY:
        process.env.PROPOSER_KEY ||
        process.env.BOOT_PROPOSER_KEY ||
        '0x4775af73d6dc84a0ae76f8726bda4b9ecf187c377229cb39e1afa7a18236a69d', // owner's/deployer's private key
      CHALLENGER_KEY:
        process.env.CHALLENGER_KEY ||
        process.env.BOOT_CHALLENGER_KEY ||
        '0xd42905d0582c476c4b74757be6576ec323d715a0c7dcff231b6348b7ab0190eb',
    },
    aws: {
      name: 'AWS',
      chainId: 1337,
      clientApiUrl: `http://${process.env.CLIENT_HOST}:${process.env.CLIENT_PORT}`,
      optimistApiUrl: `https://${process.env.OPTIMIST_HTTP_HOST}`,
      optimistWsUrl: `wss://${process.env.OPTIMIST_HOST}`,
      proposerBaseUrl: `https://${process.env.PROPOSER_HOST}`,
      web3WsUrl: `wss://${process.env.BLOCKCHAIN_WS_HOST}${process.env.BLOCKCHAIN_PATH}`,
      adversarialOptimistApiUrl: `https://${process.env.ADVERSARY_OPTIMIST_HTTP_HOST}`,
      adversarialOptimistWsUrl: `wss://${process.env.ADVERSARY_OPTIMIST_HOST}`,
      adversarialClientApiUrl: `https://${process.env.ADVERSARY_CLIENT_HTTP_HOST}`,
      adversarialClientWsUrl: `wss://${process.env.ADVERSARY_CLIENT_HOST}`,
      PROPOSER_KEY: process.env.PROPOSER_KEY,
      CHALLENGER_KEY: process.env.CHALLENGER_KEY,
    },
    polygonEdge: {
      name: 'Polygon Edge',
      chainId: 100,
      clientApiUrl: process.env.CLIENT_HOST
        ? `http://${process.env.CLIENT_HOST}:${process.env.CLIENT_PORT}`
        : 'http://localhost:8080',
      optimistApiUrl: process.env.OPTIMIST_HOST
        ? `http://${process.env.OPTIMIST_HOST}:${process.env.OPTIMIST_PORT}`
        : 'http://localhost:8081',
      optimistWsUrl: process.env.OPTIMIST_HOST
        ? `ws://${process.env.OPTIMIST_HOST}:${process.env.OPTIMIST_WS_PORT}`
        : 'ws://localhost:8082',
      proposerBaseUrl: process.env.PROPOSER_HOST
        ? `http://${process.env.PROPOSER_HOST}:${process.env.PROPOSER_PORT}`
        : 'http://localhost:8092',
      adversarialOptimistApiUrl: 'http://localhost:8088',
      adversarialOptimistWsUrl: 'ws://localhost:8089',
      web3WsUrl: `ws://localhost:10002/ws`,
      PROPOSER_KEY: process.env.PROPOSER_KEY,
      CHALLENGER_KEY: process.env.CHALLENGER_KEY,
    },
  },
  TEST_OPTIONS: {
    tokenConfigs: {
      tokenId: '0x00',
      tokenType: 'ERC20', // it can be 'ERC721' or 'ERC1155'
      tokenTypeERC721: 'ERC721',
      tokenTypeERC1155: 'ERC1155',
    },
    transferValue: process.env.TRANSFER_VALUE || 10,
    privateKey: '0x4775af73d6dc84a0ae76f8726bda4b9ecf187c377229cb39e1afa7a18236a69e',
    gas: 10000000,
    gasCosts: 80000000000000000,
    fee: 1,
    ROTATE_PROPOSER_BLOCKS: 20,
    clientApiUrls: {
      client1: process.env.CLIENT1_API_URL || 'http://localhost:8083',
      client2: process.env.CLIENT2_API_URL || 'http://localhost:8086',
    },
    optimistApiUrls: {
      optimist1: process.env.OPTIMIST1_API_URL || 'http://localhost:9091',
      optimist2: process.env.OPTIMIST2_API_URL || 'http://localhost:9093',
    },
    optimistWsUrls: {
      optimist1: process.env.OPTIMIST1_WS_URL || 'ws://localhost:9090',
      optimist2: process.env.OPTIMIST2_WS_URL || 'ws://localhost:9092',
    },
    signingKeys: {
      walletTest:
        process.env.WALLET_TEST_KEY ||
        '0x955ff4fac3c1ae8a1b7b9ff197476de1f93e9f0bf5f1c21ff16456e3c84da587',
      user1:
        process.env.USER1_KEY ||
        '0x4775af73d6dc84a0ae76f8726bda4b9ecf187c377229cb39e1afa7a18236a69e',
      user2:
        process.env.USER2_KEY ||
        '0xd42905d0582c476c4b74757be6576ec323d715a0c7dcff231b6348b7ab0190eb',
      proposer1:
        process.env.BOOT_PROPOSER_KEY ||
        process.env.PROPOSER_KEY ||
        '0x4775af73d6dc84a0ae76f8726bda4b9ecf187c377229cb39e1afa7a18236a69d',
      proposer2:
        process.env.PROPOSER2_KEY ||
        '0xabf4ed9f30bd1e4a290310d726c7bbdf39cd75a25eebd9a3a4874e10b4a0c4ce',
      proposer3:
        process.env.PROPOSER3_KEY ||
        '0xcbbf1d0686738a444cf9f66fdc96289035c384c4e8d26768f94fa81f3ab6596a',
      challenger:
        process.env.BOOT_CHALLENGER_KEY ||
        process.env.CHALLENGER_KEY ||
        '0x1da216993fb96745dcba8bc6f2ef5deb75ce602fd92f91ab702d8250033f4e1c',
      liquidityProvider:
        process.env.LIQUIDITY_PROVIDER_KEY ||
        '0xfbc1ee1c7332e2e5a76a99956f50b3ba2639aff73d56477e877ef8390c41e0c6',
      sanctionedUser:
        process.env.SANCTIONED_USER ||
        '0xfbc1ee1c7332e2e5a76a99956f50b3ba2639aff73d56477e877ef8390c41e0c6',
    },
    addresses: {
      walletTest: process.env.WALLET_TEST_ADDRESS || '0xb9e9997dF5b3ac021AB3B29C64F3c339A2546816',
      user1: process.env.USER1_ADDRESS || '0x9C8B2276D490141Ae1440Da660E470E7C0349C63',
      user2: process.env.USER2_ADDRESS || '0xfCb059A4dB5B961d3e48706fAC91a55Bad0035C9',
      proposer1: process.env.BOOT_PROPOSER_ADDRESS || '0xfeEDA3882Dd44aeb394caEEf941386E7ed88e0E0',
      proposer2: process.env.PROPOSER2_ADDRESS || '0xa12D5C4921518980c57Ce3fFe275593e4BAB9211',
      proposer3: process.env.PROPOSER3_ADDRESS || '0xdb080dC48961bC1D67a0A4151572eCb824cC76E8',
      challenger:
        process.env.BOOT_CHALLENGER_ADDRESS || '0xFFF578cDdc48792522F4a7Fdc3973Ec0d41A831f',
      liquidityProvider:
        process.env.LIQUIDITY_PROVIDER_ADDRESS || '0x4789FD18D5d71982045d85d5218493fD69F55AC4',
      sanctionedUser: process.env.SANCTIONED_USER || '0x4789FD18D5d71982045d85d5218493fD69F55AC4',
    },
    zkpPublicKeys: {
      user1:
        process.env.USER1_COMPRESSED_ZKP_PUBLIC_KEY ||
        '0x236af0fee749dd191e317fc8199f20c5b3df728bd3247db0623c3085e7ff501a',
      user2:
        process.env.USER2_COMPRESSED_ZKP_PUBLIC_KEY ||
        '0x8b1cd14f2defec7928cc958e2dfbc86fbd3218e25a10807388a5db4b8fa4837e',
    },
    mnemonics: {
      user1:
        process.env.USER1_MNEMONIC ||
        'trip differ bamboo bundle bonus luxury strike mad merry muffin nose auction',
      user2:
        process.env.USER2_MNEMONIC ||
        'control series album tribe category saddle prosper enforce moon eternal talk fame',
      proposer:
        process.env.BOOT_PROPOSER_MNEMONIC ||
        'high return hold whale promote payment hat panel reduce oyster ramp mouse',
      challenger:
        process.env.BOOT_CHALLENGER_MNEMONIC ||
        'crush power outer gadget enter maze advance rather divert monster indoor axis',
      liquidityProvider:
        process.env.LIQUIDITY_PROVIDER_MNEMONIC ||
        'smart base soup sister army address member poem point quick save penalty',
      sanctionedUser:
        process.env.SANCTIONED_USER_MNEMONIC ||
        'smart base soup sister army address member poem point quick save penalty',
    },
    restrictions: {
      erc20default: process.env.ERC20_RESTRICTION || 100000000000,
    },
  },
  RESTRICTIONS: {
    restrict: !(process.env.RESTRICT_TOKENS === 'disable'),
    signingKeys: {
      bootProposerKey:
        process.env.BOOT_PROPOSER_KEY ||
        '0x4775af73d6dc84a0ae76f8726bda4b9ecf187c377229cb39e1afa7a18236a69d',
      bootChallengerKey:
        process.env.BOOT_CHALLENGER_KEY ||
        '0xd42905d0582c476c4b74757be6576ec323d715a0c7dcff231b6348b7ab0190eb',
    },
    addresses: {
      bootProposer:
        process.env.BOOT_PROPOSER_ADDRESS || '0xfeEDA3882Dd44aeb394caEEf941386E7ed88e0E0',
      bootChallenger:
        process.env.BOOT_CHALLENGER_ADDRESS || '0xfCb059A4dB5B961d3e48706fAC91a55Bad0035C9',
    },
    tokens: {
      blockchain: [
        {
          name: 'ERC20Mock',
          address: '0x9b7bD670D87C3Dd5C808ba627c75ba7E88aD066f',
          amount: process.env.ERC20MOCK_RESTRICT || '100000000000',
        },
        {
          name: 'Test-Eth',
          address: '0x3f152B63Ec5CA5831061B2DccFb29a874C317502',
          amount: process.env.WETH_RESTRICT || '10000000000000000000000',
        },
        {
          name: 'MATIC',
          address: '0x499d11E0b6eAC7c0593d8Fb292DCBbF815Fb29Ae',
          amount: process.env.MATIC_RESTRICT || '10000000000000000000000',
        },
        {
          name: 'USDC',
          address: '0x07865c6e87b9f70255377e024ace6630c1eaa37f',
          amount: process.env.USDC_RESTRICT || '1000000000000',
        },
      ],
      staging_edge: [
        {
          name: 'ERC20Mock',
          address: '0x7578E001dCF334F48a87dA44e30C7ab3b517a5B8',
          amount: process.env.ERC20MOCK_RESTRICT || '100000000000',
        },
        {
          name: 'Test-Eth',
          address: '0x3f152B63Ec5CA5831061B2DccFb29a874C317502',
          amount: process.env.WETH_RESTRICT || '10000000000000000000000',
        },
        {
          name: 'MATIC',
          address: '0x499d11E0b6eAC7c0593d8Fb292DCBbF815Fb29Ae',
          amount: process.env.MATIC_RESTRICT || '10000000000000000000000',
        },
        {
          name: 'USDC',
          address: '0x07865c6e87b9f70255377e024ace6630c1eaa37f',
          amount: process.env.USDC_RESTRICT || '1000000000000',
        },
      ],
      staging: [
        {
          name: 'ERC20Mock',
          address: '0xB5Acbe9a0F1F8B98F3fC04471F7fE5d2c222cB44',
          amount: process.env.ERC20MOCK_RESTRICT || '100000000000',
        },
        {
          name: 'Test-Eth',
          address: '0x3f152B63Ec5CA5831061B2DccFb29a874C317502',
          amount: process.env.WETH_RESTRICT || '10000000000000000000000',
        },
        {
          name: 'MATIC',
          address: '0x499d11E0b6eAC7c0593d8Fb292DCBbF815Fb29Ae',
          amount: process.env.MATIC_RESTRICT || '10000000000000000000000',
        },
        {
          name: 'USDC',
          address: '0x07865c6e87b9f70255377e024ace6630c1eaa37f',
          amount: process.env.USDC_RESTRICT || '1000000000000',
        },
      ],
      development: [
        {
          name: 'ERC20Mock',
          address: '0x470556dE5865D293dCcc0b47644fac7721168065',
          amount: process.env.ERC20MOCK_RESTRICT || '100000000000',
        },
        {
          name: 'Test-Eth',
          address: '0x3f152B63Ec5CA5831061B2DccFb29a874C317502',
          amount: process.env.WETH_RESTRICT || '10000000000000000000000',
        },
        {
          name: 'MATIC',
          address: '0x499d11E0b6eAC7c0593d8Fb292DCBbF815Fb29Ae',
          amount: process.env.MATIC_RESTRICT || '10000000000000000000000',
        },
        {
          name: 'USDC',
          address: '0x07865c6e87b9f70255377e024ace6630c1eaa37f',
          amount: process.env.USDC_RESTRICT || '1000000000000',
        },
      ],
      mainnet: [
        {
          name: 'WETH',
          address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
          amount: process.env.WETH_RESTRICT || '1000000000000000000',
        },
        {
          name: 'MATIC',
          address: '0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0',
          amount: process.env.MATIC_RESTRICT || '1000000000000000000000',
        },
        {
          name: 'USDC',
          address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
          amount: process.env.USDC_RESTRICT || '1000000000',
        },
        {
          name: 'USDT',
          address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
          amount: process.env.USDT_RESTRICT || '1000000000',
        },
        {
          name: 'DAI',
          address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
          amount: process.env.DAI_RESTRICT || '1000000000000000000000',
        },
      ],
      mumbai: [
        {
          name: 'USDC',
          address: '0xE097d6B3100777DC31B34dC2c58fB524C2e76921',
          amount: process.env.USDC_RESTRICT || '1000000000',
        },
        {
          name: 'WMATIC',
          address: '0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889',
          amount: process.env.MATIC_RESTRICT || '1000000000000000000000',
        },
      ],
      polygonPos: [
        {
          name: 'USDC',
          address: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
          amount: process.env.USDC_RESTRICT || -1,
        },
        {
          name: 'WMATIC',
          address: '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270',
          amount: process.env.MATIC_RESTRICT || -1,
        },
      ],
      localhost: [
        {
          name: 'WETH',
          address: '0x3f152B63Ec5CA5831061B2DccFb29a874C317502',
          amount: process.env.WETH_RESTRICT || '1000000000000000000',
        },
        {
          name: 'MATIC',
          address: '0x499d11E0b6eAC7c0593d8Fb292DCBbF815Fb29Ae',
          amount: process.env.MATIC_RESTRICT || '1000000000000000000000',
        },
        {
          name: 'USDC',
          address: '0x07865c6E87B9F70255377e024ace6630C1Eaa37F',
          amount: process.env.USDC_RESTRICT || '1000000000',
        },
        {
          name: 'stMATIC',
          address: '0x9A7c69A167160C507602ecB3Df4911e8E98e1279',
          amount: process.env.MATIC_RESTRICT || '1000000000',
        },
      ],
      ropsten: [
        {
          name: 'WETH',
          address: '0xc778417E063141139Fce010982780140Aa0cD5Ab',
          amount: process.env.WETH_RESTRICT || '1000000000000000000',
        },
        {
          name: 'MATIC',
          address: '0x499d11E0b6eAC7c0593d8Fb292DCBbF815Fb29Ae',
          amount: process.env.MATIC_RESTRICT || '1000000000000000000000',
        },
        {
          name: 'USDC',
          address: '0x07865c6E87B9F70255377e024ace6630C1Eaa37F',
          amount: process.env.USDC_RESTRICT || '1000000000',
        },
      ],
    },
  },
  X509: {
    blockchain: getDefaultX509Params(),
    staging: getDefaultX509Params(),
    staging_edge: getDefaultX509Params(),
    mumbai: getDefaultX509Params(),
    mainnet: getDefaultX509Params(),
    localhost: getDefaultX509Params(),
    polygonPos: getLiveX509Params(),
  },

  // for Browser use
  proposerUrl:
    process.env.LOCAL_PROPOSER === 'true'
      ? process.env.LOCAL_API_URL
      : process.env.PROPOSER_API_URL,

  eventWsUrl:
    process.env.LOCAL_PROPOSER === 'true' ? process.env.LOCAL_WS_URL : process.env.PROPOSER_WS_URL,

  AWS: {
    s3Bucket: configureAWSBucket(),
  },

  utilApiServerUrl: process.env.LOCAL_UTIL_API_URL,

  explorerUrl: `https://explorer.${process.env.DOMAIN_NAME}`,

  // assumption is if LOCAL_PROPOSER is true, wallet UI app
  // is running in local machine
  isLocalRun: process.env.LOCAL_PROPOSER === 'true',
  SIGNATURES: {
    BLOCK: '(uint256,bytes32,bytes32,bytes32, bytes32)',
    TRANSACTION:
      '(uint256,uint256[],bytes32,bytes32,bytes32,bytes32[],bytes32[],bytes32[2],uint256[4])',
    PROPOSE_BLOCK: [
      '(uint256,bytes32,bytes32,bytes32,bytes32)',
      '(uint256,uint256[],bytes32,bytes32,bytes32,bytes32[],bytes32[],bytes32[2],uint256[4])[]',
    ],
    SUBMIT_TRANSACTION:
      '(uint256,uint256[],bytes32,bytes32,bytes32,bytes32[],bytes32[],bytes32[2],uint256[4])',
  },
  TIMER_CHANGE_PROPOSER_SECOND: Number(process.env.TIMER_CHANGE_PROPOSER_SECOND) || 30,
  MAX_ROTATE_TIMES: Number(process.env.MAX_ROTATE_TIMES) || 2,
};
