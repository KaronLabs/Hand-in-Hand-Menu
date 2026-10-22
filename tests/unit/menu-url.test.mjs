import test from 'node:test';import assert from 'node:assert/strict';import {validateMenuUrl} from '../../src/core/menu-url.mjs';
const canonical='https://menu.example.test/';
test('exact canonical URL is accepted',()=>assert.equal(validateMenuUrl(canonical,canonical),canonical));
test('standard URL normalization preserves equivalent origin',()=>assert.equal(validateMenuUrl('https://MENU.EXAMPLE.TEST',canonical),canonical));
test('platform base path is preserved',()=>assert.equal(validateMenuUrl('https://menu.example.test/sites/menu/','https://menu.example.test/sites/menu/'),'https://menu.example.test/sites/menu/'));
for(const candidate of ['http://menu.example.test/','https://other.example.test/','https://me@menu.example.test/','https://me:secret@menu.example.test/','https://menu.example.test/?token=secret','https://menu.example.test/#x','https://menu.example.test/preview','bad',undefined])test(`reject non-canonical target ${candidate}`,()=>assert.throws(()=>validateMenuUrl(candidate,canonical),{code:'invalid_menu_url'}));
test('root cannot replace platform path',()=>assert.throws(()=>validateMenuUrl(canonical,'https://menu.example.test/sites/menu/'),{code:'invalid_menu_url'}));
test('invalid canonical reference is rejected',()=>assert.throws(()=>validateMenuUrl(canonical,'bad'),{code:'invalid_menu_url'}));
