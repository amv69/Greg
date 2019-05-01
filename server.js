// server.js
// where your node app starts

// init project
var lmao = 0;
const Discord = require('discord.js');
const client = new Discord.Client();
const SQLite = require("better-sqlite3");
const sql = new SQLite('./scores/sqlite');
// init bot
client.on("ready", () => {
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
client.on('message', msg => {
  //make sure bots aren't responded to
  if (msg.author.bot || !msg.guild) return;
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
    console.log('worked');
    //calc current level 
    const curLevel = Math.floor(0.1 * Math.sqrt(score.points));
    //check if user leveled up
    if(score.level < curLevel) {
      //level up
      msg.reply(`Level Up! You are now **${curLevel}**!`);
    }
    //save data
    client.setScore.run(score);
  }
  //Gets rid of none - commands when uncommented
  //if(msg.content.indexOf(process.env.prefix) !== 0) return;

  const args = msg.content.slice(process.env.prefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();

  if(command === "points"){
    return msg.reply(`You currently have ${score.points} points and are level ${score.level}!`);
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

  if (msg.content.toUpperCase() === 'LMAO'){
    lmao++;
    msg.channel.send(' that\'s lmao #' + lmao + ' of the day');
  };
  
  if (msg.content === 'smh'){
    msg.channel.send('jfc');
  };

  if (msg.content === 'jfc'){
      msg.channel.send('smh');
    };
  
});

client.login(process.env.BOT_TOKEN);
    