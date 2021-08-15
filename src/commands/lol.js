const axios = require('axios').default;

const groupBy = (array, key) => {
  return array.reduce((acc, item) => {
    (acc[item[key]] = acc[item[key]] || []).push(item);
    return acc;
  }, {});
};

const lol = (() => {
  // TODO: Implement setRegion function
  // TODO: Implement help function
  let champions = {};

  const init = async () => {
    try {
      // TODO: Get latest version before fetch champions
      const championsResponse = await axios.get(
        `http://ddragon.leagueoflegends.com/cdn/11.16.1/data/de_DE/champion.json`
      );
      if (championsResponse.status === 200) {
        Object.values(championsResponse.data.data).forEach(champ => {
          // Index champions by key (champion id)
          champions[champ.key] = champ;
        });
        console.log('Champions loaded!');
      }
    } catch (error) {
      console.log('Error', error);
    }
  };

  const getLeagueData = async (summonerId) => {
    try {
      const leagueResponse = await axios.get(
        `https://la1.api.riotgames.com/lol/league/v4/entries/by-summoner/${summonerId}`
      );
      if (leagueResponse.status === 200 && leagueResponse.data.length !== 0) {
        const { data: leagueData } = leagueResponse;
        return leagueData[0];
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  const getSpectatorData = async (summonerId) => {
    try {
      const spectatorResponse = await axios.get(
        `https://la1.api.riotgames.com/lol/spectator/v4/active-games/by-summoner/${summonerId}`
      );
      if (spectatorResponse.status === 200) {
        const { data: spectatorData } = spectatorResponse;
        return spectatorData;
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  const execute = async (msg, args) => {
    let stats = 'None';
    let currentGame = 'None';
    const [summonerName] = args;
    axios.defaults.headers = {
      'X-Riot-Token': process.env.RIOT_KEY,
    }
    try {
      const summonerResponse = await axios.get(
        `https://la1.api.riotgames.com/lol/summoner/v4/summoners/by-name/${summonerName}`,
      );
      if (summonerResponse.status === 200) {
        const { data: summonerData } = summonerResponse;
        const leagueData = await getLeagueData(summonerData.id);
        if (leagueData) {
          const {
            queueType,
            tier,
            rank,
            leaguePoints,
            wins,
            losses,
          } = leagueData;
          stats =
            `${queueType}: ${tier} ${rank} (${
              leaguePoints
            } points)\nWins: ${wins}\nLosses: ${losses}`;
        }
        const spectatorData = await getSpectatorData(summonerData.id);
        if (spectatorData) {
          currentGame = '';
          const { participants } = spectatorData;
          // values stores the league data of every player of the current match
          const values = await Promise.all(participants.map(
            participant => getLeagueData(participant.summonerId),
          ));
          // groupedParticipants stores an object with only two keys (the two teams)
          const groupedParticipants = groupBy(participants, 'teamId');
          Object.keys(groupedParticipants).forEach((groupKey, index) => {
            groupedParticipants[groupKey].map((participant) => {
              const match = values.find(value => {
                if (value) {
                  return value.summonerId === participant.summonerId;
                }
                return false;
              });
              if (match) {
                // The player has league data
                currentGame =
                  `${currentGame}${match.summonerName} [${
                      champions[participant.championId].name
                    }] (${match.tier} ${match.rank} W:${match.wins} L:${match.losses})\n`;
              } else {
                // The player doesn't have league data
                currentGame = `${currentGame}${participant.summonerName} [${
                  champions[participant.championId].name
                }]\n`;
              }
            });
            if (index === 0) {
              currentGame = `${currentGame}\nVS\n\n`;
            }
          })
        }
        msg.reply(`${summonerName}\n\nCURRENT GAME:\n\n${currentGame}\n\nSTATS:\n${stats}`);
      }
    } catch (error) {
      if (error.response?.status === 404) {
        msg.reply(`${summonerName} not found`);
      }
      console.log('Error: ', error);
    }
  }

  init();

  return {
    description: 'League of Legends app',
    execute,
  }

})();

module.exports = lol;
