import React, { useContext, useState, useCallback, useEffect } from 'react';
import Modal from 'react-bootstrap/Modal';
import Dropdown from 'react-bootstrap/Dropdown';
import DropdownButton from 'react-bootstrap/DropdownButton';
import { MdArrowForwardIos } from 'react-icons/md';
import { toast } from 'react-toastify';
// import styles from '../../styles/bridge.module.scss';
import polygonChainImage from '../../assets/img/polygon-chain.svg';
import ethChainImage from '../../assets/img/ethereum-chain.svg';
import discloserBottomImage from '../../assets/img/discloser-bottom.svg';
import lightArrowImage from '../../assets/img/light-arrow.svg';
import matic from '../../assets/svg/matic.svg';
import { approve, getContractAddress, submitTransaction } from '../../common-files/utils/contract';
import Web3 from '../../common-files/utils/web3';
import deposit from '../../nightfall-browser/services/deposit';
import withdraw from '../../nightfall-browser/services/withdraw';
import approveImg from '../../assets/img/modalImages/adeposit_approve1.png';
import depositConfirmed from '../../assets/img/modalImages/adeposit_confirmed.png';
import successHand from '../../assets/img/modalImages/success-hand.png';
import transferCompletedImg from '../../assets/img/modalImages/tranferCompleted.png';
import { UserContext } from '../../hooks/User/index.jsx';

import Input from '../Input/index.tsx';
import TokensList from '../Modals/Bridge/TokensList/index.tsx';
import { useAccount } from '../../hooks/Account/index.tsx';
import loadAccount from '../../utils/loadAccount.ts';
import minERC20ABI from '../../utils/getMinABIErc20.ts';
import { getWalletBalance } from '../../nightfall-browser/services/commitment-storage';
import './toast.css';
import './styles.scss';
import verifyIfValueIsGreaterThen from './utils/verifyIfValueIsGreaterThen.ts';
import TransferModal from '../Modals/Bridge/Transfer/index.jsx';


const BridgeComponent = () => {
  // const [state] = useState(() => props[Object.keys(props)[1].toString()].value);
  const [state] = useContext(UserContext);

  const [transferMethod, setMethod] = useState('On-Chain');
  // const [checkBox, setCheckBox] = useState(false);

  // const initialTx = location.state?.initialTxType || 'deposit';
  // const initialTx = location.state ? location.state.initialTxType : 'deposit';
  const initialTx = 'deposit';

  const [txType, setTxType] = useState(initialTx);
  const [transferValue, setTransferValue] = useState(0);
  const [show, setShow] = useState(false);

  const [showTokensListModal, setShowTokensListModal] = useState(false);

  useEffect(() => {
    if(document.getElementById('inputValue')) {
      document.getElementById('inputValue').value = 0;
    }    
  }, [txType]);
  const openTokensListModal = () => {
    setShowTokensListModal(true);
  };

  const [showModalConfirm, setShowModalConfirm] = useState(false);
  const [showModalTransferInProgress, setShowModalTransferInProgress] = useState(true);
  const [showModalTransferEnRoute, setShowModalTransferEnRoute] = useState(false);
  const [showModalTransferConfirmed, setShowModalTransferConfirmed] = useState(false);

  function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // TODO Make this dependent on proof generation time.
  const handleCloseConfirmModal = () => {
    setShowModalConfirm(false);
    setShowModalTransferInProgress(false);
    setShowModalTransferEnRoute(false);
    setShowModalTransferConfirmed(false);
  };

  const handleShowModalConfirm = async () => {
    setShowModalConfirm(true);
    setShowModalTransferInProgress(true);
    await timeout(3000);
    setShowModalTransferInProgress(false);
    setShowModalTransferEnRoute(true);

    await timeout(3000);
    setShowModalTransferEnRoute(false);
    setShowModalTransferConfirmed(true);
  };

  const handleClose = () => setShow(false);

  async function triggerTx() {
    const { address: shieldContractAddress } = (await getContractAddress('Shield')).data;
    const { address: defaultTokenAddress } = (await getContractAddress('ERC20Mock')).data; // TODO Only for testing now
    const ercAddress = defaultTokenAddress; // TODO Location to be removed later
    switch (txType) {
      case 'deposit': {
        await approve(ercAddress, shieldContractAddress, 'ERC20', transferValue.toString());
        const { rawTransaction } = await deposit(
          {
            ercAddress,
            tokenId: 0,
            value: transferValue,
            pkd: state.zkpKeys.pkd,
            nsk: state.zkpKeys.nsk,
            fee: 1,
            tokenType: 'ERC20',
          },
          shieldContractAddress,
        );
        return submitTransaction(rawTransaction, shieldContractAddress, 1);
      }

      case 'withdraw': {
        if (transferMethod === 'Direct Transfer') {
          await withdraw(
            {
              offchain: true,
              ercAddress,
              tokenId: 0,
              value: transferValue,
              recipientAddress: await Web3.getAccount(),
              nsk: state.zkpKeys.nsk,
              ask: state.zkpKeys.ask,
              tokenType: 'ERC20',
              fees: 1,
            },
            shieldContractAddress,
          );
        } else {
          const { rawTransaction } = await withdraw(
            {
              ercAddress,
              tokenId: 0,
              value: transferValue,
              recipientAddress: await Web3.getAccount(),
              nsk: state.zkpKeys.nsk,
              ask: state.zkpKeys.ask,
              tokenType: 'ERC20',
              fees: 1,
            },
            shieldContractAddress,
          );
          return submitTransaction(rawTransaction, shieldContractAddress, 1);
        }
        break;
      }

      default:
        break;
    }
    handleClose();
    return true;
  }

  const handleChange = useCallback(
    e => {
      setTransferValue(e.target.value);
    },
    [transferValue],
  );

  /** ******* ABOUT GET L1 BALANCE ******** */
  const { accountInstance, setAccountInstance } = useAccount();
  const [l1Balance, setL1Balance] = useState(0);
  const [token, setToken] = useState(null);
  const [l2Balance, setL2Balance] = useState(0);

  const isValueGreaterThen = () => {
    if (txType === 'deposit') {
      return verifyIfValueIsGreaterThen(transferValue, l1Balance);
    }
    return verifyIfValueIsGreaterThen(transferValue, l2Balance);
  };

  const handleShow = () => {
    // if (isValueGreaterThen()) {
    //   toast.error("Input value can't be greater than balance!");
    //   return;
    // }

    // if (!transferValue) {
    //   toast.warn('Input a value for transfer, please.');
    //   return;
    // }

    // if (transferValue === 0) {
    //   toast.warn("Input a value can't be zero.");
    //   return;
    // }

    setShow(true);
  };

  async function setAccount() {
    setAccountInstance(await loadAccount());
  }

  async function updateL1Balance() {
    setAccount();
    if (token && token.address) {
      const contract = new window.web3.eth.Contract(minERC20ABI, token.address);
      const result = await contract.methods.balanceOf(accountInstance.address).call(); // 29803630997051883414242659
      const format = window.web3.utils.fromWei(result, 'Gwei'); // 29803630.997051883414242659
      setL1Balance(format);
    } else {
      setL1Balance(0);
    }
  }

  async function updateL2Balance() {
    if (token && token.address) {
      const l2bal = await getWalletBalance();
      const l2balFilteredByCompressedKey = Object.entries(l2bal).filter(
        obj => obj[0] === state.zkpKeys.compressedPkd,
      );
      new Promise(resolve => {
        let balanceAmount = 0;
        l2balFilteredByCompressedKey.forEach(obj => {
          if (Object.keys(obj[1])[0].toLocaleLowerCase() === token.address.toLocaleLowerCase()) {
            balanceAmount += Object.values(obj[1])[0];
          }
        });
        resolve(balanceAmount);
      }).then(value => setL2Balance(value));
    } else {
      setL2Balance(0);
    }
  }

  useEffect(() => {
    updateL1Balance();
    updateL2Balance();
  }, [token]);

  const updateInputValue = () => {
    if (txType === 'deposit') {
      document.getElementById('inputValue').value = l1Balance;
      setTransferValue(l1Balance);
      return;
    }
    document.getElementById('inputValue').value = l2Balance;
    setTransferValue(l2Balance);
  };

  /** ************************************ */

  return (
    <div>
      {showTokensListModal && (
        <div className="modalWrapper">          
          <TokensList handleClose={setShowTokensListModal} setToken={setToken} />
        </div>
      )}

      <div className="bridge-wrapper">
        <div>
          <div>
            <div className="tabs">
              <div
                className={txType === 'deposit' ? 'tabs_button_checked' : 'tabs_button'}
                value="deposit"
                onClick={() => setTxType('deposit')}
              >
                <p>Deposit</p>
              </div>
              <div
                className={txType === 'withdraw' ? 'tabs_button_checked' : 'tabs_button'}
                value="withdraw"
                onClick={() => setTxType('withdraw')}
              >
                <p>Withdraw</p>
              </div>
            </div>
          </div>

          <div className="brige_body">
            {/* FROM SECTION */}
            <div className="from_label">From</div>
            <div className="from_section">
              <div className="chain_balance_details">
                <div className="chain_details">
                  {txType === 'deposit' ? (
                    <img src={ethChainImage} alt="ethereum chain logo" />
                  ) : (
                    <img src={polygonChainImage} alt="polygon chain logo" height="24" width="24" />
                  )}
                  <p>{txType === 'deposit' ? 'Ethereum Mainnet' : 'Polygon Nightfall L2'}</p>
                </div>
                <div className="balance_details">
                  <p>Balance: </p>
                  {token && txType === 'deposit' && (
                    <p>
                      {`${l1Balance.toString().match(/^-?\d+(?:\.\d{0,4})?/)[0]} ${token.symbol}`}
                    </p>
                  )}
                  {token && txType === 'withdraw' && <p>{`${l2Balance} MATIC`}</p>}
                  {!token && <p>{txType === 'deposit' ? `${l1Balance}` : `${l2Balance}`}</p>}
                </div>
              </div>
              <div className="from_section_line"></div>
              <div className="token_amount_details">
                <div className="amount_details">
                  <div className="amount_value_wrapper">
                    <Input
                      id="inputValue"
                      name="price"
                      prefix="$"
                      placeholder="0,00"
                      onChange={handleChange}
                    />
                    <div className="amount_details_max" onClick={() => updateInputValue()}>
                      <span>MAX</span>
                    </div>
                  </div>
                </div>
                <div className="token_details">
                  <div className="token_details_wapper" onClick={() => openTokensListModal()}>
                    {token && token.logoURI && token.symbol && (
                      <>
                        <img src={token.logoURI} alt="chain logo" height="24" width="24" />
                        <div className="token_details_text" id="bridge_tokenDetails_tokenName">
                          <span>{token.symbol}</span>
                        </div>
                      </>
                    )}
                    {!token && (
                      <>
                        <div></div>
                        <div className="token_details_text" id="bridge_tokenDetails_tokenName">
                          <span>Select</span>
                        </div>
                      </>
                    )}
                    <img src={discloserBottomImage} alt="discloser icon" height="24" width="24" />
                  </div>
                </div>
              </div>
            </div>

            <div className="arrow_icon_wrapper">
              <img src={lightArrowImage} alt="to arrow" />
            </div>

            {/* TO SECTION */}
            <div className="to_text">To</div>
            <div className="to_wrapper">
              <div className="chain_details">
                {txType === 'withdraw' ? (
                  <img src={ethChainImage} alt="ethereum chain logo" height="24" width="24" />
                ) : (
                  <img src={polygonChainImage} alt="polygon chain logo" height="24" width="24" />
                )}
                <p>{txType === 'deposit' ? 'Polygon Nightfall L2' : 'Ethereum Mainnet'}</p>
              </div>
              <div className="balance_details">
                <p>Balance: </p>
                {token && txType === 'deposit' && <p>{`${l2Balance} MATIC`}</p>}
                {token && txType === 'withdraw' && (
                  <p>
                    {`${
                      l1Balance
                        .toString()
                        .toString()
                        .match(/^-?\d+(?:\.\d{0,4})?/)[0]
                    } ${token.symbol}`}
                  </p>
                )}
                {!token && <p>{txType === 'withdraw' ? `${l2Balance}` : `${l1Balance}`}</p>}
              </div>
            </div>
          </div>

          {/* WARN WRAPPER */}
          {/* <div className="warn_wrapper">
            <div className="warn_line1">
              <div className="warn_line1_text">
                {!checkBox ? (
                  <div
                    className="warn_line1_text__div_unchecked"
                    type="checkbox"
                    onClick={() => setCheckBox(!checkBox)}
                  />
                ) : (
                  <div
                    className="warn_line1_text__div_checked"
                    type="checkbox"
                    onClick={() => setCheckBox(!checkBox)}
                  >
                    <BsCheck />
                  </div>
                )}
                <p>Swap some MATIC token?</p>
              </div>
              <div className="warn_info">
                <AiOutlineInfo />
              </div>
            </div>
            <div className="warn_line2">
              <p>MATIC is required to perform transaction on polygon chain.</p>
            </div>
          </div> */}
          {/* TRANSFER MODE */}
          <div className="transfer_mode">
            {/* <span class="transfer-mode__label"> Transfer Mode: </span>
                        <span class="bridge-type">{{ selectedMode }} Bridge</span> */}
            <span className="transfer_mode_text"> Transfer Mode: </span>
            <span className="transfer_bridge_text">
              {txType.charAt(0).toUpperCase() + txType.slice(1)} Bridge
            </span>
          </div>

          {/* TRANSFER BUTTON */}
          <div>
            <button type="button" className="transfer_button" onClick={handleShow}>
              <p>Transfer</p>
            </button>
          </div>
        </div>        
        {show && 
          <TransferModal 
            show={show}
            setShow={setShow}
            handleClose={setShow}
            transferValue={transferValue}
            txType={txType}
            setMethod={setMethod}
            transferMethod={transferMethod}
            handleShowModalConfirm={handleShowModalConfirm}
          />
        }

        {/* TRANSFER IN PROGRESS MODAL */}
        <Modal
          contentClassName="modalFather"
          show={showModalConfirm}
          onHide={handleCloseConfirmModal}
        >
          <Modal.Header closeButton>
            <div className="modalTitle">Transfer in progress</div>
          </Modal.Header>
          {showModalTransferInProgress && (
            <Modal.Body>
              <div className="modalBody">
                <div className="processImages">
                  <img src={approveImg} alt="approve" />
                </div>
                <div className="divider" />
                <div className="spinnerBox">
                  <div className="spinnerBoard">
                    <div className="spinner" />
                  </div>
                </div>

                <div className="transferModeModal">
                  <h3>Creating Transaction</h3>
                  <div className="modalText">
                    Retrieving your commitments and generating transaction inputs.
                  </div>
                  {/* <a className={styles.footerText}>View on etherscan</a> */}
                </div>
              </div>
            </Modal.Body>
          )}

          {showModalTransferEnRoute && (
            <Modal.Body>
              <div className="modalBody">
                <div className="processImages">
                  <img src={depositConfirmed} alt="deposit confirmed" />
                </div>
                <div className="divider" />
                <div className="spinnerBox">
                  <div className="spinnerBoard">
                    <div className="spinner" />
                  </div>
                </div>
                <div className="transferModeModal">
                  <h3>Generating Zk Proof</h3>
                  <div className="modalText">
                    Proof generation may take up to 2 mins to complete. Do not navigate away.
                  </div>
                  {/* <a className="footerText">View on etherscan</a> */}
                </div>
              </div>
            </Modal.Body>
          )}

          {showModalTransferConfirmed && (
            <Modal.Body>
              <div className="modalBody">
                <div className="processImages">
                  <img src={transferCompletedImg} alt="transfer completed" />
                </div>
                <div className="divider" />
                <div className="spinnerBox">
                  <img src={successHand} alt="success hand" />
                </div>
                <div className="transferModeModal" id="Bridge_modal_success">
                  <h3>Transaction created sucessfully.</h3>
                  <div className="modalText">Your transfer is ready to send.</div>
                  <button
                    type="button"
                    className="continueTrasferButton"
                    id="Bridge_modal_continueTransferButton"
                    // onClick={() => triggerTx()}
                    onClick={() => triggerTx()}
                  >
                    Send Transaction
                  </button>
                  {/* <a className="footerText">View on etherscan</a> */}
                </div>
              </div>
            </Modal.Body>
          )}
        </Modal>
      </div>
    </div>
  );
};

export default BridgeComponent;
