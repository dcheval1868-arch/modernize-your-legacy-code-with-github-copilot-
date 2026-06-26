const { createAccountingApp } = require('./index');

function createMockIo(amountInputs = []) {
  const outputs = [];

  return {
    outputs,
    io: {
      prompt: async (question) => {
        outputs.push(question);
        if (amountInputs.length === 0) {
          return '';
        }

        return String(amountInputs.shift());
      },
      write: (message) => {
        outputs.push(message);
      },
    },
  };
}

describe('Accounting App Business Logic (mapped to docs/TESTPLAN.md)', () => {
  test('TC-001: 初期残高照会で 1000.00 が表示される', async () => {
    const app = createAccountingApp();
    const { io, outputs } = createMockIo();

    await app.processChoice('1', io);

    expect(outputs).toContain('Current balance: 1000.00');
    expect(app.getBalance()).toBe(1000);
  });

  test('TC-002: 入金で残高が加算される', async () => {
    const app = createAccountingApp();
    const { io, outputs } = createMockIo(['200.00']);

    await app.processChoice('2', io);
    await app.processChoice('1', io);

    expect(outputs).toContain('Amount credited. New balance: 1200.00');
    expect(outputs).toContain('Current balance: 1200.00');
    expect(app.getBalance()).toBe(1200);
  });

  test('TC-003: 出金（残高十分）で残高が減算される', async () => {
    const app = createAccountingApp();
    const { io, outputs } = createMockIo(['300.00']);

    await app.processChoice('3', io);
    await app.processChoice('1', io);

    expect(outputs).toContain('Amount debited. New balance: 700.00');
    expect(outputs).toContain('Current balance: 700.00');
    expect(app.getBalance()).toBe(700);
  });

  test('TC-004: 出金（残高不足）で残高は更新されない', async () => {
    const app = createAccountingApp();
    const { io, outputs } = createMockIo(['1500.00']);

    await app.processChoice('3', io);
    await app.processChoice('1', io);

    expect(outputs).toContain('Insufficient funds for this debit.');
    expect(outputs).toContain('Current balance: 1000.00');
    expect(app.getBalance()).toBe(1000);
  });

  test('TC-005: 出金額が残高と同額の場合は成功し 0.00 になる', async () => {
    const app = createAccountingApp();
    const { io, outputs } = createMockIo(['1000.00']);

    await app.processChoice('3', io);
    await app.processChoice('1', io);

    expect(outputs).toContain('Amount debited. New balance: 0.00');
    expect(outputs).toContain('Current balance: 0.00');
    expect(app.getBalance()).toBe(0);
  });

  test('TC-006: メニュー不正入力時にエラーメッセージ表示後も継続する', async () => {
    const app = createAccountingApp();
    const { io, outputs } = createMockIo();

    const continueFlag = await app.processChoice('9', io);
    await app.processChoice('1', io);

    expect(continueFlag).toBe('YES');
    expect(outputs).toContain('Invalid choice, please select 1-4.');
    expect(outputs).toContain('Current balance: 1000.00');
  });

  test('TC-007: 終了選択でループ継続フラグが NO になる', async () => {
    const app = createAccountingApp();
    const { io } = createMockIo();

    const continueFlag = await app.processChoice('4', io);

    expect(continueFlag).toBe('NO');
  });

  test('TC-008: 同一実行内の連続トランザクションで残高が保持される', async () => {
    const app = createAccountingApp();
    const { io, outputs } = createMockIo(['250.00', '100.00']);

    await app.processChoice('2', io);
    await app.processChoice('3', io);
    await app.processChoice('1', io);

    expect(outputs).toContain('Amount credited. New balance: 1250.00');
    expect(outputs).toContain('Amount debited. New balance: 1150.00');
    expect(outputs).toContain('Current balance: 1150.00');
    expect(app.getBalance()).toBe(1150);
  });

  test('TC-009: 再起動相当（新規インスタンス）で残高は初期値に戻る', async () => {
    const firstRun = createAccountingApp();
    const firstIo = createMockIo(['200.00']);
    await firstRun.processChoice('2', firstIo.io);
    expect(firstRun.getBalance()).toBe(1200);

    const secondRun = createAccountingApp();
    const { io, outputs } = createMockIo();
    await secondRun.processChoice('1', io);

    expect(outputs).toContain('Current balance: 1000.00');
    expect(secondRun.getBalance()).toBe(1000);
  });

  test('TC-010: 0.00 入金では残高が変化しない', async () => {
    const app = createAccountingApp();
    const { io, outputs } = createMockIo(['0.00']);

    await app.processChoice('2', io);
    await app.processChoice('1', io);

    expect(outputs).toContain('Amount credited. New balance: 1000.00');
    expect(outputs).toContain('Current balance: 1000.00');
    expect(app.getBalance()).toBe(1000);
  });

  test('TC-011: 0.00 出金では残高が変化しない', async () => {
    const app = createAccountingApp();
    const { io, outputs } = createMockIo(['0.00']);

    await app.processChoice('3', io);
    await app.processChoice('1', io);

    expect(outputs).toContain('Amount debited. New balance: 1000.00');
    expect(outputs).toContain('Current balance: 1000.00');
    expect(app.getBalance()).toBe(1000);
  });

  test('TC-012: 残高 0.00 での追加出金は残高不足となる', async () => {
    const app = createAccountingApp();
    const { io, outputs } = createMockIo(['1000.00', '1.00']);

    await app.processChoice('3', io);
    await app.processChoice('3', io);
    await app.processChoice('1', io);

    expect(outputs).toContain('Amount debited. New balance: 0.00');
    expect(outputs).toContain('Insufficient funds for this debit.');
    expect(outputs).toContain('Current balance: 0.00');
    expect(app.getBalance()).toBe(0);
  });
});
