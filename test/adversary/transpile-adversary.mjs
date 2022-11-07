import fs from 'fs';
import path from 'path';

const { mkdir, readdir, copyFile } = fs.promises;

// This copies the nightfall-optimist directory
async function copyDir(src, dest) {
  await mkdir(dest, { recursive: true });
  const entries = await readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.name !== 'node_modules') {
      // eslint-disable-next-line no-await-in-loop
      if (entry.isDirectory()) await copyDir(srcPath, destPath);
      // eslint-disable-next-line no-await-in-loop
      else await copyFile(srcPath, destPath);
    }
  }
}

// Transpile Block Code that makes a block
const transpileBlockAssembler = (_pathToSrc, _pathToInject) => {
  let srcFile = fs.readFileSync(_pathToSrc, 'utf-8');
  const injectFile = fs.readFileSync(_pathToInject, 'utf-8');

  // const regexInjectFileNoPreamble = /(.*function makeBlock.*)(\n|.)*/g;
  const regexInjectFileNoPreamble = /(.*let count = 0;.*)(\n|.)*/g;
  const [postAmble] = injectFile.match(regexInjectFileNoPreamble);

  const regexReplaceCall = /(.*function makeBlock.*)(\n|.)*(?=\n\/\*\*)/g;

  srcFile = `/* THIS FILE CONTAINS CODE THAT HAS BEEN AUTOGENERATED DO NOT MODIFY MANUALLY */\n${srcFile.replace(
    regexReplaceCall,
    postAmble,
  )}`;
  srcFile = srcFile.replace(/(let ws;)/g, `export let ws;`);
  fs.writeFileSync(_pathToSrc, srcFile);
};

// Transpile Block Proposed Code that manage block proposed events
const transpileBlockProposed = _pathToSrc => {
  let srcFile = fs.readFileSync(_pathToSrc, 'utf-8');

  // We need to take into account variable NONSTOP_QUEUE_AFTER_INVALID_BLOCK
  const regexReplaceComponents = /(await enqueueEvent\(commitToChallenge, 2, txDataToSign\);)/g;
  const reComponent = `logger.info(\`NONSTOP_QUEUE_AFTER_INVALID_BLOCK: \${process.env.NONSTOP_QUEUE_AFTER_INVALID_BLOCK}\`);
      if (process.env.NONSTOP_QUEUE_AFTER_INVALID_BLOCK === "false")
         await enqueueEvent(commitToChallenge, 2, txDataToSign);`;
  srcFile = `/* THIS FILE CONTAINS CODE THAT HAS BEEN AUTOGENERATED DO NOT MODIFY MANUALLY */\n${srcFile.replace(
    regexReplaceComponents,
    reComponent,
  )}`;
  fs.writeFileSync(_pathToSrc, srcFile);
};

// Transpile Block Code that does block assembly
const transpileBlockBuilder = (_pathToSrc, _pathToInject) => {
  let srcFile = fs.readFileSync(_pathToSrc, 'utf-8');
  const injectFile = fs.readFileSync(_pathToInject, 'utf-8');

  // Do some reordering of import to satisfy linter
  const srcImportPreamble = /(\n|.)*\*\/\n(?=import)/g;
  const srcimportPostamble = /import(\n|.)*/g;
  const [srcPre] = srcFile.match(srcImportPreamble);
  const [srcPost] = srcFile.match(srcimportPostamble);

  const targetImportPreamble = /import(\n|.)*(?=\nlet error)/g;
  const targetImportPostamble = /let error(\n|.)*/g;
  const [tgtPre] = injectFile.match(targetImportPreamble);
  const [tgtPost] = injectFile.match(targetImportPostamble);

  srcFile = `/* THIS FILE CONTAINS CODE THAT HAS BEEN AUTOGENERATED DO NOT MODIFY MANUALLY */\n${srcPre}${tgtPre}${srcPost}`;

  // Inject the bad Block code above the Block class so it is declared for use
  // Stops linter complaints.
  const preBlockClass = /(\n|.)*(?=\nclass Block)/g;
  const postBlockClass = /class Block(.|\n)*/g;
  const [above] = srcFile.match(preBlockClass);
  const [below] = srcFile.match(postBlockClass);

  srcFile = `${above}\n${tgtPost}\n${below}`;

  // We need to re object destructure components in build
  const regexReplaceComponents = /(const { proposer, transactions })/g;
  const reComponent = `const { proposer, transactions, errorIndex }`;
  srcFile = srcFile.replace(regexReplaceComponents, reComponent);

  // We need to re-route the references to use our bad block values
  // This is preferred as we can then reuse the calcHash function.
  const regexReplaceCalls = /this\.localLeafCount = updatedTimber.*(\n.*){3}/g;
  const reRoute = `const badBlock = createBadBlock({
      proposer,
      root: updatedTimber.root,
      leafCount: updatedTimber.leafCount,
      nCommitments,
      blockNumberL2,
      previousBlockHash,
      frontier: updatedTimber.frontier,
    }, errorIndex);
    this.localLeafCount = updatedTimber.leafCount;
    this.localFrontier = badBlock.frontier;
    this.localBlockNumberL2 += 1;
    this.localRoot = badBlock.root;`;
  srcFile = srcFile.replace(regexReplaceCalls, reRoute);

  // Modify the return from Block.build to utilise this bad block.
  const regexReplaceReturn = /return new Block(\n|.)*previousBlockHash,\n.*(}\);)/g;
  const reReturn = `return new Block({
      proposer,
      transactionHashes: transactions.map(t => t.transactionHash),
      transactionHashesRoot: this.calcTransactionHashesRoot(transactions),
      leafCount: badBlock.leafCount,
      root: badBlock.root,
      blockHash,
      nCommitments: badBlock.nCommitments,
      blockNumberL2,
      previousBlockHash,
    });`;
  srcFile = srcFile.replace(regexReplaceReturn, reReturn);

  fs.writeFileSync(_pathToSrc, srcFile);
};

// Transpile bad transaction creator code.
const transpileTransactionLookup = (_pathToSrc, _pathToInject) => {
  let srcFile = fs.readFileSync(_pathToSrc, 'utf-8');
  const injectFile = fs.readFileSync(_pathToInject, 'utf-8');

  const regexInjectFileNoPreamble = /let error(\n|.)*/g;
  const [postAmble] = injectFile.match(regexInjectFileNoPreamble);

  const regexReplaceCall =
    /(.*getSortedByFeeMempoolTransactions.*)(\n|.)*(?=\n\/\*\*\nfunction to look a transaction by transactionHash, if you know the hash of the transaction)/g;

  srcFile = `/* THIS FILE CONTAINS CODE THAT HAS BEEN AUTOGENERATED DO NOT MODIFY MANUALLY */\n${srcFile.replace(
    regexReplaceCall,
    postAmble,
  )}`;
  fs.writeFileSync(_pathToSrc, srcFile);
};

// Transpile Block API code
const transpileBlockApi = (_pathToSrc, _pathToInject) => {
  let srcFile = fs.readFileSync(_pathToSrc, 'utf-8');
  const injectFile = fs.readFileSync(_pathToInject, 'utf-8');

  const srcImportPreamble = /(\n|.)*\*\/\n(?=import)/g;
  const [srcPre] = srcFile.match(srcImportPreamble);

  srcFile = `/* THIS FILE CONTAINS CODE THAT HAS BEEN AUTOGENERATED DO NOT MODIFY MANUALLY */\n${srcPre} import { addBlock } from '../classes/block.mjs';\nimport { addTx }  from '../services/database.mjs';\n ${srcFile}`;

  const regexInjectFileNoPreamble = /(.*reset-localblock.*)(\n|.)*/g;
  const [postAmble] = injectFile.match(regexInjectFileNoPreamble);

  const regexReplaceCall = /(.*reset-localblock.*)(\n|.)*/g;

  srcFile = `\n${srcFile.replace(regexReplaceCall, postAmble)}`;
  fs.writeFileSync(_pathToSrc, srcFile);
};

// transpile to comment out checkTransaction function call
const transpileTransactionSubmitEventHandler = _pathToSrc => {
  let srcFile = fs.readFileSync(_pathToSrc, 'utf-8');

  srcFile = `/* THIS FILE CONTAINS CODE THAT HAS BEEN AUTOGENERATED DO NOT MODIFY MANUALLY */\n${srcFile.replace(
    /(await checkTransaction)/g,
    `// await checkTransaction`,
  )}`;
  fs.writeFileSync(_pathToSrc, srcFile);
};

const transpileLibNf3Sdk = (_pathToSrc, _pathToInject) => {
  let srcFile = fs.readFileSync(_pathToSrc, 'utf-8');
  const injectFile = fs.readFileSync(_pathToInject, 'utf-8');

  const regexInjectFileNoPreamble = /(.*if \(type === 'submit-transaction'\) {.*)(\n|.)*/g;
  const [postAmble] = injectFile.match(regexInjectFileNoPreamble);

  const regexReplaceCall = /(if \(type === 'rollback'\))/g;

  srcFile = `/* THIS FILE CONTAINS CODE THAT HAS BEEN AUTOGENERATED DO NOT MODIFY MANUALLY */\n${srcFile.replace(
    regexReplaceCall,
    `${postAmble
      .replace(/\n([^/\n]*)$/, '$1')
      .replace(/\n/g, '\n\t\t\t')} else if (type === 'rollback')`,
  )}`;

  fs.writeFileSync(_pathToSrc, srcFile);
};

copyDir('./nightfall-optimist/', './test/adversary/nightfall-adversary/').then(() => {
  console.log('done with optimist copy');
  transpileBlockAssembler(
    './test/adversary/nightfall-adversary/src/services/block-assembler.mjs',
    './test/adversary/adversary-code/block-assembler.mjs',
  );
  transpileBlockBuilder(
    './test/adversary/nightfall-adversary/src/classes/block.mjs',
    './test/adversary/adversary-code/block.mjs',
  );
  transpileBlockProposed(
    './test/adversary/nightfall-adversary/src/event-handlers/block-proposed.mjs',
  );
  transpileTransactionLookup(
    './test/adversary/nightfall-adversary/src/services/database.mjs',
    './test/adversary/adversary-code/database.mjs',
  );
  transpileBlockApi(
    './test/adversary/nightfall-adversary/src/routes/block.mjs',
    './test/adversary/adversary-code/route-block.mjs',
  );
  transpileTransactionSubmitEventHandler(
    './test/adversary/nightfall-adversary/src/event-handlers/transaction-submitted.mjs',
  );

  console.log(`transpile adversary optimist done`);
});

copyDir('./cli/', './test/adversary/adversary-cli/').then(() => {
  console.log('done with cli copy');
  transpileLibNf3Sdk(
    './test/adversary/adversary-cli/lib/nf3.mjs',
    './test/adversary/adversary-code/nf3.mjs',
  );
  console.log(`transpile adversary cli done`);
});
