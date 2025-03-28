import {
  Client,
  Emoji,
  parseEmoji,
  Partials,
  type TextChannel,
  type PartialEmoji,
} from "discord.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const client = new Client({
  intents: [
    "Guilds",
    "GuildMessages",
    "MessageContent",
    "GuildMessageReactions",
  ],
  partials: [Partials.Message, Partials.Reaction],
});

const resolveEmoji = (emoji: PartialEmoji) =>
  Object.getOwnPropertyDescriptor(Emoji.prototype, "identifier")!.get!.call<
    PartialEmoji,
    [],
    string
  >(emoji); // https://github.com/discordjs/discord.js/blob/main/packages/discord.js/src/structures/Emoji.js#L38-L41

client.on("messageCreate", async (message) => {
  if (message.channel.id === process.env.CHANNEL_ID_FOR_SETTING) {
    const [questionContents, emojiSyntax, editId] =
      message.content.split("---");
    const emojis = emojiSyntax?.trim().split("\n");
    if (!emojis) return; // ko se modi pogovarjajo v channelu za setanje
    if (editId) {
      const reactionRole = await prisma.reactionRole.findUnique({
        where: { id: editId.trim() },
        include: { emojis: true },
      });
      if (!reactionRole) return;
      const emojis = emojiSyntax
        .trim()
        .split("\n")
        .map(
          (i) =>
            [
              resolveEmoji(parseEmoji(i.split(" ")[0])!),
              i.split(" ").slice(1),
            ] as const
        );
      const onlyEmojis = emojis.map((i) => i[0]);

      const msg = await (
        (await client.channels.fetch(
          process.env.CHANNEL_ID_FOR_SENDING!
        )) as TextChannel
      ).messages.fetch(reactionRole.id);

      const previousReactions = msg.reactions.cache.clone();

      await msg.edit(questionContents);

      for (const [, reaction] of msg.reactions.cache.filter(
        (i) => !onlyEmojis.includes(i.emoji.identifier)
      ))
        await reaction.remove();

      for (const emoji of onlyEmojis.filter((i) => !msg.reactions.cache.has(i)))
        await msg.react(emoji);

      await prisma.reactionRole.update({
        where: { id: reactionRole.id },
        data: {
          questionContents,
          emojis: {
            update: emojis // kjer je role id drugacen
              .filter((emoji) =>
                previousReactions
                  .map((i) => i.emoji.identifier)
                  .includes(emoji[0])
              )
              .map(([emoji, roleIds]) => ({
                where: {
                  id: reactionRole.emojis.find((i) => i.emoji == emoji)!.id,
                },
                data: {
                  emoji,
                  roleIds: roleIds.map((roleId) => roleId.match(/\d+/)![0]),
                },
              })),

            create: emojis // novi emojiji
              .filter(
                (emoji) =>
                  !previousReactions
                    .map((i) => i.emoji.identifier)
                    .includes(emoji[0])
              )
              .map(([emoji, roleIds]) => ({
                emoji,
                roleIds: roleIds.map((roleId) => roleId.match(/\d+/)![0]),
              })),

            deleteMany: { emoji: { notIn: onlyEmojis } }, // izbrisani emojiji
          },
        },
      });
      return;
    }
    const msg = await (
      (await client.channels.fetch(
        process.env.CHANNEL_ID_FOR_SENDING!
      )) as TextChannel
    ).send(questionContents);

    for (const emoji of emojis) {
      await msg.react(emoji.split(" ")[0]);
    }

    await prisma.reactionRole.create({
      data: {
        id: msg.id,
        questionContents,
        emojis: {
          create: emojis.map((emoji) => ({
            emoji: resolveEmoji(parseEmoji(emoji.split(" ")[0])!),
            roleIds: emoji
              .split(" ")
              .slice(1)
              .filter(Boolean) // because autocompleting roles da space na koncu for some reason
              .map((roleId) => roleId.match(/\d+/)![0]),
          })),
        },
      },
    });
  }
});

client.on("messageReactionAdd", async (reaction, user) => {
  if (
    reaction.message.channel.id !== process.env.CHANNEL_ID_FOR_SENDING ||
    user.id === reaction.client.user.id
  )
    return;

  if (reaction.partial) reaction = await reaction.fetch();
  const reactionRole = await prisma.reactionRole.findUnique({
    where: { id: reaction.message.id },
    select: {
      emojis: {
        where: { emoji: reaction.emoji.identifier },
      },
    },
  });
  if (!reactionRole) return;
  const { roleIds } = reactionRole.emojis[0];

  const member = await reaction.message.guild?.members.fetch(user.id);
  if (!member) return;
  await member.roles.add(roleIds).catch(console.error);
});

client.on("messageReactionRemove", async (reaction, user) => {
  if (reaction.message.channel.id !== process.env.CHANNEL_ID_FOR_SENDING)
    return;
  if (reaction.partial) reaction = await reaction.fetch();
  const reactionRole = await prisma.reactionRole.findUnique({
    where: { id: reaction.message.id },
    select: {
      emojis: {
        where: { emoji: reaction.emoji.identifier },
      },
    },
  });
  if (!reactionRole) return;
  const { roleIds } = reactionRole.emojis[0];

  const member = await reaction.message.guild?.members.fetch(user.id);
  if (!member) return;
  await member.roles.remove(roleIds).catch(console.error);
});

client.on("ready", async (client) => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.login(process.env.TOKEN);
