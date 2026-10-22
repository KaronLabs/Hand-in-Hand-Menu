const failure = code => Object.assign(new RangeError(code), {code});
export function parseWhiskyPrice(raw, unitStatus) {
  if (!['verified','unverified'].includes(unitStatus)) throw failure('invalid_unit');
  if (raw === null || raw === undefined) return {raw:null,status:'missing',amountKrw:null};
  if (typeof raw !== 'string') throw failure('invalid_price');
  const value=raw.trim();
  if (value === '') return {raw:null,status:'missing',amountKrw:null};
  if (unitStatus === 'unverified') return {raw,status:'unverified',amountKrw:null};
  if (!/^\d+(?:[,.]\d)?$/.test(value)) throw failure('invalid_price');
  const [whole,decimal='0']=value.replace(',','.').split('.');
  const amountKrw=Number(whole)*10000+Number(decimal)*1000;
  if (!Number.isSafeInteger(amountKrw) || amountKrw <= 0) throw failure('invalid_price');
  return {raw,status:'verified',amountKrw};
}
export function formatPrice(price) {
  if (price.status !== 'verified' || !Number.isSafeInteger(price.amountKrw) || price.amountKrw <= 0) return '직원 문의';
  return `${price.amountKrw.toLocaleString('ko-KR')}원`;
}
export function validateMenu(menu) {
  if (!menu || !Array.isArray(menu.categories) || !Array.isArray(menu.items)) return [{code:'invalid_menu',itemId:null,message:'메뉴 구조를 확인해 주세요.'}];
  const issues=[]; const issue=(code,itemId)=>issues.push({code,itemId,message:code});
  const categories=new Map();
  for(const category of menu.categories){
    if (!category.id || !/^\d{6}\.png$/.test(category.sourceFile)) issue('invalid_category',null);
    if(categories.has(category.id)) issue('duplicate_category',null);
    categories.set(category.id,category);
  }
  if(!['verified','unverified'].includes(menu.whiskyUnitStatus)) issue('invalid_unit',null);
  const ids=new Set(),refs=new Set();let sourceCount=0;
  for(const item of menu.items){
    if(ids.has(item.id)) issue('duplicate_id',item.id);
    ids.add(item.id);
    if(!categories.has(item.categoryId)) issue('unknown_category',item.id);
    if(typeof item.nameKo !== 'string' || item.nameKo.trim()==='' || typeof item.nameOriginal !== 'string' || item.nameOriginal.trim()==='') issue('invalid_name',item.id);
    if(!Array.isArray(item.sourceRefs) || item.sourceRefs.length===0) issue('invalid_source',item.id);
    else for(const ref of item.sourceRefs){
      const key=`${ref.pageId}:${ref.rowIndex}`;
      if(refs.has(key)) issue('duplicate_source',item.id);
      refs.add(key);sourceCount++;
    }
    const kind=item.price.kind;
    if(!['single','whisky'].includes(kind)){issue('invalid_price',item.id);continue;}
    const prices=kind==='single'?[item.price.single]:[item.price.glass,item.price.bottle];
    for(const price of prices){
      if(!['verified','unverified','missing'].includes(price.status)){issue('invalid_price',item.id);continue;}
      if(price.status==='verified'){
        if(!Number.isSafeInteger(price.amountKrw) || price.amountKrw<=0) issue('invalid_price',item.id);
      }else if(price.amountKrw!==null) issue('invalid_price',item.id);
      if(kind==='whisky'){
        try{
          const expected=parseWhiskyPrice(price.raw,menu.whiskyUnitStatus);
          if(expected.status!==price.status || expected.amountKrw!==price.amountKrw) issue('invalid_price',item.id);
        }catch{issue('invalid_price',item.id);}
      }
    }
  }
  if(sourceCount!==70 || menu.sourceRowCount!==70) issue('source_count',null);
  return issues;
}
