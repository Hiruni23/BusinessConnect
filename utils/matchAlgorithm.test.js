// Sample test file for Jest
describe('Sample Test Suite', () => {
  test('should pass basic test', () => {
    expect(true).toBe(true);
  });

  test('addition works', () => {
    expect(1 + 1).toBe(2);
  });

  test('string concatenation works', () => {
    expect('hello' + ' ' + 'world').toBe('hello world');
  });
});
