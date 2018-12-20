import wellKnownTypes from './wellKnownTypes';
import { ValidateMethod } from './types.d';

const {
  string,
  int,
  float,
  boolean,
  datetime,
  uuid,
} = wellKnownTypes;

interface TestCaseType {
  value: any;
  errors: number;
}
const runTestsForTestCases = (testCasesToUse: TestCaseType[], validate: ValidateMethod) => {
  testCasesToUse.forEach((testCase) => {
    it(`should find ${testCase.errors} errors for value ${JSON.stringify(testCase.value)}`, () => {
      expect(validate(testCase.value)).toHaveLength(testCase.errors);
    });
  });
};

describe('wellKnownTypes', () => {
  describe('string', () => {
    const testCasesToUse = [
      {
        value: 'test',
        errors: 0,
      },
      {
        value: 12,
        errors: 1,
      },
      {
        value: true,
        errors: 1,
      },
    ];
    const validate = string;
    runTestsForTestCases(testCasesToUse, validate);
  });
  describe('int', () => {
    const testCasesToUse = [
      {
        value: 12,
        errors: 0,
      },
      {
        value: 12.3,
        errors: 1,
      },
      {
        value: 'test',
        errors: 2,
      },
      {
        value: true,
        errors: 2,
      },
    ];
    const validate = int;
    runTestsForTestCases(testCasesToUse, validate);
  });
  describe('float', () => {
    const testCasesToUse = [
      {
        value: 12,
        errors: 0,
      },
      {
        value: 12.3,
        errors: 0,
      },
      {
        value: 'test',
        errors: 1,
      },
      {
        value: true,
        errors: 1,
      },
    ];
    const validate = float;
    runTestsForTestCases(testCasesToUse, validate);
  });
  describe('boolean', () => {
    const testCasesToUse = [
      {
        value: true,
        errors: 0,
      },
      {
        value: false,
        errors: 0,
      },
      {
        value: 12,
        errors: 1,
      },
      {
        value: 12.3,
        errors: 1,
      },
      {
        value: 0,
        errors: 1,
      },
      {
        value: 1,
        errors: 1,
      },
      {
        value: 'test',
        errors: 1,
      },
      {
        value: 'true',
        errors: 1,
      },
      {
        value: 'false',
        errors: 1,
      },
    ];
    const validate = boolean;
    runTestsForTestCases(testCasesToUse, validate);
  });
  describe('datetime', () => {
    const testCasesToUse = [
      {
        value: 12345, // dates may be defined as numbers
        errors: 0,
      },
      {
        value: '2018-10-11',
        errors: 0,
      },
      {
        value: 'test',
        errors: 1,
      },
      {
        value: true,
        errors: 1,
      },
    ];
    const validate = datetime;
    runTestsForTestCases(testCasesToUse, validate);
  });
  describe('uuid', () => {
    const testCasesToUse = [
      {
        value: '6924e478-0453-11e9-8eb2-f2801f1b9fd1',
        errors: 0,
      },
      {
        value: 21,
        errors: 1,
      },
      {
        value: '123-431-321',
        errors: 1,
      },
      {
        value: true,
        errors: 1,
      },
    ];
    const validate = uuid;
    runTestsForTestCases(testCasesToUse, validate);
  });
});
