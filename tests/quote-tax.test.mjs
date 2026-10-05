import {test} from 'node:test';
import assert from 'node:assert/strict';
import {quoteAmounts} from '../src/lib/quotes/tax.ts';
test('tax is added to customer total without changing pre-tax revenue',()=>{
 assert.deepEqual(quoteAmounts(4300,'included',20),{subtotal:4300,tax:860,total:5160,rate:20});
 assert.deepEqual(quoteAmounts(4300,'excluded',20),{subtotal:4300,tax:860,total:5160,rate:20});
});
test('legacy price and unspecified tax remain unchanged',()=>{
 assert.equal(quoteAmounts(4300,'included').total,4300);
 assert.equal(quoteAmounts(4300,'unspecified',20).total,4300);
});
test('tax rounds in cents and accepts an explicit zero rate',()=>{
 assert.equal(quoteAmounts(100.03,'excluded',20).tax,20.01);
 assert.equal(quoteAmounts(100,'included',0).total,100);
});
