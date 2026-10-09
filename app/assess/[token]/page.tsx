import Assessment from './runner';
export default async function AssessmentPage({params}:{params:Promise<{token:string}>}) {const {token}=await params;return <Assessment token={token}/>}
