'use strict';

const Discord = require("discord.js"), Client = new Discord.Client();
let _tempconfig; try { _tempconfig = require("./config.json"); } catch { _tempconfig = { token: "TOKEN HERE", pinsRequired: 5, blockedChannels: [] }; }; const config = _tempconfig;
const fs = require('fs');
const Emojis = {
    pushpin: "\u{1f4cc}",
    thumbsup: "\u{1f44d}",
    thumbsdown: "\u{1f44e}"
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
    [...Client.guilds.values()].forEach(g => { //Fetch latest 100 messages from each text channel - so it works on some messages it wasn't around for.
        g.channels.filter(x => x.type == "text").forEach(c => {
            c.fetchMessages({ limit: 100 }).catch(() => { });
        });
    });
    console.log("Bot connected successfully");
}

const onMessage = message => {
    if (message.content.indexOf(Emojis.pushpin) == 0 && message.guild.members.get(message.author.id).hasPermission("MANAGE_MESSAGES")) {
        let channelId = parseInt(message.channel.id);
        let noWhitespace = message.content.replace(/ /g, "");
        if (noWhitespace.indexOf(Emojis.thumbsdown) == 2) {
            if (config.blockedChannels.indexOf(channelId) == -1) {
                config.blockedChannels.push(channelId);
            }
            messageSuccess(message);
            setTimeout(function () {
                message.delete();
            }, 5000);
        } else if (noWhitespace.indexOf(Emojis.thumbsup) == 2) {
            config.blockedChannels = config.blockedChannels.filter(x => x != channelId);
            messageSuccess(message);
        } else if (/x(\d+)/.test(noWhitespace)) {
            config.pinsRequired = parseInt(message.content.match(/x *(\d+)/)[1]);
            messageSuccess(message);
        }
    }
}

const messageSuccess = message => {
    storeData(config, "./config.json");
    message.react(Emojis.thumbsup);
}

const onMessageReactionAdd = (messageReaction, user) => {
    if (messageReaction.emoji.name == Emojis.pushpin) {
        if (messageReaction.message.author.id == user.id || config.blockedChannels.indexOf(parseInt(messageReaction.message.channel.id)) != -1) {
            messageReaction.remove(user).catch(() => { console.log("Bot does not have permission to remove reactions from messages, give \"Manage messages\" permission.") });
        } else if (messageReaction.count >= config.pinsRequired) {
            messageReaction.message.pin().catch(() => {
                messageReaction.message.channel.send("Bot does not have permission to pin messages, give \"Manage messages\" permission.")
            });
        }
    }
}

init();