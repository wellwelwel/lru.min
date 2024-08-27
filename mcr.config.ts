import type { CoverageReportOptions } from 'monocart-coverage-reports';

const coverageOptions: CoverageReportOptions = {
  reports: ['v8', 'console-details', 'codecov'],
  entryFilter: {
    '**/node_modules/**': false,
    '**/test/**': false,
    '**/src/**': true,
  },
};

export default coverageOptions;
