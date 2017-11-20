'use strict';

const debug = require('debug')('grown:tasks');

module.exports = args => {
  const CronJob = require('cron').CronJob;

  const path = require('path');
  const glob = require('glob');

  const _folders = [];

  ((!Array.isArray(args) && args ? [args] : args) || []).forEach(opts => {
    ((!Array.isArray(opts.folders) && opts.folders ? [opts.folders] : opts.folders) || []).forEach(cwd => {
      debug('Listing tasks from %s', path.relative(process.cwd(), cwd));

      _folders.push(cwd);
    });
  });

  return $ => {
    const cronjobs = [];

    // FIXME: methods, props or something as API?

    $.on('close', () => {
      debug('Stopping %s job%s',
        cronjobs.length,
        cronjobs.length === 1 ? '' : 's');

      cronjobs.forEach(job => {
        job.stop();
      });
    });

    $.on('listen', () => {
      _folders.forEach(baseDir => {
        glob.sync('*.js', { cwd: baseDir }).forEach(file => {
          try {
            const hooks = require(path.join(baseDir, file))($.extensions('Conn._'));

            (!Array.isArray(hooks) ? [hooks] : hooks).forEach(hook => {
              if (!hook || !(typeof hook.onTick === 'function' && typeof hook.cronTime === 'string')) {
                throw new Error(`Invalid task definition, given '${hook}'`);
              }

              // skip
              hook.start = false;

              const job = new CronJob(hook);

              cronjobs.push(job);

              job.start();
            });
          } catch (e) {
            throw new Error(`Cannot load tasks from ${file}. ${e}`);
          }
        });
      });

      debug('Starting %s job%s',
        cronjobs.length,
        cronjobs.length === 1 ? '' : 's');
    });
  };
};
