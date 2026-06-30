import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

function indexOfNeedle(needle) {
  const index = html.indexOf(needle);
  assert.notEqual(index, -1, `Missing expected markup/code: ${needle}`);
  return index;
}

test('form is organized into the planned desktop sections', () => {
  for (const heading of [
    'Kandidát',
    'Pozice a pobočka',
    'Pracovní vztah',
    'Mzda',
    'Nástup a podpisy',
    'Benefity a režim práce',
    'Poznámky',
  ]) {
    assert.match(html, new RegExp(`<h2[^>]*>${heading}</h2>`), `Missing section heading: ${heading}`);
  }

  assert.doesNotMatch(html, /class="section-index"/, 'Section numbering should not be visible in headings');
  assert.match(html, /class="[^"]*\bactions\b[^"]*\bsticky-actions\b/, 'Actions should use sticky desktop action bar class');
});

test('start date appears before salary fields and drives all salary From dates', () => {
  assert.ok(indexOfNeedle('id="startDate"') < indexOfNeedle('id="baseSalary"'), 'Datum nástupu should be before salary fields');

  for (const id of ['baseFrom', 'kpiFrom', 'varFrom', 'osohFrom', 'qFrom', 'yearFrom']) {
    assert.match(html, new RegExp(`salaryFromDateIds[\\s\\S]*['"]${id}['"]`), `${id} should be registered for start-date sync`);
  }

  assert.match(html, /function syncSalaryFromDates\(/, 'Missing smart salary date sync function');
  assert.match(html, /startDate\.addEventListener\('change',\s*syncSalaryFromDates\)/, 'Start date should trigger smart salary date sync');
});

test('reset is guarded and generated outputs are grouped', () => {
  assert.match(html, /confirm\(/, 'Reset should confirm before clearing the form');
  assert.match(html, /resetBtn[\s\S]*els\.insAures\.checked=false;[\s\S]*els\.insOwn\.checked=false;[\s\S]*els\.insNone\.checked=true;/, 'Reset should restore no-insurance default');
  assert.match(html, /class="printSection"/, 'Print view should include grouped section rows');
  assert.match(html, /padStart\(2,\s*'0'\)/, 'PDF filename month should be zero-padded');
  assert.match(html, /catRole\.addEventListener\('change',\s*applyCatalogTypedDefaults\)/, 'Manual catalog role changes should apply role defaults');
  assert.match(html, /catRole\.addEventListener\('blur',\s*applyCatalogTypedDefaults\)/, 'Manual catalog role blur should apply role defaults');
  assert.match(html, /contractRole\.addEventListener\('change',\s*applyContractTypedDefaults\)/, 'Manual contract role changes should apply role defaults');
  assert.match(html, /contractRole\.addEventListener\('blur',\s*applyContractTypedDefaults\)/, 'Manual contract role blur should apply role defaults');
  const auresBody = html.match(/function setInsuranceAures\(\) \{([\s\S]*?)\n    \}/);
  assert.ok(auresBody, 'Missing setInsuranceAures helper');
  assert.match(auresBody[1], /insAures\)\s*insAures\.checked\s*=\s*true/, 'Aures helper should check Aures');
  assert.match(auresBody[1], /insOwn\)\s*insOwn\.checked\s*=\s*false/, 'Aures helper should uncheck own insurance');
  assert.match(auresBody[1], /insNone\)\s*insNone\.checked\s*=\s*false/, 'Aures helper should uncheck no insurance');
  assert.match(html, /Osobní údaje/, 'Generated output should include grouped content headings');
});
