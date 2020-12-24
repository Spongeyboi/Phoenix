exports.boot=async()=>{
  const Database = require("@replit/database")
  const db = new Database()

  var settings = require("../settings.json")
  const Eris = require("eris")

  const client = new Eris.CommandClient(settings.token, {
    maxShards:1,
    defaultImageFormat:"png"
  }, {
    description: settings.description || "A bot made with eris",
    owner: settings.owner || "a mysterius user",
    prefix: [settings.prefix,"@mention "]
  });

  client.on("ready",()=>{
    console.log("All shards have started. The bot was marked as ready.")
    setInterval(()=>{
      client.editStatus("online",{name:`p!help | ${client.guilds.size} guilds | ${client.shards.size} shards`})
      stats.servercount = client.guilds.size
      stats.usercount = client.users.size
      stats.shardcount = client.shards.size
    },10000)
  })
  client.on("shardReady",(shard,guilds)=>{
    console.log(`Shard ${shard} has started`)
  })

  client.on("shardPreReady",(shard)=>{
    console.log(`Starting shard ${shard}.`)
  })

  client.on("shardDisconnect",(shard)=>{
    console.log(`Shard ${shard} disconnected`)
  })

  client.on("shardResume",(shard)=>{
    console.log(`Shard ${shard} is back`)
  })

  client.registerCommand("latency", (message,args)=>{
    client.createMessage(message.channel.id,`> :ping_pong: Pong! I have calculated the ping and it looks like the latency to you is **${message.createdTimestamp - message.createdTimestamp}** ms.`)
  }, { // Make a pong command
  // Responds with a random version of "Ping!" when someone says "!pong"
      description: "Stop pinging me",
      fullDescription: "This command checks if the bot is online. It is useful for seeing how long it takes for the bot to respond to your command."
  });

  client.registerCommand("invite",`You can invite the bot with one of these links\n>  ⠀\n> Normal link <https://discord.com/oauth2/authorize?client_id=${settings.clientid}&scope=bot&permissions=-9>\n> Admin link <https://discord.com/oauth2/authorize?client_id=${settings.clientid}&scope=bot&permissions=8>\n>  ⠀`,{
    description: "Invite the bot",
    fullDescription: "This command sends invite links to invite the bot."
  })

  client.registerCommand("warn",async(message,args)=>{
    if (!message.guildID) return client.createMessage(message.channel.id,"> <:error:790104021004320798> This command must be used in a server.")
    if (!message.member.permissions.has("kickMembers")) return client.createMessage(message.channel.id,"> <:error:790104021004320798> You don't have permissions to use this command. You need `kickMembers` to do this.")
    if (!message.mentions.length) return client.createMessage(message.channel.id,"> <:error:790104021004320798> You must mention the user you want to warn")
    var dm = await message.mentions[0].getDMChannel()
    var w = await db.get(message.mentions[0].id+message.guildID)
    if (w===null) w = 0
    var newwarn = w + 1
    await db.set(message.mentions[0].id+message.guildID+"warns",newwarn)
    client.createMessage(dm.id,`> **Punishment updated in ${message.channel.guild.name}**\n> You have been warned by a moderator!\n>  ⠀\n> Reason: ${args[1]}\n> Moderator: <@${message.member.id}>`)
    .then(()=>{client.createMessage(message.channel.id,`> <:success:790104020504150038> Warning logged for **${message.mentions[0].username}**`)})
    .catch(()=>{client.createMessage(message.channel.id,`> <:success:790104020504150038> Warning logged for **${message.mentions[0].username}** but I couldn't send them a DM.`)})
  },{
    description: "Warns a member if they break the rules.",
    fullDescription: "This command is used to strike users if they break any of the rules.",
    cooldown: 15000,
    cooldownMessage: "> A little too quick there. The cooldown for this command is 15 seconds.",
    aliases: ["w"]
  })

  client.registerCommand("warnings",async(message,args)=>{
    if (!message.guildID) return client.createMessage(message.channel.id,"> <:error:790104021004320798> This command must be used in a server.")
    var dm = await message.mentions[0] || message.member
    var w = await db.get(dm.id+message.guildID+"warns")
    if (w===null || w===0) return client.createMessage(message.channel.id,`> ${dm.username} is squeaky clean`)
    client.createMessage(message.channel.id,`> ${dm.username} has ${w} warnings. Moderators, you can clear them with p!clearwarns`)
  },{
    description: "View a member's warnings",
    fullDescription: "This command Checks how many warnings a user has",
    cooldown: 15000,
    cooldownMessage: "> A little too quick there. The cooldown for this command is 15 seconds.",
    aliases: ["logs","audit"]
  })

  client.registerCommand("clearwarns",async(message,args)=>{
    if (!message.guildID) return client.createMessage(message.channel.id,"> <:error:790104021004320798> This command must be used in a server.")
    if (!message.member.permissions.has("kickMembers")) return client.createMessage(message.channel.id,"> <:error:790104021004320798> You don't have permissions to use this command. You need `kickMembers` to do this.")
    if (!message.mentions.length) return client.createMessage(message.channel.id,"> <:error:790104021004320798> You must mention the user you want to warn")
    var dm = await message.mentions[0] || message.member
    await db.set(dm.id+message.guildID+"warns",0)
    client.createMessage(message.channel.id,`> <:success:790104020504150038> Cleared warnings for **${message.mentions[0].username}**`)
    },{
    description: "Clear a user's warnings",
    fullDescription: "Clear a user's warnings in a guild.",
    cooldown: 15000,
    cooldownMessage: "> A little too quick there. The cooldown for this command is 15 seconds.",
    audit: ["clear","deletewarns"]
  })

  client.registerCommand("kick",async(message,args)=>{
    if (!message.guildID) return client.createMessage(message.channel.id,"> <:error:790104021004320798> This command must be used in a server.")
    if (!message.member.permissions.has("kickMembers")) return client.createMessage(message.channel.id,"> <:error:790104021004320798> You don't have permissions to use this command. You need `kickMembers` to do this.")
    if (!message.mentions.length) return client.createMessage(message.channel.id,"> <:error:790104021004320798> You must mention the user you want to warn")
    client.kickGuildMember(message.guildID, message.mentions[0].id,args[1])
    .then(()=>{client.createMessage(message.channel.id,`> <:success:790104020504150038> Successfully kicked **${message.mentions[0].username}**`)})
    .catch(()=>{client.createMessage(message.channel.id,"> <:error:790104021004320798> I was unable to kick the user. Please ensure my role is above everything else and I have permissions to kick members")})
  },{
    description: "Kicks a member from the guild.",
    fullDescription: "This command is used to remove users from the guild.",
    cooldown: 15000,
    cooldownMessage: "> A little too quick there. The cooldown for this command is 15 seconds.",
    aliases: ["boot","cya","k","remove","goodbye"]
  })

  client.registerCommand("ban",async(message,args)=>{
    if (!message.guildID) return client.createMessage(message.channel.id,"> <:error:790104021004320798> This command must be used in a server.")
    if (!message.member.permissions.has("kickMembers")) return client.createMessage(message.channel.id,"> <:error:790104021004320798> You don't have permissions to use this command. You need `kickMembers` to do this.")
    if (!message.mentions.length) return client.createMessage(message.channel.id,"> <:error:790104021004320798> You must mention the user you want to warn")
    client.banGuildMember(message.guildID, message.mentions[0].id,args[1])
    .then(()=>{client.createMessage(message.channel.id,`> <:success:790104020504150038> Successfully banned **${message.mentions[0].username}**`)})
    .catch(()=>{client.createMessage(message.channel.id,"> <:error:790104021004320798> I was unable to ban the user. Please ensure my role is above everything else and I have permissions to ban members")})
  },{
    description: "Bans a member from the guild.",
    fullDescription: "This command is used to yeet users from the guild.",
    cooldown: 15000,
    cooldownMessage: "> A little too quick there. The cooldown for this command is 15 seconds.",
    aliases: ["hammer","thor","yeet","b","dont-return"]
  })
  client.registerCommand("bans",async(message,args)=>{
    if (!message.guildID) return client.createMessage(message.channel.id,"> <:error:790104021004320798> This command must be used in a server.")
    if (!message.member.permissions.has("kickMembers")) return client.createMessage(message.channel.id,"> <:error:790104021004320798> You don't have permissions to use this command. You need `kickMembers` to do this.")
    var bans = await client.getGuildBans(message.guildID).catch(()=>{return client.createMessage(message.channel.id),"> <:error:790104021004320798> I was unable to fetch the ban list. Weird isn't it."})
    client.createMessage(message.channel.id,`> There are **${bans.length}** bans in this server.`)
  },{
    description: "Sees how many people are in the server's ban list.",
    fullDescription: "This command is used to see the number of bans in the server.",
    cooldown: 5000,
    cooldownMessage: "> A little too quick there. The cooldown for this command is 5 seconds.",
    aliases: ["banlist","showbans","allbans"]
  })
  client.registerCommand("membercount",async(message,args)=>{
    if (!message.guildID) return client.createMessage(message.channel.id,"> <:error:790104021004320798> This command must be used in a server.")
     client.createMessage(message.channel.id,`> There are **${message.channel.guild.memberCount}** members in this server.`)
  },{
    description: "Sees how many people are in the server's ban list.",
    fullDescription: "This command is used to see the number of bans in the server.",
    cooldown: 5000,
    cooldownMessage: "> A little too quick there. The cooldown for this command is 5 seconds.",
    aliases: ["members","users","usercount"]
  })

  client.registerCommand("support",async(message,args)=>{
    client.createMessage(message.channel.id,`> Need help? Suggestions? Join the support server. Just wanna chat? Join the community.\n> Support server: <https://discord.gg/BK65Vq7>\n> Community server: <https://discord.gg/uVuPySdwhd>\n> Nothing here don't click: <https://discord.gg/7mPP8anAGq>`)
  },{
    description: "Get links to the support server",
    fullDescription: "This command is used to get help. It will give you the link to our community server.",
    cooldown: 5000,
    cooldownMessage: "> A little too quick there. The cooldown for this command is 5 seconds.",
    aliases: ["servers"]
  })

  client.registerCommand("avatar", async(message,args)=>{
    var member = message.mentions[0] || message.author
    client.createMessage(message.channel.id,{
      embed:{
        author:{
          name:`Avatar for ${member.username}`,
          icon_url: member.avatarURL
        },
        image:{
          url: member.dynamicAvatarURL("","4096")
        } 
      }
    })
  },{
    description: "displays a user's avatar",
    fullDescription: "This command displays people's avatar. Nothing interesting.",
    cooldown: 5000,
    cooldownMessage: "> A little too quick there. The cooldown for this command is 5 seconds.",
    aliases: ["thumb","av","pfp","usericon"]
  })

  client.registerCommand("suggest",async(message,args)=>{
    if (!message.guildID) return client.createMessage(message.channel.id,"> <:error:790104021004320798> This command must be used in a server.")
    var suggchannel = await db.get(message.guildID+"Suggestionchannel")
    client.createMessage(suggchannel,`> Suggestion by ${message.member.username}\n------------------------\n${args.join(" ")}`)
    .then(async(m)=>{await client.addMessageReaction(suggchannel,m.id,"success:790104020504150038"); await client.addMessageReaction(suggchannel,m.id,"error:790104021004320798"); client.createMessage(message.channel.id,`> <:success:790104020504150038> added your suggestion to <#${suggchannel}> Successfully`)})
    .catch((err)=>{console.log(err); client.createMessage(message.channel.id,`> <:error:790104021004320798> Couldn't send your suggestion. If you haven't setup suggestions yet, run \` p!Suggestionchannel \``)})
  },{
    description: "suggest a feature",
    fullDescription: "This command adds your suggestions to the suggestion channel.",
    cooldown: 60000,
    cooldownMessage: "> A little too quick there. The cooldown for this command is 1 minute.",
    aliases: ["sug"]
  })
  client.registerCommand("suggestionchannel",async(message,args)=>{
    if (!message.guildID) return client.createMessage(message.channel.id,"> <:error:790104021004320798> This command must be used in a server.")
    if (!message.member.permissions.has("kickMembers")) return client.createMessage(message.channel.id,"> <:error:790104021004320798> You don't have permissions to use this command. You need `kickMembers` to do this.")
    var suggchannel = await db.set(message.guildID+"Suggestionchannel",args[0])
    client.createMessage(message.channel.id,`> <:success:790104020504150038> I've set the suggestion channel to <#${args[0]}>`)
  },{
    description: "sets a suggestion channel",
    fullDescription: "This command sets the suggestion channel.",
    cooldown: 60000,
    cooldownMessage: "> A little too quick there. The cooldown for this command is 1 minute.",
    aliases: ["sugchannel"]
  })

  client.registerCommand("kadi",async(message,args)=>{
    var fetch = require("node-fetch");
    fetch(`https://api.augu.dev/kadi`).then(response=>response.json())
    .then(res=>{
      console.log(res)
      client.createMessage(message.channel.id,{
        embed:{
          author:{
            name:"Kadi with chris's api",
            url:res.url
          },
          color:Math.floor(Math.random(111111,999999)),
          image:{
            url:res.url
          }
        }
        }).catch((err)=>{
          var e = `e:${err}`
          switch(e){
            case "e:DiscordRESTError [50013]: Missing Permissions":
              client.createMessage(message.channel.id,"> <:error:790104021004320798> I was unable to send the message due to lack of permissions. I need the ` Embed links ` perm to send the message.")
              break;
            default:
            console.log(err)
              client.createMessage(message.channel.id,"> <:error:790104021004320798> I was unable to send the message due to an unknown error.")
          }
      })
    })
  },{
    description:"Red panda =)",
    fullDescription:"This command shows red panda. This uses Chris's api."
  })
  
  client.registerCommandAlias("ping","latency");
  client.registerCommandAlias("commands","help");

  client.connect();
}