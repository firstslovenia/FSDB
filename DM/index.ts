import { Client } from "discord.js";
import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";

const serviceAccountAuth = new JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: process.env.GOOGLE_PRIVATE_KEY,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const client = new Client({ intents: [] });

const doc = new GoogleSpreadsheet(
  process.env.GOOGLE_SPREADSHEET_ID!,
  serviceAccountAuth
);

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "poslji-podatke") {
    await interaction.deferReply();

    const imePriimek = interaction.options.getString("ime-priimek")!;
    const razred = interaction.options.getString("razred")!;
    const email = interaction.options.getString("email")!;
    const telefon = interaction.options.getString("telefon")!;

    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[0];
    await sheet.addRow({
      "Ime Priimek": imePriimek,
      Razred: razred,
      Email: email,
      Telefon: telefon,
    });
    await interaction.editReply("Poslano :)");
  }
});

client.on("ready", (client) => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.login(process.env.TOKEN);
