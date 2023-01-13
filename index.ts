import 'dotenv/config';
import { getHtmlTemplate } from './template-generation';
import nodeHtmlToImage = require('node-html-to-image');

const {
    AttachmentBuilder,
    Client,
    GatewayIntentBits,
    ActionRowBuilder, ButtonBuilder, ButtonStyle
} = require('discord.js');

// Create a new client instance
const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

// When the client is ready, run this code (only once)
client.once('ready', async () => {
    console.log('Promotion Bot is ready!');
});

client.on('interactionCreate', async interaction => {
	if (!interaction.isCommand()) return;

    if (interaction.commandName === 'banner') {
      const user = interaction.options.getUser("user");
      const member = interaction.guild.members.cache.get(user.id);
      const roles = member._roles;

      await interaction.deferReply({ ephemeral: true });

      let battalionLeader = interaction.guild.roles.cache.find(r => r.name.toLowerCase() === "battalion leader");
      let surgenceListed = interaction.guild.roles.cache.find(r => r.name.toLowerCase() === "surgence listed");

      try {
        // Check if roles are defined
        if(battalionLeader == undefined || surgenceListed == undefined) {
          await interaction.editReply({ content: "The Battalion Leader and/or Surgence Listed roles aren't defined!", ephemeral: true }); 
        } else {
          const avatar = "https://cdn.discordapp.com/avatars/" + user.id + "/" + user.avatar + ".png?size=256";
          const isBattalionLeader = roles.find(role => role === battalionLeader.id);
          const isSurgenceListed = roles.find(role => role === surgenceListed.id);
          const imageName = isSurgenceListed ? "surgence-listed.png" : "battalion-leader.png";

          // Build the Tweet-Button
          const row = new ActionRowBuilder()
            .addComponents(
              new ButtonBuilder()
                .setLabel('Tweet')
                .setStyle(ButtonStyle.Link)
                .setURL("https://twitter.com/compose/tweet")
            );

          if(isSurgenceListed) { // Check if Surgence Listed
            const attachment = await getAttachment(avatar, user, true, imageName);

            const embed = {
              color: 0x0099ff,
              image: {
                url: "attachment://" + imageName,
              }
            };

            await interaction.editReply({ content: "Congratulation <@" + user.id + ">, you have been promoted! \n\nLet your network know about your journey here in Surgence.", embeds: [embed], files: [attachment], components: [row] });  

          } else if(isBattalionLeader) { // Check if Battalion Leader
            const attachment = await getAttachment(avatar, user, false, imageName);

            const embed = {
              color: 0x0099ff,
              image: {
                url: "attachment://" + imageName,
              }
            };

            await interaction.editReply({ content: "Congratulation <@" + user.id + ">, you have been promoted! \n\nLet your network know about your journey here in Surgence.", embeds: [embed], files: [attachment], components: [row] });

          } else { // If user isn't promotable
            await interaction.editReply({ content: "You can't generate a promotion image for " + user.username + "#" + user.discriminator + " because he isn't a Battalion Leader or Surgence Listed!", ephemeral: true }); 
          }
        }
      } catch (error) {
        console.log(error);
      }
              
    }
});

// Login to Discord with your client's token
client.login(process.env.DISCORD_BOT_TOKEN);

// Generates the attachement
async function getAttachment(avatar : string, user : any, isSurgenceListed : boolean, imageName : string) {
  const _htmlTemplate = getHtmlTemplate(avatar, user.username + "#" + user.discriminator, isSurgenceListed);

  const images = await nodeHtmlToImage({
    html: _htmlTemplate,
    quality: 100,
    type: 'png',
    puppeteerArgs: {
      args: ['--no-sandbox'],
    },
    encoding: 'binary',
  });

  return new AttachmentBuilder(images, { name: imageName });
}
 