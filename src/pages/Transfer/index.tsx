import { FC, useCallback, useEffect, useMemo, useState } from "react";
import Button from "@mui/material/Button";
import "./styles";
import TextField from "@mui/material/TextField";
import SendIcon from "@mui/icons-material/Send";
import AddIcon from "@mui/icons-material/Add";
import { injected } from "../../libs/connectors/connectors";
import { useWeb3React } from "@web3-react/core";
import { useWeb3 } from "../../libs/connectors/connectHooks";
import { getERC20Contract, GetFreeTransfer } from "../../contracts/getContract";
import { BigNumber } from "ethers";
import { NULL_NUM } from "../../libs/utils";
import { formatUnits, parseUnits } from "ethers/lib/utils";
import Fab from "@mui/material/Fab";
import TransferList from "./TransferList";
import { FreeTransfer } from "../../libs/addresses";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";

enum ConnectorNames {
  Injected = "Injected",
}

const connectorsByName: { [connectorName in ConnectorNames]: any } = {
  [ConnectorNames.Injected]: injected,
};

export type AddressListType = {
  address: string;
  amount: string;
};

const TransferView: FC = () => {
  const { error, activate, account, library, chainId } = useWeb3React();
  const { activatingConnector, setActivatingConnector, triedEager } = useWeb3();
  const baseStyle = "transferView";
  const currentConnector = connectorsByName["Injected"];
  const disabled = !triedEager || !!activatingConnector || !!error;
  const [tokenAddress, setTokenAddress] = useState<string>("");
  const [decimals, setDecimals] = useState<BigNumber>();
  const [balance, setBalance] = useState<BigNumber>();
  const [symbol, setSymbol] = useState<string>();
  const [importData, setImportData] = useState<string>("");
  const [openInput, setOpenInput] = useState<boolean>(false);
  const [addressList, setAddressList] = useState<Array<AddressListType>>([
    {
      address: "",
      amount: "0",
    },
  ]);
  const [totalAmount, setTotalAmount] = useState<BigNumber>();
  const [allowAmount, setAllowAmount] = useState<BigNumber>(
    BigNumber.from("0")
  );
  const getDecimalsAndBalance = () => {
    if (tokenAddress && account) {
      (async () => {
        const tokenContract = getERC20Contract(tokenAddress, library, account);
        const decimals_num = await tokenContract!.decimals();
        const balance_num = await tokenContract!.balanceOf(account);
        const sym = await tokenContract!.symbol();
        setDecimals(decimals_num);
        setBalance(balance_num);
        setSymbol(sym);
      })();
    }
  };

  const freeTransfer = GetFreeTransfer();

  const handleClickOpenInput = () => {
    setOpenInput(true);
  };

  const handleCloseInput = () => {
    setOpenInput(false);
  };

  const changeAddress = (index: number, address: string) => {
    const newAddressList = addressList;
    newAddressList[index].address = address;
    setAddressList([...newAddressList]);
  };

  const changeAmount = (index: number, amount: string) => {
    const newAddressList = addressList;
    newAddressList[index].amount = amount;
    setAddressList([...newAddressList]);
  };

  const setImportString = () => {
    const listData = importData.replace(/\s+/g, "").split(";");
    const newAddressList: Array<AddressListType> = [];
    for (let index = 0; index < listData.length - 1; index++) {
      const element = listData[index];
      const elementArray = element.split(",");
      const thisData = {
        address: elementArray[0],
        amount: parseUnits(elementArray[1], decimals ?? 18).toString(),
      };
      newAddressList.push(thisData);
    }
    setAddressList([...newAddressList]);
  };

  const getAllow = useCallback(() => {
    if (account && chainId) {
      (async () => {
        const tokenContract = getERC20Contract(tokenAddress, library, account);
        const allow = await tokenContract!.allowance(
          account,
          FreeTransfer[chainId]
        );
        setAllowAmount(allow);
      })();
    }
  }, [account, chainId, library, tokenAddress]);

  const checkAllow = () => {
    if (totalAmount) {
      if (allowAmount.gte(totalAmount)) {
        return true;
      }
    }
    return false;
  };

  const approveTransaction = () => {
    (async () => {
      if (account && chainId) {
        const tokenContract = getERC20Contract(tokenAddress, library, account);
        const tx = await tokenContract!.approve(
          FreeTransfer[chainId],
          totalAmount
        );
        await tx
          .wait()
          .then((result: any) => {
            console.log(result);
            getAllow();
          })
          .catch((err: any) => {
            console.log(err);
          });
      }
    })();
  };

  const transferTransaction = () => {
    (async () => {
      if (freeTransfer && account && chainId) {
        const addresses = addressList.map((item) => {
          return item.address;
        });
        const tokenAmount = addressList.map((item) => {
          return item.amount;
        });
        const tx = await freeTransfer!.transfer(
          addresses,
          tokenAmount,
          tokenAddress
        );
        await tx
          .wait()
          .then((result: any) => {
            console.log(result);
            getAllow();
          })
          .catch((err: any) => {
            console.log(err);
          });
      }
    })();
  };

  useEffect(() => {
    var total = BigNumber.from("0");
    for (let index = 0; index < addressList.length; index++) {
      const element = addressList[index];
      total = total.add(BigNumber.from(element.amount));
    }
    setTotalAmount(total);
  }, [addressList]);

  useEffect(() => {
    if (account && chainId) {
      getAllow();
    }
  }, [account, chainId, library, tokenAddress, getAllow]);

  const mapLi = () => {
    return addressList.map((item, index) => {
      return (
        <TransferList
          key={index.toString() + item}
          index={index}
          item={item}
          symbol={symbol ? symbol : ""}
          decimals={decimals}
          changeAddress={changeAddress}
          changeAmount={changeAmount}
        />
      );
    });
  };

  const checkAddressListNull = () => {
    for (let index = 0; index < addressList.length; index++) {
      const element = addressList[index];
      if (element.address === "") {
        return false;
      }
    }
    return true;
  };

  const chainName = useMemo(() => {
    if (chainId === 56) {
      return "BNB";
    } else if (chainId === 97) {
      return "BNB Test";
    } else if (chainId === 534353) {
      return "Scroll Alpha Testnet";
    } else {
      return "Wrong network";
    }
  }, [chainId]);

  return (
    <div className={baseStyle}>
      <a href="https://github.com/DoctorLi2042/FreeTransfer">
        <h1 className={`title`}>Free Transfer{"->"}</h1>
      </a>
      <div>
        <Button
          className="connectWallet"
          variant="contained"
          size={`large`}
          disabled={disabled}
          onClick={() => {
            setActivatingConnector(currentConnector);
            activate(connectorsByName["Injected"], (error) => {
              if (error) {
                setActivatingConnector(undefined);
              }
            });
          }}
        >
          {account ? account : "Connect Wallet"}
        </Button>
        <p>{chainName}</p>
      </div>
      <div className="transferInfo">
        <TextField
          className="tokenAddress"
          id="outlined-basic"
          label="Token address"
          variant="outlined"
          size="small"
          value={tokenAddress}
          onChange={(e) => setTokenAddress(e.target.value)}
        />
        {decimals ? (
          <div className="tokenInfo">
            <h3>{`decimals:${decimals}`}</h3>
            <h3>
              {`balance:${
                balance
                  ? parseFloat(formatUnits(balance, decimals)).toFixed(6)
                  : NULL_NUM
              }`}{" "}
              <span>{symbol}</span>
            </h3>
          </div>
        ) : (
          <></>
        )}
        <div className="check">
          <Button
            variant="contained"
            size={`small`}
            onClick={getDecimalsAndBalance}
          >
            check
          </Button>
        </div>

        <div className="import">
          <Button variant="outlined" onClick={handleClickOpenInput}>
            import
          </Button>
          <Dialog open={openInput} onClose={handleCloseInput}>
            <DialogTitle>Input Data</DialogTitle>
            <DialogContent>
              <DialogContentText>
                example: 0x688f016CeDD62AD1d8dFA4aBcf3762ab29294489, 1.23;
                0x688f016CeDD62AD1d8dFA4aBcf3762ab29294489, 2.34;
              </DialogContentText>
              <TextField
                autoFocus
                margin="dense"
                id="name"
                label="Data"
                type="text"
                fullWidth
                variant="standard"
                value={importData}
                onChange={(e) => {
                  setImportData(e.target.value);
                }}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseInput}>Cancel</Button>
              <Button
                onClick={() => {
                  setImportString();
                  handleCloseInput();
                }}
              >
                Subscribe
              </Button>
            </DialogActions>
          </Dialog>
        </div>

        <ul className="addressList">{mapLi()}</ul>
        {totalAmount ? (
          <div className="totalAmount">
            {`Total amount: ${formatUnits(totalAmount, decimals)}`}{" "}
            <span>{symbol}</span>
          </div>
        ) : (
          <></>
        )}
        <Fab
          color="primary"
          aria-label="add"
          disabled={!checkAddressListNull()}
          className="add-button"
          onClick={() => {
            if (!checkAddressListNull()) {
              return;
            }
            setAddressList([
              ...addressList,
              {
                address: "",
                amount: "0",
              },
            ]);
          }}
        >
          <AddIcon />
        </Fab>

        <div>
          <Button
            className="connectWallet"
            variant="contained"
            size={`large`}
            endIcon={<SendIcon />}
            onClick={() => {
              if (checkAllow()) {
                transferTransaction();
              } else {
                approveTransaction();
              }
            }}
          >
            {checkAllow() ? "Transfer" : "Approve"}
          </Button>
        </div>
      </div>
      <div className="sponsoring">
        <h3>Thanks for sponsoring</h3>
        <a href="https://nestprotocol.org/">
          <img src="nest_logo_120.jpeg" alt="nestLogo" />
        </a>
      </div>
    </div>
  );
};

export default TransferView;
