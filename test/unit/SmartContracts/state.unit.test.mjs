/* eslint-disable no-await-in-loop */
import { expect } from 'chai';
import hardhat from 'hardhat';
import {
  calculateBlockHash,
  calculateTransactionHash,
  createBlockAndTransactions,
} from '../utils/utils.mjs';
import { setCommitmentHashEscrowed } from '../utils/stateStorage.mjs';
import {
  packHistoricRoots,
  packTransactionInfo,
} from '../../../common-files/classes/transaction.mjs';
import { packBlockInfo } from '../../../common-files/utils/block-utils.mjs';

const { ethers, upgrades } = hardhat;

describe('State contract State functions', function () {
  let ProposersInstance;
  let addr1;
  let addr2;
  let state;
  let addressC;
  let transactionsCreated;
  let shield;
  let sanctionedSigner;

  before(async () => {
    const owner = await ethers.getSigners();
    [, , , , sanctionedSigner] = owner;
  });
  let blockHash;

  beforeEach(async () => {
    [addr1, addr2, addressC] = await ethers.getSigners();

    transactionsCreated = createBlockAndTransactions(
      '0x000000000000000000000000499d11e0b6eac7c0593d8fb292dcbbf815fb29ae',
      addr1.address,
      0,
      '0x0000000000000000000000000000000000000000000000000000000000000000',
      1,
      '0x6fdcfc8a2d541d6b99b6d6349b67783edf599fedfd1931b96f4385bcb3f2f188',
      '0x2dffeee2af2f5be8b946c00d2a0f96dc59ac65d1decce3bae9c2c70d5efca4a0',
      '1',
    );

    blockHash = calculateBlockHash(transactionsCreated.block);

    const Proposers = await ethers.getContractFactory('Proposers');
    ProposersInstance = await upgrades.deployProxy(Proposers, []);
    await ProposersInstance.deployed();

    const Verifier = await ethers.getContractFactory('Verifier');
    const verifier = await Verifier.deploy();
    await verifier.deployed();

    const Poseidon = await ethers.getContractFactory('Poseidon');
    const poseidon = await Poseidon.deploy();
    await poseidon.deployed();

    const MerkleTree = await ethers.getContractFactory('MerkleTree_Stateless', {
      libraries: {
        Poseidon: poseidon.address,
      },
    });
    const merkleTree = await MerkleTree.deploy();
    await merkleTree.deployed();

    const ChallengesUtil = await ethers.getContractFactory('ChallengesUtil', {
      libraries: {
        MerkleTree_Stateless: merkleTree.address,
      },
    });
    const challengesUtil = await ChallengesUtil.deploy();
    await challengesUtil.deployed();

    const Utils = await ethers.getContractFactory('Utils');
    const utils = await Utils.deploy();
    await utils.deployed();

    const Challenges = await ethers.getContractFactory('Challenges', {
      libraries: {
        Verifier: verifier.address,
        ChallengesUtil: challengesUtil.address,
        Utils: utils.address,
      },
    });
    const challenges = await upgrades.deployProxy(Challenges, [], {
      unsafeAllow: ['external-library-linking'],
    });
    await challenges.deployed();

    const X509Deployer = await ethers.getContractFactory('X509');
    const X509Instance = await upgrades.deployProxy(X509Deployer);
    const x509Address = X509Instance.address;
    await X509Instance.enableWhitelisting(false);

    const SanctionsListMockDeployer = await ethers.getContractFactory('SanctionsListMock');
    const sanctionsListMockInstance = await SanctionsListMockDeployer.deploy(
      sanctionedSigner.address,
    );
    const sanctionsListAddress = sanctionsListMockInstance.address;

    const Shield = await ethers.getContractFactory('Shield');
    shield = await upgrades.deployProxy(Shield, [], {
      initializer: 'initializeState',
    });
    await shield.deployed();
    await shield.setAuthorities(sanctionsListAddress, x509Address);

    const State = await ethers.getContractFactory('State', {
      libraries: {
        Utils: utils.address,
      },
    });
    state = await upgrades.deployProxy(State, [addr1.address, addressC.address, shield.address], {
      unsafeAllow: ['external-library-linking'],
      initializer: 'initializeState',
    });
    await state.deployed();

    await ProposersInstance.setStateContract(state.address);

    await state.registerVerificationKey(0, [], true, false);
    await state.registerVerificationKey(1, [], false, false);
    await state.registerVerificationKey(2, [], false, true);
  });

  afterEach(async () => {
    // clear down the test network after each test
    await hardhat.network.provider.send('hardhat_reset');
  });

  it('should set proposer', async function () {
    const newUrl = 'url';
    const newFee = 100;

    expect((await state.getProposer(addr1.address)).thisAddress).to.equal(
      ethers.constants.AddressZero,
    );
    await expect(
      state
        .connect(addr2)
        .setProposer(addr1.address, [
          addr1.address,
          addr1.address,
          addr1.address,
          newUrl,
          newFee,
          false,
          0,
        ]),
    ).to.be.revertedWith('State: Only proposer contract is authorized');

    await state.setProposer(addr1.address, [
      addr1.address,
      addr1.address,
      addr1.address,
      newUrl,
      newFee,
      false,
      0,
    ]);
    expect((await state.getProposer(addr1.address)).thisAddress).to.equal(addr1.address);
    expect((await state.proposers(addr1.address)).thisAddress).to.equal(addr1.address);
    expect((await state.proposers(addr1.address)).previousAddress).to.equal(addr1.address);
    expect((await state.proposers(addr1.address)).nextAddress).to.equal(addr1.address);
    expect((await state.proposers(addr1.address)).url).to.equal(newUrl);
    expect((await state.proposers(addr1.address)).fee).to.equal(newFee);
    expect((await state.proposers(addr1.address)).inProposerSet).to.equal(false);
    expect((await state.proposers(addr1.address)).indexProposerSet).to.equal(0);
  });

  it('should set current proposer', async function () {
    const newUrl = 'url';
    const newFee = 100;

    await state.setProposer(addr1.address, [
      addr1.address,
      addr1.address,
      addr1.address,
      newUrl,
      newFee,
      false,
      0,
    ]);

    expect((await state.getCurrentProposer()).thisAddress).to.equal(ethers.constants.AddressZero);
    await state.setCurrentProposer(addr1.address);
    expect((await state.getCurrentProposer()).thisAddress).to.equal(addr1.address);
  });

  it('should not set current proposer if proposer is not registered', async function () {
    expect((await state.getCurrentProposer()).thisAddress).to.equal(ethers.constants.AddressZero);
    await state.setCurrentProposer(addr1.address);
    expect((await state.getCurrentProposer()).thisAddress).to.equal(ethers.constants.AddressZero);
  });

  it('should add pending withdrawal', async function () {
    const amountL1Token = 100;
    const amountL2Token = 0;
    await state.addPendingWithdrawal(addr1.address, amountL1Token, amountL2Token);
    expect((await state.pendingWithdrawalsFees(addr1.address)).feesL1).to.equal(amountL1Token);
    expect((await state.pendingWithdrawalsFees(addr1.address)).feesL2).to.equal(amountL2Token);
  });

  it('should withdraw', async function () {
    await addr1.sendTransaction({
      to: state.address,
      value: ethers.utils.parseEther('1.0'),
    });

    const amountL1Token = 100;
    const amountL2Token = 0;

    await state.addPendingWithdrawal(addr1.address, amountL1Token, amountL2Token);
    expect((await state.pendingWithdrawalsFees(addr1.address)).feesL1).to.equal(amountL1Token);
    expect((await state.pendingWithdrawalsFees(addr1.address)).feesL2).to.equal(amountL2Token);

    const balanceContract = await ethers.provider.getBalance(state.address);

    await state.withdraw();

    expect((await state.pendingWithdrawalsFees(addr1.address)).feesL1).to.equal(0);
    expect((await state.pendingWithdrawalsFees(addr1.address)).feesL2).to.equal(0);

    expect(await ethers.provider.getBalance(state.address)).to.equal(
      balanceContract.sub(amountL1Token),
    );
  });

  it('should setProposerStartBlock', async function () {
    const newBlock = 10;
    await state.setProposerStartBlock(newBlock);
    expect(await state.proposerStartBlock()).to.equal(newBlock);

    const actualProposerStartBlock = await state.proposerStartBlock();
    const newProposerStartBlock = 100;

    await state.setProposerStartBlock(newProposerStartBlock);

    expect(await state.proposerStartBlock()).to.equal(newProposerStartBlock);
    expect(await state.proposerStartBlock()).not.equal(actualProposerStartBlock);
  });

  it('should setNumProposers', async function () {
    const prevNumProposers = 0;

    await state.setNumProposers(prevNumProposers);

    const actualNumProposers = await state.getNumProposers();
    expect(await state.getNumProposers()).to.equal(prevNumProposers);

    const newNumProposers = 1;

    await state.setNumProposers(newNumProposers);

    expect(await state.getNumProposers()).to.equal(newNumProposers);
    expect(await state.getNumProposers()).not.equal(actualNumProposers);
  });

  it('should update proposer', async function () {
    const newUrl = 'url';
    const newFee = 100;
    const updateUrl = 'url1';
    const updateFee = 500;

    expect((await state.getProposer(addr1.address)).thisAddress).to.equal(
      ethers.constants.AddressZero,
    );
    await state.setProposer(addr1.address, [
      addr1.address,
      addr1.address,
      addr1.address,
      newUrl,
      newFee,
      false,
      0,
    ]);
    expect((await state.getProposer(addr1.address)).thisAddress).to.equal(addr1.address);
    expect((await state.proposers(addr1.address)).thisAddress).to.equal(addr1.address);
    expect((await state.proposers(addr1.address)).url).to.equal(newUrl);
    expect((await state.proposers(addr1.address)).fee).to.equal(newFee);

    await state.updateProposer(addr1.address, updateUrl, updateFee);

    expect((await state.proposers(addr1.address)).thisAddress).to.equal(addr1.address);
    expect((await state.proposers(addr1.address)).url).to.equal(updateUrl);
    expect((await state.proposers(addr1.address)).fee).to.equal(updateFee);
  });

  it('should set stake account', async function () {
    const amount = await state.getMinimumStake();
    const challengeLocked = 5;

    await state.setStakeAccount(addr1.address, amount, challengeLocked);

    const timeLockedStake = await state.stakeAccounts(addr1.address);

    expect(timeLockedStake.amount).to.equal(amount);
    expect(timeLockedStake.challengeLocked).to.equal(challengeLocked);
    expect(timeLockedStake.time).to.equal(0);

    expect((await state.getStakeAccount(addr1.address)).amount).to.equal(amount);
    expect((await state.getStakeAccount(addr1.address)).challengeLocked).to.equal(challengeLocked);
    expect((await state.getStakeAccount(addr1.address)).time).to.equal(0);
  });

  it('should update Stake Account Time', async function () {
    const addr = addr1.address;
    const time = 5;

    const timeLockedStake = await state.stakeAccounts(addr);

    await state.updateStakeAccountTime(addr, time);

    expect((await state.getStakeAccount(addr1.address)).amount).to.equal(timeLockedStake.amount);
    expect((await state.getStakeAccount(addr1.address)).challengeLocked).to.equal(
      timeLockedStake.challengeLocked,
    );
    expect((await state.getStakeAccount(addr1.address)).time).to.equal(time);
  });

  it('should remove current proposer', async function () {
    const newUrl = 'url';
    const newFee = 100;
    const amount = await state.getMinimumStake();
    const challengeLocked = 5;

    expect((await state.getCurrentProposer()).thisAddress).to.equal(ethers.constants.AddressZero);
    expect((await state.getProposer(addr1.address)).thisAddress).to.equal(
      ethers.constants.AddressZero,
    );
    await state.setProposer(addr1.address, [
      addr1.address,
      addr2.address,
      addr2.address,
      newUrl,
      newFee,
      false,
      0,
    ]);
    await state.setNumProposers(1);
    expect((await state.getProposer(addr1.address)).thisAddress).to.equal(addr1.address);
    expect((await state.proposers(addr1.address)).thisAddress).to.equal(addr1.address);
    expect((await state.proposers(addr1.address)).nextAddress).to.equal(addr2.address);
    expect((await state.proposers(addr1.address)).url).to.equal(newUrl);
    expect((await state.proposers(addr1.address)).fee).to.equal(newFee);
    await state.setProposer(addr2.address, [
      addr2.address,
      addr1.address,
      addr1.address,
      newUrl,
      newFee,
      false,
      0,
    ]);

    await state.setStakeAccount(addr1.address, amount, challengeLocked);
    await state.setStakeAccount(addr2.address, amount, challengeLocked);
    await state.setCurrentProposer(addr1.address);
    await state.setNumProposers(2);

    expect((await state.getCurrentProposer()).thisAddress).to.equal(addr1.address);

    await state.removeProposer(addr1.address);

    expect((await state.getCurrentProposer()).thisAddress).to.equal(addr2.address);

    expect((await state.getProposer(addr1.address)).thisAddress).to.equal(
      ethers.constants.AddressZero,
    );
    expect((await state.proposers(addr1.address)).thisAddress).to.equal(
      ethers.constants.AddressZero,
    );
    expect((await state.proposers(addr1.address)).nextAddress).to.equal(
      ethers.constants.AddressZero,
    );
    expect((await state.proposers(addr1.address)).url).to.equal('');
    expect((await state.proposers(addr1.address)).fee).to.equal(0);
    expect((await state.proposers(addr2.address)).nextAddress).to.equal(addr2.address);
  });

  it('should remove proposer without proposer rotation', async function () {
    const newUrl = 'url';
    const newFee = 100;
    const amount = await state.getMinimumStake();
    const challengeLocked = 5;

    expect((await state.getCurrentProposer()).thisAddress).to.equal(ethers.constants.AddressZero);
    expect((await state.getProposer(addr1.address)).thisAddress).to.equal(
      ethers.constants.AddressZero,
    );
    await state.setProposer(addr1.address, [
      addr1.address,
      addr2.address,
      addr2.address,
      newUrl,
      newFee,
      false,
      0,
    ]);
    await state.setNumProposers(1);
    expect((await state.getProposer(addr1.address)).thisAddress).to.equal(addr1.address);
    expect((await state.proposers(addr1.address)).thisAddress).to.equal(addr1.address);
    expect((await state.proposers(addr1.address)).nextAddress).to.equal(addr2.address);
    expect((await state.proposers(addr1.address)).url).to.equal(newUrl);
    expect((await state.proposers(addr1.address)).fee).to.equal(newFee);
    await state.setProposer(addr2.address, [
      addr2.address,
      addr1.address,
      addr1.address,
      newUrl,
      newFee,
      false,
      0,
    ]);

    await state.setStakeAccount(addr1.address, amount, challengeLocked);
    await state.setStakeAccount(addr2.address, amount, challengeLocked);

    await state.setCurrentProposer(addr1.address);
    await state.setNumProposers(2);

    expect((await state.getCurrentProposer()).thisAddress).to.equal(addr1.address);

    await state.removeProposer(addr2.address);

    expect((await state.getProposer(addr2.address)).thisAddress).to.equal(
      ethers.constants.AddressZero,
    );
    expect((await state.proposers(addr2.address)).thisAddress).to.equal(
      ethers.constants.AddressZero,
    );
    expect((await state.proposers(addr2.address)).nextAddress).to.equal(
      ethers.constants.AddressZero,
    );
    expect((await state.proposers(addr2.address)).url).to.equal('');
    expect((await state.proposers(addr2.address)).fee).to.equal(0);

    expect((await state.getCurrentProposer()).thisAddress).to.equal(addr1.address);
  });

  it('should change current proposer with maxProposers == 1', async function () {
    const newUrl = 'url';
    const newFee = 100;
    const amount = await state.getMinimumStake();
    const challengeLocked = 5;

    expect((await state.getCurrentProposer()).thisAddress).to.equal(ethers.constants.AddressZero);
    expect((await state.getProposer(addr1.address)).thisAddress).to.equal(
      ethers.constants.AddressZero,
    );
    await state.setProposer(addr1.address, [
      addr1.address,
      addr1.address,
      addr2.address,
      newUrl,
      newFee,
      false,
      0,
    ]);
    await state.setNumProposers(1);
    expect((await state.getProposer(addr1.address)).thisAddress).to.equal(addr1.address);
    expect((await state.proposers(addr1.address)).thisAddress).to.equal(addr1.address);
    expect((await state.proposers(addr1.address)).nextAddress).to.equal(addr2.address);
    expect((await state.proposers(addr1.address)).url).to.equal(newUrl);
    expect((await state.proposers(addr1.address)).fee).to.equal(newFee);
    await state.setProposer(addr2.address, [
      addr2.address,
      addr2.address,
      addr2.address,
      newUrl,
      newFee,
      false,
      0,
    ]);
    await state.setStakeAccount(addr1.address, amount, challengeLocked);
    await state.setStakeAccount(addr2.address, amount, challengeLocked);
    await state.setCurrentProposer(addr2.address);
    await state.setNumProposers(2);

    await state.setBootProposer(addr1.address);

    expect((await state.getCurrentProposer()).thisAddress).to.equal(addr2.address);

    await state.setMaxProposers(1);

    await state.changeCurrentProposer();

    expect((await state.getCurrentProposer()).thisAddress).to.equal(addr1.address);

    expect(await state.getNumProposers()).to.equal(1);
  });

  it('should not change current proposer: State: Too soon to rotate proposer', async function () {
    const newUrl = 'url';
    const newFee = 100;
    const amount = await state.getMinimumStake();
    const challengeLocked = 5;

    expect((await state.getCurrentProposer()).thisAddress).to.equal(ethers.constants.AddressZero);
    expect((await state.getProposer(addr1.address)).thisAddress).to.equal(
      ethers.constants.AddressZero,
    );
    await state.setProposer(addr1.address, [
      addr1.address,
      addr1.address,
      addr2.address,
      newUrl,
      newFee,
      false,
      0,
    ]);
    await state.setNumProposers(1);
    expect((await state.getProposer(addr1.address)).thisAddress).to.equal(addr1.address);
    expect((await state.proposers(addr1.address)).thisAddress).to.equal(addr1.address);
    expect((await state.proposers(addr1.address)).nextAddress).to.equal(addr2.address);
    expect((await state.proposers(addr1.address)).url).to.equal(newUrl);
    expect((await state.proposers(addr1.address)).fee).to.equal(newFee);
    await state.setProposer(addr2.address, [
      addr2.address,
      addr2.address,
      addr2.address,
      newUrl,
      newFee,
      false,
      0,
    ]);
    await state.setStakeAccount(addr1.address, amount, challengeLocked);
    await state.setStakeAccount(addr2.address, amount, challengeLocked);

    await state.setCurrentProposer(addr2.address);
    await state.setNumProposers(2);

    await state.setBootProposer(addr1.address);

    expect((await state.getCurrentProposer()).thisAddress).to.equal(addr2.address);

    await state.setMaxProposers(5);
    await state.setProposerStartBlock(await ethers.provider.getBlockNumber());
    await expect(state.changeCurrentProposer()).to.be.revertedWith(
      'State: Too soon to rotate proposer',
    );
  });

  it('should not change current proposer with numProposers <= 1', async function () {
    const newUrl = 'url';
    const newFee = 100;

    expect((await state.getCurrentProposer()).thisAddress).to.equal(ethers.constants.AddressZero);
    expect((await state.getProposer(addr1.address)).thisAddress).to.equal(
      ethers.constants.AddressZero,
    );

    await state.setProposer(addr1.address, [
      addr1.address,
      addr1.address,
      addr1.address,
      newUrl,
      newFee,
      false,
      0,
    ]);

    expect((await state.getProposer(addr1.address)).thisAddress).to.equal(addr1.address);
    expect((await state.proposers(addr1.address)).thisAddress).to.equal(addr1.address);
    expect((await state.proposers(addr1.address)).nextAddress).to.equal(addr1.address);
    expect((await state.proposers(addr1.address)).url).to.equal(newUrl);
    expect((await state.proposers(addr1.address)).fee).to.equal(newFee);

    await state.setNumProposers(1);
    await state.setCurrentProposer(addr1.address);

    expect((await state.getCurrentProposer()).thisAddress).to.equal(addr1.address);
    const prevSprint = await state.currentSprint();

    await state.changeCurrentProposer();

    expect(await state.currentSprint()).to.equal(prevSprint);

    expect((await state.getCurrentProposer()).thisAddress).to.equal(addr1.address);
  });

  it('should change current proposer with numProposers > 1', async function () {
    const newUrl = 'url';
    const newFee = 100;
    const amount = await state.getMinimumStake();
    const challengeLocked = 5;

    expect((await state.getCurrentProposer()).thisAddress).to.equal(ethers.constants.AddressZero);
    expect((await state.getProposer(addr1.address)).thisAddress).to.equal(
      ethers.constants.AddressZero,
    );

    await state.setProposer(addr1.address, [
      addr1.address,
      addr1.address,
      addr1.address,
      newUrl,
      newFee,
      false,
      0,
    ]);

    await state.setNumProposers(1);
    expect((await state.getProposer(addr1.address)).thisAddress).to.equal(addr1.address);
    expect((await state.proposers(addr1.address)).thisAddress).to.equal(addr1.address);
    expect((await state.proposers(addr1.address)).nextAddress).to.equal(addr1.address);
    expect((await state.proposers(addr1.address)).url).to.equal(newUrl);
    expect((await state.proposers(addr1.address)).fee).to.equal(newFee);

    await state.setProposer(addr2.address, [
      addr2.address,
      addr2.address,
      addr2.address,
      newUrl,
      newFee,
      false,
      0,
    ]);
    await state.setStakeAccount(addr1.address, amount, challengeLocked);
    await state.setStakeAccount(addr2.address, amount, challengeLocked);

    await state.setCurrentProposer(addr1.address);

    await state.setNumProposers(2);

    expect((await state.getCurrentProposer()).thisAddress).to.equal(addr1.address);

    const prevSprint = await state.currentSprint();
    await state.changeCurrentProposer();

    expect(await state.currentSprint()).to.equal(prevSprint + 1);
  });

  it('should proposeBlock', async function () {
    const newUrl = 'url';
    const newFee = 100;
    const amount = await state.getMinimumStake();
    const challengeLocked = 5;

    await state.setProposer(addr1.address, [
      addr1.address,
      addr1.address,
      addr1.address,
      newUrl,
      newFee,
      false,
      0,
    ]);
    await state.setCurrentProposer(addr1.address);
    await state.setStakeAccount(addr1.address, amount, challengeLocked);
    await expect(
      state
        .connect(addr2)
        .proposeBlock(
          transactionsCreated.block,
          [transactionsCreated.depositTransaction, transactionsCreated.withdrawTransaction],
          { value: 10 },
        ),
    ).to.be.revertedWith('State: Only current proposer authorised');
    await setCommitmentHashEscrowed(
      state.address,
      transactionsCreated.depositTransaction.commitments,
    );

    await state.proposeBlock(
      transactionsCreated.block,
      [transactionsCreated.withdrawTransaction, transactionsCreated.depositTransaction],
      { value: 10 },
    );

    expect((await state.blockInfo(blockHash)).feesL2).to.equal(1);

    const siblingPath = [
      transactionsCreated.block.transactionHashesRoot,
      calculateTransactionHash(transactionsCreated.depositTransaction),
    ];
    const index = 0;
    expect(
      await state.areBlockAndTransactionReal(
        transactionsCreated.block,
        transactionsCreated.withdrawTransaction,
        index,
        siblingPath,
      ),
    ).to.equal(calculateTransactionHash(transactionsCreated.withdrawTransaction));
  });

  it('should not proposeBlock: funds not escrowed', async function () {
    const newUrl = 'url';
    const newFee = 100;
    const amount = await state.getMinimumStake();
    const challengeLocked = 5;

    await state.setProposer(addr1.address, [
      addr1.address,
      addr1.address,
      addr1.address,
      newUrl,
      newFee,
      false,
      0,
    ]);
    await state.setCurrentProposer(addr1.address);
    await state.setStakeAccount(addr1.address, amount, challengeLocked);
    await expect(
      state
        .connect(addr2)
        .proposeBlock(
          transactionsCreated.block,
          [transactionsCreated.depositTransaction, transactionsCreated.withdrawTransaction],
          { value: 10 },
        ),
    ).to.be.revertedWith('State: Only current proposer authorised');
    await expect(
      state.proposeBlock(
        transactionsCreated.block,
        [transactionsCreated.withdrawTransaction, transactionsCreated.depositTransaction],
        { value: 10 },
      ),
    ).to.be.revertedWithCustomError(state, 'CommitmentNotEscrowed');
  });

  it('should not proposeBlock: transaction hashes root', async function () {
    const newUrl = 'url';
    const newFee = 100;
    const amount = await state.getMinimumStake();
    const challengeLocked = 5;

    await state.setProposer(addr1.address, [
      addr1.address,
      addr1.address,
      addr1.address,
      newUrl,
      newFee,
      false,
      0,
    ]);
    await state.setCurrentProposer(addr1.address);
    await state.setStakeAccount(addr1.address, amount, challengeLocked);
    await expect(
      state
        .connect(addr2)
        .proposeBlock(
          transactionsCreated.block,
          [transactionsCreated.depositTransaction, transactionsCreated.withdrawTransaction],
          { value: 10 },
        ),
    ).to.be.revertedWith('State: Only current proposer authorised');
    transactionsCreated.block.transactionHashesRoot = ethers.constants.HashZero;
    await setCommitmentHashEscrowed(
      state.address,
      transactionsCreated.depositTransaction.commitments,
    );
    await expect(
      state.proposeBlock(
        transactionsCreated.block,
        [transactionsCreated.withdrawTransaction, transactionsCreated.depositTransaction],
        { value: 10 },
      ),
    ).to.be.revertedWithCustomError(state, 'InvalidTransactionHash');
  });

  it('should not proposeBlock: The block has an invalid size', async function () {
    const newUrl = 'url';
    const newFee = 100;
    const amount = await state.getMinimumStake();
    const challengeLocked = 5;

    await state.setProposer(addr1.address, [
      addr1.address,
      addr1.address,
      addr1.address,
      newUrl,
      newFee,
      false,
      0,
    ]);
    await state.setCurrentProposer(addr1.address);
    await state.setStakeAccount(addr1.address, amount, challengeLocked);

    transactionsCreated.withdrawTransaction.nullifiers = Array(2500).fill(
      '0x0000000000000000000000000000000000000000000000000000000000000000',
    );

    await setCommitmentHashEscrowed(
      state.address,
      transactionsCreated.depositTransaction.commitments,
    );
    await expect(
      state.proposeBlock(transactionsCreated.block, [transactionsCreated.withdrawTransaction], {
        value: 10,
      }),
    ).to.be.revertedWithCustomError(state, 'InvalidBlockSize');
  });

  it('should not proposeBlock: Block flawed or out of order', async function () {
    const newUrl = 'url';
    const newFee = 100;
    const amount = await state.getMinimumStake();
    const challengeLocked = 5;

    await state.setProposer(addr1.address, [
      addr1.address,
      addr1.address,
      addr1.address,
      newUrl,
      newFee,
      false,
      0,
    ]);
    await state.setCurrentProposer(addr1.address);
    await state.setStakeAccount(addr1.address, amount, challengeLocked);
    await setCommitmentHashEscrowed(
      state.address,
      transactionsCreated.depositTransaction.commitments,
    );
    await state.proposeBlock(
      transactionsCreated.block,
      [transactionsCreated.withdrawTransaction, transactionsCreated.depositTransaction],
      { value: 10 },
    );

    expect((await state.blockInfo(blockHash)).feesL2).to.equal(1);

    const packedInfoBlock = packBlockInfo(1, addr1.address, 1);

    transactionsCreated.block.packedInfo = packedInfoBlock;
    await expect(
      state.proposeBlock(
        transactionsCreated.block,
        [transactionsCreated.withdrawTransaction, transactionsCreated.depositTransaction],
        { value: 10 },
      ),
    ).to.be.revertedWith('State: Block flawed or out of order');
  });

  it('should not proposeBlock Proposer address is not the sender', async function () {
    const packedInfoBlock = packBlockInfo(700, addr2.address, 0);

    const wrongBlock = [
      packedInfoBlock,
      '0x2bcd2b4a55cf968f9f3dd85b3dbdd3da19e44d11a0053b221c9b5dfaf9792127',
      '0x01b3dd9607d81663fc1437e08423f028070afd2006a2679b3c674f64176fd934',
      '0xa2f1ec04a89542d6f1e04449398052422c7b1057df8606db047f48047bb7ab72',
      '0x0487da81cb1d53536928de44fa55de0accf9a8bc9f42739a80f69584970d572f',
    ];

    const newUrl = 'url';
    const newFee = 100;
    const amount = await state.getMinimumStake();
    const challengeLocked = 5;

    await state.setProposer(addr1.address, [
      addr1.address,
      addr1.address,
      addr1.address,
      newUrl,
      newFee,
      false,
      0,
    ]);
    await state.setCurrentProposer(addr1.address);
    await state.setStakeAccount(addr1.address, amount, challengeLocked);
    await setCommitmentHashEscrowed(
      state.address,
      transactionsCreated.depositTransaction.commitments,
    );
    await expect(
      state.proposeBlock(
        wrongBlock,
        [transactionsCreated.withdrawTransaction, transactionsCreated.depositTransaction],
        { value: 10 },
      ),
    ).to.be.revertedWith('State: The sender is not the proposer');
  });

  it('should popBlockData', async function () {
    const newUrl = 'url';
    const newFee = 100;
    const amount = await state.getMinimumStake();
    const challengeLocked = 5;

    await state.setProposer(addr1.address, [
      addr1.address,
      addr1.address,
      addr1.address,
      newUrl,
      newFee,
      false,
      0,
    ]);
    await state.setCurrentProposer(addr1.address);
    await state.setStakeAccount(addr1.address, amount, challengeLocked);
    await setCommitmentHashEscrowed(
      state.address,
      transactionsCreated.depositTransaction.commitments,
    );
    await state.proposeBlock(
      transactionsCreated.block,
      [transactionsCreated.withdrawTransaction, transactionsCreated.depositTransaction],
      { value: 10 },
    );

    const lastBlockHashes = await state.getBlockData(0);

    expect(lastBlockHashes.time).to.above(0);
    expect(await state.getNumberOfL2Blocks()).to.equal(1);
    await expect(state.popBlockData()).to.be.revertedWith(
      'State: Only challenger contract is authorized',
    );
    await state.connect(addressC).popBlockData();
    expect(await state.getNumberOfL2Blocks()).to.equal(0);

    await expect(state.getBlockData(0)).to.be.revertedWith('State: Invalid block number L2');
  });

  it('should be a real block', async function () {
    const packedInfoBlock = packBlockInfo(700, addr1.address, 5);

    const wrongBlockNumber = {
      packedInfo: packedInfoBlock,
      root: '0x2bcd2b4a55cf968f9f3dd85b3dbdd3da19e44d11a0053b221c9b5dfaf9792127',
      previousBlockHash: '0x01b3dd9607d81663fc1437e08423f028070afd2006a2679b3c674f64176fd934',
      frontierHash: '0xa2f1ec04a89542d6f1e04449398052422c7b1057df8606db047f48047bb7ab72',
      transactionHashesRoot: '0x0487da81cb1d53536928de44fa55de0accf9a8bc9f42739a80f69584970d572f',
    };
    const packedInfo = packTransactionInfo(100000000000000, 10, 0, 0);

    const historicRootBlockNumberL2 = [
      '0x0000000000000000000000000000000000000000000000000000000000000009',
      '0x0000000000000000000000000000000000000000000000000000000000000002',
      '0x0000000000000000000000000000000000000000000000000000000000000000',
      '0x0000000000000000000000000000000000000000000000000000000000000000',
    ];

    const packedHistoricRootBlockNumber = packHistoricRoots(historicRootBlockNumberL2);

    const transaction1 = {
      packedInfo,
      historicRootBlockNumberL2: packedHistoricRootBlockNumber,
      tokenId: '0x0000000000000000000000000000000000000000000000000000000000000000',
      ercAddress: '0x000000000000000000000000499d11e0b6eac7c0593d8fb292dcbbf815fb29ae',
      recipientAddress: '0x0000000000000000000000000000000000000000000000000000000000000000',
      commitments: [
        '0x078ba912b4169b22fb2d9b6fba6229ccd4ae9c2610c72312d0c6d18d85fd22cf',
        '0x0000000000000000000000000000000000000000000000000000000000000000',
        '0x0000000000000000000000000000000000000000000000000000000000000000',
      ],
      nullifiers: [
        '0x0000000000000000000000000000000000000000000000000000000000000000',
        '0x0000000000000000000000000000000000000000000000000000000000000000',
        '0x0000000000000000000000000000000000000000000000000000000000000000',
        '0x0000000000000000000000000000000000000000000000000000000000000000',
      ],
      compressedSecrets: [
        '0x0000000000000000000000000000000000000000000000000000000000000000',
        '0x0000000000000000000000000000000000000000000000000000000000000000',
      ],
      proof: [
        '0x1aceea8d85c56b2eb7eb394591d8b5da69448eff68b43f73a6535f58a39b107a',
        '0x2238f221dcce70cbe1ca2bded0b923013148476798dc531beb93ac5498ca7bcf',
        '0x20b3765b6a0654a77e391d4802434bea28b807441091f274448ef42d8c43a3f0',
        '0x0ff4e034de91170aa481bcb14b0aa904f4e2961b630092e1fa79c10da20589ae',
      ],
    };

    const newUrl = 'url';
    const newFee = 100;
    const amount = await state.getMinimumStake();
    const challengeLocked = 5;

    await state.setProposer(addr1.address, [
      addr1.address,
      addr1.address,
      addr1.address,
      newUrl,
      newFee,
      false,
      0,
    ]);
    await state.setCurrentProposer(addr1.address);
    await state.setStakeAccount(addr1.address, amount, challengeLocked);
    await setCommitmentHashEscrowed(
      state.address,
      transactionsCreated.depositTransaction.commitments,
    );
    await state.proposeBlock(
      transactionsCreated.block,
      [transactionsCreated.withdrawTransaction, transactionsCreated.depositTransaction],
      { value: 10 },
    );

    await expect(state.isBlockReal(wrongBlockNumber)).to.be.revertedWith(
      'State: Block does not exist',
    );

    await expect(
      state.areBlockAndTransactionsReal(wrongBlockNumber, [
        transactionsCreated.withdrawTransaction,
        transactionsCreated.depositTransaction,
      ]),
    ).to.be.revertedWith('State: Block does not exist');

    await expect(
      state.areBlockAndTransactionsReal(transactionsCreated.block, [transaction1]),
    ).to.be.revertedWith('State: Transaction hashes root does not match');
  });

  it('should setBlockStakeWithdrawn', async function () {
    const newUrl = 'url';
    const newFee = 100;
    const amount = await state.getMinimumStake();
    const challengeLocked = 5;

    await state.setProposer(addr1.address, [
      addr1.address,
      addr1.address,
      addr1.address,
      newUrl,
      newFee,
      false,
      0,
    ]);
    await state.setCurrentProposer(addr1.address);
    await state.setStakeAccount(addr1.address, amount, challengeLocked);
    await setCommitmentHashEscrowed(
      state.address,
      transactionsCreated.depositTransaction.commitments,
    );
    await state.proposeBlock(
      transactionsCreated.block,
      [transactionsCreated.withdrawTransaction, transactionsCreated.depositTransaction],
      { value: 10 },
    );

    expect((await state.blockInfo(blockHash)).stakeClaimed).to.equal(false);
    await state.connect(addressC).setBlockStakeWithdrawn(blockHash);
    expect((await state.blockInfo(blockHash)).stakeClaimed).to.equal(true);
  });

  it('should rewardChallenger', async function () {
    const newUrl = 'url';
    const newFee = 100;
    const amount = await state.getMinimumStake();
    const challengeLocked = amount.mul(2);

    await state.setProposer(addr1.address, [
      addr1.address,
      addr1.address,
      addr1.address,
      newUrl,
      newFee,
      false,
      0,
    ]);
    await state.setNumProposers(1);
    await state.setProposer(addr2.address, [
      addr2.address,
      addr2.address,
      addr2.address,
      newUrl,
      newFee,
      false,
      0,
    ]);
    await state.setStakeAccount(addr1.address, amount, challengeLocked);
    await state.setStakeAccount(addr2.address, amount, challengeLocked);

    await state.setCurrentProposer(addr1.address);
    await state.setNumProposers(2);
    await setCommitmentHashEscrowed(
      state.address,
      transactionsCreated.depositTransaction.commitments,
    );
    await state.proposeBlock(
      transactionsCreated.block,
      [transactionsCreated.withdrawTransaction, transactionsCreated.depositTransaction],
      { value: 10 },
    );

    const badBlock = {
      blockHash: (await state.blockHashes(0)).blockHash,
      time: (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp,
      proposer: addr2.address,
      blockStake: amount,
    };

    await state.connect(addressC).rewardChallenger(addressC.address, addr2.address, [badBlock]);

    const stakeAccount = await state.getStakeAccount(addr2.address);
    expect(stakeAccount.amount).to.equal(amount);
    expect(stakeAccount.time).to.equal(0);
    expect(stakeAccount.challengeLocked).to.equal(challengeLocked - amount);
    expect((await state.pendingWithdrawalsFees(addressC.address)).feesL1).to.equal(
      badBlock.blockStake,
    );
    expect((await state.pendingWithdrawalsFees(addressC.address)).feesL2).to.equal(0);
  });

  it('Should build spanProposersList and change current proposer', async function () {
    const newUrl = 'url';
    const newFee = 100;
    const amount = await state.getMinimumStake();
    const challengeLocked = 5;

    expect((await state.getCurrentProposer()).thisAddress).to.equal(ethers.constants.AddressZero);
    expect((await state.getProposer(addr1.address)).thisAddress).to.equal(
      ethers.constants.AddressZero,
    );

    await state.setProposer(addr1.address, [
      addr1.address,
      addr2.address,
      addr2.address,
      newUrl,
      newFee,
      false,
      0,
    ]);
    await state.setNumProposers(1);
    await state.setCurrentProposer(addr1.address);

    await state.setProposer(addr2.address, [
      addr2.address,
      addr1.address,
      addr1.address,
      newUrl,
      newFee,
      false,
      0,
    ]);

    await state.setStakeAccount(addr1.address, amount, challengeLocked);
    await state.setStakeAccount(addr2.address, amount.mul(100000), challengeLocked);
    await state.setNumProposers(2);

    let prevSprint;
    for (let i = 0; i < (await state.getSprintsInSpan()).add(100); i++) {
      prevSprint = await state.currentSprint();
      await state.setProposerStartBlock(0);
      await state.changeCurrentProposer();
      expect(prevSprint.add(1).mod(await state.getSprintsInSpan())).to.equal(
        (await state.currentSprint()).mod(await state.getSprintsInSpan()),
      );
    }
  });

  it('Should build spanProposersList and change current proposer with 10 proposers', async function () {
    const newUrl = 'url';
    const newFee = 100;
    const amount = await state.getMinimumStake();
    const challengeLocked = 5;

    const signers = [];
    for (let i = 0; i < 10; i++) {
      signers.push(ethers.Wallet.createRandom());
    }

    expect((await state.getCurrentProposer()).thisAddress).to.equal(ethers.constants.AddressZero);
    expect((await state.getProposer(addr1.address)).thisAddress).to.equal(
      ethers.constants.AddressZero,
    );

    await state.setProposer(addr1.address, [
      addr1.address,
      addr2.address,
      addr2.address,
      newUrl,
      newFee,
      false,
      0,
    ]);
    await state.setNumProposers(1);
    await state.setCurrentProposer(addr1.address);

    await state.setProposer(addr2.address, [
      addr2.address,
      addr1.address,
      addr1.address,
      newUrl,
      newFee,
      false,
      0,
    ]);

    await state.setStakeAccount(addr1.address, amount, challengeLocked);
    await state.setStakeAccount(addr2.address, amount.mul(100000), challengeLocked);
    await state.setNumProposers(2);

    const sprintInSpan = await state.getSprintsInSpan();
    const spanProposersList = [];
    for (let i = 0; i < sprintInSpan; i++) {
      spanProposersList.push(state.spanProposersList(i));
    }
    console.log(`list of next proposer: ${await Promise.all(spanProposersList)}`);

    for (let i = 0; i < signers.length; i++) {
      await state.setProposer(signers[i].address, [
        signers[i].address,
        i === signers.length - 1 ? signers[0].address : signers[i + 1].address,
        i === signers.length - 1 ? signers[0].address : signers[i + 1].address,
        newUrl,
        newFee,
        false,
        0,
      ]);
      await state.setStakeAccount(signers[i].address, amount, challengeLocked);
      await state.setNumProposers(i + 1 + 2);
    }

    let prevSprint;
    for (let i = 0; i < (await state.getSprintsInSpan()).add(100); i++) {
      prevSprint = await state.currentSprint();
      await state.setProposerStartBlock(0);
      await state.changeCurrentProposer();
      expect(prevSprint.add(1).mod(await state.getSprintsInSpan())).to.equal(
        (await state.currentSprint()).mod(await state.getSprintsInSpan()),
      );
    }
  });

  it('Should build spanProposersList and change current proposer with 20 proposers', async function () {
    const newUrl = 'url';
    const newFee = 100;
    const amount = await state.getMinimumStake();
    const challengeLocked = 5;

    const signers = [];
    for (let i = 0; i < 20; i++) {
      signers.push(ethers.Wallet.createRandom());
    }

    expect((await state.getCurrentProposer()).thisAddress).to.equal(ethers.constants.AddressZero);
    expect((await state.getProposer(addr1.address)).thisAddress).to.equal(
      ethers.constants.AddressZero,
    );

    await state.setProposer(addr1.address, [
      addr1.address,
      addr2.address,
      addr2.address,
      newUrl,
      newFee,
      false,
      0,
    ]);
    await state.setNumProposers(1);
    await state.setCurrentProposer(addr1.address);

    await state.setProposer(addr2.address, [
      addr2.address,
      addr1.address,
      addr1.address,
      newUrl,
      newFee,
      false,
      0,
    ]);

    await state.setStakeAccount(addr1.address, amount, challengeLocked);
    await state.setStakeAccount(addr2.address, amount.mul(100000), challengeLocked);
    await state.setNumProposers(2);

    for (let i = 0; i < signers.length; i++) {
      await state.setProposer(signers[i].address, [
        signers[i].address,
        i === signers.length - 1 ? signers[0].address : signers[i + 1].address,
        i === signers.length - 1 ? signers[0].address : signers[i + 1].address,
        newUrl,
        newFee,
        false,
        0,
      ]);
      await state.setStakeAccount(signers[i].address, amount, challengeLocked);
      await state.setNumProposers(i + 1 + 2);
    }

    let prevSprint;
    for (let i = 0; i < (await state.getSprintsInSpan()).add(100); i++) {
      prevSprint = await state.currentSprint();
      await state.setProposerStartBlock(0);
      await state.changeCurrentProposer();
      expect(prevSprint.add(1).mod(await state.getSprintsInSpan())).to.equal(
        (await state.currentSprint()).mod(await state.getSprintsInSpan()),
      );
    }
  });

  it('Should build spanProposersList and change current proposer with 30 proposers', async function () {
    const newUrl = 'url';
    const newFee = 100;
    const amount = await state.getMinimumStake();
    const challengeLocked = 5;

    const signers = [];
    for (let i = 0; i < 30; i++) {
      signers.push(ethers.Wallet.createRandom());
    }

    expect((await state.getCurrentProposer()).thisAddress).to.equal(ethers.constants.AddressZero);
    expect((await state.getProposer(addr1.address)).thisAddress).to.equal(
      ethers.constants.AddressZero,
    );

    await state.setProposer(addr1.address, [
      addr1.address,
      addr2.address,
      addr2.address,
      newUrl,
      newFee,
      false,
      0,
    ]);
    await state.setNumProposers(1);
    await state.setCurrentProposer(addr1.address);

    await state.setProposer(addr2.address, [
      addr2.address,
      addr1.address,
      addr1.address,
      newUrl,
      newFee,
      false,
      0,
    ]);

    await state.setStakeAccount(addr1.address, amount, challengeLocked);
    await state.setStakeAccount(addr2.address, amount.mul(100000), challengeLocked);
    await state.setNumProposers(2);

    for (let i = 0; i < signers.length; i++) {
      await state.setProposer(signers[i].address, [
        signers[i].address,
        i === signers.length - 1 ? signers[0].address : signers[i + 1].address,
        i === signers.length - 1 ? signers[0].address : signers[i + 1].address,
        newUrl,
        newFee,
        false,
        0,
      ]);
      await state.setStakeAccount(signers[i].address, amount, challengeLocked);
      await state.setNumProposers(i + 1 + 2);
    }

    let prevSprint;
    for (let i = 0; i < (await state.getSprintsInSpan()).add(100); i++) {
      prevSprint = await state.currentSprint();
      await state.setProposerStartBlock(0);
      await state.changeCurrentProposer();
      expect(prevSprint.add(1).mod(await state.getSprintsInSpan())).to.equal(
        (await state.currentSprint()).mod(await state.getSprintsInSpan()),
      );
    }
  });

  it('Should build spanProposersList and change current proposer with 50 proposers', async function () {
    const newUrl = 'url';
    const newFee = 100;
    const amount = await state.getMinimumStake();
    const challengeLocked = 5;

    const signers = [];
    for (let i = 0; i < 50; i++) {
      signers.push(ethers.Wallet.createRandom());
    }

    expect((await state.getCurrentProposer()).thisAddress).to.equal(ethers.constants.AddressZero);
    expect((await state.getProposer(addr1.address)).thisAddress).to.equal(
      ethers.constants.AddressZero,
    );

    await state.setProposer(addr1.address, [
      addr1.address,
      addr2.address,
      addr2.address,
      newUrl,
      newFee,
      false,
      0,
    ]);
    await state.setNumProposers(1);
    await state.setCurrentProposer(addr1.address);

    await state.setProposer(addr2.address, [
      addr2.address,
      addr1.address,
      addr1.address,
      newUrl,
      newFee,
      false,
      0,
    ]);

    await state.setStakeAccount(addr1.address, amount, challengeLocked);
    await state.setStakeAccount(addr2.address, amount.mul(100000), challengeLocked);
    await state.setNumProposers(2);

    for (let i = 0; i < signers.length; i++) {
      await state.setProposer(signers[i].address, [
        signers[i].address,
        i === signers.length - 1 ? signers[0].address : signers[i + 1].address,
        i === signers.length - 1 ? signers[0].address : signers[i + 1].address,
        newUrl,
        newFee,
        false,
        0,
      ]);
      await state.setStakeAccount(signers[i].address, amount, challengeLocked);
      await state.setNumProposers(i + 1 + 2);
    }

    let prevSprint;
    for (let i = 0; i < (await state.getSprintsInSpan()).add(100); i++) {
      prevSprint = await state.currentSprint();
      await state.setProposerStartBlock(0);
      await state.changeCurrentProposer();
      expect(prevSprint.add(1).mod(await state.getSprintsInSpan())).to.equal(
        (await state.currentSprint()).mod(await state.getSprintsInSpan()),
      );
    }
  });
});
