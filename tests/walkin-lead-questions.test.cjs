const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
function load(file,dependencies={}){
  const exports={};
  const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
  new Function('exports','require',code)(exports,name=>dependencies[name]??{});
  return exports;
}
const {answerError,buildWalkinAnswerGroups,isOtherAnswer,isWalkinSource,questionnaireId}=load('src/lib/walkin-lead-questions.ts');
const question=(type,extra={})=>({key:'q',label:'Question?',type,required:true,options:[],sort_order:1,...extra});
const form=(id,version=1)=>({product_type_id:id,product_type:'Furniture',title:'Furniture',origin:'vendor',questionnaire_key:`vendor:${id}`,questionnaire_version:version,questions:[question('text')]});
test('walk-in source matching handles case and separators without matching other sources',()=>{
  for(const name of ['Walk-in','Walk In','WALKIN','walk_in'])assert.equal(isWalkinSource(name),true);
  for(const name of ['Online','Reference','', 'walk-in campaign'])assert.equal(isWalkinSource(name),false);
});
test('required values block submission while drafts allow incomplete answers and N/A is valid',()=>{
  const q=question('text');assert.ok(answerError(q,''));assert.ok(answerError(q,'   '));assert.equal(answerError(q,'N/A'),undefined);assert.equal(answerError(q,'',true),undefined);
  assert.equal(answerError({...q,required:false},''),undefined);
});
test('types and option membership are enforced, including draft values',()=>{
  assert.ok(answerError(question('number',{integer:true,min:1}),0));assert.ok(answerError(question('number',{integer:true,min:1}),1.5));assert.ok(answerError(question('number'),Infinity));
  assert.equal(answerError(question('number',{integer:true,min:1}),3),undefined);
  assert.ok(answerError(question('single_select',{options:['Yes','No']}),'Maybe',true));
  assert.equal(answerError(question('multi_select',{options:['A','B']}),['A','B']),undefined);
  assert.ok(answerError(question('multi_select',{options:['A']}),['A','A']));
  assert.ok(answerError(question('file'),['https://example.com/arbitrary.pdf']));
});
test('only selected furniture and current versions are submitted; hidden answers are excluded',()=>{
  const a=form(1),b=form(2);const answers={[questionnaireId(a)]:{q:'  N/A  ',removed:'old question'},[questionnaireId(b)]:{q:'other furniture'}};
  assert.deepEqual(buildWalkinAnswerGroups([a],answers),[{product_type_id:1,questionnaire_key:'vendor:1',questionnaire_version:1,answers:{q:'N/A'}}]);
  assert.deepEqual(buildWalkinAnswerGroups([form(1,2)],answers)[0].answers,{});
  assert.deepEqual(buildWalkinAnswerGroups([],answers),[]);
});
test('multipart creation serializes question groups as JSON, including empty groups',async()=>{
  const calls=[];const {createLead}=load('src/api/leads.ts',{'@/lib/apiClient':{apiClient:{post:async(url,body)=>{calls.push({url,body});return {data:{success:true}};}}}});
  const groups=buildWalkinAnswerGroups([form(1)],{[questionnaireId(form(1))]:{q:'N/A'}});
  await createLead({firstname:'Test',product_types:['1'],walkin_answers:groups});
  assert.deepEqual(JSON.parse(calls[0].body.get('walkin_answers')),groups);
  assert.equal(calls[0].body.get('product_types'),'1');
  await createLead({firstname:'Test',walkin_answers:[]});assert.equal(calls[1].body.get('walkin_answers'),'[]');
  await createLead({firstname:'Test'});assert.equal(calls[2].body.has('walkin_answers'),false);
});

test('single choice with Others accepts custom text only when allowed',()=>{
  const q=question('single_select',{options:['Design','Budget'],allow_other:true});
  assert.equal(answerError(q,'Budget'),undefined);assert.equal(answerError(q,'Resale value'),undefined);
  assert.ok(answerError(q,''));assert.ok(answerError(q,'x'.repeat(501)));
  assert.ok(answerError({...q,allow_other:false},'Resale value'));
  assert.equal(isOtherAnswer(q,'Resale value'),true);assert.equal(isOtherAnswer(q,'Budget'),false);assert.equal(isOtherAnswer(q,''),false);
});
