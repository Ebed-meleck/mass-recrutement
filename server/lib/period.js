// @TODO This is an exact copy of the client 'PeriodService', this code should
//       to determine if it's angular or node and inject accordingly - removing
//       the duplication.
import Moment from 'dayjs';

class PeriodService {
  constructor(clientTimestamp) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    this.timestamp = new Moment(clientTimestamp);

    this.periods = {
      today: {
        key: 'today',
        translateKey: 'PERIODS_TODAY',
        limit: calculatePeriodLimit('date')
      },
      week: {
        key: 'week',
        translateKey: 'PERIODS_THIS_WEEK',
        limit: calculatePeriodLimit('week')
      },
      month: {
        key: 'month',
        translateKey: 'PERIODS_THIS_MONTH',
        limit: calculatePeriodLimit('month')
      },
      year: {
        key: 'year',
        translateKey: 'PERIODS_THIS_YEAR',
        limit: calculatePeriodLimit('year')
      },
      yesterday: {
        key: 'yesterday',
        translateKey: 'PERIODS_YESTERDAY',
        limit: calculatePeriodLimit('date', -1)
      },
      lastWeek: {
        key: 'lastWeek',
        translateKey: 'PERIODS_LAST_WEEK',
        limit: calculatePeriodLimit('week', -1)
      },
      lastMonth: {
        key: 'lastMonth',
        translateKey: 'PERIODS_LAST_MONTH',
        limit: calculatePeriodLimit('month', -1)
      },
      lastYear: {
        key: 'lastYear',
        translateKey: 'PERIODS_LAST_YEAR',
        limit: calculatePeriodLimit('year', -1)
      },

      // components will make an exception for all time - no period has to be selected
      // on the server this simply removes the WHERE condition
      allTime: {
        key: 'allTime',
        translateKey: 'PERIODS_ALL_TIME',
        limit: undefined
      },

      custom: {
        key: 'custom',
        translateKey: 'CUSTOM'
      }
    };

    function calculatePeriodLimit(periodKey, dateModifier = 0) {
      const currentPeriod = Moment().get(periodKey);

      return {
        start: () =>
          new Moment(self.timestamp)
            .set(periodKey, currentPeriod + dateModifier)
            .startOf(periodKey)
            .toDate(),
        end: () =>
          new Moment(self.timestamp)
            .set(periodKey, currentPeriod + dateModifier)
            .endOf(periodKey)
            .toDate()
      };
    }
  }

  lookupPeriod(key) {
    return this.periods[key];
  }
}

export default PeriodService;