import { chromium } from "playwright";
import { readWallets, readProxy } from "./common/readFiles.js";
import path from "path";

function wait(ms) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve();
    }, ms);
  });
}

const mnemonics = readWallets("./data/mnemonics.txt");
const proxy = readProxy("./data/proxy.txt");
const __dirname = path.resolve();

const depositURL = "https://app.hyperliquid-testnet.xyz/portfolio";
const faucetURL = "https://app.hyperliquid-testnet.xyz/drip";
const portfolioURL = "https://app.hyperliquid-testnet.xyz/portfolio";

async function sendHyperliquid(
  mnemonic,
  proxyServer,
  proxyUsername,
  proxyPassword,
  i
) {
  let password = "11111111";
  const pathToExtension = path.join(__dirname, "Metamask");
  const browser = await chromium.launchPersistentContext("", {
    channel: "chromium",
    headless: false,
    ignoreHTTPSErrors: true,
    proxy: {
      server: `${proxyServer}`, //host:port
      username: `${proxyUsername}`, //username
      password: `${proxyPassword}`, // password
    },
    args: [
      `--headless=new`,
      `--disable-extensions-except=${pathToExtension}`,
      `--load-extension=${pathToExtension}`,
    ],
  });

  try {
    await wait(5000);
    const pageMM = await browser.newPage();

    //[INFO] Import seed to Metamask

    let [background] = browser.serviceWorkers();
    if (!background) background = await browser.waitForEvent("serviceworker");
    const extensionId = background.url().split("/")[2];

    const popupMM = `chrome-extension://${extensionId}/popup.html`;

    await pageMM.goto(`chrome-extension://${extensionId}/home.html`, {
      waitUntil: "networkidle",
      timeout: 20000,
    });

    await pageMM.locator("xpath=//input[@type='checkbox']").click();
    await wait(2000);
    await pageMM
      .locator("xpath=//button[@data-testid='onboarding-import-wallet']")
      .click();
    await wait(2000);

    await pageMM
      .locator("xpath=//button[@data-testid='metametrics-no-thanks']")
      .click();
    await wait(2000);

    let arraySeed = mnemonic.split(" ");

    for (let i = 0; i < arraySeed.length; i++) {
      await pageMM
        .locator(`xpath=//input[@data-testid='import-srp__srp-word-${i}']`)
        .fill(arraySeed[i]);
      await wait(500);
    }

    await pageMM
      .locator("xpath=//button[@data-testid='import-srp-confirm']")
      .click();
    await wait(2000);

    await pageMM
      .locator("xpath=//input[@data-testid='create-password-new']")
      .fill(password);
    await wait(2000);

    await pageMM
      .locator("xpath=//input[@data-testid='create-password-confirm']")
      .fill(password);
    await wait(2000);
    await wait(2000);

    await pageMM.locator("xpath=//input[@type='checkbox']").click();
    await wait(2000);

    await pageMM
      .locator("xpath=//button[@data-testid='create-password-import']")
      .click();
    await wait(2000);
    await pageMM
      .locator("xpath=//button[@data-testid='onboarding-complete-done']")
      .click();
    await wait(2000);

    await pageMM
      .locator("xpath=//button[@data-testid='pin-extension-next']")
      .click();
    await wait(2000);

    await pageMM
      .locator("xpath=//button[@data-testid='pin-extension-done']")
      .click();
    await wait(2000);

    //[INFO] Connect to HyperLiquid  https://app.hyperliquid-testnet.xyz/drip

    const HyperLiquidPage = await browser.newPage();

    await HyperLiquidPage.goto(faucetURL, {
      waitUntil: "domcontentloaded",
      timeout: 35000,
    });

    await HyperLiquidPage.locator("xpath=//button[text()='Connect']").click();
    await wait(2000);
    await pageMM.goto(popupMM);
    await wait(2000);

    await HyperLiquidPage.locator("xpath=//div[text()='MetaMask']").click();
    await wait(2000);

    await pageMM.reload();
    await wait(2000);

    await pageMM.locator("xpath=//button[@data-testid='confirm-btn']").click();
    await wait(1500);

    if (
      await pageMM
        .locator("xpath=//button[@data-testid='confirm-btn']", {
          timeout: 5000,
        })
        .isVisible()
    ) {
      await pageMM
        .locator("xpath=//button[@data-testid='confirm-btn']")
        .click();
      await wait(1500);
    } else {
      try {
        //[INFO] Terms of use HL
        await HyperLiquidPage.locator(
          "xpath=//div[text()='This is testnet trading which does not involve real money.']"
        ).click();
        await wait(2000);

        await HyperLiquidPage.locator(
          "xpath=//*[@id='root']/div[3]/div/div/div[1]/div/div[3]/div/div[1]"
        ).click();
        await wait(3000);
        //button/div[text()='Accept']
        await HyperLiquidPage.locator(
          "xpath=//button/div[text()='Accept']"
        ).click();
        await wait(2000);

        await pageMM.reload();
        await wait(4000);

        await pageMM
          .locator("xpath=//button[@data-testid='confirm-footer-button']")
          .click();
        await wait(1500);
      } catch (err) {}
      try {
        await HyperLiquidPage.locator(
          "xpath=//button[text()='Switch to Arbitrum Sepolia to Claim']"
        ).click();
        await wait(2000);

        await pageMM.reload();
        await wait(2000);
        await pageMM
          .locator("xpath=//button[@data-testid='confirmation-submit-button']")
          .click();
        await wait(2000);
      } catch (err) {
        await wait(3000);
      }
    }
    // [INFO] Go to deposit page https://app.hyperliquid-testnet.xyz/portfolio
    await HyperLiquidPage.goto(depositURL, {
      waitUntil: "domcontentloaded",
      timeout: 35000,
    });

    await wait(3500);

    try {
      await HyperLiquidPage.locator(
        "xpath=//button[text()='Establish Connection']"
      ).click();
      await wait(2000);
      await pageMM.reload();
      await wait(2000);
      await pageMM
        .locator("xpath=//button[@data-testid='confirm-footer-button']")
        .click();
      await wait(2000);
      // [INFO] Click to "send" and aproove transaction

      await wait(2000);
      await HyperLiquidPage.locator("xpath=//div/div[text()='Send']").click();
    } catch (err) {
      console.log(err);
    }
    await wait(2000);

    await HyperLiquidPage.locator("xpath=//div/button[text()='Send']").click();
    await wait(2000);

    //[INFO] Data for send tokens
    let destinationAddress = "0x0AfbcCB5Ab515EF6Ff10e813b276d0C0A59076e0"; //[TODO] CHANGE!
    await HyperLiquidPage.locator(
      "xpath=//input[@placeholder='Destination']"
    ).fill(destinationAddress); // fill dest. address

    await wait(2000);
    await HyperLiquidPage.locator("xpath=//a[text()='MAX']").click();

    await wait(2000);
    await HyperLiquidPage.locator(
      "xpath=//*[@id='root']/div[3]/div/div[2]/div[2]/div/button"
    ).click();

    await wait(2000);
    await HyperLiquidPage.locator(
      "xpath=//div[text()='I confirm that I am not withdrawing to Arbitrum. I am sending assets on the Hyperliquid L1. My assets will be lost if I send to a CEX.']"
    ).click();

    await wait(2000);
    await HyperLiquidPage.locator(
      "xpath=//button[text()='Transfer with Fee']"
    ).click();

    await wait(2000);

    await pageMM.reload();
    await wait(2000);

    await pageMM
      .locator("xpath=//button[@data-testid='confirm-footer-button']")
      .click();
    await wait(1500);
    console.log(`Аккаунт  [${i}] завершен`);
  } catch (error) {
    console.log(error);

    await browser.close();
  }
}

export async function Send() {
  let i = 0;
  for (i; i < mnemonics.length; i++) {
    try {
      console.log(`Аккаунт [${i}] запущен`);
      await sendHyperliquid(
        mnemonics[i],
        proxy[i].proxyServer,
        proxy[i].proxyUsername,
        proxy[i].proxyPassword,
        i
      );
    } catch (err) {
      console.error(`Ошибка на аккаунте [${i}]:`, err);
    }
  }

  console.log(`Все аккаунты завершены ${i}/${mnemonics.length}`);
}
