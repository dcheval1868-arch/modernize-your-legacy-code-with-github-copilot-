const readline = require('node:readline/promises');
const { stdin: input, stdout: output } = require('node:process');

function normalizeOperation(operation, length = 6) {
  return String(operation).padEnd(length, ' ').slice(0, length);
}

function round2(value) {
  return Number(Number(value).toFixed(2));
}

function parseAmount(inputValue) {
  const amount = Number.parseFloat(inputValue);
  if (Number.isNaN(amount)) {
    return 0;
  }

  return amount;
}

function createAccountingApp(initialBalance = 1000.0) {
  let storageBalance = round2(initialBalance);

  function dataProgram(passedOperation, balance) {
    const operationType = normalizeOperation(passedOperation).trimEnd();

    if (operationType === 'READ') {
      return storageBalance;
    }

    if (operationType === 'WRITE') {
      storageBalance = round2(balance);
    }

    return storageBalance;
  }

  async function operations(passedOperation, io) {
    const operationType = normalizeOperation(passedOperation);
    let amount = 0;
    let finalBalance = 1000.0;

    if (operationType === 'TOTAL ') {
      finalBalance = dataProgram('READ', finalBalance);
      io.write(`Current balance: ${finalBalance.toFixed(2)}`);
      return;
    }

    if (operationType === 'CREDIT') {
      const amountInput = await io.prompt('Enter credit amount: ');
      amount = parseAmount(amountInput);

      finalBalance = dataProgram('READ', finalBalance);
      finalBalance = round2(finalBalance + amount);
      dataProgram('WRITE', finalBalance);
      io.write(`Amount credited. New balance: ${finalBalance.toFixed(2)}`);
      return;
    }

    if (operationType === 'DEBIT ') {
      const amountInput = await io.prompt('Enter debit amount: ');
      amount = parseAmount(amountInput);

      finalBalance = dataProgram('READ', finalBalance);

      if (finalBalance >= amount) {
        finalBalance = round2(finalBalance - amount);
        dataProgram('WRITE', finalBalance);
        io.write(`Amount debited. New balance: ${finalBalance.toFixed(2)}`);
      } else {
        io.write('Insufficient funds for this debit.');
      }
    }
  }

  async function processChoice(userChoice, io) {
    const parsedChoice = Number.parseInt(userChoice, 10);

    switch (parsedChoice) {
      case 1:
        await operations('TOTAL ', io);
        return 'YES';
      case 2:
        await operations('CREDIT', io);
        return 'YES';
      case 3:
        await operations('DEBIT ', io);
        return 'YES';
      case 4:
        return 'NO';
      default:
        io.write('Invalid choice, please select 1-4.');
        return 'YES';
    }
  }

  function getBalance() {
    return storageBalance;
  }

  return {
    dataProgram,
    operations,
    processChoice,
    getBalance,
  };
}

async function main() {
  const app = createAccountingApp(1000.0);
  const rl = readline.createInterface({ input, output });
  const io = {
    prompt: async (question) => rl.question(question),
    write: (message) => console.log(message),
  };
  let continueFlag = 'YES';

  while (continueFlag !== 'NO') {
    console.log('--------------------------------');
    console.log('Account Management System');
    console.log('1. View Balance');
    console.log('2. Credit Account');
    console.log('3. Debit Account');
    console.log('4. Exit');
    console.log('--------------------------------');

    const choiceInput = await rl.question('Enter your choice (1-4): ');
    continueFlag = await app.processChoice(choiceInput, io);
  }

  console.log('Exiting the program. Goodbye!');
  rl.close();
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Unexpected error:', error);
    process.exitCode = 1;
  });
}

module.exports = {
  normalizeOperation,
  createAccountingApp,
};
