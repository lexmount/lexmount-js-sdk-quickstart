export async function waitForKeypress(): Promise<void> {
  const input = process.stdin;
  const wasFlowing = input.readableFlowing;
  const wasRaw = input.isRaw;
  process.stdout.write('Press any key to continue (close browser and tunnel)...');
  try {
    if (input.readableEnded || input.destroyed) return;
    if (input.isTTY) input.setRawMode(true);
    await new Promise<void>((resolve, reject) => {
      const cleanup = () => {
        input.off('data', onData);
        input.off('end', onEnd);
        input.off('error', onError);
      };
      const onData = (data: Buffer) => {
        cleanup();
        if (data.includes(3)) reject(new Error('Cancelled by user'));
        else resolve();
      };
      const onEnd = () => { cleanup(); resolve(); };
      const onError = (error: Error) => { cleanup(); reject(error); };
      input.once('data', onData);
      input.once('end', onEnd);
      input.once('error', onError);
      input.resume();
    });
  } finally {
    if (input.isTTY) input.setRawMode(!!wasRaw);
    if (wasFlowing !== true) input.pause();
    process.stdout.write('\n');
  }
}
