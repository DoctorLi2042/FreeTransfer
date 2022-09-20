import { FC, useCallback, useEffect, useState } from "react";
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
import { formatUnits } from "ethers/lib/utils";
import Fab from "@mui/material/Fab";
import TransferList from "./TransferList";
import { FreeTransfer } from "../../libs/addresses";

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

  const freeTransfer = GetFreeTransfer()

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
  }, [account, chainId, library, tokenAddress])

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
        await tx.wait().then((result: any) => {
          console.log(result)
          getAllow()
        }).catch((err: any) => {
          console.log(err)
        });;
      }
    })();
  };

  const transferTransaction = () => {
    (async () => {
      if (freeTransfer && account && chainId) {
        const addresses = addressList.map((item) => {
          return item.address
        })
        const tokenAmount = addressList.map((item) => {
          return item.amount
        })
        const tx = await freeTransfer!.transfer(
          addresses,
          tokenAmount,
          tokenAddress
        );
        await tx.wait().then((result: any) => {
          console.log(result)
          getAllow()
        }).catch((err: any) => {
          console.log(err)
        });;
      }
    })();
  }

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
      getAllow()
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

  return (
    <div className={baseStyle}>
      <a href="https://github.com/DoctorLi2042/FreeTransfer"><h1 className={`title`}>Free Transfer{'->'}</h1></a>
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
        <div>
          <Button
            className="connectWallet"
            variant="contained"
            size={`small`}
            onClick={getDecimalsAndBalance}
          >
            check
          </Button>
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
          className='add-button'
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
                transferTransaction()
              } else {
                approveTransaction()
              }
            }}
          >
            {checkAllow() ? 'Transfer' : 'Approve'}
          </Button>
        </div>
      </div>
      <div className="sponsoring">
        <h3>Thanks for sponsoring</h3>
        <a href="https://nestprotocol.org/"><img src="nest_logo_120.jpeg" alt="nestLogo"/></a>
      </div>
    </div>
  );
};

export default TransferView;
