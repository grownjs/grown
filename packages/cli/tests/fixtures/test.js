if (process.argv[2] === 'throw') {
  process.nextTick(() => Promise.reject(new Error('UNHANDLED_REJECTION')));
  return;
}

if (process.argv[2] === 'error') {
  process.stderr.write('FAILED\n');
  process.exit(2);
  return;
}

if (process.argv[2] === 'wait') {
  setTimeout(() => process.exit(), 1000);
  return;
}

setTimeout(() => {
  process.stdout.write('DONE\n');
}, 200);
