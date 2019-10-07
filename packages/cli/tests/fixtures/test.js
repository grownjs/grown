if (process.argv.slice(2).indexOf('throw') !== -1) {
  process.nextTick(() => Promise.reject(new Error('UNHANDLED_REJECTION')));
  return;
}

if (process.argv.slice(2).indexOf('error') !== -1) {
  process.stderr.write('FAILED\n');
  process.exit(2);
  return;
}

if (process.argv.slice(2).indexOf('wait') !== -1) {
  setTimeout(() => process.exit(), 500);
  return;
}

setTimeout(() => {
  process.stdout.write('DONE\n');
}, 100);
