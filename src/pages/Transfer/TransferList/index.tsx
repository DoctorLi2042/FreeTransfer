import FormControl from "@mui/material/FormControl";
import InputAdornment from "@mui/material/InputAdornment";
import OutlinedInput from "@mui/material/OutlinedInput";
import TextField from "@mui/material/TextField";
import { BigNumber } from "ethers";
import { formatUnits, parseUnits } from "ethers/lib/utils";
import { FC } from "react";
import { AddressListType } from "..";
import "./styles";

type Props = {
    key: string,
    index: number,
    item: AddressListType,
    symbol: string,
    changeAddress: (index: number, address: string) => void,
    changeAmount: (index: number, amount: string) => void,
    decimals?: BigNumber,
}

const TransferList: FC<Props> = ({...props}) => {
    return (
        <li key={props.key}>
          <TextField
            className="tokenAddress"
            id="outlined-basic"
            label={`Address ${props.index + 1}`}
            variant="outlined"
            size="small"
            value={props.item.address}
            onChange={(e) => {
                props.changeAddress(props.index, e.target.value)
            }}
          />
          <FormControl
            sx={{ m: 0, width: "25ch" }}
            variant="outlined"
            size="small"
          >
            <OutlinedInput
              id="outlined-adornment-weight"
              // value={values.weight}
              // onChange={handleChange('weight')}
              endAdornment={
                <InputAdornment position="end">{props.symbol}</InputAdornment>
              }
              value={formatUnits(BigNumber.from(props.item.amount), (props.decimals ? props.decimals : 18))}
              onChange={(e) => {
                props.changeAmount(props.index, parseUnits(e.target.value, (props.decimals ? props.decimals : 18)).toString())
              }}
              aria-describedby="outlined-weight-helper-text"
              inputProps={{
                "aria-label": "weight",
              }}
            />
          </FormControl>
        </li>
    )
}

export default TransferList