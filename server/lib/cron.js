import * as cron from 'cron';
import debug from 'debug';
import { downloadFormInDataDb, extractInput, aggregateStats, aggregateOtherDetail } from './odkData';
const LOGGER = debug('CRON:SYSTEM');


const runImport = new cron.CronJob('0 0 0,12,18 * * *', async () => {
  try {
    LOGGER('cron import started, downloading data from odk central')
    await downloadFormInDataDb();
    LOGGER('Extract the candidate information')
    await extractInput();
    LOGGER('Aggregate the Statistics ')
    await aggregateStats();
    LOGGER('Other aggregate detail');
    await aggregateOtherDetail();
    LOGGER('Import ODK terminé avec succès and aggregation');
  } catch (e) {
    LOGGER('Erreur lors de l\'import ODK:', e);
  }
});

runImport.start();