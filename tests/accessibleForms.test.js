/**
 * Accessible Forms Service Tests
 * Comprehensive tests for WCAG 2.1 AA compliant form accessibility helpers
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import {
  enhanceFormAccessibility,
  validateFormAccessibility,
  addFieldLabel,
  addFieldDescription,
  addFieldError,
  clearFieldError,
  setFieldRequired,
  setFieldInvalid,
  announceFormStatus,
  createLiveRegion,
  renderAccessibleInput,
  renderAccessibleSelect,
  renderAccessibleTextarea,
  renderAccessibleCheckbox,
  renderAccessibleRadioGroup,
  getFormAccessibilityScore,
  getAccessibilityIssues,
  getTranslations,
  getTranslator,
} from '../src/services/accessibleForms.js'

// Mock state
vi.mock('../src/stores/state.js', () => ({
  getState: vi.fn(() => ({
    lang: 'fr',
  })),
}))

import { getState } from '../src/stores/state.js'

describe('Accessible Forms Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getState.mockReturnValue({ lang: 'fr' })
  })

  describe('enhanceFormAccessibility', () => {
    it('should return error for null form element', () => {
      const result = enhanceFormAccessibility(null)
      expect(result.success).toBe(false)
      expect(result.error).toBe('no-form-element')
    })

    it('should return error for undefined form element', () => {
      const result = enhanceFormAccessibility(undefined)
      expect(result.success).toBe(false)
      expect(result.error).toBe('no-form-element')
    })

    it('should handle string input for testing purposes', () => {
      const result = enhanceFormAccessibility('<form><input /></form>')
      expect(result.success).toBe(true)
      expect(result.enhanced).toBe(true)
    })

    it('should return error for invalid form element', () => {
      const result = enhanceFormAccessibility({})
      expect(result.success).toBe(false)
      expect(result.error).toBe('invalid-form-element')
    })

    it('should return success with fields processed count for DOM element', () => {
      const mockForm = {
        getAttribute: vi.fn(() => null),
        setAttribute: vi.fn(),
        querySelectorAll: vi.fn(() => []),
        querySelector: vi.fn(() => null),
        appendChild: vi.fn(),
        id: 'test-form',
      }
      const result = enhanceFormAccessibility(mockForm)
      expect(result.success).toBe(true)
      expect(result.fieldsProcessed).toBe(0)
    })
  })

  describe('validateFormAccessibility', () => {
    it('should return invalid for null input', () => {
      const result = validateFormAccessibility(null)
      expect(result.valid).toBe(false)
      expect(result.issues).toContain('no-form-html')
    })

    it('should return invalid for non-string input', () => {
      const result = validateFormAccessibility(123)
      expect(result.valid).toBe(false)
    })

    it('should return invalid for empty string', () => {
      const result = validateFormAccessibility('')
      expect(result.valid).toBe(false)
    })

    it('should detect missing id on input', () => {
      const html = '<form><input type="text" /></form>'
      const result = validateFormAccessibility(html)
      expect(result.issues.some(i => i.type === 'missing-id')).toBe(true)
    })

    it('should detect missing label on input', () => {
      const html = '<form><input id="test" type="text" /></form>'
      const result = validateFormAccessibility(html)
      expect(result.issues.some(i => i.type === 'missing-label')).toBe(true)
    })

    it('should pass for input with label', () => {
      const html = '<form><label for="test">Name</label><input id="test" type="text" /></form>'
      const result = validateFormAccessibility(html)
      expect(result.issues.filter(i => i.type === 'missing-label').length).toBe(0)
    })

    it('should pass for input with aria-label', () => {
      const html = '<form><input id="test" type="text" aria-label="Name" /></form>'
      const result = validateFormAccessibility(html)
      expect(result.issues.filter(i => i.type === 'missing-label').length).toBe(0)
    })

    it('should pass for input with aria-labelledby', () => {
      const html = '<form><span id="label">Name</span><input id="test" type="text" aria-labelledby="label" /></form>'
      const result = validateFormAccessibility(html)
      expect(result.issues.filter(i => i.type === 'missing-label').length).toBe(0)
    })

    it('should warn about placeholder used as label', () => {
      const html = '<form><input id="test" type="text" placeholder="Enter name" /></form>'
      const result = validateFormAccessibility(html)
      expect(result.issues.some(i => i.type === 'placeholder-as-label')).toBe(true)
    })

    it('should warn about missing aria-required on required fields', () => {
      const html = '<form><label for="test">Name</label><input id="test" type="text" required /></form>'
      const result = validateFormAccessibility(html)
      expect(result.issues.some(i => i.type === 'missing-aria-required')).toBe(true)
    })

    it('should not warn when aria-required is present', () => {
      const html = '<form><label for="test">Name</label><input id="test" type="text" required aria-required="true" /></form>'
      const result = validateFormAccessibility(html)
      expect(result.issues.filter(i => i.type === 'missing-aria-required').length).toBe(0)
    })

    it('should warn about missing autocomplete on email fields', () => {
      const html = '<form><label for="test">Email</label><input id="test" type="email" /></form>'
      const result = validateFormAccessibility(html)
      expect(result.issues.some(i => i.type === 'missing-autocomplete')).toBe(true)
    })

    it('should not warn when autocomplete is present', () => {
      const html = '<form><label for="test">Email</label><input id="test" type="email" autocomplete="email" /></form>'
      const result = validateFormAccessibility(html)
      expect(result.issues.filter(i => i.type === 'missing-autocomplete').length).toBe(0)
    })

    it('should count total fields correctly', () => {
      const html = '<form><input id="a" /><select id="b"></select><textarea id="c"></textarea></form>'
      const result = validateFormAccessibility(html)
      expect(result.totalFields).toBe(3)
    })

    it('should separate errors and warnings', () => {
      const html = '<form><input type="text" /><input id="test" type="email" /></form>'
      const result = validateFormAccessibility(html)
      expect(typeof result.errors).toBe('number')
      expect(typeof result.warnings).toBe('number')
    })
  })

  describe('addFieldLabel', () => {
    it('should return error for missing parameters', () => {
      expect(addFieldLabel(null, 'Label').success).toBe(false)
      expect(addFieldLabel('id', null).success).toBe(false)
      expect(addFieldLabel('', 'Label').success).toBe(false)
      expect(addFieldLabel('id', '').success).toBe(false)
    })

    it('should return error when field not found in DOM', () => {
      const result = addFieldLabel('non-existent-input', 'Test Label')
      expect(result.success).toBe(false)
      expect(result.error).toBe('field-not-found')
    })

    it('should add label to existing DOM element', () => {
      // Create test input
      const input = document.createElement('input')
      input.id = 'test-label-input'
      const container = document.createElement('div')
      container.appendChild(input)
      document.body.appendChild(container)

      const result = addFieldLabel('test-label-input', 'Test Label')
      expect(result.success).toBe(true)
      expect(result.inputId).toBe('test-label-input')
      expect(result.labelText).toBe('Test Label')

      // Cleanup
      document.body.removeChild(container)
    })
  })

  describe('addFieldDescription', () => {
    it('should return error for missing parameters', () => {
      expect(addFieldDescription(null, 'Desc').success).toBe(false)
      expect(addFieldDescription('id', null).success).toBe(false)
    })

    it('should return error when field not found in DOM', () => {
      const result = addFieldDescription('non-existent-input', 'Test description')
      expect(result.success).toBe(false)
      expect(result.error).toBe('field-not-found')
    })

    it('should add description to existing DOM element', () => {
      // Create test input
      const input = document.createElement('input')
      input.id = 'test-desc-input'
      const container = document.createElement('div')
      container.appendChild(input)
      document.body.appendChild(container)

      const result = addFieldDescription('test-desc-input', 'Test description')
      expect(result.success).toBe(true)
      expect(result.inputId).toBe('test-desc-input')
      expect(result.descriptionId).toBe('test-desc-input-desc')

      // Cleanup
      document.body.removeChild(container)
    })
  })

  describe('addFieldError', () => {
    it('should return error for missing parameters', () => {
      expect(addFieldError(null, 'Error').success).toBe(false)
      expect(addFieldError('id', null).success).toBe(false)
    })

    it('should return success with html flag in Node environment', () => {
      const result = addFieldError('test-input', 'Test error')
      expect(result.success).toBe(true)
      expect(result.inputId).toBe('test-input')
      expect(result.errorText).toBe('Test error')
    })
  })

  describe('clearFieldError', () => {
    it('should return error for missing input id', () => {
      const result = clearFieldError(null)
      expect(result.success).toBe(false)
      expect(result.error).toBe('missing-input-id')
    })

    it('should return success with cleared flag in Node environment', () => {
      const result = clearFieldError('test-input')
      expect(result.success).toBe(true)
      expect(result.cleared).toBe(true)
    })
  })

  describe('setFieldRequired', () => {
    it('should return error for missing input id', () => {
      const result = setFieldRequired(null)
      expect(result.success).toBe(false)
    })

    it('should return success with required flag in Node environment', () => {
      const result = setFieldRequired('test-input', true)
      expect(result.success).toBe(true)
      expect(result.required).toBe(true)
    })

    it('should handle required=false', () => {
      const result = setFieldRequired('test-input', false)
      expect(result.success).toBe(true)
      expect(result.required).toBe(false)
    })
  })

  describe('setFieldInvalid', () => {
    it('should return error for missing input id', () => {
      const result = setFieldInvalid(null)
      expect(result.success).toBe(false)
    })

    it('should return success with invalid flag in Node environment', () => {
      const result = setFieldInvalid('test-input', true)
      expect(result.success).toBe(true)
      expect(result.invalid).toBe(true)
    })

    it('should handle invalid=false', () => {
      const result = setFieldInvalid('test-input', false)
      expect(result.success).toBe(true)
      expect(result.invalid).toBe(false)
    })
  })

  describe('announceFormStatus', () => {
    it('should return error for missing message', () => {
      const result = announceFormStatus(null)
      expect(result.success).toBe(false)
      expect(result.error).toBe('missing-message')
    })

    it('should return error for empty message', () => {
      const result = announceFormStatus('')
      expect(result.success).toBe(false)
    })

    it('should return success with announced flag in Node environment', () => {
      const result = announceFormStatus('Form submitted')
      expect(result.success).toBe(true)
      expect(result.announced).toBe(true)
      expect(result.message).toBe('Form submitted')
    })

    it('should accept polite priority', () => {
      const result = announceFormStatus('Success', 'polite')
      expect(result.success).toBe(true)
      expect(result.priority).toBe('polite')
    })

    it('should accept assertive priority', () => {
      const result = announceFormStatus('Error!', 'assertive')
      expect(result.success).toBe(true)
      expect(result.priority).toBe('assertive')
    })
  })

  describe('createLiveRegion', () => {
    it('should create live region with auto-generated id', () => {
      const region = createLiveRegion()
      expect(region).toBeDefined()
      expect(region.id).toBeDefined()
      expect(region.update).toBeInstanceOf(Function)
      expect(region.clear).toBeInstanceOf(Function)
    })

    it('should create live region with custom id', () => {
      const region = createLiveRegion('custom-region')
      expect(region.id).toBe('custom-region')
    })

    it('should have working update method in Node environment', () => {
      const region = createLiveRegion('test-region')
      const result = region.update('Test message')
      expect(result.success).toBe(true)
      expect(result.message).toBe('Test message')
    })

    it('should have working clear method in Node environment', () => {
      const region = createLiveRegion('test-region')
      const result = region.clear()
      expect(result.success).toBe(true)
    })
  })

  describe('renderAccessibleInput', () => {
    it('should render input with default options', () => {
      const html = renderAccessibleInput()
      expect(html).toContain('<input')
      expect(html).toContain('type="text"')
    })

    it('should render input with custom id', () => {
      const html = renderAccessibleInput({ id: 'my-input' })
      expect(html).toContain('id="my-input"')
    })

    it('should render input with label', () => {
      const html = renderAccessibleInput({ id: 'test', label: 'Name' })
      expect(html).toContain('<label')
      expect(html).toContain('for="test"')
      expect(html).toContain('Name')
    })

    it('should render required indicator when required', () => {
      const html = renderAccessibleInput({ id: 'test', label: 'Name', required: true })
      expect(html).toContain('aria-required="true"')
      expect(html).toContain('required')
      expect(html).toContain('*')
    })

    it('should render optional text when not required', () => {
      getState.mockReturnValue({ lang: 'en' })
      const html = renderAccessibleInput({ id: 'test', label: 'Name', required: false })
      expect(html).toContain('Optional')
    })

    it('should render description when provided', () => {
      const html = renderAccessibleInput({ id: 'test', description: 'Enter your full name' })
      expect(html).toContain('Enter your full name')
      expect(html).toContain('id="test-desc"')
    })

    it('should render error message when provided', () => {
      const html = renderAccessibleInput({ id: 'test', error: 'Name is required' })
      expect(html).toContain('Name is required')
      expect(html).toContain('aria-invalid="true"')
      expect(html).toContain('role="alert"')
    })

    it('should hide error container when no error', () => {
      const html = renderAccessibleInput({ id: 'test' })
      expect(html).toContain('sr-only')
      expect(html).toContain('aria-invalid="false"')
    })

    it('should include aria-describedby for description and error', () => {
      const html = renderAccessibleInput({ id: 'test', description: 'desc', error: 'err' })
      expect(html).toContain('aria-describedby="test-desc test-error"')
    })

    it('should render disabled state', () => {
      const html = renderAccessibleInput({ id: 'test', disabled: true })
      expect(html).toContain('disabled')
      expect(html).toContain('aria-disabled="true"')
    })

    it('should render with autocomplete', () => {
      const html = renderAccessibleInput({ id: 'test', autocomplete: 'email' })
      expect(html).toContain('autocomplete="email"')
    })

    it('should render with maxlength', () => {
      const html = renderAccessibleInput({ id: 'test', maxLength: 50 })
      expect(html).toContain('maxlength="50"')
    })

    it('should render with pattern', () => {
      const html = renderAccessibleInput({ id: 'test', pattern: '[a-z]+' })
      expect(html).toContain('pattern="[a-z]+"')
    })

    it('should render placeholder', () => {
      const html = renderAccessibleInput({ id: 'test', placeholder: 'Enter name' })
      expect(html).toContain('placeholder="Enter name"')
    })

    it('should render value', () => {
      const html = renderAccessibleInput({ id: 'test', value: 'John' })
      expect(html).toContain('value="John"')
    })

    it('should render different input types', () => {
      const emailHtml = renderAccessibleInput({ type: 'email' })
      expect(emailHtml).toContain('type="email"')

      const passwordHtml = renderAccessibleInput({ type: 'password' })
      expect(passwordHtml).toContain('type="password"')

      const numberHtml = renderAccessibleInput({ type: 'number' })
      expect(numberHtml).toContain('type="number"')
    })

    it('should add custom class name', () => {
      const html = renderAccessibleInput({ className: 'custom-class' })
      expect(html).toContain('custom-class')
    })
  })

  describe('renderAccessibleSelect', () => {
    it('should render select with default options', () => {
      const html = renderAccessibleSelect()
      expect(html).toContain('<select')
    })

    it('should render select with options array of strings', () => {
      const html = renderAccessibleSelect({
        id: 'country',
        selectOptions: ['France', 'Germany', 'Spain'],
      })
      expect(html).toContain('France')
      expect(html).toContain('Germany')
      expect(html).toContain('Spain')
    })

    it('should render select with options array of objects', () => {
      const html = renderAccessibleSelect({
        id: 'country',
        selectOptions: [
          { value: 'fr', label: 'France' },
          { value: 'de', label: 'Germany' },
        ],
      })
      expect(html).toContain('value="fr"')
      expect(html).toContain('France')
    })

    it('should render placeholder option', () => {
      const html = renderAccessibleSelect({ id: 'test', placeholder: 'Choose...' })
      expect(html).toContain('Choose...')
      expect(html).toContain('disabled selected')
    })

    it('should render selected value', () => {
      const html = renderAccessibleSelect({
        id: 'test',
        selectOptions: ['A', 'B', 'C'],
        value: 'B',
      })
      expect(html).toMatch(/<option[^>]*value="B"[^>]*selected/)
    })

    it('should render label', () => {
      const html = renderAccessibleSelect({ id: 'test', label: 'Country' })
      expect(html).toContain('<label')
      expect(html).toContain('Country')
    })

    it('should render required state', () => {
      const html = renderAccessibleSelect({ id: 'test', required: true })
      expect(html).toContain('required')
      expect(html).toContain('aria-required="true"')
    })

    it('should render disabled options', () => {
      const html = renderAccessibleSelect({
        id: 'test',
        selectOptions: [{ value: 'a', label: 'A', disabled: true }],
      })
      expect(html).toContain('disabled')
    })

    it('should render multiple select', () => {
      const html = renderAccessibleSelect({ id: 'test', multiple: true })
      expect(html).toContain('multiple')
    })

    it('should render error state', () => {
      const html = renderAccessibleSelect({ id: 'test', error: 'Selection required' })
      expect(html).toContain('Selection required')
      expect(html).toContain('aria-invalid="true"')
    })
  })

  describe('renderAccessibleTextarea', () => {
    it('should render textarea with default options', () => {
      const html = renderAccessibleTextarea()
      expect(html).toContain('<textarea')
      expect(html).toContain('rows="4"')
    })

    it('should render textarea with custom rows', () => {
      const html = renderAccessibleTextarea({ rows: 6 })
      expect(html).toContain('rows="6"')
    })

    it('should render textarea with value', () => {
      const html = renderAccessibleTextarea({ value: 'Hello World' })
      expect(html).toContain('Hello World')
    })

    it('should render textarea with label', () => {
      const html = renderAccessibleTextarea({ id: 'bio', label: 'Biography' })
      expect(html).toContain('<label')
      expect(html).toContain('Biography')
    })

    it('should render character count when enabled', () => {
      const html = renderAccessibleTextarea({
        id: 'test',
        maxLength: 100,
        showCharCount: true,
        value: 'Hello',
      })
      expect(html).toContain('caracteres sur 100')
    })

    it('should render required state', () => {
      const html = renderAccessibleTextarea({ id: 'test', required: true })
      expect(html).toContain('required')
      expect(html).toContain('aria-required="true"')
    })

    it('should render error state', () => {
      const html = renderAccessibleTextarea({ id: 'test', error: 'Too short' })
      expect(html).toContain('Too short')
      expect(html).toContain('aria-invalid="true"')
    })

    it('should render description', () => {
      const html = renderAccessibleTextarea({ id: 'test', description: 'Write about yourself' })
      expect(html).toContain('Write about yourself')
    })

    it('should render maxlength and minlength', () => {
      const html = renderAccessibleTextarea({ maxLength: 500, minLength: 10 })
      expect(html).toContain('maxlength="500"')
      expect(html).toContain('minlength="10"')
    })
  })

  describe('renderAccessibleCheckbox', () => {
    it('should render checkbox with default options', () => {
      const html = renderAccessibleCheckbox()
      expect(html).toContain('type="checkbox"')
    })

    it('should render checkbox with label', () => {
      const html = renderAccessibleCheckbox({ id: 'agree', label: 'I agree to the terms' })
      expect(html).toContain('I agree to the terms')
      expect(html).toContain('<label')
    })

    it('should render checked state', () => {
      const html = renderAccessibleCheckbox({ checked: true })
      expect(html).toContain('checked')
    })

    it('should render required state', () => {
      const html = renderAccessibleCheckbox({ required: true })
      expect(html).toContain('required')
      expect(html).toContain('aria-required="true"')
    })

    it('should render disabled state', () => {
      const html = renderAccessibleCheckbox({ disabled: true })
      expect(html).toContain('disabled')
      expect(html).toContain('aria-disabled="true"')
    })

    it('should render error state', () => {
      const html = renderAccessibleCheckbox({ id: 'test', error: 'You must agree' })
      expect(html).toContain('You must agree')
      expect(html).toContain('aria-invalid="true"')
    })

    it('should render description', () => {
      const html = renderAccessibleCheckbox({ id: 'test', description: 'Check to agree' })
      expect(html).toContain('Check to agree')
    })

    it('should render custom value', () => {
      const html = renderAccessibleCheckbox({ value: 'yes' })
      expect(html).toContain('value="yes"')
    })
  })

  describe('renderAccessibleRadioGroup', () => {
    it('should render radio group with fieldset', () => {
      const html = renderAccessibleRadioGroup({ id: 'gender' })
      expect(html).toContain('<fieldset')
      expect(html).toContain('role="radiogroup"')
    })

    it('should render legend', () => {
      const html = renderAccessibleRadioGroup({ legend: 'Select gender' })
      expect(html).toContain('<legend')
      expect(html).toContain('Select gender')
    })

    it('should render radio options from strings', () => {
      const html = renderAccessibleRadioGroup({
        id: 'color',
        radioOptions: ['Red', 'Green', 'Blue'],
      })
      expect(html).toContain('type="radio"')
      expect(html).toContain('Red')
      expect(html).toContain('Green')
      expect(html).toContain('Blue')
    })

    it('should render radio options from objects', () => {
      const html = renderAccessibleRadioGroup({
        id: 'size',
        radioOptions: [
          { value: 's', label: 'Small' },
          { value: 'm', label: 'Medium' },
          { value: 'l', label: 'Large' },
        ],
      })
      expect(html).toContain('value="s"')
      expect(html).toContain('Small')
    })

    it('should render selected value', () => {
      const html = renderAccessibleRadioGroup({
        id: 'test',
        radioOptions: ['A', 'B', 'C'],
        value: 'B',
      })
      expect(html).toMatch(/<input[^>]*value="B"[^>]*checked/)
    })

    it('should render inline layout', () => {
      const html = renderAccessibleRadioGroup({
        id: 'test',
        radioOptions: ['A', 'B'],
        inline: true,
      })
      expect(html).toContain('inline-flex')
    })

    it('should render required state', () => {
      const html = renderAccessibleRadioGroup({ id: 'test', required: true, legend: 'Choice', radioOptions: ['A', 'B'] })
      expect(html).toContain('aria-required="true"')
      expect(html).toContain('*')
    })

    it('should render disabled options', () => {
      const html = renderAccessibleRadioGroup({
        id: 'test',
        radioOptions: [{ value: 'a', label: 'A', disabled: true }],
      })
      expect(html).toContain('disabled')
      expect(html).toContain('aria-disabled="true"')
    })

    it('should render error state', () => {
      const html = renderAccessibleRadioGroup({ id: 'test', error: 'Please select an option' })
      expect(html).toContain('Please select an option')
      expect(html).toContain('aria-invalid="true"')
    })
  })

  describe('getFormAccessibilityScore', () => {
    it('should return 0 for null input', () => {
      const result = getFormAccessibilityScore(null)
      expect(result.score).toBe(0)
    })

    it('should return 0 for non-string input', () => {
      const result = getFormAccessibilityScore(123)
      expect(result.score).toBe(0)
    })

    it('should return high score for accessible form', () => {
      const html = `
        <form role="form">
          <label for="name">Name</label>
          <input id="name" type="text" aria-required="true" required />
          <div role="alert" aria-live="assertive"></div>
        </form>
      `
      const result = getFormAccessibilityScore(html)
      expect(result.score).toBeGreaterThan(50)
    })

    it('should return low score for inaccessible form', () => {
      const html = '<input type="text" /><input type="email" />'
      const result = getFormAccessibilityScore(html)
      expect(result.score).toBeLessThan(90)
    })

    it('should return breakdown by category', () => {
      const html = '<form><input id="test" /></form>'
      const result = getFormAccessibilityScore(html)
      expect(result.breakdown).toBeDefined()
      expect(result.breakdown.labels).toBeDefined()
      expect(result.breakdown.ariaAttributes).toBeDefined()
      expect(result.breakdown.errorHandling).toBeDefined()
    })

    it('should indicate pass/fail status', () => {
      const goodHtml = `
        <form role="form">
          <label for="test">Test</label>
          <input id="test" type="text" aria-required="true" />
          <div role="alert" aria-live="assertive"></div>
        </form>
      `
      const result = getFormAccessibilityScore(goodHtml)
      expect(typeof result.passed).toBe('boolean')
    })

    it('should provide accessibility level', () => {
      const html = '<form><input id="test" /></form>'
      const result = getFormAccessibilityScore(html)
      expect(['excellent', 'good', 'needs-improvement', 'poor']).toContain(result.level)
    })

    it('should count total fields', () => {
      const html = '<form><input id="a" /><select id="b"></select></form>'
      const result = getFormAccessibilityScore(html)
      expect(result.totalFields).toBe(2)
    })

    it('should return issues array', () => {
      const html = '<form><input type="text" /></form>'
      const result = getFormAccessibilityScore(html)
      expect(Array.isArray(result.issues)).toBe(true)
    })
  })

  describe('getAccessibilityIssues', () => {
    it('should return error for null input', () => {
      const issues = getAccessibilityIssues(null)
      expect(issues.length).toBeGreaterThan(0)
      expect(issues[0].type).toBe('no-form-html')
    })

    it('should return sorted issues by severity', () => {
      const html = '<input type="text" /><input id="test" type="email" />'
      const issues = getAccessibilityIssues(html)

      // Check that issues are sorted: errors first, then warnings
      let lastSeenSeverity = null
      const severityOrder = { error: 0, warning: 1, info: 2 }

      for (const issue of issues) {
        if (lastSeenSeverity !== null) {
          const currentOrder = severityOrder[issue.severity] || 2
          const lastOrder = severityOrder[lastSeenSeverity] || 2
          expect(currentOrder).toBeGreaterThanOrEqual(lastOrder)
        }
        lastSeenSeverity = issue.severity
      }
    })

    it('should detect missing form element', () => {
      const html = '<input id="test" type="text" aria-label="Test" />'
      const issues = getAccessibilityIssues(html)
      expect(issues.some(i => i.type === 'missing-form-element')).toBe(true)
    })

    it('should not warn about missing form when form exists', () => {
      const html = '<form><input id="test" aria-label="Test" /></form>'
      const issues = getAccessibilityIssues(html)
      expect(issues.filter(i => i.type === 'missing-form-element').length).toBe(0)
    })

    it('should detect missing submit button', () => {
      const html = '<form><input id="test" aria-label="Test" /></form>'
      const issues = getAccessibilityIssues(html)
      expect(issues.some(i => i.type === 'missing-submit-button')).toBe(true)
    })

    it('should not warn when submit button exists', () => {
      const html = '<form><input id="test" aria-label="Test" /><button type="submit">Submit</button></form>'
      const issues = getAccessibilityIssues(html)
      expect(issues.filter(i => i.type === 'missing-submit-button').length).toBe(0)
    })

    it('should warn about multiple radios without fieldset', () => {
      const html = `<form>
        <input type="radio" id="a" aria-label="A" />
        <input type="radio" id="b" aria-label="B" />
        <input type="radio" id="c" aria-label="C" />
      </form>`
      const issues = getAccessibilityIssues(html)
      expect(issues.some(i => i.type === 'missing-fieldset')).toBe(true)
    })

    it('should not warn when fieldset exists', () => {
      const html = `<form>
        <fieldset>
          <input type="radio" id="a" aria-label="A" />
          <input type="radio" id="b" aria-label="B" />
          <input type="radio" id="c" aria-label="C" />
        </fieldset>
      </form>`
      const issues = getAccessibilityIssues(html)
      expect(issues.filter(i => i.type === 'missing-fieldset').length).toBe(0)
    })

    it('should include all issue types from validation', () => {
      const html = '<input type="text" />'
      const issues = getAccessibilityIssues(html)
      expect(issues.some(i => i.type === 'missing-id')).toBe(true)
    })
  })

  describe('getTranslations', () => {
    it('should return translations object', () => {
      const translations = getTranslations()
      expect(translations).toBeDefined()
      expect(typeof translations).toBe('object')
    })

    it('should have French translations', () => {
      const translations = getTranslations()
      expect(translations.fr).toBeDefined()
      expect(translations.fr.required).toBeDefined()
    })

    it('should have English translations', () => {
      const translations = getTranslations()
      expect(translations.en).toBeDefined()
      expect(translations.en.required).toBeDefined()
    })

    it('should have Spanish translations', () => {
      const translations = getTranslations()
      expect(translations.es).toBeDefined()
      expect(translations.es.required).toBeDefined()
    })

    it('should have German translations', () => {
      const translations = getTranslations()
      expect(translations.de).toBeDefined()
      expect(translations.de.required).toBeDefined()
    })
  })

  describe('getTranslator', () => {
    it('should return a function', () => {
      const t = getTranslator()
      expect(typeof t).toBe('function')
    })

    it('should translate keys for current language', () => {
      getState.mockReturnValue({ lang: 'fr' })
      const t = getTranslator()
      const result = t('required')
      expect(result).toBe('Ce champ est obligatoire')
    })

    it('should translate to English when language is en', () => {
      getState.mockReturnValue({ lang: 'en' })
      const t = getTranslator()
      const result = t('required')
      expect(result).toBe('This field is required')
    })

    it('should translate to Spanish when language is es', () => {
      getState.mockReturnValue({ lang: 'es' })
      const t = getTranslator()
      const result = t('required')
      expect(result).toBe('Este campo es obligatorio')
    })

    it('should translate to German when language is de', () => {
      getState.mockReturnValue({ lang: 'de' })
      const t = getTranslator()
      const result = t('required')
      expect(result).toBe('Dieses Feld ist erforderlich')
    })

    it('should handle parameter substitution', () => {
      getState.mockReturnValue({ lang: 'fr' })
      const t = getTranslator()
      const result = t('characterCount', { count: 50, max: 100 })
      expect(result).toContain('50')
      expect(result).toContain('100')
    })

    it('should fallback to French for unknown language', () => {
      getState.mockReturnValue({ lang: 'xx' })
      const t = getTranslator()
      const result = t('required')
      expect(result).toBe('Ce champ est obligatoire')
    })

    it('should return key for unknown translation', () => {
      const t = getTranslator()
      const result = t('unknown_key_xyz')
      expect(result).toBe('unknown_key_xyz')
    })
  })

  describe('Integration tests', () => {
    it('should create complete accessible form', () => {
      const inputHtml = renderAccessibleInput({
        id: 'name',
        label: 'Full Name',
        required: true,
        placeholder: 'Enter your name',
      })

      const selectHtml = renderAccessibleSelect({
        id: 'country',
        label: 'Country',
        selectOptions: ['France', 'Germany', 'Spain'],
        required: true,
      })

      const textareaHtml = renderAccessibleTextarea({
        id: 'bio',
        label: 'Biography',
        maxLength: 500,
        showCharCount: true,
      })

      const checkboxHtml = renderAccessibleCheckbox({
        id: 'terms',
        label: 'I accept the terms',
        required: true,
      })

      const formHtml = `<form role="form">
        ${inputHtml}
        ${selectHtml}
        ${textareaHtml}
        ${checkboxHtml}
        <button type="submit">Submit</button>
      </form>`

      const result = getFormAccessibilityScore(formHtml)
      expect(result.score).toBeGreaterThan(60)
      expect(result.totalFields).toBe(4)
    })

    it('should validate form and report issues correctly', () => {
      const formHtml = `
        <form>
          <input type="text" placeholder="Name" />
          <input id="email" type="email" />
          <button type="submit">Submit</button>
        </form>
      `
      const issues = getAccessibilityIssues(formHtml)

      // Should detect missing id on first input
      expect(issues.some(i => i.type === 'missing-id')).toBe(true)

      // Should detect missing label on second input
      expect(issues.some(i => i.type === 'missing-label')).toBe(true)

      // Should warn about autocomplete on email
      expect(issues.some(i => i.type === 'missing-autocomplete')).toBe(true)
    })

    it('should have no errors for fully accessible form', () => {
      const formHtml = `
        <form role="form">
          <label for="name">Name</label>
          <input id="name" type="text" required aria-required="true" />
          <label for="email">Email</label>
          <input id="email" type="email" autocomplete="email" aria-required="true" required />
          <div role="alert" aria-live="assertive"></div>
          <button type="submit">Submit</button>
        </form>
      `
      const validation = validateFormAccessibility(formHtml)
      const errorCount = validation.issues.filter(i => i.severity === 'error').length
      expect(errorCount).toBe(0)
    })
  })
})
