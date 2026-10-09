import { QUESTIONS } from '@/lib/question-bank';
import {CAPS} from '@/lib/assessment';
export async function GET(){return Response.json({name:'Preview',status:'Invited',language:'en',questions:CAPS.flatMap((_,cap)=>QUESTIONS.filter(q=>q.cap===cap).slice(0,2)).map(({points,explanation,...q})=>q),minutes:40,started:null,answers:{},conversation:'',revision:0},{headers:{'Cache-Control':'no-store'}})}
