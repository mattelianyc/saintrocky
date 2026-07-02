import { createValidationT, initValidation, loginSchema, validationKeys } from '../index.js';

test('loginSchema: rejects invalid input with key messages', async () => {
  // i18next-like behavior (missing keys return the key)
  initValidation({ t: (k) => k });

  await expect(
    loginSchema.validate(
      { email: 'not-an-email', password: '123' },
      { abortEarly: false }
    )
  ).rejects.toMatchObject({
    errors: expect.arrayContaining([
      validationKeys.auth.login.email.invalid,
      validationKeys.auth.login.password.min
    ])
  });
});

test('loginSchema: accepts valid input', async () => {
  initValidation({ t: (k) => k });
  await expect(
    loginSchema.validate({ email: 'a@b.com', password: '123456' })
  ).resolves.toEqual({ email: 'a@b.com', password: '123456' });
});

test('createValidationT: resolves register validation messages', () => {
  const translate = createValidationT('en');

  expect(translate(validationKeys.auth.register.name.required)).toBe('Name is required.');
  expect(translate(validationKeys.auth.register.name.min)).toBe(
    'Name must be at least 2 characters.'
  );
  expect(translate(validationKeys.auth.register.email.required)).toBe('Email is required.');
  expect(translate(validationKeys.auth.register.email.invalid)).toBe(
    'Enter a valid email address.'
  );
  expect(translate(validationKeys.auth.register.password.required)).toBe(
    'Password is required.'
  );
  expect(translate(validationKeys.auth.register.password.min)).toBe(
    'Password must be at least 8 characters.'
  );
});






