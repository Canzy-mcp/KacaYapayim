import test from 'node:test';
import assert from 'node:assert/strict';
import {suggestCustomerColumns,mapCustomerRows} from '../src/lib/customer-csv.ts';
test('Turkish CSV headers map and unfamiliar columns can be selected explicitly',()=>{
 const suggested=suggestCustomerColumns(['Ad Soyad','Telefon','İl','Notlar']);
 assert.deepEqual(mapCustomerRows([['Ayşe','05321234567','İzmir','Not']],suggested)[0],{name:'Ayşe',phone:'05321234567',email:'',company_name:'',city:'İzmir',district:'',address:'',notes:'Not'});
 assert.equal(mapCustomerRows([['Ignored','Ali']],{name:1})[0].name,'Ali');
});
test('CSV mapping requires name and rejects duplicate column assignments',()=>{
 assert.throws(()=>mapCustomerRows([['Ali']],{name:-1}));
 assert.throws(()=>mapCustomerRows([['Ali']],{name:0,phone:0}));
 assert.equal(mapCustomerRows([['Ali']],{name:0,phone:-1})[0].phone,'');
});
