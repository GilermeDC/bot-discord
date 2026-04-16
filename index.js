const { setDefaultResultOrder } = require('dns');
setDefaultResultOrder('ipv4first');

const { Client, GatewayIntentBits } = require('discord.js');
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  entersState
} = require('@discordjs/voice');
const gTTS = require('node-gtts')('pt');
const fs = require('fs');
const path = require('path');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

let connection;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function falar(texto) {
  return new Promise((resolve) => {
    const filePath = path.join(__dirname, `audio_${Date.now()}.mp3`);

    gTTS.save(filePath, texto, (err) => {
      if (err) {
        console.error('Erro ao gerar áudio:', err);
        return resolve();
      }

      const resource = createAudioResource(filePath);
      const player = createAudioPlayer();

      connection.subscribe(player);
      player.play(resource);

      player.on(AudioPlayerStatus.Idle, () => {
        try { fs.unlinkSync(filePath); } catch (e) {}
        resolve();
      });

      player.on('error', (err) => {
        console.error('Erro no player:', err);
        try { fs.unlinkSync(filePath); } catch (e) {}
        resolve();
      });
    });
  });
}

// ✅ clientReady para discord.js v14
client.on('clientReady', () => {
  console.log(`Logado como ${client.user.tag}`);
});

client.on('messageCreate', async (msg) => {
  if (msg.content === '!chamada') {

    const channel = msg.member?.voice?.channel;
    if (!channel) return msg.reply('Entra em uma call primeiro!');

  connection = joinVoiceChannel({
  channelId: channel.id,
  guildId: channel.guild.id,
  adapterCreator: channel.guild.voiceAdapterCreator,
  selfDeaf: false,
  selfMute: false,
  debug: true
});

    connection.on('stateChange', (oldState, newState) => {
      console.log(`Conexão: ${oldState.status} -> ${newState.status}`);
    });

    // 🔍 Log de desconexão com motivo
    connection.on(VoiceConnectionStatus.Disconnected, (oldState, newState) => {
      console.log('❌ Desconectado!', newState.reason, newState.closeCode);
    });

    try {
      await entersState(connection, VoiceConnectionStatus.Ready, 20000);
      console.log('✅ Conectado na call!');
    } catch (error) {
      console.error('❌ Timeout ao conectar na call:', error.message);
      connection.destroy();
      return msg.reply('Não consegui entrar na call. Veja os logs.');
    }

    const membros = channel.members
      .filter(m => !m.user.bot)
      .map(m => m.displayName);

    await falar('Chamada K J H iniciando');

    for (const nome of membros) {
      await falar(nome);
      await sleep(5000);
    }

    await falar('Fim da chamada');
  }
});

client.login(process.env.TOKEN);