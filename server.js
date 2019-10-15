// server.js

// init project
var lmao = 9;
const Discord = require('discord.js');
const client = new Discord.Client();
const ytdl = require('ytdl-core');
const SQLite = require("better-sqlite3");
const sql = new SQLite('./scores/sqlite');
// init bot
client.on("ready", () => {

	console.log('Bot on')
  //check of the table exists for points
  
  const table = sql.prepare("SELECT count(*) FROM sqlite_master WHERE type='table' AND name='scores';").get();
  if(!table['count(*)']) {
    //if not there create it and set it up
    sql.prepare("CREATE TABLE scores (id TEXT PRIMARY KEY, user TEXT, guild TEXT, points INTEGER, level INTEGER);").run()
    sql.prepare("CREATE UNIQUE INDEX idx_scores_id ON scores (id);").run();
    sql.pragma("synchronous = 1");
    sql.pragma("journal_mode = wal");
  }
  //Getter and Setter
  client.getScore = sql.prepare("SELECT * FROM scores WHERE user = ? AND guild = ?");
  client.setScore = sql.prepare("INSERT OR REPLACE INTO scores(id, user, guild, points, level) VALUES (@id, @user, @guild, @points, @level);");
})

client.once('disconnect', () => {
 console.log('Disconnected');
})

client.once('reconnecting', () => {
 console.log('Reconnecting...');
})

client.on('message', msg => {
  //make sure bots aren't responded to
  if (msg.author.bot || !msg.guild) return;
  //More stuff that works with the SQL
  //init score
  let score;
  
  if(msg.guild){
    score = client.getScore.get(msg.author.id, msg.guild.id);
    //If no score exists, initialize
    if(!score){
      score = {id: `${msg.guild.id}-${msg.author.id}`, user: msg.author.id, guild: msg.guild.id, points: 0, level: 1};
    }
    //increment user points
    score.points++;
    //calc current level 
    const curLevel = Math.floor(0.1 * Math.sqrt(score.points));
    //check if user leveled up
    if(score.level < curLevel) {
      //level up
      //msg.reply(`Level Up! You are now **${curLevel}**!`);
    }
    //save data
    client.setScore.run(score);
  }
  //Gets rid of none - commands when uncommented
  //if(msg.content.indexOf(process.env.prefix) !== 0) return;

  const prefix = '-';
  const args = msg.content.slice(prefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();
  const queue = new Map();
  const serverQ = queue.get(msg.guild.id);


  if(command === 'echoes'){
  	execute(msg, serverQ)
  }

  if(command === 'act2'){
  	skip(msg, serverQ)
  }

  if(command === '3freeze'){
  	stop(msg, serverQ)
  }

  async function execute(message, serverQ){
  	const args = msg.content.split(' ')
  	const voiceChannel = msg.member.voiceChannel
  	if(!voiceChannel) return msg.channel.send('You need to be in a voice channel to summon this stand')
  	const permissions = voiceChannel.permissionsFor(msg.client.user)
  	if(!permissions.has('CONNECT') || !permissions.has('SPEAK')){
  		return msg.channel.send('Echoes needs permission to join and talk in voice')
  	}
  	const songInfo = await ytdl.getInfo(args[1])
    const song = {
  		title: songInfo.title,
  		url: songInfo.video_url
  	}

  	if(!serverQ){
  		const qConstructor = {
  			textChannel: msg.channel,
  			voiceChannel: voiceChannel,
  			connection: null,
  			songs: [],
  			volume: 5,
  			playing: true
  		}

  		queue.set(msg.guild.id, qConstructor)
  		qConstructor.songs.push(song)

  		try{
  			var connect = await voiceChannel.join()
  			qConstructor.connection = connect
  			play(msg.guild, qConstructor.songs[0])
  		} catch(e){
  			console.log(e);
  			queue.delete(msg.guild.id)
  			return msg.channel.send(e)
  		}
  	} 
  	 else {
  	 	serverQ.songs.push(song)
  	 	console.log(serverQ.songs)
  	 	return msg.channel.send('${song.title} added to the queue')
  	 }
  }

  function play(guild, song){
  	const serverQ = queue.get(guild.id)

  	if(!song){
  		serverQ.voiceChannel.leave()
  		queue.delete(guild.id)
  		return
  	}

  	const dispatcher = serverQ.connection.playStream(ytdl(song.url))
  		.on('end', () => {
  			console.log('Song Over')
  			serverQ.songs.shift()
  			play(guild, serverQ.songs[0])
  		})
  		.on('error', error =>{
  			console.log(error)
  		})

  	dispatcher.setVolumeLogarithmic(serverQ.volume / 5)
  }

  function skip(message, serverQ){
  	if(!msg.member.voiceChannel) return msg.channel.send('You must be in a voice channel to use this stand')
  	if(!serverQ) return msg.channel.send('No song to skip')
  		serverQ.connection.dispatcher.end()
  }

  function stop(message, serverQ){
  	if(!msg.member.voiceChannel) return msg.channel.send('You must be in a voice channel to use this stand')
  	serverQ.songs = [];
  	serverQ.connection.dispatcher.end()
  }

  //Commands that work with the SQL set up
  if(command === "starplatinum"){ 
  	//var test = client.getScore.get(args[0], msg.guild.id)
    return msg.reply(`You have sent ${score.points} messages`, {files: ['https://i.imgur.com/RFdmmFi.gif']}); 
  }

  if(command === "leaderboard"){
    //Get
    const top10 = sql.prepare("SELECT * FROM scores WHERE guild = ? ORDER BY points DESC LIMIT 10;").all(msg.guild.id);

    //Show
    const embed = new Discord.RichEmbed()
      .setTitle("Leaderboard")
      .setAuthor(client.user.usernmane, client.user.avatarURL)
      .setDescription("Our top 10 point leaders!")
      .setColor(0x00AE86);

    for(const data of top10){
      embed.addField(client.users.get(data.user).tag, `${data.points} points (level ${data.level})`);
    }
    return msg.channel.send({embed});
  } 

  if (command === "zahando" && (msg.author.id === "284457363707002936" || msg.author.id === "144597989434982400")) {
  	msg.channel.send('ZA HANDO', {files: ["https://i.imgur.com/dNhGYu2.jpg"]})
  		.then(msg =>{
  			msg.delete(10000)
  		})
  		var temp = parseInt(args[0])
  		var temp2 = parseInt(lmao)
  		lmao = temp + temp2
        async function clear() {
            msg.delete();
            var amount = args[0]
            if(amount == undefined) amount = 2
            const fetched = await msg.channel.fetchMessages({limit: amount});
            msg.channel.bulkDelete(fetched);
        }
        clear();
    }

    if(command === "zahandocount"){
    	msg.channel.send(lmao + " messages deleted", {files: ["https://i.kym-cdn.com/photos/images/original/001/106/277/7c8.gif"]})
    }
  
  //if (msg.content.toUpperCase() === 'LMAO'){
    //lmao++;
   // msg.channel.send(' that\'s lmao #' + lmao + ' of the day');
 // };
  
  if (msg.content === 'smh'){
    msg.channel.send('jfc');
  };

  if (msg.content === 'jfc'){
      msg.channel.send('smh');
    };
    const spike = client.emojis.find(emoji => emoji.name === "spike");
  if (msg.content == spike && msg.author.id === "122838807828496386"){
  	msg.delete()
  	msg.channel.send({files: ["https://www.mariowiki.com/images/thumb/0/09/ThwompNSMBU.png/1200px-ThwompNSMBU.png"]})
  }
  var re = new RegExp('ree+', 'i')
  if (msg.content === 'ree' || msg.content === 'reee' || msg.content === 'reeee' || msg.content === 'reeeee' || msg.content === 'reeeeee' || msg.content === 'reeeeeeee'){
  	msg.channel.send({files: ["https://i.kym-cdn.com/photos/images/newsfeed/000/915/652/b49.gif"]})
  }
  
});

client.login('NDEzNDY0OTkxMjU4Mzc4MjQz.XMdGFg.N8DS8u2FZbynok4-O0zdgk5I33g');
    
