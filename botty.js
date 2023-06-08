// Require necessary modules and initialize the discord client
const repl = require("node:repl");
const msg = "message";

repl.start("> ").context.m = msg;

const { Client, GatewayIntentBits } = require("discord.js");
const axios = require("axios");
require("dotenv").config({ path: "./keys.env" });

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Get the API key and list of currencies
const apiKey = process.env.API_KEY;
const currencies = ["USD", "EUR", "GBP", "BRL", "ISK"];
const currenciesParam = currencies.map(encodeURIComponent).join("%2C");
const apiUrl = `https://api.currencyapi.com/v3/latest?apikey=${apiKey}&currencies=${currenciesParam}`;

let currency;
function grabCurrency(string) {
  // If any currency is found in the string, it is returned
  if (string.includes("usd")) {
    return (currency = "usd");
  } else if (string.includes("eur")) {
    return (currency = "eur");
  } else if (string.includes("gbp")) {
    return (currency = "gbp");
  } else if (string.includes("brl")) {
    return (currency = "brl");
  } else if (string.includes("isk")) {
    return (currency = "isk");
  } else {
    throw new Error("Currency not found");
  }
}
let exchangeRates = {};

function convertCurrency(amount, currency) {
  let convertedRates = {};

  // Depending on the currency, the conversion is performed.
  // At the end, the object with all converted rates is returned.
  if (currency == "usd") {
    convertedRates = { ...exchangeRates };
    for (const item in exchangeRates) {
      convertedRates[item] = exchangeRates[item] * amount;
    }
    return convertedRates;
  } else if (currency == "eur") {
    convertedRates = { ...exchangeRates };
    for (const item in exchangeRates) {
      convertedRates[item] =
        (exchangeRates[item] / exchangeRates["EUR"]) * amount;
    }
    return convertedRates;
  } else if (currency == "gbp") {
    for (const item in exchangeRates) {
      convertedRates[item] =
        (exchangeRates[item] / exchangeRates["GBP"]) * amount;
    }
    return convertedRates;
  } else if (currency == "brl") {
    for (const item in exchangeRates) {
      convertedRates[item] =
        (exchangeRates[item] / exchangeRates["BRL"]) * amount;
    }
    return convertedRates;
  } else if (currency == "isk") {
    for (const item in exchangeRates) {
      convertedRates[item] =
        (exchangeRates[item] / exchangeRates["ISK"]) * amount;
    }
    return convertedRates;
  } else {
    throw new Error("Conversion failed");
  }
}

function formatExchangeRates(exchangeRates) {
  // Each currency's exchange rate is added to the string in the specified order
  // At the end, the formatted string with all exchange rates is returned
  const order = ["USD", "EUR", "GBP", "BRL", "ISK"];
  let formattedString = "";

  for (const currency of order) {
    if (currency in exchangeRates) {
      formattedString += `${currency}: ${getFormattedRate(
        currency,
        exchangeRates[currency]
      )}\n`;
    }
  }

  return formattedString;
}

function getFormattedRate(currency, rate) {
  switch (currency) {
    case "USD":
      return rate.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
      });
    case "EUR":
      return rate.toLocaleString("en-US", {
        style: "currency",
        currency: "EUR",
      });
    case "GBP":
      return rate.toLocaleString("en-US", {
        style: "currency",
        currency: "GBP",
      });
    case "BRL":
      return rate.toLocaleString("en-US", {
        style: "currency",
        currency: "BRL",
      });
    case "ISK":
      return rate.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "kr";
    default:
      return rate.toLocaleString("en-US", {
        style: "currency",
        currency: currency,
      });
  }
}

// Event listener for receiving messages.
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (message.content.startsWith("!copy ")) {
    // Copy command: repeats the message after "!copy"
    let prompt = message.content.slice(6);
    message.channel.send(prompt);
  }
  if (message.content.startsWith("!flip")) {
    message.channel.send(Math.random() < 0.5 ? 'Heads' : 'Tails');
  }

  if (message.content.startsWith("!joke")) {
    axios
      .get("https://v2.jokeapi.dev/joke/Any?type=single")
      .then(function (response) {
        let joke = response.data.joke;
        message.channel.send(joke);
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  if (message.content.startsWith("!meme")) {
    axios
      .get("https://meme-api.com/gimme")
      .then(function (response) {
        const memeUrl = response.data.url;
        console.log(memeUrl);
        message.channel.send({ files: [memeUrl] })
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  if (message.content.startsWith("!c ")) {
    let prompt = message.content.slice(3);
    const lowercaseContent = prompt.toLowerCase();

    axios
      .get(apiUrl)
      .then(function (response) {
        const rates = response.data.data;
        numericValue = parseFloat(prompt);
        for (const item in rates) {
          exchangeRates[item] = rates[item].value;
        }
        if (isNaN(numericValue)) {
          return Promise.reject(new Error("Invalid numeric value"));
        } else {
          try {
            grabCurrency(lowercaseContent);
            let msg = convertCurrency(numericValue, currency);
            console.log(msg);
            const formattedString = formatExchangeRates(msg);
            message.channel.send("```\n" + formattedString + "```");
          } catch (error) {
            return Promise.reject(error);
          }
        }
      })
      .catch(function (error) {
        console.error(error);
      });
  }
});

client.on("ready", () => {
  console.log(`Bot is ready!`);
});
client.login(process.env.DISCORD_BOT_TOKEN);
