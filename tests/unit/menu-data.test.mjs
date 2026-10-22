import test from 'node:test'; import assert from 'node:assert/strict'; import {readFileSync} from 'node:fs';
import {validateMenu} from '../../src/core/menu.mjs';
const menu=JSON.parse(readFileSync(new URL('../../data/menu.json',import.meta.url)));
const clone=()=>structuredClone(menu);
test('source-linked menu is valid and preserves every source row',()=>{assert.deepEqual(validateMenu(menu),[]);assert.deepEqual(menu.categories.map(c=>menu.items.filter(i=>i.categoryId===c.id).length),[11,7,8,7,8,29]);assert.equal(menu.items.length,70);});
test('same-named Balvenie rows have separate stable identities',()=>{assert.deepEqual(menu.items.filter(i=>i.nameOriginal==='Balvenie 12Y').map(i=>i.id),['speyside-001','speyside-002']);});
test('hand-checked prices and options agree with source',()=>{assert.equal(menu.items.find(i=>i.id==='food-001').price.single.amountKrw,22000);assert.equal(menu.items.find(i=>i.id==='food-003').price.single.amountKrw,35000);assert.equal(menu.items.find(i=>i.id==='modern-008').price.single.amountKrw,28000);assert.deepEqual(menu.items.find(i=>i.id==='food-006').options.map(o=>o.labelKo),['바질 페스토','디아볼라','마르게리타']);});
for(const bad of [null,{}, {categories:[],items:null}, {categories:null,items:[]}])test(`reject invalid menu root ${JSON.stringify(bad)}`,()=>assert.equal(validateMenu(bad)[0].code,'invalid_menu'));
const mutations=[
 ['duplicate_category',m=>m.categories.push(m.categories[0])],
 ['invalid_category',m=>m.categories[0].id=''],
 ['invalid_category',m=>m.categories[0].sourceFile='../secret'],
 ['duplicate_id',m=>m.items[1].id=m.items[0].id],
 ['unknown_category',m=>m.items[0].categoryId='nope'],
 ['invalid_name',m=>m.items[0].nameKo=''],
 ['invalid_source',m=>m.items[0].sourceRefs=[]],
 ['duplicate_source',m=>m.items[1].sourceRefs=m.items[0].sourceRefs],
 ['source_count',m=>m.sourceRowCount=69],
 ['invalid_price',m=>m.items[0].price.single.amountKrw=-1],
 ['invalid_price',m=>m.items[0].price.single.amountKrw=NaN],
 ['invalid_price',m=>m.items[0].price.single.amountKrw=0],
 ['invalid_price',m=>m.items[0].price.single.status='wat'],
 ['invalid_price',m=>m.items[41].price.glass.amountKrw=24000],
 ['invalid_price',m=>m.items[41].price.bottle.status='missing'],
 ['invalid_price',m=>m.items[0].price.kind='wat'],
 ['invalid_unit',m=>m.whiskyUnitStatus='wat'],
 ['invalid_price',m=>{m.whiskyUnitStatus='verified';m.items[41].price.glass={raw:'wat',status:'verified',amountKrw:24000};}],
];
for(const [code,change] of mutations)test(`detect ${code}: ${change}`,()=>{const m=clone();change(m);assert.ok(validateMenu(m).some(i=>i.code===code));});
test('confirmed whisky values must agree with raw source units',()=>{const m=clone();m.whiskyUnitStatus='verified';m.items.filter(i=>i.price.kind==='whisky').forEach(i=>{for(const key of ['glass','bottle']){const p=i.price[key];if(p.raw!==null){p.status='verified';p.amountKrw=Number(p.raw.replace(',','.'))*10000;}}});assert.deepEqual(validateMenu(m),[]);m.items[41].price.glass.amountKrw=25000;assert.ok(validateMenu(m).some(i=>i.code==='invalid_price'));});
const provenanceMutations=[
 ['empty stable ID',m=>m.items[0].id=''],
 ['invented source replacing a real row',m=>m.items[0].sourceRefs=[{fileName:'not-a-source.png',pageId:'invented',rowIndex:-10}]],
 ['out-of-range source row',m=>m.items[0].sourceRefs[0].rowIndex=12],
 ['noninteger source row',m=>m.items[0].sourceRefs[0].rowIndex=1.5],
 ['mismatched source filename',m=>m.items[0].sourceRefs[0].fileName='wrong.png'],
 ['source moved to wrong category',m=>m.items[0].categoryId='classic'],
 ['source page category mismatch',m=>m.items[0].sourceRefs[0].pageId='112413'],
 ['invalid source object',m=>m.items[0].sourceRefs=[null]],
 ['missing source reference array',m=>delete m.items[0].sourceRefs],
 ['category source page substitution',m=>m.categories[0].sourceFile='112449.png'],
 ['invented category',m=>m.categories[0].id='invented'],
 ['nonstring Korean name',m=>m.items[0].nameKo=null],
 ['empty original name',m=>m.items[0].nameOriginal=''],
 ['nonstring original name',m=>m.items[0].nameOriginal=null],
];
for(const [label,change] of provenanceMutations)test(`reject ${label}`,()=>{const m=clone();change(m);assert.ok(validateMenu(m).length>0);});

const safetyMutations=[
 ['whisky cannot use a single verified price to bypass unit confirmation','invalid_price',m=>m.items[41].price={kind:'single',single:{raw:'1',status:'verified',amountKrw:1}}],
 ['food cannot substitute whisky price fields','invalid_price',m=>m.items[0].price=structuredClone(m.items[41].price)],
 ['verified won amount must agree with its raw source price','invalid_price',m=>m.items[0].price.single.amountKrw=999],
 ['malformed raw won price is rejected','invalid_price',m=>m.items[0].price.single.raw='22,00'],
 ['nontext raw won price is rejected','invalid_price',m=>m.items[0].price.single.raw=22000],
 ['null category is reported without crashing','invalid_category',m=>m.categories[0]=null],
 ['missing category title cannot render undefined','invalid_category',m=>delete m.categories[0].titleKo],
 ['blank original category title is rejected','invalid_category',m=>m.categories[0].titleOriginal=' '],
 ['null item is reported without crashing','invalid_item',m=>m.items[0]=null],
 ['missing ingredients cannot pass validation then crash rendering','invalid_content',m=>delete m.items[0].ingredientsKo],
 ['nontext original ingredient is rejected','invalid_content',m=>m.items[0].ingredientsOriginal=[null]],
 ['missing option array is rejected','invalid_content',m=>delete m.items[0].options],
 ['null option is rejected','invalid_content',m=>m.items[0].options=[null]],
 ['missing original option label is rejected','invalid_content',m=>delete m.items[5].options[0].labelOriginal],
 ['nontext serving note is rejected','invalid_content',m=>m.items[0].servingNote={}],
 ['missing price object is reported without crashing','invalid_price',m=>delete m.items[0].price],
 ['missing single price is reported without crashing','invalid_price',m=>delete m.items[0].price.single],
 ['missing whisky bottle price is reported without crashing','invalid_price',m=>delete m.items[41].price.bottle],
 ['merging source rows without confirmation is rejected','invalid_source',m=>{m.items[41].sourceRefs.push(m.items[42].sourceRefs[0]);m.items.splice(42,1);}],
];
for(const [label,code,change] of safetyMutations)test(label,()=>{const m=clone();change(m);let issues;assert.doesNotThrow(()=>issues=validateMenu(m));assert.ok(issues.some(i=>i.code===code),JSON.stringify(issues));});
