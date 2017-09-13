'use strict';

const debug = require('debug')('grown:socket');

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

    _folders.forEach(baseDir => {
      glob.sync('*.js', { cwd: baseDir }).forEach(file => {
        try {
          const hook = require(path.join(baseDir, file))($.extensions('Conn._'));

          if (!hook || !(typeof hook.onTick === 'function' && typeof hook.cronTime === 'string')) {
            throw new Error(`Invalid task definition, given '${hook}'`);
          }

          cronjobs.push(new CronJob(hook));
        } catch (e) {
          throw new Error(`Cannot load task ${file}. ${e}`);
        }
      });
    });


    // FIXME: methods, props or something as API?

    $.on('close', () => {
      debug('Stopping %s job%s',
        cronjobs.length,
        cronjobs.length === 1 ? '' : 's');

      cronjobs.forEach(job => {
        job.stop();
      });
    });

    process.nextTick(() => {
      debug('Starting %s job%s',
        cronjobs.length,
        cronjobs.length === 1 ? '' : 's');

      cronjobs.forEach(job => {
        job.start();
      });
    });
  };
};
