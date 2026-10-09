import assert from 'node:assert/strict';
import {chooseQuestions,scoreAnswers,profile,DEFAULT_RULES,csvCell} from '../lib/assessment.ts';
import {QUESTIONS} from '../lib/question-bank.ts';
const chosen=chooseQuestions(QUESTIONS,()=>0.5);
assert.equal(chosen.length,12);assert.equal(new Set(chosen.map(q=>q.id)).size,12);
for(let i=0;i<6;i++)assert.equal(chosen.filter(q=>q.cap===i).length,2);
const correct=Object.fromEntries(chosen.map(q=>[q.id,q.points.indexOf(100)]));
assert.deepEqual(scoreAnswers(chosen,correct),[100,100,100,100,100,100]);
assert.deepEqual(scoreAnswers(chosen,{}),[0,0,0,0,0,0]);
assert.equal(profile([60,80,59,0,0,100],DEFAULT_RULES)[0].level,'Proficient');
assert.equal(profile([60,80,59,0,0,100],DEFAULT_RULES)[1].level,'Strong');
assert.equal(profile([60,80,59,0,0,100],DEFAULT_RULES)[2].type,'Core risk');
assert.equal(profile([60,80,59,0,0,100],DEFAULT_RULES)[3].type,'Development gap');
for(const q of QUESTIONS){for(const lang of ['en','ms','zh']){assert.ok(q.prompt[lang]);assert.equal(q.options[lang].length,4)}assert.ok(q.points.includes(100))}
assert.equal(csvCell('=HYPERLINK("bad")'),'"\'=HYPERLINK(""bad"")"');
console.log('PASS: question selection, translation parity, scoring boundaries, profiling and CSV formula escaping.');
