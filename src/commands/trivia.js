const axios = require('axios').default;

// TODO: Move to utils
function shuffle(array) {
  let currentIndex = array.length;
  while (0 !== currentIndex) {
    const randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }

  return array;
}

const trivia = (() => {
  // TODO: Implement help function
  let currentTrivia = -1;
  let questions = [];

  const init = async () => {
    try {
      const response = await axios.get('https://opentdb.com/api.php?amount=50&category=31');
      if (response.status === 200) {
        const results = response.data?.results;
        questions = results.map((question) => {
          const answers = {};
          if (question.type === 'boolean') {
            answers['a'] = 'True';
            answers['b'] = 'False';
          } else if (question.type === 'multiple') {
            const unshuffledAnswers = [question.correct_answer, ...question.incorrect_answers];
            const shuffledAnswers = shuffle(unshuffledAnswers);
            ['a', 'b', 'c', 'd'].forEach((option, index) => {
              if (shuffledAnswers[index]) {
                answers[option] = shuffledAnswers[index];
              }
            });
          }
          return {
            ...question,
            answers,
          }
        });
      }
    } catch (error) {
      console.log('Error: ', error);
    }
  }

  const execute = (msg, args) => {
    const [command] = args;
    let triviaState = "CURRENT Trivia:";
    if (command === 'new') {
      if (currentTrivia === -1) {
        triviaState = "NEW Trivia:";
        currentTrivia = Math.floor(Math.random() * questions.length);
      }
      const question = questions[currentTrivia].question.replace(/&quot;/g,'"');
      const answers = Object.keys(questions[currentTrivia].answers)
        .map((answerKey) => `${answerKey}) ${questions[currentTrivia].answers[answerKey]}`)
        .join('\n');
      msg.reply(`${triviaState}\n\n${question}\n\n${answers}`);
    } else if (command.match(/[abcd]/)) {
      if (currentTrivia !== -1) {
        const userAnswer = questions[currentTrivia].answers[command];
        if (userAnswer === questions[currentTrivia].correct_answer) {
          msg.reply("Correct! :D");
        } else {
          msg.reply("Incorrect! :(");
        }
        currentTrivia = -1;
      } else {
        msg.reply("Type !js trivia new");
      }
    } else {
      // TODO: Create a commands object similar to the one on index.js
      msg.reply("Trivia app commands:\n\n!js trivia new: Request a new trivia\n!js trivia [option]: Respond to a trivia");
    }
  }

  init();

  return {
    description: 'Trivia app',
    execute,
  }
})();

module.exports = trivia;
