import {normalizeSearch} from '../core/menu.mjs';
const controllers=new WeakMap();
export function initMenuUI(document){
  if(controllers.has(document))return controllers.get(document);
  const tools=document.querySelector('[data-menu-tools]');
  const input=document.querySelector('[data-menu-search]');
  const rows=[...document.querySelectorAll('[data-menu-item]')];
  const buttons=[...document.querySelectorAll('[data-category-filter]')];
  const sections=[...document.querySelectorAll('[data-menu-section]')];
  const empty=document.querySelector('[data-menu-empty]');
  const status=document.querySelector('[data-menu-status]');
  let category='all';
  function apply(){
    const query=normalizeSearch(input.value);
    let count=0;
    for(const row of rows){
      row.hidden=!((category==='all'||row.dataset.category===category)&&row.dataset.search.includes(query));
      if(!row.hidden)count++;
    }
    for(const section of sections)section.hidden=![...section.querySelectorAll('[data-menu-item]')].some(row=>!row.hidden);
    for(const button of buttons)button.setAttribute('aria-pressed',String(button.dataset.categoryFilter===category));
    empty.hidden=count!==0;
    status.textContent=`${count}개의 메뉴 · 가격 단위: 원`;
  }
  function reset(){category='all';input.value='';apply();input.focus?.();}
  input.addEventListener('input',apply);
  for(const button of buttons)button.addEventListener('click',()=>{
    category=button.dataset.categoryFilter;
    apply();
    document.querySelector('#menu').scrollIntoView?.({block:'start',behavior:'smooth'});
  });
  document.querySelector('[data-menu-clear]').addEventListener('click',reset);
  const controller={reset};controllers.set(document,controller);
  apply();tools.hidden=false;
  return controller;
}
