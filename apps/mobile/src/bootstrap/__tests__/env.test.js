test('env bootstrap initializes process.env on import', () => {
  const prevProcess = globalThis.process;
  globalThis.process = undefined;

  jest.isolateModules(() => {
    require('@/bootstrap/env.js');
  });

  expect(globalThis.process).toBeTruthy();
  expect(globalThis.process.env).toBeTruthy();

  globalThis.process = prevProcess;
});
