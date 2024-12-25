import {entryPoint} from "./common/utils.js"
import { Deposit } from "./depositHL.js";
import { Faucet} from "./faucetHL.js";
import { Send } from "./sendHL.js";

async function startMenu(menu) {
  let startOver = true;
  if (menu === undefined) {
    mode = await entryPoint();
  } else {
    startOver = false;
  }

  switch (mode) {
    case "Faucet":
      Faucet();
      break;
    case "Deposit":
      Deposit();
      break;
    case "Send":
      Send();
      break;
  }
}

const args = process.argv.slice(2);
let mode = args[0];

await startMenu(mode);
