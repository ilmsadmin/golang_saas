import { validateTenantSlug, generateSlug, isReservedSlug } from '../slug-validation';

describe('Tenant Slug Validation', () => {
  test('should validate correct tenant slugs', () => {
    expect(validateTenantSlug('abc').valid).toBe(true);
    expect(validateTenantSlug('tenant1').valid).toBe(true);
    expect(validateTenantSlug('company-name').valid).toBe(true);
    expect(validateTenantSlug('my-company').valid).toBe(true);
  });

  test('should reject invalid tenant slugs', () => {
    expect(validateTenantSlug('ab').valid).toBe(false); // too short
    expect(validateTenantSlug('ABC').valid).toBe(false); // uppercase
    expect(validateTenantSlug('123').valid).toBe(false); // numbers only
    expect(validateTenantSlug('-abc').valid).toBe(false); // starts with hyphen
    expect(validateTenantSlug('abc-').valid).toBe(false); // ends with hyphen
    expect(validateTenantSlug('ab--cd').valid).toBe(false); // double hyphen
  });

  test('should reject reserved slugs', () => {
    expect(validateTenantSlug('admin').valid).toBe(false);
    expect(validateTenantSlug('system').valid).toBe(false);
    expect(validateTenantSlug('api').valid).toBe(false);
    expect(validateTenantSlug('www').valid).toBe(false);
  });

  test('should generate valid slugs from names', () => {
    expect(generateSlug('ABC Company')).toBe('abc-company');
    expect(generateSlug('Công ty XYZ')).toBe('cong-ty-xyz');
    expect(generateSlug('Test Company!!!')).toBe('test-company');
    expect(generateSlug('  Multiple   Spaces  ')).toBe('multiple-spaces');
  });

  test('should detect reserved slugs', () => {
    expect(isReservedSlug('admin')).toBe(true);
    expect(isReservedSlug('ADMIN')).toBe(true);
    expect(isReservedSlug('system')).toBe(true);
    expect(isReservedSlug('mycompany')).toBe(false);
  });
});
