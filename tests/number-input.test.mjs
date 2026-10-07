import test from 'node:test';
import assert from 'node:assert/strict';
import {parsePrice,parseQuantity} from '../src/lib/money.ts';
test('prices reject malformed grouping and preserve empty input as invalid',()=>{
 for(const s of ['12.34,50','1..234,50',',50','', '1.23.456,78'])assert.equal(parsePrice(s),null);
 assert.equal(parsePrice('1.234.567,89'),1234567.89);assert.equal(parsePrice('1234,50'),1234.5);
});
test('quantity supports three decimals without coercing empty or zero',()=>{
 assert.equal(parseQuantity('1,234'),1.234);assert.equal(parseQuantity('1.234'),1.234);assert.equal(parseQuantity('1.234,567'),1234.567);
 for(const s of ['','0','-1','1,2345','1e3','Infinity','1000001','12.34,567'])assert.equal(parseQuantity(s),null);
});
