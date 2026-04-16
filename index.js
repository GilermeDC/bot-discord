const { setDefaultResultOrder } = require('dns');
setDefaultResultOrder('ipv4first');

const { Client, GatewayIntentBits } = require('discord.js');
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  StreamType,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  entersState
} = require('@discordjs/voice');

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

// 🔊 FUNÇÃO DE FALA (SEM gtts / SEM ffmpeg)
async function falar(texto) {
  return new Promise((resolve) => {
    try {
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(texto)}&tl=pt&client=tw-ob`;

      const resource = createAudioResource(url, {
        inputType: StreamType.Arbitrary
      });

      const player = createAudioPlayer();
      connection.subscribe(player);

      player.play(resource);

      player.on(AudioPlayerStatus.Idle, () => {
        resolve();
      });

    } catch (err) {
      console.error("Erro ao falar:", err);
      resolve();
    }
  });
}

client.on('clientReady', () => {
  console.log(`Logado como ${client.user.tag}`);
});

client.on('messageCreate', async (msg) => {
  if (msg.content === '!chamada') {

    const channel = msg.member.voice.channel;

    if (!channel) {
      return msg.reply('Entra em uma call primeiro!');
    }

    connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: channel.guild.id,
      adapterCreator: channel.guild.voiceAdapterCreator,
      selfDeaf: false,
      selfMute: false
    });

    connection.on('stateChange', (oldState, newState) => {
      console.log(`Conexão: ${oldState.status} -> ${newState.status}`);
    });

    try {
      await entersState(connection, VoiceConnectionStatus.Ready, 20000);
      console.log("✅ Conectado na call!");
    } catch (error) {
      console.error("❌ Erro ao conectar na call:", error);
      return;
    }

    const membros = channel.members
      .filter(m => !m.user.bot)
      .map(m => m.displayName);

    await falar("Chamada K J H iniciando");

    for (const nome of membros) {
      await falar(nome);
      await sleep(5000);
    }

    await falar("Fim da chamada");
  }
});

client.login(process.env.TOKEN);