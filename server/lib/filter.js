/* eslint class-methods-use-this:off */
import { clone, isUndefined, isArray as _isArray, omit, each, isEmpty } from 'lodash';
import Periods from './period';
const RESERVED_KEYWORDS = ['limit', 'detailed'];
const DEFAULT_LIMIT_KEY = 'limit';

class Filter {
  constructor(filters = {}, options = {}) {
    this._paramIndex = 1;
    this._statements = [];
    this._parameters = [];
    this._filters = clone(filters);
    this._tableAlias = options.tableAlias || null;
    this._limitKey = options.limitKey || DEFAULT_LIMIT_KEY;
    this._order = '';
    this._uuids = options.uuids || [];
    this._autoParseStatements = isUndefined(options.autoParseStatements) ? false : options.autoParseStatements;
    this._group = '';
  }

  _incrementParamIndex(n = 1) {
    this._paramIndex += n;
  }

  fullText(filterKey, columnAlias = filterKey, tableAlias = this._tableAlias) {
    const tableString = this._formatTableAlias(tableAlias);

    if (this._filters[filterKey] && this._filters[filterKey] !== '') {
      const searchString = `%${this._filters[filterKey]}%`;
      const preparedStatement = `LOWER(${tableString}${columnAlias}) LIKE $${this._paramIndex} `;

      this._addFilter(preparedStatement, searchString);
      this._incrementParamIndex();
      delete this._filters[filterKey];
    }
  }

  period(filterKey, columnAlias = filterKey, tableAlias = this._tableAlias) {
    const tableString = this._formatTableAlias(tableAlias);
    if (this._filters[filterKey]) {
      // if a client timestamp has been passed - this will be passed in here
      const period = new Periods(this._filters.client_timestamp);
      const targetPeriod = period.lookupPeriod(this._filters[filterKey]);
      // specific base case - if all time requested to not apply a date filter
      if (targetPeriod === period.periods.allTime || targetPeriod === period.periods.custom) {
        delete this._filters[filterKey];
        return;
      }
      const periodFromStatement = `DATE(${tableString}${columnAlias}) >= DATE($${this._paramIndex})`;
      const periodToStatement = `DATE(${tableString}${columnAlias}) <= DATE($${this._paramIndex})`;

      this._addFilter(periodFromStatement, targetPeriod?.limit.start());
      this._addFilter(periodToStatement, targetPeriod?.limit.end());
      this._incrementParamIndex();
      delete this._filters[filterKey];
    }
  }

  dateFrom(filterKey, columnAlias = filterKey, tableAlias = this._tableAlias) {
    const tableString = this._formatTableAlias(tableAlias);
    const timestamp = this._filters[filterKey];

    if (timestamp) {
      const preparedStatement = `DATE(${tableString}${columnAlias}) >= DATE($${this._paramIndex})`;
      this._addFilter(preparedStatement, new Date(timestamp));
      this._incrementParamIndex();
      delete this._filters[filterKey];
    }
  }

  dateTo(filterKey, columnAlias = filterKey, tableAlias = this._tableAlias) {
    const tableString = this._formatTableAlias(tableAlias);
    const timestamp = this._filters[filterKey];

    if (timestamp) {
      const preparedStatement = `DATE(${tableString}${columnAlias}) <= DATE($${this._paramIndex})`;
      this._addFilter(preparedStatement, new Date(timestamp));
      this._incrementParamIndex();
      delete this._filters[filterKey];
    }
  }

  // eslint-disable-next-line default-param-last
  equals(filterKey, columnAlias = filterKey, tableAlias = this._tableAlias, isArray) {
    const tableString = this._formatTableAlias(tableAlias);
    const column = this._uuids.includes(columnAlias) ? `${tableString}${columnAlias}::text` : `${tableString}${columnAlias}`;

    if (this._filters[filterKey] && this._filters[filterKey] !== '') {
      this._filters[filterKey] = this._parseBoolean(this._filters[filterKey]);
      let preparedStatement = '';

      if (isArray) {
        preparedStatement = `${column} in ($${this._paramIndex})`;
      } else {
        preparedStatement = `${column} = $${this._paramIndex}`;
      }

      this._addFilter(preparedStatement, this._filters[filterKey]);
      this._incrementParamIndex();
      delete this._filters[filterKey];
    }
  }

  custom(filterKey, preparedStatement, preparedValue) {
    if (this._filters[filterKey]) {
      const searchValue = preparedValue || this._filters[filterKey];
      const isParameterArray = _isArray(searchValue);

      this._statements.push(preparedStatement);

      if (isParameterArray) {
        this._parameters.push(...searchValue);
        this._incrementParamIndex(searchValue.length);
      } else {
        this._parameters.push(searchValue);
        this._incrementParamIndex();
      }

      delete this._filters[filterKey];
    }
  }

  setOrder(orderString) {
    this._order = orderString;
  }

  setGroup(groupString) {
    this._group = groupString;
  }

  applyQuery(sql) {
    const limitCondition = this._parseLimit();

    if (this._autoParseStatements) {
      this._parseDefaultFilters();
    }

    const conditionStatements = this._parseStatements();
    const order = this._order;
    const group = this._group;

    return `${sql} WHERE ${conditionStatements} ${group} ${order} ${limitCondition}`;
  }

  paginationLimitQuery(table, limit = 100, page = 1) {
    if (this._autoParseStatements) {
      this._parseDefaultFilters();
    }

    const conditionStatements = this._parseStatements();

    return `
      SELECT
        COUNT(*)::integer AS total, ${page} AS current,
        ${limit} AS page_limit, (${(page - 1) * limit}) AS page_min, (${page * limit}) AS page_max
      FROM ${table} 
      WHERE ${conditionStatements} 
    `;
  }

  applyPaginationQuery(sql, limit, page) {
    if (this._autoParseStatements) {
      this._parseDefaultFilters();
    }

    const conditionStatements = this._parseStatements();
    const order = this._order;
    const group = this._group;

    return `${sql} WHERE ${conditionStatements} ${group} ${order} LIMIT ${limit} OFFSET ${page}`;
  }

  parameters() {
    return this._parameters;
  }

  _formatTableAlias(table) {
    return table ? `${table}.` : '';
  }

  _addFilter(statement, parameter) {
    this._statements.push(statement);
    this._parameters.push(parameter);
  }

  _parseDefaultFilters() {
    this._filters = omit(this._filters, RESERVED_KEYWORDS);

    each(this._filters, (value, key) => {
      const tableString = this._formatTableAlias(this._tableAlias);
      this._addFilter(`${tableString}${key} = $${this._paramIndex}`, value);
      this._incrementParamIndex();
    });
  }

  _parseStatements() {
    const DEFAULT_NO_STATEMENTS = 'TRUE';
    return isEmpty(this._statements) ? DEFAULT_NO_STATEMENTS : this._statements.join(' AND ');
  }

  _parseLimit() {
    let limitString = '';
    const limit = Number(this._filters[this._limitKey]);

    if (limit) {
      limitString = `LIMIT ${limit} `;
    }

    return limitString;
  }

  _parseBoolean(value) {
    if (value === 'true' || value === true) return 't';
    else if (value === 'false' || value === false) return 'f';
    else return value;
  }
}

export default Filter;