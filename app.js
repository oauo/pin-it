'use strict';

const Discord = require("discord.js"), Client = new Discord.Client();
let _tempconfig; try { _tempconfig = require("./config.json"); } catch { _tempconfig = { token: "TOKEN HERE", pinsRequired: 5 }; }; const config = _tempconfig;
const fs = require('fs');
const Emojis = {
    pushpin: "\u{1f4cc}",
    thumbsup: "\u{1f44D}"
}

//Bot
function init() {
    if (config.token == "TOKEN HERE") {
        storeData(config, "./config.json");
        console.log("Go to config.json and change [TOKEN HERE] to your bot token, and restart.");
        return;
    }

    //Add event listeners
    Client.on("ready", onReady);
    Client.on("message", async message => onMessage(message));
    Client.on("messageReactionAdd", async (messageReaction, user) => onMessageReactionAdd(messageReaction, user));

    //Request bot token and/or login
    Client.login(config.token).catch(() => { console.log("Token rejected, ensure it is correct, and restart.") });
}

const storeData = (data, path) => {
    try {
        fs.writeFileSync(path, JSON.stringify(data))
    } catch (err) {
        console.error(err)
    }
}

const onReady = () => {
    Client.user.setActivity("Pinning messages");
    [...Client.guilds.values()].forEach(g => { //Fetch latest 100 messages from each text channel from all guilds - so it works on some messages it wasn't around for.
        console.log(g.name);
        g.channels.filter(x => x.type == "text").forEach(c => {
            c.fetchMessages({ limit: 100 }).catch(() => { });
        });
    });
    console.log("Bot connected successfully");
}

const onMessage = message => {
    console.log(message.content);
    if (message.content.indexOf(Emojis.pushpin) == 0 && message.guild.members.get(message.author.id).hasPermission("MANAGE_MESSAGES")) {
        config.pinsRequired = parseInt(message.content.match(/x *(\d+)/)[1]);
        storeData(config, "./config.json");
        message.react(Emojis.thumbsup);
    }
}

const onMessageReactionAdd = (messageReaction, user) => {
    if (messageReaction.emoji.name == Emojis.pushpin) {
        if (messageReaction.message.author.id == user.id) {
            messageReaction.remove(user).catch(() => { console.log("Bot does not have permission to remove reactions from messages, give \"Manage messages\" permission.") });
        } else if (messageReaction.count >= config.pinsRequired) {
            messageReaction.message.pin().catch(() => {
                messageReaction.message.channel.send("Bot does not have permission to pin messages, give \"Manage messages\" permission.")
            });
        }
    }
}

init();