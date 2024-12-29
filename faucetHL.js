import { chromium } from "playwright";
import { readWallets, readProxy } from "./common/readFiles.js";
import path from "path";
import cron from 'node-crontab';  

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

const faucetURL = "https://app.hyperliquid-testnet.xyz/drip";

async function faucetHyperliquid(
  mnemonic,
  proxyServer,
  proxyUsername,
  proxyPassword,
  i
) {
  let password = "11111111";
  const pathToExtension = path.join(__dirname, "Metamask");
  const basicFee = '30';
  const priorityFee = '30';
  const gasLimit = '150000';

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

    try {
      await HyperLiquidPage.locator(
        "xpath=//button[text()='Claim 100 mock USDC']"
      ).click();
      await wait(2000);
    } catch (err) {
      console.log(err);
    }
    await wait(2000);

    await pageMM.reload();
     //change fee

     try{
      await wait(3500);

    await pageMM
      .locator("xpath=//button[@data-testid='edit-gas-fee-icon']")
      .click();
      await wait(3500);

      await pageMM
      .locator("xpath=//button[@data-testid='edit-gas-fee-item-custom']")
      .click();

      await wait(3500);

      await pageMM
      .locator("xpath=//input[@data-testid='base-fee-input']")
      .fill(basicFee);

      await wait(3500);

      await pageMM
      .locator("xpath=//input[@data-testid='priority-fee-input']")
      .fill(priorityFee);
      await wait(3500);

      await pageMM
      .locator("xpath=//a[@data-testid='advanced-gas-fee-edit']")
      .click();
      await wait(3500);

      await pageMM
      .locator("xpath=//input[@data-testid='gas-limit-input']")
      .fill(gasLimit);
      await wait(3500);

      await pageMM
      .locator("xpath=//button[@class='button btn--rounded btn-primary']")
      .click();
    }
    catch(err){
    }
    await wait(2000);

    await pageMM
      .locator("xpath=//button[@data-testid='confirm-footer-button']")
      .click();
    await wait(1500);
    console.log(`Аккаунт  [${i}] завершен`);
    await browser.close();
  } catch (error) {
    console.log(error);
    await browser.close();
  }
}

export async function Faucet() {
  let i = 0;
  for (i; i < mnemonics.length; i++) {
    try {
      console.log(`Аккаунт [${i}] запущен`);      
      await faucetHyperliquid(
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

const cronJob = cron.scheduleJob('0 */4 * * *', async function() {
  console.log('Запуск задачи каждые 4 часа...');
  await Faucet();  // Запускаем вашу основную функцию Faucet
});
