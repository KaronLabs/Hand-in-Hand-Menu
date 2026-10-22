export function validateMenuUrl(candidate,canonicalUrl){
  try{
    const current=new URL(candidate),expected=new URL(canonicalUrl);
    if(current.protocol!=='https:'||current.username||current.password||current.search||current.hash||current.href!==expected.href)throw new Error('invalid URL');
    return current.href;
  }catch{
    throw Object.assign(new RangeError('정식 메뉴 URL을 확인해 주세요.'),{code:'invalid_menu_url'});
  }
}
